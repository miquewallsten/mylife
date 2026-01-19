


import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, PendingMemory, DraftMemory, Entity, ProposedEntity } from '../types';

interface BiographerDeskProps {
  chatHistory: ChatMessage[];
  pendingMemories: PendingMemory[];
  onSendMessage: (text: string) => void;
  onUploadMedia: (file: File) => void;
  onConfirmPending: (id: string) => void;
  onConfirmDraft: (messageId: string, draft: DraftMemory) => void;
  onConfirmEntity: (messageId: string, entity: ProposedEntity) => void;
  isLoading: boolean;
  currentInvestigation?: string | null;
}

export const BiographerDesk: React.FC<BiographerDeskProps> = ({ 
  chatHistory, 
  pendingMemories,
  onSendMessage, 
  onUploadMedia,
  onConfirmPending,
  onConfirmDraft,
  onConfirmEntity,
  isLoading,
  currentInvestigation,
}) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' });
    }
  }, [chatHistory, pendingMemories]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200 shadow-sm overflow-hidden font-serif">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center text-white text-[10px] font-black uppercase font-sans">S</div>
          <div>
            <h3 className="text-[11px] font-black text-slate-900 tracking-tight uppercase leading-none font-sans">The Study</h3>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mt-1 truncate max-w-[140px] font-sans">
              {currentInvestigation || 'A friend is listening'}
            </span>
          </div>
        </div>
        <button 
          onClick={() => onSendMessage("I'm ready to talk about something else.")} 
          className="px-2 py-1 border border-slate-200 rounded-md text-[8px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-900 hover:text-white transition-all font-sans"
        >
          New Topic
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-4 hide-scrollbar bg-[#FDFDFD]">
        <AnimatePresence>
          {pendingMemories.map((pm) => (
            <motion.div key={pm.id} className="w-full bg-white rounded-xl border-2 border-teal-500 p-3 shadow-md mb-2">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-teal-600 font-sans">Adding a piece...</span>
              </div>
              <div className="text-[11px] font-bold text-slate-900 mb-2 font-serif italic">"{pm.suggestedData.narrative}"</div>
              <button onClick={() => onConfirmPending(pm.id)} className="w-full py-2 bg-teal-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest font-sans shadow-lg shadow-teal-600/20">Keep this</button>
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {chatHistory.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-1.5`}>
              <div className={`max-w-[95%] px-3 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none font-medium font-sans' : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100 italic'}`}>
                {msg.text}
              </div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-col gap-2 mt-1 w-full items-start">
                  {msg.sources.map((source, idx) => (
                    <a 
                      key={`${msg.id}-src-${idx}`}
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all font-sans shadow-sm border ${
                        source.uri.includes('google.com/maps') 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100' 
                          : 'bg-teal-50 border-teal-100 text-teal-700 hover:bg-teal-100'
                      }`}
                    >
                      {source.uri.includes('google.com/maps') ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          Pinpoint: {source.title}
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                          {source.title}
                        </>
                      )}
                    </a>
                  ))}
                </div>
              )}

              {msg.proposedEntities && msg.proposedEntities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {msg.proposedEntities.map((entity, idx) => (
                    <button 
                      key={`${msg.id}-ent-${idx}`}
                      onClick={() => onConfirmEntity(msg.id, entity)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-[9px] font-black text-indigo-700 uppercase tracking-widest hover:bg-indigo-100 transition-all font-sans shadow-sm"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {/* Fixed: details is now recognized via ProposedEntity type */}
                      {entity.details ? `Add Fact to ${entity.name}` : `Remember ${entity.name}`}
                    </button>
                  ))}
                </div>
              )}

              {msg.proposals && msg.proposals.length > 0 && (
                <div className="w-full space-y-2 mt-1">
                  {msg.proposals.map((proposal, idx) => (
                    <motion.div 
                      key={`${msg.id}-prop-${idx}`} 
                      className="w-full max-w-[90%] bg-white rounded-2xl border-2 border-slate-900 p-4 shadow-xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-900 font-sans">A story is emerging...</span>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 font-sans">{proposal.sortDate}</span>
                      </div>
                      
                      <div className="text-[14px] font-medium text-slate-900 mb-5 leading-relaxed font-serif bg-slate-50 p-3 rounded-xl italic">"{proposal.narrative}"</div>
                      <button 
                        onClick={() => onConfirmDraft(msg.id, proposal)} 
                        className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all font-sans shadow-lg shadow-slate-900/20"
                      >
                        Keep this story
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && <div className="flex justify-start"><div className="bg-slate-50 px-3 py-1.5 rounded-full animate-pulse text-[10px] text-slate-400 font-sans uppercase font-black">Thinking...</div></div>}
        </AnimatePresence>
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,application/pdf,audio/*"
            onChange={(e) => e.target.files?.[0] && onUploadMedia(e.target.files[0])}
          />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg></button>
          <div className="flex-1 relative">
            <input 
              className="w-full bg-slate-50 rounded-2xl py-2.5 px-4 pr-10 text-[13px] outline-none border border-slate-100 italic font-sans focus:bg-white focus:border-slate-300 transition-all" 
              placeholder="Talk to me..." 
              value={inputText} 
              onChange={e => setInputText(e.target.value)} 
            />
            <button 
              type="button" 
              onClick={handleSubmit}
              disabled={isLoading || !inputText.trim()} 
              className="absolute right-1.5 top-1.5 w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center disabled:opacity-5 active:scale-95 transition-all shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};