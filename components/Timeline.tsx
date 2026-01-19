
import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Memory, Era, EraCategory } from '../types';
import { ERA_THEMES } from '../constants';

interface TimelineProps {
  eras: Era[];
  memories: Memory[];
  onDeleteMemory: (id: string) => void;
  onEditMemory: (id: string, updates: Partial<Memory>) => void;
  currentInvestigation: string | null;
}

const MEMORY_SEEDS = [
  "What was the first car you remember?",
  "Describe your childhood bedroom.",
  "Was there a local shop you frequented?",
  "Tell me about a legendary family holiday.",
  "What did the neighborhood smell like in summer?",
  "Who was your most eccentric neighbor?",
  "What was the first movie that truly moved you?"
];

export const Timeline: React.FC<TimelineProps> = ({ 
  eras, 
  memories, 
  onDeleteMemory,
  onEditMemory,
  currentInvestigation
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredMemories = useMemo(() => {
    let list = [...memories].sort((a, b) => a.sortDate.localeCompare(b.sortDate));
    if (activeFilter) {
      list = list.filter(m => m.eraIds.includes(activeFilter));
    }
    return list;
  }, [memories, activeFilter]);

  const decades = useMemo(() => {
    const years = memories.length > 0 ? memories.map(m => parseInt(m.sortDate.substring(0, 4))) : [1960, 2020];
    const minYear = Math.min(...years, 1960);
    const maxYear = Math.max(...years, 2025);
    const startDecade = Math.floor(minYear / 10) * 10;
    const endDecade = Math.ceil(maxYear / 10) * 10;
    const list = [];
    for (let y = startDecade; y <= endDecade; y += 10) list.push(y);
    return list;
  }, [memories]);

  const scrollToYear = (year: number) => {
    const el = document.getElementById(`year-${year}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="h-full flex relative bg-[#FAFAFA] overflow-hidden">
      {/* Era Context Sidebar (Tracks) */}
      <div className="w-48 shrink-0 bg-white border-r border-slate-100 flex flex-col p-4 overflow-y-auto hide-scrollbar z-20 shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-6">Chapter Tracks</h3>
        
        <div className="space-y-8">
          {(['personal', 'professional', 'location'] as EraCategory[]).map(cat => (
            <div key={cat} className="space-y-3">
              <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: ERA_THEMES[cat].text }} />
                {cat}
              </div>
              <div className="flex flex-col gap-2">
                {eras.filter(e => e.category === cat).map(era => (
                  <button 
                    key={era.id}
                    onClick={() => setActiveFilter(activeFilter === era.id ? null : era.id)}
                    className={`text-left px-3 py-2 rounded-xl border transition-all ${
                      activeFilter === era.id 
                        ? 'bg-slate-900 border-slate-900 shadow-lg scale-105' 
                        : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className={`text-[10px] font-serif font-black ${activeFilter === era.id ? 'text-white' : 'text-slate-700'}`}>
                      {era.label}
                    </div>
                    <div className={`text-[7px] font-black uppercase tracking-tighter ${activeFilter === era.id ? 'text-white/60' : 'text-slate-400'}`}>
                      {era.startYear}—{era.endYear}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {activeFilter && (
          <button 
            onClick={() => setActiveFilter(null)}
            className="mt-8 w-full py-2 bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-slate-100 hover:bg-slate-100"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Main Timeline Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto hide-scrollbar p-8 space-y-12">
        <AnimatePresence>
          {currentInvestigation && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-white border border-dashed border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm mb-6">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center animate-pulse text-white">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <div>
                <h4 className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Researching</h4>
                <p className="text-sm font-serif italic text-slate-900 font-bold">{currentInvestigation}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative border-l-2 border-slate-100 ml-4 pl-10 space-y-16">
          {decades.map((decade, dIdx) => {
            const decadeMemories = filteredMemories.filter(m => {
              const year = parseInt(m.sortDate.substring(0, 4));
              return year >= decade && year < decade + 10;
            });

            const showPlaceholder = decadeMemories.length === 0 && (decade % 20 === 0 || dIdx === 0);

            return (
              <div key={decade} id={`year-${decade}`} className="relative">
                <div className="absolute -left-[51px] top-0 w-10 h-10 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center text-[10px] font-black text-slate-900 shadow-md">
                  {decade}
                </div>

                <div className="space-y-4">
                  {showPlaceholder ? (
                    <div className="h-20 flex items-center text-[10px] text-slate-300 font-serif italic tracking-[0.1em] group hover:text-slate-500 transition-colors">
                      {MEMORY_SEEDS[decade % MEMORY_SEEDS.length]}
                    </div>
                  ) : (
                    decadeMemories.map((m) => (
                      <motion.div 
                        key={m.id}
                        layout
                        onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                        className={`bg-white rounded-2xl border border-slate-100 shadow-sm cursor-pointer overflow-hidden transition-all ${expandedId === m.id ? 'p-6 ring-2 ring-slate-900 shadow-xl' : 'p-4 hover:border-slate-300'}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="shrink-0 pt-1 text-[8px] font-black text-slate-400 font-sans">{m.sortDate}</div>
                          <div className="flex-1">
                            <h4 className={`font-serif text-slate-900 ${expandedId === m.id ? 'text-lg font-black' : 'text-sm font-bold'}`}>{m.narrative}</h4>
                            
                            <div className="flex gap-2 mt-2">
                              {m.eraIds.map(eraId => {
                                const era = eras.find(e => e.id === eraId);
                                if (!era) return null;
                                return (
                                  <span key={eraId} className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-100">
                                    {era.label}
                                  </span>
                                );
                              })}
                            </div>

                            {expandedId === m.id && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-4">
                                {m.mediaUrl && (
                                  <div className="rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                                    <img src={m.mediaUrl} className="w-full h-auto object-cover" />
                                  </div>
                                )}
                                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                  <span className="text-[7px] font-black uppercase text-slate-300 tracking-tighter">Verified Entry ID: {m.id.slice(0, 8)}</span>
                                  <button onClick={(e) => { e.stopPropagation(); onDeleteMemory(m.id); }} className="text-[8px] font-black uppercase text-rose-300 hover:text-rose-600 tracking-widest">Remove</button>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mini Decade Navigation */}
      <div className="w-12 shrink-0 h-full border-l border-slate-50 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center gap-1 z-30">
        {decades.filter(d => d % 10 === 0).map(d => (
          <button 
            key={`nav-${d}`} 
            onClick={() => scrollToYear(d)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black text-slate-300 hover:bg-slate-900 hover:text-white transition-all group relative font-sans"
          >
            {d.toString().slice(2)}
            <div className="absolute right-full mr-2 px-2 py-1 bg-slate-900 text-white text-[7px] rounded opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none">{d}s</div>
          </button>
        ))}
      </div>
    </div>
  );
};
