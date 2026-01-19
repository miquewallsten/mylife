


import { useState, useEffect } from 'react';
import { LifeStory, Memory, Entity, Era, EntityType, UserProfile, ChatMessage, PendingMemory, DraftMemory, GroundingSource, EraCategory, ProposedEntity } from '../types';
import { INITIAL_LIFE_STORY } from '../constants';
import { parseMemories, analyzeMedia } from '../services/biographer';

const STORAGE_KEY_PREFIX = 'mylife_story_';

export function useLifeStory() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('mylife_active_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [currentInvestigation, setCurrentInvestigation] = useState<string | null>(null);
  
  const [story, setStory] = useState<LifeStory>(() => {
    if (user) {
      const savedStory = localStorage.getItem(`${STORAGE_KEY_PREFIX}${user.uid}`);
      return savedStory ? JSON.parse(savedStory) : INITIAL_LIFE_STORY;
    }
    return INITIAL_LIFE_STORY;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('mylife_active_user', JSON.stringify(user));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${user.uid}`, JSON.stringify(story));
    }
  }, [story, user]);

  const login = (method: string) => {
    const mockUid = 'demo_user_alpha';
    const savedStory = localStorage.getItem(`${STORAGE_KEY_PREFIX}${mockUid}`);
    if (savedStory) {
      const parsedStory = JSON.parse(savedStory) as LifeStory;
      setUser(parsedStory.profile);
      setStory(parsedStory);
    } else {
      const mockUser: UserProfile = { uid: mockUid, email: 'demo@mylife.ai', displayName: null, birthYear: 1974, birthCity: '', onboarded: false };
      setUser(mockUser);
      setStory({ ...INITIAL_LIFE_STORY, profile: mockUser });
    }
  };

  const logout = () => {
    localStorage.removeItem('mylife_active_user');
    setUser(null);
    setStory(INITIAL_LIFE_STORY);
  };

  const updateProfile = async (name: string, dob: string, location: string) => {
    const year = parseInt(dob.split('-')[0]) || 1974;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = parseInt(dob.split('-')[1]) - 1;
    const month = monthNames[monthIndex] || "";
    
    const newProfile = { ...user!, displayName: name, birthYear: year, birthCity: location, onboarded: true };
    const newEras: Era[] = [
      { id: 'era_origin', label: 'Early Years', category: 'personal', startYear: year, endYear: year + 18, colorTheme: 'personal' },
      { id: 'era_location_origin', label: `Life in ${location}`, category: 'location', startYear: year, endYear: 'present', colorTheme: 'location' }
    ];
    setUser(newProfile);
    setCurrentInvestigation("Opening the book");

    const initialProposal: DraftMemory = { 
      narrative: `Born in ${location}.`, 
      sortDate: dob, 
      location: location, 
      sentiment: 'neutral', 
      suggestedEraCategories: ['personal', 'location'] 
    };

    const firstMessage = `I see you were born in ${month} ${year}, that is great. \n\nDo you want to tell me a bit about your parents or siblings? \n\nIf not, just start entering any story, adventure, trip, work, or anything relevant to your life—your love life, kids, whatever comes to mind. I'm listening.`;

    setStory(prev => ({ 
      ...prev, 
      profile: newProfile, 
      eras: newEras, 
      chatHistory: [{
        id: 'welcome_origin', 
        role: 'biographer', 
        text: firstMessage, 
        timestamp: Date.now(), 
        proposals: [initialProposal]
      }] 
    }));
  };

  // Fixed proposedEntities parameter to use ProposedEntity type
  const addChatMessage = (text: string, role: 'user' | 'biographer', proposals?: DraftMemory[], proposedEntities?: ProposedEntity[], attachment?: ChatMessage['attachment'], sources?: GroundingSource[]) => {
    const newMessage: ChatMessage = { id: Math.random().toString(36).substr(2, 9), role, text, timestamp: Date.now(), attachment, proposals, proposedEntities, sources };
    setStory(prev => ({ ...prev, chatHistory: [...prev.chatHistory, newMessage] }));
    return newMessage;
  };

  const processMemoryFromInput = async (input: string) => {
    if (!user || !story.profile) return;
    addChatMessage(input, 'user');
    
    // Include entities in the "Facts" for better cross-referencing
    const entityFacts = story.entities.map(e => `[Entity: ${e.name} (${e.type}) details: ${e.historyTags.join(', ')}]`).join('\n');
    const memoryFacts = story.memories.map(m => `[${m.sortDate}: ${m.narrative}]`).join('\n');
    const existingFacts = `${entityFacts}\n${memoryFacts}`;
    
    let latLng = undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
      latLng = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch (e) {
      console.warn("Location context unavailable.");
    }

    const result = await parseMemories(input, { 
      eras: story.eras, 
      birthYear: story.profile.birthYear, 
      existingFacts, 
      chatHistory: story.chatHistory,
      latLng
    });

    addChatMessage(result.biographerFeedback, 'biographer', result.proposals, result.proposedEntities, undefined, result.sources);
    setCurrentInvestigation(result.currentInvestigationTopic);
  };

  const handleMediaUpload = async (file: File) => {
    if (!user || !story.profile) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = (e.target?.result as string).split(',')[1];
      const attachment: ChatMessage['attachment'] = { type: file.type.startsWith('image/') ? 'image' : (file.type.includes('pdf') ? 'pdf' : 'audio'), url: URL.createObjectURL(file) };
      addChatMessage(`Attached artifact: ${file.name}`, 'user', undefined, undefined, attachment);
      const analysis = await analyzeMedia(base64Data, file.type, { birthYear: story.profile!.birthYear, existingFacts: story.memories.map(m => m.narrative).join(' ') });
      const pending: PendingMemory = { id: Math.random().toString(36).substr(2, 9), mediaUrl: attachment.url, mediaType: attachment.type as any, analysis: analysis.analysis, suggestedData: { narrative: analysis.narrative, sortDate: analysis.suggestedYear || 'Unknown', location: analysis.suggestedLocation, eventAnchor: analysis.suggestedEventAnchor } };
      setStory(prev => ({ ...prev, pendingMemories: [...prev.pendingMemories, pending] }));
      addChatMessage(analysis.biographerCuriosity, 'biographer');
    };
    reader.readAsDataURL(file);
  };

  const confirmPendingMemory = (id: string) => {
    setStory(prev => {
      const pm = prev.pendingMemories.find(p => p.id === id);
      if (!pm) return prev;
      const year = parseInt((pm.suggestedData.sortDate || '').split('-')[0]);
      const matchedEras = prev.eras.filter(e => year >= e.startYear && (e.endYear === 'present' || year <= e.endYear));
      const newMemory: Memory = { 
        id: Math.random().toString(36).substr(2, 9), 
        userId: user?.uid || 'anonymous', 
        narrative: pm.suggestedData.narrative || 'Artifact Record', 
        originalInput: 'Upload', 
        sortDate: pm.suggestedData.sortDate || 'Unknown', 
        location: pm.suggestedData.location, 
        confidenceScore: 0.9, 
        entityIds: [], 
        eraIds: matchedEras.map(e => e.id), 
        sentiment: 'neutral', 
        mediaUrl: pm.mediaUrl, 
        mediaType: pm.mediaType, 
        eventAnchor: pm.suggestedData.eventAnchor 
      };
      return { ...prev, memories: [...prev.memories, newMemory], pendingMemories: prev.pendingMemories.filter(p => p.id !== id) };
    });
  };

  const confirmDraftMemory = (messageId: string, draft: DraftMemory) => {
    const year = parseInt(draft.sortDate.split('-')[0]);
    
    setStory(prev => {
      let currentEras = [...prev.eras];
      
      if (draft.suggestedEraCategories) {
        draft.suggestedEraCategories.forEach(cat => {
          const existingPresentIdx = currentEras.findIndex(e => e.category === cat && e.endYear === 'present');
          
          if (existingPresentIdx !== -1) {
            const existing = currentEras[existingPresentIdx];
            if (existing.label === (draft.location ? `Life in ${draft.location}` : `New ${cat} Era`) && existing.startYear === year) {
              return;
            }
            currentEras[existingPresentIdx] = { ...existing, endYear: year };
          }

          const newEra: Era = { 
            id: `era_${Math.random().toString(36).substr(2, 5)}`, 
            label: draft.location ? `Life in ${draft.location}` : `New ${cat} Era`, 
            category: cat, 
            startYear: year, 
            endYear: 'present', 
            colorTheme: cat 
          };
          currentEras.push(newEra);
        });
      }

      const matchedEraIds = currentEras.filter(e => year >= e.startYear && (e.endYear === 'present' || year <= e.endYear)).map(e => e.id);
      
      const newMemory: Memory = { 
        id: Math.random().toString(36).substr(2, 9), 
        userId: user?.uid || 'anonymous', 
        narrative: draft.narrative, 
        originalInput: 'Conversation', 
        sortDate: draft.sortDate, 
        location: draft.location, 
        confidenceScore: 1.0, 
        entityIds: [], 
        eraIds: matchedEraIds, 
        sentiment: draft.sentiment || 'neutral', 
        eventAnchor: draft.suggestedEventAnchor 
      };

      return { 
        ...prev, 
        memories: [...prev.memories, newMemory], 
        eras: currentEras,
        chatHistory: prev.chatHistory.map(m => m.id === messageId ? { ...m, proposals: m.proposals?.filter(p => p !== draft) } : m) 
      };
    });
  };

  // Fixed entityDraft parameter to use ProposedEntity type
  const confirmProposedEntity = (messageId: string, entityDraft: ProposedEntity) => {
    setStory(prev => {
      const existingIdx = prev.entities.findIndex(e => e.name.toLowerCase() === entityDraft.name?.toLowerCase());
      
      if (existingIdx !== -1) {
        // Enrich existing entity
        const existing = prev.entities[existingIdx];
        const updatedTags = [...existing.historyTags];
        if (entityDraft.details && !updatedTags.includes(entityDraft.details)) {
          updatedTags.push(entityDraft.details);
        }
        
        const updatedEntities = [...prev.entities];
        updatedEntities[existingIdx] = { ...existing, historyTags: updatedTags };
        
        return {
          ...prev,
          entities: updatedEntities,
          chatHistory: prev.chatHistory.map(m => m.id === messageId ? { ...m, proposedEntities: m.proposedEntities?.filter(e => e.name !== entityDraft.name) } : m)
        };
      } else {
        // Create new entity
        const newEntity: Entity = { 
          id: Math.random().toString(36).substr(2, 9), 
          userId: user?.uid || 'anonymous', 
          name: entityDraft.name || 'Unknown', 
          type: entityDraft.type || EntityType.PERSON, 
          historyTags: entityDraft.details ? [entityDraft.details] : [] 
        };
        return { 
          ...prev, 
          entities: [...prev.entities, newEntity], 
          chatHistory: prev.chatHistory.map(m => m.id === messageId ? { ...m, proposedEntities: m.proposedEntities?.filter(e => e.name !== entityDraft.name) } : m) 
        };
      }
    });
  };

  const deleteMemory = (id: string) => setStory(prev => ({ ...prev, memories: prev.memories.filter(m => m.id !== id) }));
  const editMemory = (id: string, updates: Partial<Memory>) => setStory(prev => ({ ...prev, memories: prev.memories.map(m => m.id === id ? { ...m, ...updates } : m) }));
  
  return { 
    user, login, logout, story, updateProfile, processMemoryFromInput, handleMediaUpload, 
    confirmPendingMemory, confirmDraftMemory, confirmProposedEntity, deleteMemory, editMemory, 
    currentInvestigation 
  };
}