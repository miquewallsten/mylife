

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
  historyTags: string[];
  narrativeHistory?: string;
}

export interface ProposedEntity extends Partial<Entity> {
  details?: string;
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
  entityIds: string[];
  eraIds: string[]; // Changed to support multiple overlapping eras
  sentiment: 'positive' | 'neutral' | 'high-stakes' | 'nostalgic';
  mediaUrl?: string;
  mediaType?: 'image' | 'pdf' | 'audio';
  eventAnchor?: string; 
}

export interface PendingMemory {
  id: string;
  suggestedData: Partial<Memory>;
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
  associatedEntities?: Partial<Entity>[];
  suggestedEventAnchor?: string;
  suggestedEraCategories?: EraCategory[];
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

export interface LifeStory {
  profile: UserProfile | null;
  memories: Memory[];
  pendingMemories: PendingMemory[];
  entities: Entity[];
  eras: Era[];
  chatHistory: ChatMessage[];
  isPremium: boolean;
}