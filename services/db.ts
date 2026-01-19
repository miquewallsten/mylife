
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  updateDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { Memory, Entity, Era, UserProfile, LifeStory } from '../types';
import { encryptNarrative, decryptNarrative } from './crypto';

// Real Firebase Integration
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: "mylife-biographer.firebaseapp.com",
  projectId: "mylife-biographer",
  storageBucket: "mylife-biographer.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

let app: any;
let db: any;
let auth: any;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.error("Firebase init failed", e);
}

export { auth };

export async function loginWithGoogle() {
  if (!auth) return;
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function logoutUser() {
  if (!auth) return;
  return signOut(auth);
}

export function watchAuthState(callback: (user: FirebaseUser | null) => void) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

export class VaultDB {
  private uid: string;

  constructor(uid: string) {
    this.uid = uid;
  }

  // Encrypted Memory Storage
  async getMemories(): Promise<Memory[]> {
    const raw = await this.getCollection<Memory>('memories');
    // Decrypt on load
    const decrypted = await Promise.all(raw.map(async m => ({
      ...m,
      narrative: await decryptNarrative(m.narrative, this.uid)
    })));
    return decrypted;
  }

  async saveMemories(data: Memory[]) {
    // Encrypt before save
    const encrypted = await Promise.all(data.map(async m => ({
      ...m,
      narrative: await encryptNarrative(m.narrative, this.uid)
    })));
    await this.saveCollection('memories', encrypted);
  }

  // Generic Cloud Sync
  private async getCollection<T>(name: string): Promise<T[]> {
    if (!db) {
       const raw = localStorage.getItem(`mylife_v1_${this.uid}_${name}`);
       return raw ? JSON.parse(raw) : [];
    }
    try {
      const q = query(collection(db, name), where("userId", "==", this.uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (e) {
      console.warn(`Firestore fail for ${name}, falling back to local`, e);
      const raw = localStorage.getItem(`mylife_v1_${this.uid}_${name}`);
      return raw ? JSON.parse(raw) : [];
    }
  }

  private async saveCollection<T>(name: string, data: T[]) {
    // Save to Local as cache
    localStorage.setItem(`mylife_v1_${this.uid}_${name}`, JSON.stringify(data));
    
    if (!db) return;
    
    // Attempt Firestore Sync
    try {
      for (const item of data as any) {
        await setDoc(doc(db, name, item.id), { ...item, userId: this.uid });
      }
    } catch (e) {
      console.error(`Sync failed for ${name}`, e);
    }
  }

  async getEntities(): Promise<Entity[]> { return this.getCollection<Entity>('entities'); }
  async saveEntities(data: Entity[]) { await this.saveCollection('entities', data); }

  async getEras(): Promise<Era[]> { return this.getCollection<Era>('eras'); }
  async saveEras(data: Era[]) { await this.saveCollection('eras', data); }

  async syncStory(story: LifeStory) {
    await this.saveMemories(story.memories);
    await this.saveEntities(story.entities);
    await this.saveEras(story.eras);
    localStorage.setItem(`mylife_profile_${this.uid}`, JSON.stringify(story.profile));
    localStorage.setItem(`mylife_chat_${this.uid}`, JSON.stringify(story.chatHistory));
  }
}
