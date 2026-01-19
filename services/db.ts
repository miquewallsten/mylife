
import { initializeApp, getApps, getApp } from 'firebase/app';
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
import { Memory, Entity, Era, UserProfile, LifeStory } from '../types.ts';
import { encryptNarrative, decryptNarrative } from './crypto.ts';

// EXACT CONFIGURATION PROVIDED BY USER
const firebaseConfig = {
  apiKey: "AIzaSyAvZw4xKV3DmP5l8ix_CY35aPoW_4ryJOM",
  authDomain: "mylife-2-83922535-c259e.firebaseapp.com",
  projectId: "mylife-2-83922535-c259e",
  storageBucket: "mylife-2-83922535-c259e.firebasestorage.app",
  messagingSenderId: "928320416304",
  appId: "1:928320416304:web:678fcf6b668232c8cadbf5"
};

let app: any;
let db: any;
let auth: any;

try {
  // Prevent duplicate initialization error
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  
  // Enable offline persistence for high-end mobile experience
  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn("Multiple tabs open; persistence enabled in only one.");
      } else if (err.code === 'unimplemented') {
        console.warn("Browser doesn't support persistence.");
      }
    });
  }
  console.log("MyLife: Production Firebase Connection Initialized.");
} catch (e) {
  console.error("Firebase Initialization Failed.", e);
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
  const normalized = secret.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized + "mylife-v4-final-salt");
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedUid = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 28);

  const uid = `vault_${hashedUid}`;
  
  const mockUser: UserProfile = {
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
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Try to fetch profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        const profileData = userDoc.exists() ? (userDoc.data() as object) : {};
        
        // Explicitly create a clean object for the callback.
        const baseUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName
        };
        
        callback({ ...baseUser, ...profileData });
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
        return await Promise.all(snap.docs.map(async d => {
          const m = d.data() as any;
          const decrypted = await decryptNarrative(m.narrative, this.uid);
          return { ...(m as any), id: d.id, narrative: decrypted } as Memory;
        }));
      } catch (e) {
        console.error("Cloud memory fetch failed:", e);
      }
    }
    const local = JSON.parse(localStorage.getItem(`mylife_${this.uid}_memories`) || '[]');
    return await Promise.all(local.map(async (m: any) => ({
      ...m,
      narrative: await decryptNarrative(m.narrative, this.uid)
    })));
  }

  async saveMemories(data: Memory[]) {
    const encrypted = await Promise.all(data.map(async m => ({
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
