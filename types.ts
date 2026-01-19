
export enum EntityType {
  PERSON = 'PERSON',
  PLACE = 'PLACE',
  OBJECT = 'OBJECT'
}

export type EraCategory = 'personal' | 'professional' | 'location';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Entity {
  id: string;
  userId: string;
  name: string;
  type: EntityType;
  relationship?: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  historyTags: string[]; // These are the "Facts" we've collected
  narrativeHistory?: string; // AI Synthesized summary
}

export interface ProposedEntity extends Partial<Entity> {
  details?: string; // Synthesized biographical detail
}

export interface Memory {
  id: string;
  userId: string;
  narrative: string;
  originalInput: string;
  sortDate: string; // YYYY or YYYY-MM-DD
  location?: string;
  latLng?: { lat: number; lng: number };
  address?: string;
  confidenceScore: number;
  entityIds: string[]; // Explicitly link to People/Places
  eraIds: string[];
  sentiment: 'positive' | 'neutral' | 'high-stakes' | 'nostalgic';
  mediaUrl?: string;
  mediaType?: 'image' | 'pdf' | 'audio';
  historicalContext?: string; // AI generated context for the era
}

export interface PendingMemory {
  id: string;
  suggestedData: Partial<Memory> & {
    suggestedYear?: string;
    suggestedLocation?: string;
    biographerCuriosity?: string;
  };
  mediaUrl: string;
  mediaType: 'image' | 'pdf' | 'audio';
  analysis: string;
}

export interface DraftMemory {
  narrative: string;
  sortDate: string;
  location?: string;
  latLng?: { lat: number; lng: number };
  address?: string;
  sentiment: 'positive' | 'neutral' | 'high-stakes' | 'nostalgic';
  associatedEntities?: ProposedEntity[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'biographer';
  text: string;
  timestamp: number;
  attachment?: {
    type: 'image' | 'pdf' | 'audio';
    url: string;
  };
  proposals?: DraftMemory[];
  proposedEntities?: ProposedEntity[];
  sources?: GroundingSource[]; 
}

export interface Era {
  id: string;
  label: string;
  category: EraCategory;
  startYear: number;
  endYear: number | 'present';
  colorTheme: string; 
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  birthYear: number;
  birthCity: string;
  onboarded: boolean;
}

export interface LegacyInsight {
  theme: string;
  description: string;
  relatedMemories: string[];
}

export interface LifeStory {
  profile: UserProfile | null;
  memories: Memory[];
  pendingMemories: PendingMemory[];
  entities: Entity[];
  eras: Era[];
  chatHistory: ChatMessage[];
  isPremium: boolean;
  legacyInsights: LegacyInsight[];
}
