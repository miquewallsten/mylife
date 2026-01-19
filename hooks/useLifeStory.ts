
import { useState, useEffect, useMemo } from 'react';
import { LifeStory, Memory, Entity, Era, UserProfile, ChatMessage, PendingMemory, DraftMemory, GroundingSource, ProposedEntity, EntityType } from '../types';
import { INITIAL_LIFE_STORY } from '../constants';
import { parseMemories, analyzeMedia } from '../services/biographer';
import { VaultDB, loginWithGoogle, logoutUser, watchAuthState } from '../services/db';

export function useLifeStory() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [currentInvestigation, setCurrentInvestigation] = useState<string | null>(null);
  const vault = useMemo(() => user ? new VaultDB(user.uid) : null, [user]);

  const [story, setStory] = useState<LifeStory>(INITIAL_LIFE_STORY);

  // Sync Auth State
  useEffect(() => {
    return watchAuthState((fbUser) => {
      if (fbUser) {
        const savedProfile = localStorage.getItem(`mylife_profile_${fbUser.uid}`);
        const profileData = savedProfile ? JSON.parse(savedProfile) : null;

        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || profileData?.displayName || null,
          birthYear: profileData?.birthYear || 1974,
          birthCity: profileData?.birthCity || '',
          onboarded: profileData?.onboarded || false
        });
      } else {
        setUser(null);
        setStory(INITIAL_LIFE_STORY);
      }
      setAuthLoading(false);
    });
  }, []);

  // Initial Sync from Firestore
  useEffect(() => {
    async function loadData() {
      if (user && vault) {
        const chat = localStorage.getItem(`mylife_chat_${user.uid}`);
        
        const memories = await vault.getMemories();
        const entities = await vault.getEntities();
        const eras = await vault.getEras();

        setStory(prev => ({
          ...prev,
          profile: user,
          chatHistory: chat ? JSON.parse(chat) : INITIAL_LIFE_STORY.chatHistory,
          memories,
          entities,
          eras
        }));
      }
    }
    loadData();
  }, [user, vault]);

  // Background Sync to Vault
  useEffect(() => {
    if (user && vault) {
      vault.syncStory(story);
    }
  }, [story, user, vault]);

  // Gap Detector: Finds periods with no memories
  const timelineGaps = useMemo(() => {
    if (story.memories.length < 2) return [];
    const years = story.memories.map(m => {
      const match = m.sortDate.match(/\d{4}/);
      return match ? parseInt(match[0]) : NaN;
    }).filter(y => !isNaN(y)).sort();
    
    if (years.length === 0) return [story.profile?.birthYear ? story.profile.birthYear + 18 : 1990];
    
    const gaps = [];
    for (let i = 0; i < years.length - 1; i++) {
      if (years[i+1] - years[i] > 5) {
        gaps.push(Math.floor((years[i] + years[i+1]) / 2));
      }
    }
    return gaps;
  }, [story.memories, story.profile]);

  const generateId = () => crypto.randomUUID();

  const requestNudge = async () => {
    if (!user || !story.profile) return;
    const gapYear = timelineGaps.length > 0 ? timelineGaps[0] : story.profile.birthYear + 20;
    
    const nudgeInput = `I'm reflecting on the year ${gapYear}. Can you tell me what was happening then and ask me a question to jog my memory?`;
    await processMemoryFromInput(nudgeInput);
  };

  const login = async (method: 'google' | 'email') => {
    if (method === 'google') {
      try {
        await loginWithGoogle();
      } catch (err) {
        console.error("Login failed", err);
      }
    } else {
      alert("Email Magic Link requested. (Demo: Use Google for instant access)");
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const updateProfile = async (name: string, dob: string, location: string, chapters: string[]) => {
    const year = parseInt(dob.split('-')[0]) || 1974;
    const newProfile = { ...user!, displayName: name, birthYear: year, birthCity: location, onboarded: true };
    
    const newEras: Era[] = [
      { id: generateId(), label: 'Childhood', category: 'personal', startYear: year, endYear: year + 13, colorTheme: 'personal' },
      ...chapters.map((chapter, idx) => ({
        id: generateId(),
        label: chapter,
        category: (idx % 2 === 0 ? 'professional' : 'location') as any,
        startYear: year + 15 + (idx * 5),
        endYear: idx === chapters.length - 1 ? 'present' as const : year + 20 + (idx * 5),
        colorTheme: 'professional'
      }))
    ];

    setUser(newProfile);
    setStory(prev => ({ ...prev, profile: newProfile, eras: newEras }));
  };

  const processMemoryFromInput = async (input: string) => {
    if (!user || !story.profile) return;
    
    const newMessage: ChatMessage = { id: generateId(), role: 'user', text: input, timestamp: Date.now() };
    setStory(prev => ({ ...prev, chatHistory: [...prev.chatHistory, newMessage] }));

    // Prepare "Fact Store" for the AI
    const entityFacts = story.entities.map(e => `[${e.type}: ${e.name} - ${e.historyTags.join(', ')}]`).join('\n');
    const recentMemories = story.memories.slice(-5).map(m => `[${m.sortDate}]: ${m.narrative}`).join('\n');
    const existingFacts = `KNOWN ENTITIES:\n${entityFacts}\n\nRECENT MEMORIES:\n${recentMemories}`;

    const result = await parseMemories(input, { 
      eras: story.eras, 
      birthYear: story.profile.birthYear, 
      existingFacts, 
      chatHistory: story.chatHistory, 
      gaps: timelineGaps
    });

    const bioMessage: ChatMessage = { 
      id: generateId(), 
      role: 'biographer', 
      text: result.biographerFeedback, 
      timestamp: Date.now(), 
      proposals: result.proposals, 
      proposedEntities: result.proposedEntities, 
      sources: result.sources 
    };
    
    setStory(prev => ({ ...prev, chatHistory: [...prev.chatHistory, bioMessage] }));
    setCurrentInvestigation(result.currentInvestigationTopic);
  };

  const confirmDraftMemory = async (messageId: string, draft: DraftMemory) => {
    const rawYear = draft.sortDate.match(/\d{4}/)?.[0];
    const year = parseInt(rawYear || "") || story.profile!.birthYear;
    const eraIds = story.eras.filter(e => year >= e.startYear && (e.endYear === 'present' || year <= (e.endYear as number))).map(e => e.id);
    
    // Automatically link existing entities mentioned in the narrative
    const linkedEntityIds = story.entities
      .filter(ent => draft.narrative.toLowerCase().includes(ent.name.toLowerCase()))
      .map(ent => ent.id);

    const newMem: Memory = { 
      id: generateId(), 
      userId: user!.uid, 
      narrative: draft.narrative,
      originalInput: 'Conversation', 
      sortDate: draft.sortDate, 
      confidenceScore: 1, 
      entityIds: linkedEntityIds, 
      eraIds, 
      sentiment: draft.sentiment 
    };
    
    setStory(prev => ({ 
      ...prev, 
      memories: [...prev.memories, newMem],
      chatHistory: prev.chatHistory.map(m => m.id === messageId ? { 
        ...m, 
        proposals: m.proposals?.filter(p => p.narrative !== draft.narrative) 
      } : m)
    }));
  };

  const confirmProposedEntity = (messageId: string, ent: ProposedEntity) => {
    setStory(prev => {
      const existingIdx = prev.entities.findIndex(e => e.name.toLowerCase() === ent.name?.toLowerCase());
      
      if (existingIdx !== -1) {
        // Update existing entity with new facts
        const updated = [...prev.entities];
        if (ent.details && !updated[existingIdx].historyTags.includes(ent.details)) {
          updated[existingIdx].historyTags.push(ent.details);
        }
        return { 
          ...prev, 
          entities: updated, 
          chatHistory: prev.chatHistory.map(m => m.id === messageId ? { 
            ...m, 
            proposedEntities: m.proposedEntities?.filter(e => e.name !== ent.name) 
          } : m) 
        };
      }
      
      // Create new entity
      const newEnt: Entity = { 
        id: generateId(), 
        userId: user!.uid, 
        name: ent.name!, 
        type: (ent.type as unknown as EntityType) || EntityType.PERSON, 
        historyTags: ent.details ? [ent.details] : [] 
      };
      
      return { 
        ...prev, 
        entities: [...prev.entities, newEnt], 
        chatHistory: prev.chatHistory.map(m => m.id === messageId ? { 
          ...m, 
          proposedEntities: m.proposedEntities?.filter(e => e.name !== ent.name) 
        } : m) 
      };
    });
  };

  const handleMediaUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Full = e.target?.result as string;
      const base64Data = base64Full.split(',')[1];
      const attachment: ChatMessage['attachment'] = { 
        type: file.type.startsWith('image/') ? 'image' : 'pdf', 
        url: base64Full 
      };
      
      const userMsg: ChatMessage = { 
        id: generateId(), 
        role: 'user', 
        text: `Shared an artifact: ${file.name}`, 
        timestamp: Date.now(), 
        attachment 
      };
      setStory(prev => ({ ...prev, chatHistory: [...prev.chatHistory, userMsg] }));
      
      const res = await analyzeMedia(base64Data, file.type, { 
        birthYear: story.profile!.birthYear, 
        existingFacts: story.entities.map(e => e.name).join(', ') 
      });
      
      const pm: PendingMemory = { 
        id: generateId(), 
        mediaUrl: base64Full, 
        mediaType: attachment.type as any, 
        analysis: res.analysis, 
        suggestedData: res 
      };
      setStory(prev => ({ ...prev, pendingMemories: [...prev.pendingMemories, pm] }));
    };
    reader.readAsDataURL(file);
  };

  const confirmPendingMemory = (id: string) => {
    setStory(prev => {
      const pm = prev.pendingMemories.find(m => m.id === id);
      if (!pm) return prev;
      
      const yearStr = pm.suggestedData.suggestedYear || "";
      const yearMatch = yearStr.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0]) : prev.profile!.birthYear;
      
      const eraIds = prev.eras.filter(e => year >= e.startYear && (e.endYear === 'present' || year <= (e.endYear as number))).map(e => e.id);
      
      const newMem: Memory = { 
        id: generateId(), 
        userId: user!.uid, 
        narrative: pm.suggestedData.narrative || '', 
        originalInput: 'Artifact', 
        sortDate: yearStr || `${year}`, 
        confidenceScore: 1, 
        entityIds: [], 
        eraIds, 
        sentiment: 'neutral', 
        mediaUrl: pm.mediaUrl, 
        mediaType: pm.mediaType
      };
      return { 
        ...prev, 
        memories: [...prev.memories, newMem], 
        pendingMemories: prev.pendingMemories.filter(m => m.id !== id) 
      };
    });
  };

  const deleteMemory = (id: string) => setStory(prev => ({ ...prev, memories: prev.memories.filter(m => m.id !== id) }));
  const editMemory = (id: string, updates: Partial<Memory>) => setStory(prev => ({ ...prev, memories: prev.memories.map(m => m.id === id ? { ...m, ...updates } : m) }));
  
  return { 
    user, 
    authLoading, 
    login, 
    logout, 
    story, 
    updateProfile, 
    processMemoryFromInput, 
    requestNudge, 
    handleMediaUpload, 
    confirmPendingMemory, 
    confirmDraftMemory, 
    confirmProposedEntity, 
    deleteMemory, 
    editMemory, 
    currentInvestigation 
  };
}
