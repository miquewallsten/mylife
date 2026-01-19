
import { LifeStory, EraCategory } from './types';

export const ERA_THEMES: Record<EraCategory, { bg: string, text: string, border: string, track: string, gradient: string }> = {
  personal: {
    bg: '#FDF7ED', // Warm Sepia
    text: '#5D4037',
    border: 'border-[#E7D7C1]',
    track: '#EFE0C3',
    gradient: 'from-[#FDF7ED] to-[#F3E5AB]' // Warm Sun
  },
  professional: {
    bg: '#F4F7FA', // Professional Blue
    text: '#334E68',
    border: 'border-[#D1DBE5]',
    track: '#E1E9F0',
    gradient: 'from-[#F4F7FA] to-[#CBD5E1]' // Cool Steel
  },
  location: {
    bg: '#F0F9F8', // Geographic Teal
    text: '#004D40',
    border: 'border-[#C1E5E1]',
    track: '#D1E8E7',
    gradient: 'from-[#F0F9F8] to-[#99F6E4]' // Fresh Mist
  }
};

export const INITIAL_LIFE_STORY: LifeStory = {
  profile: null,
  memories: [],
  pendingMemories: [],
  entities: [],
  eras: [],
  chatHistory: [
    {
      id: 'welcome',
      role: 'biographer',
      text: 'Hello. I am your Biographer. I am here to help you capture your life as it truly was—the moves, the businesses, and the personal milestones. Where should we begin?',
      timestamp: Date.now()
    }
  ],
  isPremium: false,
  legacyInsights: []
};
