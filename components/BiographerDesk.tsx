
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, Attachment } from '../types';

interface BiographerDeskProps {
  chatHistory: ChatMessage[];
  onSendMessage: (text: string, attachments?: Attachment[]) => void;
  isLoading: boolean;
  currentInvestigation?: string | null;
  userName?: string;
  fullScreen?: boolean;
  hideHeader?: boolean;
}

export const BiographerDesk: React.FC<BiographerDeskProps> = ({ 
  chatHistory, 
  onSendMessage, 
  isLoading, 
  currentInvestigation,
  userName,
  fullScreen = false,
  hideHeader = false
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 220);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && attachments.length === 0) || isLoading) return;
    onSendMessage(inputText || (attachments.length > 0 ? "I'm sharing this photo with you." : ""), attachments);
    setInputText('');
    setAttachments([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const mockAttachment: Attachment = {
        id: crypto.randomUUID(),
        type: 'image',
        name: file.name,
        url: url
      };
      setAttachments([...attachments, mockAttachment]);
    };
    reader.readAsDataURL(file);
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate transcription
      setInputText("I remember walking through the streets of Mexico City, seeing the old architecture blending with the new...");
    } else {
      setIsRecording(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative min-h-0">
      {!hideHeader && (
        <div className="px-3 py-1.5 border-b border-stone-50 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-1.5">
            <div className={`w-1 h-1 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-[7px] font-black uppercase text-stone-300 tracking-widest font-sans">
              {isLoading ? "Preserving..." : "Chat History"}
            </span>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 hide-scrollbar bg-stone-50/10">
        <AnimatePresence initial={false}>
          {chatHistory.map((msg) => (
            <motion.div 
              key={msg.id} 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }} 
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-1`}
            >
              <div className={`max-w-[85%] px-3 py-1.5 rounded-xl text-[12px] md:text-[13px] leading-relaxed shadow-sm transition-all ${
                msg.role === 'user' 
                  ? 'bg-[#1A202C] text-white rounded-tr-none' 
                  : 'bg-white text-stone-800 rounded-tl-none font-serif italic border border-stone-100'
              }`}>
                {msg.text}
              </div>
              <span className="text-[5px] font-black text-stone-300 uppercase px-1 tracking-widest font-sans">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-2 md:p-3 bg-white border-t border-stone-50 shrink-0">
        <div className="max-w-2xl mx-auto space-y-1.5">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1 pb-1">
              {attachments.map(att => (
                <div key={att.id} className="relative group">
                  <div className="w-10 h-10 rounded-md overflow-hidden border border-stone-100 shadow-sm">
                    <img src={att.url} alt="Attached" className="w-full h-full object-cover" />
                  </div>
                  <button onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))} className="absolute -top-1 -right-1 w-3 h-3 bg-stone-900 text-white rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative flex items-end gap-1.5">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload} 
            />
            
            <div className="flex-1 relative">
              <textarea 
                ref={textareaRef}
                rows={1}
                className="w-full bg-stone-50 rounded-xl py-2.5 pl-3 pr-16 text-[13px] outline-none border border-stone-100 focus:bg-white focus:border-stone-900 focus:shadow-md transition-all resize-none font-serif italic text-stone-800 min-h-[44px]" 
                placeholder={isRecording ? "Listening..." : `Share more, ${userName || 'friend'}...`} 
                value={inputText} 
                onChange={e => setInputText(e.target.value)} 
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                disabled={isLoading}
              />
              <div className="absolute right-1 bottom-1.5 flex items-center gap-0.5">
                <button 
                  type="button" 
                  onClick={toggleRecording} 
                  disabled={isLoading} 
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-white text-stone-400 hover:text-rose-500 border border-stone-50 shadow-sm'}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                </button>
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isLoading} 
                  className="w-7 h-7 bg-white text-stone-400 rounded-full flex items-center justify-center hover:text-stone-900 border border-stone-50 shadow-sm transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                </button>
              </div>
            </div>
            
            <button type="submit" disabled={isLoading || (!inputText.trim() && attachments.length === 0)} className="w-10 h-10 bg-[#1A202C] text-white rounded-xl flex items-center justify-center shrink-0 disabled:opacity-10 hover:scale-105 active:scale-95 transition-all shadow-md">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
