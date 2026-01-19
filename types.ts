
export enum EntityType {
  PERSON = 'PERSON',
  PLACE = 'PLACE',
  OBJECT = 'OBJECT',
  DREAM = 'DREAM',
  VISION = 'VISION',
  SKILL = 'SKILL',
  PASSION = 'PASSION',
  LIKE = 'LIKE',
  THOUGHT = 'THOUGHT',
  IDENTITY = 'IDENTITY'
}

export type EraCategory = 'personal' | 'professional' | 'location';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Attachment {
  id: string;
  type: 'image' | 'doc' | 'link' | 'audio';
  url: string;
  name: string;
}

export interface EntityMetadata {
  dob?: string;
  locationOfBirth?: string;
  citizenship?: string[];
  notes?: string;
  ancestry?: string;
}

export interface Entity {
  id: string;
  userId: string;
  name: string;
  type: EntityType;
  relationship?: string; // e.g., 'Father', 'Spouse', 'Mentor'
  relatedToId?: string; // Direct ID of parent/child/spouse for lineage
  historyTags: string[]; 
  narrativeHistory?: string; 
  metadata?: EntityMetadata;
}

export interface MemoryConnection {
  targetId: string;
  reason: string;
  strength: number; // 0.1 to 1.0
}

export interface Memory {
  id: string;
  userId: string;
  narrative: string;
  originalInput: string;
  sortDate: string; 
  entityIds: string[]; 
  eraIds: string[]; 
  connections: MemoryConnection[]; 
  sentiment: 'positive' | 'neutral' | 'high-stakes' | 'nostalgic';
  type: 'EVENT' | 'INTANGIBLE';
  attachments?: Attachment[];
  aiInsight?: string; 
  groundingSources?: GroundingSource[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'biographer';
  text: string;
  timestamp: number;
}

export interface Era {
  id: string;
  label: string;
  category: EraCategory;
  startYear: number;
  endYear: number | 'present';
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  birthYear: number;
  birthCity: string;
  onboarded: boolean;
  preferredTone?: 'concise' | 'elaborate';
}

export interface LegacyInsight {
  theme: string;
  description: string;
}

export interface LifeStory {
  profile: UserProfile | null;
  memories: Memory[];
  entities: Entity[];
  eras: Era[];
  chatHistory: ChatMessage[];
  isPremium: boolean;
  legacyInsights: LegacyInsight[];
}
