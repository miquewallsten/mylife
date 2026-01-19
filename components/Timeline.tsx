
import React, { useState, useMemo, useEffect, useRef } from 'react';
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

export const Timeline: React.FC<TimelineProps> = ({ eras, memories, onDeleteMemory, onEditMemory, currentInvestigation }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingDate, setEditingDate] = useState('');
  const [activeEraId, setActiveEraId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sortedMemories = useMemo(() => {
    return [...memories].sort((a, b) => (a.sortDate || '').localeCompare(b.sortDate || ''));
  }, [memories]);

  const decades = useMemo(() => {
    const years = memories.length > 0 ? memories.map(m => {
      const match = m.sortDate.match(/\d{4}/);
      return match ? parseInt(match[0]) : NaN;
    }).filter(y => !isNaN(y)) : [1960, 2020];
    
    const min = Math.min(...years, 1950);
    const max = Math.max(...years, 2030);
    
    const list = [];
    for (let y = Math.floor(min / 10) * 10; y <= Math.ceil(max / 10) * 10; y += 10) list.push(y);
    return list;
  }, [memories]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const elements = containerRef.current.querySelectorAll('[data-era-id]');
      let foundEra = null;
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight / 2 && rect.bottom > window.innerHeight / 2) {
          foundEra = el.getAttribute('data-era-id');
        }
      });
      if (foundEra) setActiveEraId(foundEra);
    };

    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  const activeEra = eras.find(e => e.id === activeEraId);
  const bgGradient = activeEra ? ERA_THEMES[activeEra.category].gradient : 'from-slate-50 to-white';

  const handleEdit = (m: Memory) => {
    setEditingId(m.id);
    setEditingText(m.narrative);
    setEditingDate(m.sortDate);
  };

  const saveEdit = () => {
    if (editingId) onEditMemory(editingId, { narrative: editingText, sortDate: editingDate });
    setEditingId(null);
  };

  return (
    <div 
      ref={containerRef}
      className={`h-full overflow-y-auto hide-scrollbar transition-all duration-1000 bg-gradient-to-b ${bgGradient} relative font-serif`}
    >
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40 opacity-10 hover:opacity-100 transition-opacity">
        {decades.map(d => (
          <button 
            key={d} 
            className="text-[10px] font-black font-sans text-slate-900 hover:scale-150 transition-transform"
            onClick={() => document.getElementById(`decade-${d}`)?.scrollIntoView({ behavior: 'smooth' })}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="max-w-3xl mx-auto py-32 px-6 space-y-24">
        <header className="text-center space-y-6 mb-32">
          <div className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 font-sans">The Infinite Path</div>
          <h1 className="text-7xl font-black text-slate-900 leading-tight tracking-tight">Your Manuscript</h1>
          <div className="h-1.5 w-20 bg-slate-900 mx-auto rounded-full" />
        </header>

        <div className="relative border-l-2 border-slate-900/10 ml-4 pl-12 space-y-32">
          {decades.map((decade) => {
            const list = sortedMemories.filter(m => {
              const match = m.sortDate.match(/\d{4}/);
              const year = match ? parseInt(match[0]) : NaN;
              return year >= decade && year < decade + 10;
            });

            if (list.length === 0 && decade % 20 !== 0) return null;

            return (
              <div key={decade} id={`decade-${decade}`} className="relative">
                <div className="absolute -left-[68px] top-0 w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-[11px] font-black text-white shadow-2xl z-10 font-sans rotate-12">
                  {decade}
                </div>

                <div className="space-y-16">
                  {list.length === 0 ? (
                    <div className="py-12 text-3xl italic text-slate-200">A quiet period in the {decade}s...</div>
                  ) : (
                    list.map(m => {
                      const primaryEra = eras.find(e => m.eraIds.includes(e.id));
                      const isVague = !/\d{4}/.test(m.sortDate);

                      return (
                        <motion.div 
                          key={m.id}
                          data-era-id={primaryEra?.id}
                          layout
                          onClick={() => editingId !== m.id && handleEdit(m)}
                          className={`group relative glass rounded-[3rem] p-10 md:p-14 border-2 transition-all cursor-pointer hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] ${editingId === m.id ? 'border-slate-900 shadow-2xl scale-[1.02] bg-white' : 'border-white/50 hover:border-slate-900/20 shadow-xl'}`}
                        >
                          <div className="flex flex-col gap-8">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className={`text-[12px] font-black uppercase tracking-widest font-sans ${isVague ? 'text-amber-500 italic' : 'text-slate-400'}`}>
                                  {m.sortDate}
                                  {isVague && " (Approx)"}
                                </span>
                              </div>
                              {primaryEra && (
                                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${ERA_THEMES[primaryEra.category].border} text-slate-600 font-sans bg-white/50 shadow-sm`}>
                                  {primaryEra.label}
                                </span>
                              )}
                            </div>

                            {editingId === m.id ? (
                              <div className="space-y-8">
                                <textarea 
                                  autoFocus 
                                  className="w-full text-3xl font-bold text-slate-900 bg-transparent outline-none border-b-2 border-slate-100 focus:border-slate-900 transition-colors leading-relaxed py-4 resize-none"
                                  value={editingText} 
                                  onChange={e => setEditingText(e.target.value)}
                                  rows={4}
                                />
                                <div className="flex gap-4">
                                  <button onClick={saveEdit} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl">Save Milestone</button>
                                  <button onClick={() => setEditingId(null)} className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest">Discard Changes</button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-10">
                                <p className="text-3xl md:text-4xl font-bold text-slate-900 leading-[1.3] tracking-tight first-letter:text-6xl first-letter:float-left first-letter:mr-3 first-letter:font-black">
                                  {m.narrative}
                                </p>
                                {m.historicalContext && (
                                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-[11px] text-amber-800 italic leading-relaxed font-sans shadow-sm flex gap-3">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                                    <span>Historical Anchor: {m.historicalContext}</span>
                                  </div>
                                )}
                                {m.mediaUrl && (
                                  <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white ring-1 ring-slate-100">
                                    <img src={m.mediaUrl} className="w-full h-auto object-cover max-h-[500px]" alt="Artifact" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
