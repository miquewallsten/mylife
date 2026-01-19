
import React, { useState, useEffect } from 'react';
import { OnboardingFlow } from './components/OnboardingFlow';
import { Timeline } from './components/Timeline';
import { BiographerDesk } from './components/BiographerDesk';
import { LifeBook } from './components/LifeBook';
import { Auth } from './components/Auth';
import { useLifeStory } from './hooks/useLifeStory';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
  const { 
    user, login, logout, story, updateProfile, 
    processMemoryFromInput, handleMediaUpload, confirmPendingMemory,
    // Fix: Removed non-existent 'findTimelineGaps' which was causing a TypeScript error
    confirmDraftMemory, confirmProposedEntity, deleteMemory, editMemory,
    currentInvestigation
  } = useLifeStory();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<'timeline' | 'book'>('timeline');

  if (!user) {
    return <Auth onSignIn={(method) => login(method)} />;
  }

  if (!story.profile?.onboarded) {
    return <OnboardingFlow onComplete={updateProfile} />;
  }

  const handleSendMessage = async (text: string) => {
    setIsProcessing(true);
    try {
      await processMemoryFromInput(text);
    } catch (err) {
      console.error(err);
    }
    setIsProcessing(false);
  };

  const onUploadMedia = async (file: File) => {
    setIsProcessing(true);
    await handleMediaUpload(file);
    setIsProcessing(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white selection:bg-slate-900 selection:text-white overflow-hidden">
      <nav className="h-12 shrink-0 border-b border-slate-100 flex items-center justify-between px-6 z-50 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-slate-900 rounded-md flex items-center justify-center text-white font-black text-sm shadow-sm">M</div>
          <h1 className="text-sm font-serif font-black tracking-tight text-slate-900">MyLife</h1>
          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-full border border-slate-100">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Heirloom Encryption</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-100">
            <button 
              onClick={() => setView('timeline')} 
              className={`px-4 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${view === 'timeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Timeline
            </button>
            <button 
              onClick={() => setView('book')} 
              className={`px-4 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${view === 'book' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Life Book
            </button>
          </div>
          <button onClick={logout} className="text-[8px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-colors">Log Out</button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <section className="flex-1 min-w-[400px] border-r border-slate-100 relative bg-[#FAFAFA]">
          <AnimatePresence mode="wait">
            {view === 'timeline' ? (
              <motion.div key="timeline" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Timeline memories={story.memories} eras={story.eras} onDeleteMemory={deleteMemory} onEditMemory={editMemory} currentInvestigation={currentInvestigation} />
              </motion.div>
            ) : (
              <motion.div key="book" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LifeBook story={story} onClose={() => setView('timeline')} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <aside className="w-[380px] shrink-0 hidden lg:block">
          <BiographerDesk 
            chatHistory={story.chatHistory} 
            pendingMemories={story.pendingMemories || []}
            onSendMessage={handleSendMessage} 
            onUploadMedia={onUploadMedia}
            onConfirmPending={confirmPendingMemory}
            onConfirmDraft={confirmDraftMemory}
            onConfirmEntity={confirmProposedEntity}
            isLoading={isProcessing} 
            // Fix: Added currentInvestigation to properly track context in the sidebar
            currentInvestigation={currentInvestigation}
          />
        </aside>
      </div>
    </div>
  );
}
