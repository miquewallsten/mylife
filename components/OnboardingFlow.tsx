
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingFlowProps {
  onComplete: (name: string, dob: string, location: string, chapters: string[]) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [dob, setDob] = useState(''); 
  const [location, setLocation] = useState(''); 
  const [chapters, setChapters] = useState('');

  const steps = [
    {
      label: "IDENTITY",
      q: "What name shall we put on the cover?",
      input: (
        <input 
          autoFocus 
          className="w-full text-4xl md:text-6xl font-serif font-black bg-transparent border-b-4 border-slate-900/10 focus:border-slate-900 outline-none pb-6 text-center tracking-tight transition-all" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(1)} 
          placeholder="Your Full Name" 
        />
      )
    },
    {
      label: "GENESIS",
      q: "When did your story start?",
      input: (
        <input 
          autoFocus 
          type="date" 
          className="w-full text-4xl md:text-6xl font-serif font-black bg-transparent border-b-4 border-slate-900/10 focus:border-slate-900 outline-none pb-6 text-center tracking-tight transition-all" 
          value={dob} 
          onChange={e => setDob(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && dob && setStep(2)} 
        />
      )
    },
    {
      label: "SETTING",
      q: "And where did you first arrive?",
      input: (
        <input 
          autoFocus 
          className="w-full text-4xl md:text-5xl font-serif font-black bg-transparent border-b-4 border-slate-900/10 focus:border-slate-900 outline-none pb-6 text-center tracking-tight transition-all" 
          value={location} 
          onChange={e => setLocation(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && location.trim() && setStep(3)} 
          placeholder="City or Hospital" 
        />
      )
    },
    {
      label: "CHAPTERS",
      q: "Name 2-3 major chapters of your life.",
      sub: "e.g. 'The Oracle Years', 'Moving to London', 'Retiring in Madeira'",
      input: (
        <textarea 
          autoFocus 
          className="w-full text-2xl md:text-3xl font-serif font-bold bg-transparent border-b-4 border-slate-900/10 focus:border-slate-900 outline-none pb-6 text-center tracking-tight transition-all resize-none" 
          value={chapters} 
          onChange={e => setChapters(e.target.value)} 
          rows={2}
          placeholder="Comma separated chapters..." 
        />
      )
    }
  ];

  const handleNext = () => {
    if (step === 0 && !name.trim()) return;
    if (step === 1 && !dob) return;
    if (step === 2 && !location.trim()) return;
    if (step === 3) {
      const chapterList = chapters.split(',').map(s => s.trim()).filter(s => s.length > 0);
      onComplete(name, dob, location, chapterList);
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#FDFDFD] z-[500] flex flex-col items-center justify-center p-6 md:p-12">
      <div className="max-w-3xl w-full text-center space-y-20">
        <div className="space-y-4">
          <motion.div 
            key={step + "label"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] font-sans"
          >
            {steps[step].label} — {step + 1} of 4
          </motion.div>
          <motion.h2 
            key={step + "q"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-serif font-black text-slate-900 tracking-tight"
          >
            {steps[step].q}
          </motion.h2>
          {steps[step].sub && (
            <p className="text-slate-400 font-serif italic text-lg">{steps[step].sub}</p>
          )}
        </div>

        <motion.div
           key={step + "input"}
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative"
        >
          {steps[step].input}
        </motion.div>

        <div className="flex flex-col items-center gap-8">
          <button 
            onClick={handleNext}
            className="px-16 py-6 bg-slate-900 text-white rounded-full text-[14px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-900/20"
          >
            {step === 3 ? "Begin the Legacy" : "Continue"}
          </button>
          
          {step > 0 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-900 transition-colors"
            >
              Previous
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
