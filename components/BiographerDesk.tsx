
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, PendingMemory, DraftMemory, Entity, ProposedEntity } from '../types';

interface BiographerDeskProps {
  chatHistory: ChatMessage[];
  pendingMemories: PendingMemory[];
  onSendMessage: (text: string) => void;
  onRequestNudge: () => void;
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
  onRequestNudge,
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
    <div className="h-full flex flex-col bg-white border-l border-slate-200 shadow-sm overflow-hidden font-serif selection:bg-slate-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-black uppercase font-sans shadow-lg">B</div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase leading-none font-sans">The Study</h3>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] block mt-1 truncate max-w-[140px] font-sans">
              {currentInvestigation || 'Ready for a story'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onRequestNudge}
            disabled={isLoading}
            className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-amber-700 hover:bg-amber-100 transition-all font-sans disabled:opacity-50 flex items-center gap-2"
          >
            Inspire Me
          </button>
        </div>
      </div>

      {/* Chat History */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar bg-[#FAFAFA]">
        <AnimatePresence initial={false}>
          {chatHistory.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2`}>
              <div className={`max-w-[92%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none font-sans font-medium' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 italic'}`}>
                {msg.text}
              </div>

              {/* Proposed Memories with Deductive Reasoning */}
              {msg.proposals && msg.proposals.length > 0 && (
                <div className="w-full space-y-3 mt-2">
                  {msg.proposals.map((proposal, idx) => (
                    <motion.div 
                      key={`${msg.id}-prop-${idx}`} 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-full max-w-[95%] bg-white rounded-3xl border-2 border-slate-900 p-5 shadow-2xl relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 font-sans">Milestone Proposal</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 font-sans bg-slate-50 px-2 py-1 rounded-lg">{proposal.sortDate}</span>
                      </div>

                      {/* Reasoning Badge */}
                      {(proposal as any).reasoning && (
                        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] text-indigo-700 italic font-sans flex items-start gap-2">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="shrink-0 mt-0.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                          <span>Biographer's Deduction: {(proposal as any).reasoning}</span>
                        </div>
                      )}
                      
                      <div className="text-[15px] font-medium text-slate-900 mb-6 leading-relaxed font-serif bg-slate-50/50 p-4 rounded-2xl italic border border-slate-100">
                        "{proposal.narrative}"
                      </div>
                      
                      <button 
                        onClick={() => onConfirmDraft(msg.id, proposal)} 
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all font-sans"
                      >
                        Commit to Timeline
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 px-4 py-2 rounded-full animate-pulse text-[10px] text-slate-400 font-sans uppercase font-black">
                Deducing the context...
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,application/pdf,audio/*"
            onChange={(e) => e.target.files?.[0] && onUploadMedia(e.target.files[0])}
          />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-300 hover:text-slate-900 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </button>
          
          <div className="flex-1 relative">
            <input 
              className="w-full bg-slate-50 rounded-[1.5rem] py-3.5 px-6 text-[14px] outline-none border border-slate-100 italic font-sans focus:bg-white focus:border-slate-300 transition-all" 
              placeholder="Tell me a crumb of your story..." 
              value={inputText} 
              onChange={e => setInputText(e.target.value)} 
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !inputText.trim()} 
              className="absolute right-2 top-2 w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center disabled:opacity-20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
