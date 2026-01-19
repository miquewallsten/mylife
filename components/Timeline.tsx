
import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Memory, Era } from '../types';

interface TimelineProps {
  eras: Era[];
  memories: Memory[];
  onDeleteMemory: (id: string) => void;
  onEditMemory: (id: string, updates: Partial<Memory>) => void;
  currentInvestigation: string | null;
  profile?: { name: string; birthYear: number; birthCity: string };
}

export const Timeline: React.FC<TimelineProps> = ({ eras, memories, onDeleteMemory, onEditMemory, currentInvestigation, profile }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingDate, setEditingDate] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const eventMemories = useMemo(() => {
    return memories
      .filter(m => m.type === 'EVENT' && m.sortDate !== '0000' && m.sortDate !== '')
      .sort((a, b) => (a.sortDate || '').localeCompare(b.sortDate || ''));
  }, [memories]);

  const decades = useMemo(() => {
    const startYear = profile?.birthYear || 1960;
    const years = eventMemories.length > 0 ? eventMemories.map(m => {
      const match = m.sortDate.match(/\d{4}/);
      return match ? parseInt(match[0]) : NaN;
    }).filter(y => !isNaN(y)) : [startYear];
    
    const min = Math.min(...years, startYear);
    const max = Math.max(...years, new Date().getFullYear());
    
    const list = [];
    for (let y = Math.floor(min / 10) * 10; y <= Math.ceil(max / 10) * 10; y += 10) list.push(y);
    return list;
  }, [eventMemories, profile]);

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
    <div ref={containerRef} className="h-full overflow-y-auto hide-scrollbar bg-[#FDFDFD] relative font-serif selection:bg-slate-100">
      <div className="fixed right-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-40 opacity-10 hover:opacity-100 transition-opacity">
        {decades.map(d => (
          <button 
            key={d} 
            className="text-[6px] font-black font-sans text-slate-900 p-1 hover:scale-125 transition-transform"
            onClick={() => document.getElementById(`decade-${d}`)?.scrollIntoView({ behavior: 'smooth' })}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="max-w-xl mx-auto py-16 px-8 space-y-12">
        <header className="text-center space-y-1 mb-12">
          <div className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300 font-sans">The Ledger of Your Life</div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">YOUR RECORD</h1>
        </header>

        <div className="relative border-l-[1.5px] border-slate-100 ml-2 pl-8 space-y-8">
          {profile && (
            <div className="relative group">
              <div className="absolute -left-[38.5px] top-1.5 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-[7px] font-black text-white z-20 font-sans border-4 border-white">
                {profile.birthYear}
              </div>
              <div className="p-4 rounded-2xl hover:bg-slate-50/50 transition-colors">
                <span className="text-[7px] font-black uppercase text-slate-300 font-sans block mb-1">Genesis</span>
                <p className="text-lg font-black text-slate-900 leading-none">The story began in {profile.birthCity}.</p>
              </div>
            </div>
          )}

          {decades.map((decade) => {
            const list = eventMemories.filter(m => {
              const match = m.sortDate.match(/\d{4}/);
              const year = match ? parseInt(match[0]) : NaN;
              return year >= decade && year < decade + 10;
            });

            if (list.length === 0 && decade % 20 !== 0) return null;

            return (
              <div key={decade} id={`decade-${decade}`} className="relative space-y-4">
                <div className="absolute -left-[38.5px] top-0 w-6 h-6 bg-white border-2 border-slate-100 rounded-lg flex items-center justify-center text-[7px] font-black text-slate-400 z-10 font-sans">
                  {decade}
                </div>

                <div className="space-y-2">
                  {list.map(m => (
                    <motion.div 
                      key={m.id}
                      layout
                      onClick={() => editingId !== m.id && handleEdit(m)}
                      className={`group relative p-5 rounded-[2rem] transition-all cursor-pointer border ${editingId === m.id ? 'bg-white border-slate-900 shadow-xl z-30' : 'bg-white border-slate-50 hover:border-slate-200'}`}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-sans">{m.sortDate}</span>
                          {m.groundingSources && m.groundingSources.length > 0 && (
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          )}
                        </div>

                        {editingId === m.id ? (
                          <div className="space-y-3">
                            <input 
                              className="w-full text-[10px] font-black uppercase tracking-widest bg-transparent border-b border-slate-200 outline-none pb-1"
                              value={editingDate}
                              onChange={e => setEditingDate(e.target.value)}
                            />
                            <textarea 
                              autoFocus 
                              className="w-full text-[15px] font-bold text-slate-900 bg-transparent outline-none py-1 resize-none leading-tight"
                              value={editingText} 
                              onChange={e => setEditingText(e.target.value)}
                            />
                            <div className="flex gap-2 pt-2">
                              <button onClick={saveEdit} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Update Thread</button>
                              <button onClick={() => setEditingId(null)} className="px-5 py-2.5 text-slate-400 text-[9px] font-black uppercase tracking-widest">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-[16px] font-bold text-slate-900 leading-snug tracking-tight">
                              {m.narrative}
                            </p>
                            
                            {m.aiInsight && (
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-[8px] font-black uppercase text-slate-400 font-sans block mb-1">Story Connection</span>
                                <p className="text-[11px] text-slate-600 font-sans font-medium leading-relaxed">{m.aiInsight}</p>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-1">
                              {m.groundingSources?.map((src, i) => (
                                <a 
                                  key={i} 
                                  href={src.uri} 
                                  target="_blank" 
                                  rel="noopener"
                                  className="text-[8px] font-black uppercase text-slate-400 border border-slate-100 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {src.title}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
