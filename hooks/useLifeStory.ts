
import { useState, useEffect, useMemo } from 'react';
import { LifeStory, Memory, Entity, Era, UserProfile, ChatMessage, Attachment } from '../types.ts';
import { INITIAL_LIFE_STORY } from '../constants.tsx';
import { ingestLifeThread } from '../services/biographer.ts';
import { VaultDB, watchAuthState, loginWithGoogle, loginWithApple, loginWithPasscode, logoutUser } from '../services/db.ts';

export function useLifeStory() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const localUser = localStorage.getItem('mylife_active_user');
    if (localUser) {
      try { return JSON.parse(localUser); } catch (e) { return null; }
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
  }, [user?.uid, !!vault]);

  useEffect(() => {
    if (user && vault && story.profile?.onboarded) {
      vault.syncStory(story);
    }
  }, [story, user?.uid, !!vault]);

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

  const processMemoryFromInput = async (input: string, attachments?: Attachment[]) => {
    if (!user || !story.profile) return;
    setIsProcessing(true);

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: input, timestamp: Date.now() };
    setStory(prev => ({ ...prev, chatHistory: [...prev.chatHistory, userMsg] }));

    try {
      const result = await ingestLifeThread(input, { 
        userName: story.profile.displayName || 'Friend', 
        existingStory: story,
        tone: story.profile.preferredTone
      });

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
          if (!exists) updatedEntities.push(ne);
        });

        const finalMemories = [...prev.memories, ...newMemories];

        return {
          ...prev,
          chatHistory: [...prev.chatHistory, bioMsg],
          memories: finalMemories,
          entities: updatedEntities
        };
      });

      setCurrentInvestigation(result.topic);
    } catch (err) {
      console.error("Ingestion failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateProfile = async (name: string, dob: string, location: string) => {
    if (!user) return;
    const year = parseInt(dob.split('-')[0]) || 1974;
    const updatedUser: UserProfile = { ...user, displayName: name, birthYear: year, birthCity: location, onboarded: true, preferredTone: 'concise' };
    const newEras: Era[] = [{ id: crypto.randomUUID(), label: 'Early Years', category: 'personal', startYear: year, endYear: year + 18 }];
    
    setUser(updatedUser);
    setStory(prev => ({ 
      ...prev, 
      profile: updatedUser, 
      eras: newEras
    }));
  };

  return { 
    user, authLoading, dataLoading, authError, story, isProcessing, currentInvestigation, processMemoryFromInput, 
    deleteMemory: (id: string) => setStory(prev => ({ ...prev, memories: prev.memories.filter(m => m.id !== id) })),
    editMemory: (id: string, updates: Partial<Memory>) => setStory(prev => ({ ...prev, memories: prev.memories.map(m => m.id === id ? { ...m, ...updates } : m) })),
    updateProfile, setTone: (tone: 'concise' | 'elaborate') => setStory(prev => prev.profile ? ({ ...prev, profile: { ...prev.profile, preferredTone: tone } }) : prev), 
    login, logout: logoutUser 
  };
}