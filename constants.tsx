
import { LifeStory, EraCategory } from './types';

export const ERA_THEMES: Record<EraCategory, { bg: string, text: string, border: string, track: string, gradient: string }> = {
  personal: {
    bg: '#FDF7ED', 
    text: '#5D4037',
    border: 'border-[#E7D7C1]',
    track: '#EFE0C3',
    gradient: 'from-[#FDF7ED] to-[#F3E5AB]'
  },
  professional: {
    bg: '#F4F7FA',
    text: '#334E68',
    border: 'border-[#D1DBE5]',
    track: '#E1E9F0',
    gradient: 'from-[#F4F7FA] to-[#CBD5E1]'
  },
  location: {
    bg: '#F0F9F8',
    text: '#004D40',
    border: 'border-[#C1E5E1]',
    track: '#D1E8E7',
    gradient: 'from-[#F0F9F8] to-[#99F6E4]'
  }
};

export const INITIAL_LIFE_STORY: LifeStory = {
  profile: null,
  memories: [],
  entities: [],
  eras: [],
  chatHistory: [
    {
      id: 'welcome',
      role: 'biographer',
      text: "I'm here to help you turn your memories into a beautiful legacy. What's one story you've always wanted to make sure stays in the family?",
      timestamp: Date.now()
    }
  ],
  isPremium: false,
  legacyInsights: []
};
