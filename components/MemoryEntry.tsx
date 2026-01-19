
import React, { useState } from 'react';

interface MemoryEntryProps {
  onAdd: (text: string) => Promise<void>;
  isLoading: boolean;
}

export const MemoryEntry: React.FC<MemoryEntryProps> = ({ onAdd, isLoading }) => {
  const [text, setText] = useState('');

  const handleSubmit = async () => {
    if (!text.trim()) return;
    await onAdd(text);
    setText('');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 md:p-8 z-50 pointer-events-none">
      <div className="max-w-4xl mx-auto glass rounded-3xl p-4 md:p-6 shadow-2xl pointer-events-auto border-t border-white/50">
        <div className="flex flex-col md:flex-row gap-4">
          <textarea 
            className="flex-1 bg-white/50 rounded-2xl p-4 text-xl outline-none border border-slate-200 focus:border-slate-400 transition-colors resize-none"
            placeholder="Share a crumb of memory... 'I remember the smell of fresh bread in Grandma's kitchen in '72...'"
            rows={3}
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <div className="flex flex-row md:flex-col gap-2">
            <button 
              onClick={handleSubmit}
              disabled={isLoading}
              className={`flex-1 md:flex-none px-8 py-4 bg-slate-900 text-white rounded-2xl text-lg font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Save Story'
              )}
            </button>
            <button className="p-4 bg-teal-50 text-teal-700 rounded-2xl hover:bg-teal-100 transition-colors flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
