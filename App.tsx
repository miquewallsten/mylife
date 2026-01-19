
import React, { useState } from 'react';
import { OnboardingFlow } from './components/OnboardingFlow';
import { Timeline } from './components/Timeline';
import { BiographerDesk } from './components/BiographerDesk';
import { LifeBook } from './components/LifeBook';
import { Auth } from './components/Auth';
import { useLifeStory } from './hooks/useLifeStory';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
  const { 
    user, authLoading, login, logout, story, updateProfile, 
    processMemoryFromInput, requestNudge, handleMediaUpload, confirmPendingMemory,
    confirmDraftMemory, confirmProposedEntity, deleteMemory, editMemory,
    currentInvestigation
  } = useLifeStory();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<'timeline' | 'book'>('timeline');
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8FAF8]">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 font-sans">Accessing your Vault...</p>
        </div>
      </div>
    );
  }

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

  const handleRequestNudge = async () => {
    setIsProcessing(true);
    try {
      await requestNudge();
    } catch (err) {
      console.error(err);
    }
    setIsProcessing(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden selection:bg-slate-900 selection:text-white">
      {/* Invisible Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-20 flex items-center justify-between px-8 z-[100] pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl">M</div>
          <h1 className="text-xl font-serif font-black tracking-tight text-slate-900">MyLife</h1>
        </div>
        
        <div className="flex items-center gap-6 pointer-events-auto bg-white/50 backdrop-blur-xl p-2 rounded-2xl border border-white/50 shadow-xl">
          <button 
            onClick={() => setView(view === 'timeline' ? 'book' : 'timeline')} 
            className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white shadow-lg"
          >
            {view === 'timeline' ? 'Open Life Book' : 'Back to Timeline'}
          </button>
          <button onClick={logout} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors pr-4">Log Out</button>
        </div>
      </nav>

      {/* Main Experience */}
      <main className="flex-1 relative">
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

        {/* Floating Biographer Presence */}
        <div className="fixed bottom-10 right-10 z-[200] flex flex-col items-end gap-6">
          <AnimatePresence>
            {isChatOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-[400px] h-[600px] glass rounded-[3rem] shadow-2xl border-2 border-white/50 overflow-hidden flex flex-col"
              >
                <BiographerDesk 
                  chatHistory={story.chatHistory} 
                  pendingMemories={story.pendingMemories || []}
                  onSendMessage={handleSendMessage} 
                  onRequestNudge={handleRequestNudge}
                  onUploadMedia={handleMediaUpload}
                  onConfirmPending={confirmPendingMemory}
                  onConfirmDraft={confirmDraftMemory}
                  onConfirmEntity={confirmProposedEntity}
                  isLoading={isProcessing} 
                  currentInvestigation={currentInvestigation}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${isChatOpen ? 'bg-slate-100 text-slate-900 rotate-90' : 'bg-slate-900 text-white hover:scale-110'}`}
          >
            {isChatOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
