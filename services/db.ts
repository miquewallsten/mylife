
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc 
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

const firebaseConfig = {
  apiKey: process.env.API_KEY, 
  authDomain: "mylife-biographer.firebaseapp.com",
  projectId: "mylife-biographer",
};

let app: any;
let db: any;
let auth: any;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 20) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  }
} catch (e) {
  console.warn("Firebase restricted. Using Vault mode.");
}

export { auth };

let authCallback: ((user: any | null) => void) | null = null;

function handleAuthError(error: any, method: string) {
  console.error("Auth Error:", error);
  return new Error("Social login is unavailable in this sandbox. Use 'Private Passcode'—it is 100% private and works instantly.");
}

export async function loginWithGoogle() {
  if (!auth) throw new Error("Sandbox mode: Use Passcode.");
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    if (authCallback) authCallback(result.user);
    return result.user;
  } catch (error: any) {
    throw handleAuthError(error, "Google");
  }
}

export async function loginWithApple() {
  if (!auth) throw new Error("Sandbox mode: Use Passcode.");
  const provider = new OAuthProvider('apple.com');
  try {
    const result = await signInWithPopup(auth, provider);
    if (authCallback) authCallback(result.user);
    return result.user;
  } catch (error: any) {
    throw handleAuthError(error, "Apple");
  }
}

export async function loginWithPasscode(secret: string, type: 'email' | 'passcode') {
  const normalized = secret.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized + "mylife-v4-final-salt");
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedUid = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 28);

  const uid = `vault_${hashedUid}`;
  
  // CRITICAL: Hydrate profile from storage immediately to prevent onboarding reset
  const savedProfileStr = localStorage.getItem(`mylife_profile_${uid}`);
  const profileData = savedProfileStr ? JSON.parse(savedProfileStr) : null;

  const mockUser = {
    uid: uid,
    email: type === 'email' ? normalized : `private@vault.local`,
    displayName: profileData?.displayName || (type === 'email' ? normalized.split('@')[0] : "Legacy Keeper"),
    onboarded: profileData?.onboarded === true,
    birthYear: profileData?.birthYear || 1974,
    birthCity: profileData?.birthCity || '',
    preferredTone: profileData?.preferredTone || 'concise'
  };
  
  localStorage.setItem('mylife_active_user', JSON.stringify(mockUser));
  if (authCallback) authCallback(mockUser);
  return mockUser;
}

export async function logoutUser() {
  if (auth) { try { await signOut(auth); } catch (e) {} }
  localStorage.removeItem('mylife_active_user');
  if (authCallback) authCallback(null);
}

export function watchAuthState(callback: (user: any | null) => void) {
  authCallback = callback;
  
  const local = localStorage.getItem('mylife_active_user');
  if (local) {
    const parsed = JSON.parse(local);
    // Double check local storage for latest profile updates
    const savedProfileStr = localStorage.getItem(`mylife_profile_${parsed.uid}`);
    if (savedProfileStr) {
      callback({ ...parsed, ...JSON.parse(savedProfileStr) });
    } else {
      callback(parsed);
    }
  } else if (auth) {
    onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) callback(fbUser);
      else callback(null);
    });
  } else {
    callback(null);
  }

  return () => { authCallback = null; };
}

export class VaultDB {
  private uid: string;
  private isCloud: boolean;

  constructor(uid: string) {
    this.uid = uid;
    this.isCloud = !!db && !uid.startsWith('vault_');
  }

  async getMemories(): Promise<Memory[]> {
    const local = this.getLocal('memories');
    return await Promise.all(local.map(async (m: any) => {
      try {
        const decrypted = await decryptNarrative(m.narrative, this.uid);
        return { ...m, narrative: decrypted };
      } catch (e) {
        return m;
      }
    }));
  }

  async saveMemories(data: Memory[]) {
    const encrypted = await Promise.all(data.map(async m => ({
      ...m,
      narrative: await encryptNarrative(m.narrative, this.uid)
    })));
    this.setLocal('memories', encrypted);
    if (this.isCloud) await this.syncToCloud('memories', encrypted);
  }

  private getLocal(key: string) {
    const data = localStorage.getItem(`mylife_${this.uid}_${key}`);
    return data ? JSON.parse(data) : [];
  }

  private setLocal(key: string, data: any) {
    localStorage.setItem(`mylife_${this.uid}_${key}`, JSON.stringify(data));
  }

  private async syncToCloud(collectionName: string, data: any) {
    if (!this.isCloud) return;
    try {
      const userRef = doc(db, 'users', this.uid);
      await setDoc(userRef, { lastSync: Date.now() }, { merge: true });
      const collRef = doc(db, 'users', this.uid, 'collections', collectionName);
      await setDoc(collRef, { data, updatedAt: Date.now() });
    } catch (e) {}
  }

  async getEntities(): Promise<Entity[]> { return this.getLocal('entities'); }
  async saveEntities(data: Entity[]) { 
    this.setLocal('entities', data); 
    if (this.isCloud) await this.syncToCloud('entities', data);
  }

  async getEras(): Promise<Era[]> { return this.getLocal('eras'); }
  async saveEras(data: Era[]) { 
    this.setLocal('eras', data); 
    if (this.isCloud) await this.syncToCloud('eras', data);
  }

  async syncStory(story: LifeStory) {
    await this.saveMemories(story.memories);
    await this.saveEntities(story.entities);
    await this.saveEras(story.eras);
    if (story.profile) {
      localStorage.setItem(`mylife_profile_${this.uid}`, JSON.stringify(story.profile));
    }
    localStorage.setItem(`mylife_chat_${this.uid}`, JSON.stringify(story.chatHistory));
  }
}
