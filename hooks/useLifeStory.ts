
import { useState, useEffect, useMemo } from 'react';
import { LifeStory, Memory, Entity, Era, UserProfile, ChatMessage, Attachment } from '../types';
import { INITIAL_LIFE_STORY } from '../constants';
import { ingestLifeThread } from '../services/biographer';
import { VaultDB, watchAuthState, loginWithGoogle, loginWithApple, loginWithPasscode, logoutUser } from '../services/db';

export function useLifeStory() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const localUser = localStorage.getItem('mylife_active_user');
    if (localUser) {
      try {
        const parsed = JSON.parse(localUser);
        const savedProfileStr = localStorage.getItem(`mylife_profile_${parsed.uid}`);
        if (savedProfileStr) {
          const profile = JSON.parse(savedProfileStr);
          return { ...parsed, ...profile };
        }
        return parsed;
      } catch (e) { return null; }
    }
    return null;
  });
  
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [story, setStory] = useState<LifeStory>(INITIAL_LIFE_STORY);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentInvestigation, setCurrentInvestigation] = useState<string | null>(null);

  const vault = useMemo(() => user ? new VaultDB(user.uid) : null, [user?.uid]);

  useEffect(() => {
    const unsub = watchAuthState((authUser) => {
      if (authUser) {
        const savedProfileStr = localStorage.getItem(`mylife_profile_${authUser.uid}`);
        const profileData = savedProfileStr ? JSON.parse(savedProfileStr) : null;
        
        const finalUser: UserProfile = {
          uid: authUser.uid,
          email: authUser.email || null,
          displayName: profileData?.displayName || authUser.displayName || 'Legacy Keeper',
          birthYear: profileData?.birthYear || 1974,
          birthCity: profileData?.birthCity || '',
          onboarded: profileData?.onboarded === true,
          preferredTone: profileData?.preferredTone || 'concise'
        };
        
        setUser(finalUser);
        localStorage.setItem('mylife_active_user', JSON.stringify(finalUser));
      } else {
        setUser(null);
        setStory(INITIAL_LIFE_STORY);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    async function loadData() {
      if (user && vault) {
        setDataLoading(true);
        try {
          const memories = await vault.getMemories();
          const entities = await vault.getEntities();
          const eras = await vault.getEras();
          const chatStr = localStorage.getItem(`mylife_chat_${user.uid}`);
          
          const savedProfileStr = localStorage.getItem(`mylife_profile_${user.uid}`);
          const profile = savedProfileStr ? JSON.parse(savedProfileStr) : user;

          setStory(prev => ({
            ...prev,
            profile: profile,
            chatHistory: chatStr ? JSON.parse(chatStr) : INITIAL_LIFE_STORY.chatHistory,
            memories,
            entities,
            eras
          }));
        } catch (e) {
          console.error("Vault Restoration Failed:", e);
        } finally {
          setDataLoading(false);
        }
      } else {
        setDataLoading(false);
      }
    }
    loadData();
  }, [user?.uid, vault]);

  useEffect(() => {
    if (user && vault && story.profile?.onboarded) {
      vault.syncStory(story);
    }
  }, [story, user?.uid, vault]);

  const login = async (method: 'google' | 'apple' | 'passcode' | 'email', val?: string) => {
    setAuthError(null);
    try {
      if (method === 'google') await loginWithGoogle();
      else if (method === 'apple') await loginWithApple();
      else if (val) await loginWithPasscode(val, method as 'email' | 'passcode');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const fileToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!url.startsWith('data:')) return resolve('');
      const base64 = url.split(',')[1];
      resolve(base64);
    });
  };

  const setTone = (tone: 'concise' | 'elaborate') => {
    if (!user) return;
    const updatedProfile = { ...story.profile, preferredTone: tone } as UserProfile;
    setStory(prev => ({ ...prev, profile: updatedProfile }));
    localStorage.setItem(`mylife_profile_${user.uid}`, JSON.stringify(updatedProfile));
  };

  const processMemoryFromInput = async (input: string, attachments?: Attachment[]) => {
    if (!user || !story.profile) return;
    setIsProcessing(true);

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: input, timestamp: Date.now() };
    setStory(prev => ({ ...prev, chatHistory: [...prev.chatHistory, userMsg] }));

    try {
      const imageParts = [];
      if (attachments) {
        for (const att of attachments) {
          if (att.type === 'image') {
            const base64 = await fileToBase64(att.url);
            if (base64) imageParts.push({ data: base64, mimeType: 'image/jpeg' });
          }
        }
      }

      const result = await ingestLifeThread(input, { 
        userName: story.profile.displayName || 'Friend', 
        existingStory: story,
        images: imageParts,
        tone: story.profile.preferredTone
      });

      if (!result) throw new Error("Intelligence Engine Delay.");

      const bioMsg: ChatMessage = { id: crypto.randomUUID(), role: 'biographer', text: result.biographerResponse, timestamp: Date.now() };
      
      const newMemories: Memory[] = result.extractedMemories.map((m: any) => ({
        id: crypto.randomUUID(),
        userId: user.uid,
        narrative: m.narrative,
        originalInput: input,
        sortDate: m.sortDate,
        entityIds: [], 
        eraIds: [],
        connections: [],
        sentiment: m.sentiment || 'neutral',
        type: m.type || 'EVENT',
        aiInsight: m.aiInsight,
        attachments: attachments || [],
        groundingSources: result.groundingSources || []
      }));

      const newEntities: Entity[] = result.extractedEntities.map((e: any) => ({
        id: crypto.randomUUID(),
        userId: user.uid,
        name: e.name,
        type: e.type,
        relationship: e.relationship,
        metadata: e.metadata,
        historyTags: [e.details || 'Captured Fragment']
      }));

      setStory(prev => {
        const updatedEntities = [...prev.entities];
        result.extractedEntities.forEach((extracted: any, index: number) => {
          const ne = newEntities[index];
          const exists = updatedEntities.find(ent => ent.name.toLowerCase() === ne.name.toLowerCase());
          if (exists) {
            exists.metadata = { ...exists.metadata, ...ne.metadata };
            if (ne.relationship) exists.relationship = ne.relationship;
          } else {
            updatedEntities.push(ne);
          }
        });

        const finalMemories = [...prev.memories, ...newMemories].map(m => {
          const linkedEntityIds = updatedEntities.filter(e => 
            m.narrative.toLowerCase().includes(e.name.toLowerCase()) || 
            m.originalInput.toLowerCase().includes(e.name.toLowerCase())
          ).map(e => e.id);
          return { 
            ...m, 
            entityIds: Array.from(new Set([...m.entityIds, ...linkedEntityIds]))
          };
        });

        return {
          ...prev,
          chatHistory: [...prev.chatHistory, bioMsg],
          memories: finalMemories,
          entities: updatedEntities
        };
      });

      setCurrentInvestigation(result.topic);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateProfile = async (name: string, dob: string, location: string) => {
    if (!user) return;
    const year = parseInt(dob.split('-')[0]) || 1974;
    const updatedUser: UserProfile = { ...user, displayName: name, birthYear: year, birthCity: location, onboarded: true, preferredTone: 'concise' };
    const newEras: Era[] = [{ id: crypto.randomUUID(), label: 'Early Years', category: 'personal', startYear: year, endYear: year + 18 }];
    
    localStorage.setItem(`mylife_profile_${user.uid}`, JSON.stringify(updatedUser));
    localStorage.setItem('mylife_active_user', JSON.stringify(updatedUser));
    
    setUser(updatedUser);
    setStory(prev => ({ 
      ...prev, 
      profile: updatedUser, 
      eras: newEras,
      chatHistory: prev.chatHistory.length <= 1 ? [{
        id: 'init',
        role: 'biographer',
        text: `Welcome, ${name}. I've set your origin in ${location}. If you'd like, you could share a bit about how your heritage shaped your own journey?`,
        timestamp: Date.now()
      }] : prev.chatHistory
    }));
  };

  return { 
    user, authLoading, dataLoading, authError, story, isProcessing, currentInvestigation, processMemoryFromInput, 
    deleteMemory: (id: string) => setStory(prev => ({ ...prev, memories: prev.memories.filter(m => m.id !== id) })),
    editMemory: (id: string, updates: Partial<Memory>) => setStory(prev => ({ ...prev, memories: prev.memories.map(m => m.id === id ? { ...m, ...updates } : m) })),
    updateProfile, setTone, login, logout: logoutUser 
  };
}
