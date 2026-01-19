
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  enableIndexedDbPersistence,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider,
  signOut, 
  onAuthStateChanged,
} from 'firebase/auth';
import { Memory, Entity, Era, UserProfile, LifeStory } from '../types';
import { encryptNarrative, decryptNarrative } from './crypto';

// Configuration looks for Vite environment variables first
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || process.env.API_KEY,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "mylife-biographer.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "mylife-biographer",
};

let app: any;
let db: any;
let auth: any;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 20) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    // Enable offline persistence for high-end mobile experience
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn("Multiple tabs open; persistence enabled in only one.");
      } else if (err.code === 'unimplemented') {
        console.warn("Browser doesn't support persistence.");
      }
    });
  }
} catch (e) {
  console.error("Firebase Initialization Failed. Check VITE_ environment variables.", e);
}

export { auth, db };

export async function loginWithGoogle() {
  if (!auth) throw new Error("Firebase Auth is not configured.");
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function loginWithApple() {
  if (!auth) throw new Error("Firebase Auth is not configured.");
  const provider = new OAuthProvider('apple.com');
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function loginWithPasscode(secret: string, type: 'email' | 'passcode') {
  // Passcode logic creates a deterministic, secure UID for the "Vault"
  const normalized = secret.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized + "mylife-v4-final-salt");
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedUid = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 28);

  const uid = `vault_${hashedUid}`;
  
  const mockUser = {
    uid: uid,
    email: type === 'email' ? normalized : `private@vault.local`,
    displayName: "Legacy Keeper",
    onboarded: false,
    birthYear: 1974,
    birthCity: '',
    preferredTone: 'concise'
  };
  
  localStorage.setItem('mylife_active_user', JSON.stringify(mockUser));
  return mockUser;
}

export async function logoutUser() {
  if (auth) await signOut(auth);
  localStorage.removeItem('mylife_active_user');
}

export function watchAuthState(callback: (user: any | null) => void) {
  if (auth) {
    return onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        callback(fbUser);
      } else {
        const local = localStorage.getItem('mylife_active_user');
        callback(local ? JSON.parse(local) : null);
      }
    });
  }
  return () => {};
}

export class VaultDB {
  private uid: string;
  private isCloud: boolean;

  constructor(uid: string) {
    this.uid = uid;
    this.isCloud = !!db && !uid.startsWith('vault_');
  }

  async getMemories(): Promise<Memory[]> {
    if (this.isCloud) {
      try {
        const q = query(collection(db, 'users', this.uid, 'memories'), orderBy('sortDate'));
        const snap = await getDocs(q);
        const cloudData = await Promise.all(snap.docs.map(async doc => {
          const m = doc.data() as Memory;
          const decrypted = await decryptNarrative(m.narrative, this.uid);
          // Fixed: Cast to any to avoid "Spread types may only be created from object types" error
          return { ...(m as any), id: doc.id, narrative: decrypted };
        }));
        return cloudData;
      } catch (e) {
        console.error("Cloud Fetch Failed, falling back to local:", e);
      }
    }
    const local = JSON.parse(localStorage.getItem(`mylife_${this.uid}_memories`) || '[]');
    return await Promise.all(local.map(async (m: any) => {
      const decrypted = await decryptNarrative(m.narrative, this.uid);
      // Fixed: Cast to any to avoid "Spread types may only be created from object types" error
      return { ...(m as any), narrative: decrypted };
    }));
  }

  async saveMemories(data: Memory[]) {
    const encrypted = await Promise.all(data.map(async m => ({
      // Fixed: Cast to any to avoid "Spread types may only be created from object types" error
      ...(m as any),
      narrative: await encryptNarrative(m.narrative, this.uid)
    })));
    
    localStorage.setItem(`mylife_${this.uid}_memories`, JSON.stringify(encrypted));

    if (this.isCloud) {
      for (const m of encrypted) {
        await setDoc(doc(db, 'users', this.uid, 'memories', m.id), m, { merge: true });
      }
    }
  }

  async getEntities(): Promise<Entity[]> {
    if (this.isCloud) {
      const snap = await getDocs(collection(db, 'users', this.uid, 'entities'));
      // Fixed: Cast to any to avoid "Spread types may only be created from object types" error
      return snap.docs.map(d => ({ ...(d.data() as any), id: d.id } as Entity));
    }
    return JSON.parse(localStorage.getItem(`mylife_${this.uid}_entities`) || '[]');
  }

  async saveEntities(data: Entity[]) {
    localStorage.setItem(`mylife_${this.uid}_entities`, JSON.stringify(data));
    if (this.isCloud) {
      for (const e of data) {
        await setDoc(doc(db, 'users', this.uid, 'entities', e.id), e, { merge: true });
      }
    }
  }

  async getEras(): Promise<Era[]> {
    if (this.isCloud) {
      const snap = await getDocs(collection(db, 'users', this.uid, 'eras'));
      // Fixed: Cast to any to avoid "Spread types may only be created from object types" error
      return snap.docs.map(d => ({ ...(d.data() as any), id: d.id } as Era));
    }
    return JSON.parse(localStorage.getItem(`mylife_${this.uid}_eras`) || '[]');
  }

  async saveEras(data: Era[]) {
    localStorage.setItem(`mylife_${this.uid}_eras`, JSON.stringify(data));
    if (this.isCloud) {
      for (const era of data) {
        await setDoc(doc(db, 'users', this.uid, 'eras', era.id), era, { merge: true });
      }
    }
  }

  async syncStory(story: LifeStory) {
    await this.saveMemories(story.memories);
    await this.saveEntities(story.entities);
    await this.saveEras(story.eras);
    
    if (story.profile) {
      localStorage.setItem(`mylife_profile_${this.uid}`, JSON.stringify(story.profile));
      if (this.isCloud) {
        await setDoc(doc(db, 'users', this.uid), story.profile, { merge: true });
      }
    }
    localStorage.setItem(`mylife_chat_${this.uid}`, JSON.stringify(story.chatHistory));
  }
}
