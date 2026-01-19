
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LifeStory, EntityType } from '../types';
import { BiographerDesk } from './BiographerDesk';

interface DashboardProps {
  story: LifeStory;
  isProcessing: boolean;
  currentInvestigation: string | null;
  onSendMessage: (text: string) => void;
  onSetTone: (tone: 'concise' | 'elaborate') => void;
  userName: string;
}

const TAG_COLORS: Record<string, string> = {
  PERSON: 'bg-blue-50 text-blue-500 border-blue-100',
  PLACE: 'bg-teal-50 text-teal-500 border-teal-100',
  PASSION: 'bg-rose-50 text-rose-500 border-rose-100',
  LIKE: 'bg-rose-50 text-rose-500 border-rose-100',
  DREAM: 'bg-amber-50 text-amber-500 border-amber-100',
  THOUGHT: 'bg-stone-50 text-stone-500 border-stone-100',
  OBJECT: 'bg-slate-50 text-slate-500 border-slate-100',
  IDENTITY: 'bg-indigo-50 text-indigo-500 border-indigo-100'
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  story, 
  isProcessing, 
  currentInvestigation, 
  onSendMessage,
  onSetTone,
  userName 
}) => {
  const activeFragments = useMemo(() => {
    return story.entities.slice(-15).reverse();
  }, [story.entities]);

  const nudge = useMemo(() => {
    const hasFamily = story.entities.some(e => ['Father', 'Mother', 'Sibling'].includes(e.relationship || ''));
    const places = story.entities.filter(e => e.type === EntityType.PLACE);
    
    if (!hasFamily) {
      return `If you'd like, you could share a bit about the people who influenced your early years. I'm curious if any specific family members shaped your path?`;
    }
    
    if (places.length >= 2 && !story.entities.some(e => e.type === EntityType.IDENTITY)) {
      return "Your journey has touched many borders. If you're comfortable, we could document how these different places helped define your sense of self.";
    }

    return "Looking back at your younger self, is there a dream or an ambition you once had that you'd like to make sure is part of your record?";
  }, [story.entities]);

  const tone = story.profile?.preferredTone || 'concise';

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#FAF9F6] overflow-hidden">
      <div className="flex-1 h-full flex flex-col p-1 md:p-2 order-2 md:order-1 min-h-0">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden flex flex-col">
          <BiographerDesk 
            chatHistory={story.chatHistory}
            onSendMessage={onSendMessage}
            isLoading={isProcessing}
            currentInvestigation={currentInvestigation}
            userName={userName}
            fullScreen={true}
            hideHeader={false}
          />
        </div>
      </div>

      <div className="w-full md:w-[260px] p-1 md:p-2 space-y-1.5 order-1 md:order-2 flex-none overflow-y-auto hide-scrollbar">
        <div className="bg-[#1A202C] p-3.5 rounded-[1.5rem] shadow-lg text-white space-y-2 relative overflow-hidden">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-emerald-400" />
            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-stone-500 font-sans">Story Ideas</span>
          </div>

          <p className="text-[12px] font-serif italic text-stone-300 leading-tight border-l border-emerald-400/20 pl-2.5">
            {nudge}
          </p>

          <div className="pt-1.5 flex items-center justify-between border-t border-white/5">
            <span className="text-[6px] font-black uppercase text-stone-600 tracking-widest">Active</span>
            <button 
              onClick={() => onSendMessage("Could you give me some ideas for stories about my personal journey?")}
              className="text-[7px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Give me Ideas →
            </button>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-[1.5rem] shadow-sm border border-stone-100 space-y-3">
          <div className="space-y-1.5">
            <span className="text-[7px] font-black uppercase text-stone-400 tracking-widest font-sans">Conversation Tone</span>
            <div className="flex p-0.5 bg-stone-50 rounded-lg">
              <button 
                onClick={() => onSetTone('concise')}
                className={`flex-1 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${tone === 'concise' ? 'bg-[#1A202C] text-white shadow-sm' : 'text-stone-400'}`}
              >
                Direct
              </button>
              <button 
                onClick={() => onSetTone('elaborate')}
                className={`flex-1 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${tone === 'elaborate' ? 'bg-[#1A202C] text-white shadow-sm' : 'text-stone-400'}`}
              >
                Warm
              </button>
            </div>
          </div>

          <div className="border-t border-stone-50 pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[7px] font-black uppercase text-stone-400 tracking-widest font-sans">Fragments</span>
              <span className="text-[6px] font-black text-stone-200 uppercase">{activeFragments.length}</span>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {activeFragments.map(ent => (
                <motion.div 
                  key={ent.id}
                  className={`px-1.5 py-0.5 border rounded-md text-[7px] font-bold font-sans uppercase tracking-tight ${TAG_COLORS[ent.type] || 'bg-stone-50 text-stone-600 border-stone-100'}`}
                >
                  {ent.name}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
