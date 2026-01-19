
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthProps {
  onSignIn: (method: 'google' | 'apple' | 'passcode' | 'email', val?: string) => void;
  error?: string | null;
}

export const Auth: React.FC<AuthProps> = ({ onSignIn, error }) => {
  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState<'selection' | 'email' | 'passcode'>('selection');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim()) {
      setIsConnecting(true);
      // Small delay to show the "Opening Vault" state
      setTimeout(() => {
        onSignIn(mode === 'email' ? 'email' : 'passcode', inputValue);
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#F8FAF8] z-[300] flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[3.5rem] p-10 md:p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 text-center relative"
      >
        <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black mx-auto mb-10 shadow-2xl">
          M
        </div>
        
        <h1 className="text-4xl font-serif font-black text-slate-900 mb-4 tracking-tight">Your Private Vault</h1>
        <p className="text-slate-500 text-lg mb-12 leading-relaxed">
          The sanctuary for your life's greatest stories. Secure, seamless, and forever.
        </p>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-3xl text-[12px] text-amber-800 font-sans italic leading-relaxed text-left"
          >
            <div className="flex gap-3">
              <div className="shrink-0 pt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
              </div>
              <p>{error}</p>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {mode === 'selection' ? (
            <motion.div 
              key="selection"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                  onClick={() => setMode('passcode')}
                  className="py-6 bg-slate-900 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex flex-col items-center gap-2 shadow-xl ring-4 ring-slate-100"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Passcode
                </button>
                <button 
                  onClick={() => setMode('email')}
                  className="py-6 bg-slate-900 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex flex-col items-center gap-2 shadow-xl ring-4 ring-slate-100"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                  Email
                </button>
              </div>

              <div className="relative pt-2 pb-6">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.4em]">
                  <span className="bg-white px-4 text-slate-300">Cloud Sync (Experimental)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 opacity-40">
                <button disabled className="w-full py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-3 cursor-not-allowed">
                  Apple Sign-In (Preview Restricted)
                </button>
                <button disabled className="w-full py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-3 cursor-not-allowed">
                  Google Sign-In (Preview Restricted)
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.form 
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="text-left">
                <h3 className="text-2xl font-serif font-black text-slate-900 mb-2 capitalize">
                  {mode === 'email' ? 'Enter Email' : 'Set Your Secret Key'}
                </h3>
                <p className="text-[13px] text-slate-400 font-sans italic leading-relaxed">
                  {mode === 'email' 
                    ? "Enter your email. Your data stays encrypted with your unique identity hash." 
                    : "Choose a secret phrase. This generates your 100% private identity."}
                </p>
              </div>

              <input 
                autoFocus
                type={mode === 'email' ? 'email' : 'password'}
                placeholder={mode === 'email' ? 'your@email.com' : 'Your Secret Phrase'}
                className="w-full py-6 px-8 bg-slate-50 border-2 border-slate-900 rounded-[2rem] text-2xl font-black focus:bg-white outline-none transition-all text-center placeholder:text-slate-200 shadow-inner"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={isConnecting}
              />

              <button 
                type="submit"
                disabled={!inputValue.trim() || isConnecting}
                className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-xl font-bold hover:bg-slate-800 transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isConnecting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Opening Vault...
                  </div>
                ) : (
                  <>
                    Open My Vault
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </>
                )}
              </button>
              
              <button 
                type="button"
                onClick={() => { setMode('selection'); setInputValue(''); }}
                className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all mt-4"
              >
                Back to Selection
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-12 text-[11px] text-slate-300 font-black uppercase tracking-widest leading-loose">
          Privacy Policy: Everything is encrypted client-side.<br/>
          Your secret key never leaves this browser.
        </p>
      </motion.div>
    </div>
  );
};
