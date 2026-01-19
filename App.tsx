
import React, { useState } from 'react';
import { OnboardingFlow } from './components/OnboardingFlow';
import { Timeline } from './components/Timeline';
import { BiographerDesk } from './components/BiographerDesk';
import { LifeBook } from './components/LifeBook';
import { NeuralMap } from './components/NeuralMap';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { useLifeStory } from './hooks/useLifeStory';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
  const { 
    user, authLoading, dataLoading, authError, login, logout, story, updateProfile, setTone,
    processMemoryFromInput, isProcessing, currentInvestigation, deleteMemory, editMemory
  } = useLifeStory();
  
  const [view, setView] = useState<'dashboard' | 'timeline' | 'book' | '3d'>('dashboard');

  if (authLoading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#FAF9F6]">
      <div className="w-5 h-5 border-[1.5px] border-[#1A202C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Auth onSignIn={(method, val) => login(method, val)} error={authError} />;

  // Only show onboarding if we have a user, we're done loading data, and they haven't onboarded yet
  if (!dataLoading && !story.profile?.onboarded) {
    return <OnboardingFlow onComplete={updateProfile} />;
  }

  // If we're loading data, show a quiet transitional state
  if (dataLoading) {
     return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="text-center space-y-3">
          <div className="w-1.5 h-1.5 bg-[#1A202C] rounded-full animate-ping mx-auto" />
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300">Synchronizing Vault...</span>
        </div>
      </div>
    );
  }

  const shortName = story.profile?.displayName || user.displayName || 'Friend';

  return (
    <div className="h-screen w-screen flex flex-col bg-[#FAF9F6] overflow-hidden selection:bg-[#B08D57]/20 pb-safe">
      <nav className="fixed top-0 left-0 right-0 h-12 md:h-14 flex items-center justify-between px-4 md:px-6 z-[100] pt-safe bg-white/90 backdrop-blur-md border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#1A202C] rounded-md flex items-center justify-center text-white font-black text-[10px] shadow-sm">M</div>
          <h1 className="text-[11px] font-serif font-black text-[#1A202C] tracking-tight uppercase">{shortName}</h1>
        </div>
        
        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg">
          <button 
            onClick={() => setView('dashboard')} 
            className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${view === 'dashboard' ? 'bg-[#1A202C] text-white shadow-sm' : 'text-stone-400'}`}
          >
            DESK
          </button>
          <button 
            onClick={() => setView('timeline')} 
            className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${view === 'timeline' ? 'bg-[#1A202C] text-white shadow-sm' : 'text-stone-400'}`}
          >
            BOOK
          </button>
          <button 
            onClick={() => setView('3d')} 
            className={`hidden md:block px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${view === '3d' ? 'bg-[#1A202C] text-white shadow-sm' : 'text-stone-400'}`}
          >
            MAP
          </button>
        </div>

        <button onClick={logout} className="text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-[#1A202C] transition-colors">Exit</button>
      </nav>

      <main className="flex-1 relative mt-12 md:mt-14 overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div key="dashboard" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dashboard 
                story={story} 
                isProcessing={isProcessing} 
                currentInvestigation={currentInvestigation} 
                onSendMessage={processMemoryFromInput}
                onSetTone={setTone}
                userName={shortName.split(' ')[0]}
              />
            </motion.div>
          )}
          {view === 'timeline' && (
            <motion.div key="timeline" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Timeline 
                memories={story.memories} 
                eras={story.eras} 
                onDeleteMemory={deleteMemory} 
                onEditMemory={editMemory} 
                currentInvestigation={currentInvestigation}
                profile={story.profile ? { 
                  name: story.profile.displayName || 'Mikael', 
                  birthYear: story.profile.birthYear, 
                  birthCity: story.profile.birthCity 
                } : undefined}
              />
            </motion.div>
          )}
          {view === '3d' && (
            <motion.div key="3d" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <NeuralMap story={story} />
            </motion.div>
          )}
          {view === 'book' && (
            <motion.div key="book" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LifeBook story={story} onClose={() => setView('dashboard')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
