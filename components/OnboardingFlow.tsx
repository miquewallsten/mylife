
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

  const steps = [
    {
      label: "IDENTITY",
      q: "What name shall we put on the cover?",
      input: (
        <input 
          autoFocus 
          className="w-full text-3xl md:text-5xl font-serif font-black bg-transparent border-b-2 border-slate-900/10 focus:border-slate-900 outline-none pb-4 text-center tracking-tight transition-all" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(1)} 
          placeholder="Your Name" 
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
          className="w-full text-3xl md:text-5xl font-serif font-black bg-transparent border-b-2 border-slate-900/10 focus:border-slate-900 outline-none pb-4 text-center tracking-tight transition-all" 
          value={dob} 
          onChange={e => setDob(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && dob && setStep(2)} 
        />
      )
    },
    {
      label: "SETTING",
      q: "In which city were you born?",
      input: (
        <input 
          autoFocus 
          className="w-full text-3xl md:text-4xl font-serif font-black bg-transparent border-b-2 border-slate-900/10 focus:border-slate-900 outline-none pb-4 text-center tracking-tight transition-all" 
          value={location} 
          onChange={e => setLocation(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && location.trim() && handleFinish()} 
          placeholder="e.g. CDMX" 
        />
      )
    }
  ];

  const handleFinish = () => {
    onComplete(name, dob, location, []);
  };

  const handleNext = () => {
    if (step === 0 && !name.trim()) return;
    if (step === 1 && !dob) return;
    if (step === 2) {
      handleFinish();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#FDFDFD] z-[500] flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full text-center space-y-8 md:space-y-12">
        <div className="space-y-3">
          <motion.div 
            key={step + "label"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] font-sans"
          >
            {steps[step].label} — Step {step + 1} of 3
          </motion.div>
          <motion.h2 
            key={step + "q"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-4xl font-serif font-black text-slate-900 tracking-tight leading-tight"
          >
            {steps[step].q}
          </motion.h2>
        </div>

        <motion.div
           key={step + "input"}
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative"
        >
          {steps[step].input}
        </motion.div>

        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={handleNext}
            className="w-full md:w-auto px-10 py-4 bg-slate-900 text-white rounded-full text-[11px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            {step === 2 ? "Begin My Life" : "Continue"}
          </button>
          
          {step > 0 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-900 transition-colors"
            >
              Previous
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
