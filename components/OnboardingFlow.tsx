
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingFlowProps {
  onComplete: (name: string, dob: string, location: string) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [dob, setDob] = useState(''); 
  const [location, setLocation] = useState(''); 

  const steps = [
    {
      label: "Chapter One",
      q: "What name shall we put on the cover?",
      input: (
        <input 
          autoFocus 
          className="w-full text-3xl font-black bg-transparent border-b-4 border-slate-900 outline-none pb-4 text-center uppercase tracking-tighter" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(1)} 
          placeholder="YOUR FULL NAME" 
        />
      )
    },
    {
      label: "The Beginning",
      q: "When did your story start?",
      input: (
        <input 
          autoFocus 
          type="date" 
          className="w-full text-4xl font-black bg-transparent border-b-4 border-slate-900 outline-none pb-4 text-center tracking-tighter uppercase" 
          value={dob} 
          onChange={e => setDob(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && dob && setStep(2)} 
        />
      )
    },
    {
      label: "The Setting",
      q: "And where did you first arrive?",
      input: (
        <input 
          autoFocus 
          className="w-full text-2xl font-black bg-transparent border-b-4 border-slate-900 outline-none pb-4 text-center uppercase tracking-tighter" 
          value={location} 
          onChange={e => setLocation(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && location.trim() && onComplete(name, dob, location)} 
          placeholder="CITY OR HOSPITAL" 
        />
      )
    }
  ];

  return (
    <div className="fixed inset-0 bg-[#FDFDFD] z-[500] flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: '30px 30px' }} 
      />
      
      <div className="max-w-2xl w-full text-center space-y-16 relative">
        <div className="space-y-2">
          <motion.div 
            key={step + "label"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]"
          >
            Setting the Stage — Step {step + 1} of 3: {steps[step].label}
          </motion.div>
          <motion.h2 
            key={step + "q"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase"
          >
            {steps[step].q}
          </motion.h2>
        </div>

        <motion.div
           key={step + "input"}
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.2 }}
        >
          {steps[step].input}
        </motion.div>

        <div className="flex justify-center items-center gap-8 pt-10">
          <AnimatePresence>
            {step > 0 && (
              <motion.button 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={() => setStep(step - 1)}
                className="px-8 py-3 bg-slate-100 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:text-slate-900 hover:bg-slate-200 transition-all"
              >
                Back
              </motion.button>
            )}
          </AnimatePresence>
          <button 
            onClick={() => {
              if (step === 0 && !name.trim()) return;
              if (step === 1 && !dob) return;
              if (step === 2 && !location.trim()) return;
              step < 2 ? setStep(step + 1) : onComplete(name, dob, location);
            }}
            className="px-12 py-5 bg-slate-900 text-white rounded-[1.5rem] text-[13px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 active:scale-95"
          >
            {step === 2 ? "Write the First Page" : "Next"}
          </button>
        </div>

        <div className="pt-20">
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-slate-900"
              initial={{ width: '0%' }}
              animate={{ width: `${((step + 1) / 3) * 100}%` }}
              transition={{ type: 'spring', stiffness: 50 }}
            />
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end opacity-20 pointer-events-none">
        <div className="text-[9px] font-black uppercase tracking-widest italic font-serif">A shared record of a life...</div>
        <div className="text-[9px] font-black uppercase tracking-widest text-right text-slate-500">Subject: {name || 'UNNAMED'}<br/>The Book Begins</div>
      </div>
    </div>
  );
};
