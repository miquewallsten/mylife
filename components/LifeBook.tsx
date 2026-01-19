
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeStory, Era, Memory, Entity, LegacyInsight } from '../types.ts';
import { synthesizeEraNarrative, answerLegacyQuestion, generateCharacterPortrait, synthesizeLegacyInsights } from '../services/biographer.ts';

interface LifeBookProps {
  story: LifeStory;
  onClose: () => void;
}

export const LifeBook: React.FC<LifeBookProps> = ({ story, onClose }) => {
  const [isAssembling, setIsAssembling] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [synthesizedEras, setSynthesizedEras] = useState<Record<string, string>>({});
  const [characterPortraits, setCharacterPortraits] = useState<Record<string, string>>({});
  const [wisdomVault, setWisdomVault] = useState<LegacyInsight[]>([]);
  
  const [legacyQuestion, setLegacyQuestion] = useState('');
  const [legacyAnswer, setLegacyAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  const assembleBook = async () => {
    setIsAssembling(true);
    
    // 1. Synthesize Chapters
    const eraSynthesis: Record<string, string> = {};
    for (const era of story.eras) {
      const eraMemories = story.memories.filter(m => m.eraIds.includes(era.id));
      if (eraMemories.length > 0) {
        eraSynthesis[era.id] = await synthesizeEraNarrative(era, eraMemories);
      }
    }
    setSynthesizedEras(eraSynthesis);

    // 2. Synthesize Characters
    const portraits: Record<string, string> = {};
    for (const ent of story.entities.slice(0, 5)) { // Top 5 influential people
      const entMemories = story.memories.filter(m => m.entityIds.includes(ent.id));
      if (entMemories.length > 1) {
        portraits[ent.id] = await generateCharacterPortrait(ent, entMemories);
      }
    }
    setCharacterPortraits(portraits);

    // 3. Synthesize Wisdom
    const insights = await synthesizeLegacyInsights(story);
    setWisdomVault(insights);

    setIsAssembling(false);
    setShowChapters(true);
  };

  const handleAskLegacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legacyQuestion.trim() || isAsking) return;
    setIsAsking(true);
    const answer = await answerLegacyQuestion(legacyQuestion, story);
    setLegacyAnswer(answer);
    setIsAsking(false);
  };

  return (
    <div className="fixed inset-0 bg-[#FDFCF8] z-[200] overflow-y-auto selection:bg-[#F3E5AB] font-serif">
      <button 
        onClick={onClose}
        className="fixed top-8 right-8 p-4 bg-white/50 backdrop-blur-xl rounded-full shadow-lg hover:bg-white transition-all z-[300] border border-stone-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>

      <div className="max-w-4xl mx-auto px-6">
        <header className="text-center pt-32 pb-48 space-y-12">
          <div className="text-[10px] font-black uppercase tracking-[0.6em] text-stone-400 font-sans">The Collected Memoirs of</div>
          <h1 className="text-7xl md:text-9xl font-black text-stone-900 tracking-tighter leading-[0.85]">{story.profile?.displayName || 'Legacy'}</h1>
          <div className="h-0.5 w-24 bg-stone-900 mx-auto opacity-20" />
          <p className="italic text-2xl text-stone-500 max-w-xl mx-auto leading-relaxed">"Every life is a book, if only one knows how to read it."</p>
        </header>

        {!showChapters && !isAssembling && (
          <div className="text-center pb-40">
            <button 
              onClick={assembleBook}
              className="group relative px-20 py-8 bg-stone-900 text-[#FDFCF8] rounded-2xl text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all overflow-hidden"
            >
              <span className="relative z-10 font-black tracking-tight">Assemble the Heirloom</span>
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
            </button>
          </div>
        )}

        {isAssembling && (
          <div className="text-center pb-40 space-y-12">
            <div className="space-y-4">
              <h2 className="text-3xl italic text-stone-400 animate-pulse">Our Biographer is distilling your life's essence...</h2>
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ scaleY: [1, 2, 1] }} 
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    className="w-1 h-8 bg-stone-200 rounded-full"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {showChapters && (
          <div className="space-y-64 pb-64">
            {/* The Wisdom Vault Section */}
            {wisdomVault.length > 0 && (
              <section className="space-y-24">
                <div className="text-center space-y-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-600 font-sans">The Wisdom Vault</div>
                  <h2 className="text-6xl font-black text-stone-900 tracking-tight">Recurring Lessons</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {wisdomVault.map((insight, idx) => (
                    <div key={idx} className="bg-white border border-stone-100 p-8 rounded-[2rem] shadow-sm space-y-4">
                      <h3 className="text-2xl font-black text-stone-900 uppercase tracking-tight font-sans">{insight.theme}</h3>
                      <p className="text-stone-500 leading-relaxed italic">{insight.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Chapters Section */}
            {story.eras.map(era => {
              const synthesizedText = synthesizedEras[era.id];
              const eraMemories = story.memories.filter(m => m.eraIds.includes(era.id));
              if (!synthesizedText && eraMemories.length === 0) return null;

              return (
                <section key={era.id} className="space-y-24 relative">
                  <div className="flex flex-col items-center gap-6 text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 font-sans">Chapter {era.startYear}</span>
                    <h2 className="text-6xl font-black text-stone-900 tracking-tight">{era.label}</h2>
                    <div className="h-px w-12 bg-stone-200" />
                  </div>
                  
                  <div className="max-w-2xl mx-auto space-y-16">
                    <div className="prose prose-stone prose-2xl text-stone-800 leading-[1.8] text-justify font-serif">
                      <p className="first-letter:text-8xl first-letter:font-black first-letter:float-left first-letter:mr-4 first-letter:mt-2 first-letter:text-stone-900 first-letter:leading-none">
                        {synthesizedText || "The memories of this time remain as quiet whispers."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-12 pt-12">
                      {eraMemories.filter(m => m.attachments?.some(a => a.type === 'image')).map(m => {
                        const imageAtt = m.attachments?.find(a => a.type === 'image');
                        if (!imageAtt) return null;
                        return (
                          <motion.div key={m.id} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
                            <div className="rounded-[3rem] overflow-hidden shadow-2xl border-[16px] border-white ring-1 ring-stone-200">
                              <img src={imageAtt.url} className="w-full h-auto" alt="Artifact" />
                            </div>
                            <p className="text-center italic text-stone-400 text-lg">{m.sortDate} — A fragment from the journey</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            })}

            {/* The People of the Journey */}
            {Object.keys(characterPortraits).length > 0 && (
              <section className="space-y-32">
                 <div className="text-center space-y-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-600 font-sans">Portraits of Souls</div>
                  <h2 className="text-6xl font-black text-stone-900 tracking-tight">The Inner Circle</h2>
                </div>
                <div className="space-y-24">
                  {Object.entries(characterPortraits).map(([id, portrait]) => {
                    const entity = story.entities.find(e => e.id === id);
                    return (
                      <div key={id} className="max-w-2xl mx-auto space-y-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center font-black text-xl font-sans">
                            {entity?.name[0]}
                          </div>
                          <h3 className="text-3xl font-black text-stone-900 tracking-tight uppercase font-sans">{entity?.name}</h3>
                        </div>
                        <div className="prose prose-stone prose-xl italic text-stone-600 leading-relaxed border-l-4 border-indigo-100 pl-8">
                          {portrait}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Legacy Portal Section */}
            <section className="pt-32 pb-32 border-t-2 border-stone-100">
              <div className="max-w-2xl mx-auto text-center space-y-12">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center text-[#FDFCF8] text-2xl font-black mx-auto shadow-2xl mb-8">L</div>
                  <h2 className="text-5xl font-black text-stone-900 tracking-tight">The Legacy Portal</h2>
                  <p className="text-stone-500 text-xl italic">For the generations to come. Ask the Vault anything about this life.</p>
                </div>

                <form onSubmit={handleAskLegacy} className="relative group">
                  <input 
                    className="w-full bg-white border-2 border-stone-100 rounded-3xl py-6 px-8 text-xl focus:border-stone-900 outline-none transition-all shadow-inner italic"
                    placeholder="e.g., 'What was Dad's biggest adventure?'"
                    value={legacyQuestion}
                    onChange={e => setLegacyQuestion(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={isAsking || !legacyQuestion.trim()}
                    className="absolute right-3 top-3 bottom-3 px-8 bg-stone-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest disabled:opacity-20 transition-all active:scale-95"
                  >
                    {isAsking ? 'Searching...' : 'Ask the Vault'}
                  </button>
                </form>

                <AnimatePresence>
                  {legacyAnswer && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-stone-50 rounded-[2.5rem] p-10 text-left border border-stone-100 shadow-xl"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-2 rounded-full bg-stone-900 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 font-sans">Response from the Records</span>
                      </div>
                      <p className="text-2xl leading-relaxed text-stone-800 italic">"{legacyAnswer}"</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>
        )}

        {showChapters && (
          <footer className="py-40 text-center border-t border-stone-100">
            <div className="space-y-12">
              <div className="space-y-4">
                <p className="italic text-stone-400 text-2xl">The story continues with every breath...</p>
                <div className="h-1 w-12 bg-stone-100 mx-auto" />
              </div>
              
              <div className="flex flex-col items-center gap-6">
                <button 
                  disabled={!story.isPremium}
                  className={`px-12 py-5 rounded-full font-sans font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl transition-all ${story.isPremium ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-stone-100 text-stone-300 cursor-not-allowed'}`}
                >
                  {story.isPremium ? 'Export Digital Heirloom (PDF)' : 'Premium: Unlock Full Export'}
                </button>
                {!story.isPremium && (
                  <p className="text-stone-400 text-[10px] uppercase font-black tracking-widest font-sans">Premium includes AI Synthesis & Historical Deep-Dives</p>
                )}
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};
