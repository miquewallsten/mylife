
import React, { useState } from 'react';
import { LifeStory, Era } from '../types';

interface LifeBookProps {
  story: LifeStory;
  onClose: () => void;
}

export const LifeBook: React.FC<LifeBookProps> = ({ story, onClose }) => {
  const [isAssembling, setIsAssembling] = useState(false);
  const [showChapters, setShowChapters] = useState(false);

  const assembleBook = () => {
    setIsAssembling(true);
    setTimeout(() => {
      setIsAssembling(false);
      setShowChapters(true);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-stone-100 z-[200] overflow-y-auto p-8 md:p-20 selection:bg-yellow-200">
      <button 
        onClick={onClose}
        className="fixed top-8 right-8 p-4 bg-white rounded-full shadow-lg hover:bg-slate-50 transition-colors z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>

      <div className="max-w-4xl mx-auto space-y-24">
        <header className="text-center space-y-8 py-20">
          <div className="text-sm uppercase tracking-[0.5em] text-slate-400 font-bold font-sans">Collected Memories of</div>
          <h1 className="text-7xl md:text-9xl font-serif text-slate-900 leading-tight">{story.profile?.displayName || 'My Story'}</h1>
          <div className="h-2 w-32 bg-slate-900 mx-auto" />
          <p className="font-serif italic text-2xl text-slate-500">In my own words.</p>
        </header>

        {!showChapters && !isAssembling && (
          <div className="text-center">
            <button 
              onClick={assembleBook}
              className="px-16 py-8 bg-slate-900 text-white rounded-2xl text-2xl font-serif shadow-2xl hover:scale-105 transition-transform active:scale-95"
            >
              Open My Life Book
            </button>
          </div>
        )}

        {isAssembling && (
          <div className="text-center space-y-8 animate-pulse">
            <h2 className="text-4xl font-serif italic text-slate-400">Binding your stories together...</h2>
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto" />
          </div>
        )}

        {showChapters && (
          <div className="space-y-40 pb-40">
            {story.eras.map(era => {
              // Fix: Changed m.eraId to m.eraIds.includes(era.id) because Memory uses eraIds (array)
              const eraMemories = story.memories.filter(m => m.eraIds.includes(era.id));
              if (eraMemories.length === 0) return null;

              return (
                <section key={era.id} className="space-y-16">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 font-sans">Chapter</span>
                    <h2 className="text-5xl font-serif font-black text-slate-800">{era.label}</h2>
                    <div className="text-lg font-serif italic text-slate-400">{era.startYear} — {era.endYear}</div>
                  </div>
                  
                  <div className="space-y-20 max-w-2xl mx-auto">
                    {eraMemories.map((m, idx) => (
                      <div key={m.id} className="relative">
                        {/* Drop cap for each new memory to give a book feel */}
                        <div className="prose prose-2xl font-serif text-slate-800 leading-relaxed first-letter:text-6xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-serif">
                          {m.narrative}
                        </div>
                        {m.location && (
                          <div className="mt-4 text-sm font-sans font-bold uppercase tracking-widest text-slate-300">
                            {m.location} • {m.sortDate}
                          </div>
                        )}
                        {m.mediaUrl && m.mediaType === 'image' && (
                          <div className="mt-10 rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                            <img src={m.mediaUrl} className="w-full h-auto" alt="Memory attachment" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {showChapters && (
          <footer className="py-20 text-center border-t border-slate-200">
            <p className="font-serif italic text-slate-400">The story continues...</p>
            {story.isPremium && (
              <button className="mt-12 px-10 py-4 bg-teal-600 text-white rounded-full font-sans font-black uppercase tracking-widest shadow-xl hover:bg-teal-700 transition-all">
                Export Digital Heirloom (PDF)
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
};
