
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
      onSignIn(mode === 'email' ? 'email' : 'passcode', inputValue);
    }
  };

  const handleSocialSignIn = (provider: 'google' | 'apple') => {
    setIsConnecting(true);
    onSignIn(provider);
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
          Unlock your sanctuary. Everything is secured with your unique identity hash.
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
                  <span className="bg-white px-4 text-slate-300">Social Secure Access</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => handleSocialSignIn('apple')}
                  className="w-full py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.96.78-1.95 1.55-3.04 1.57-1.07.02-1.42-.64-2.65-.64-1.23 0-1.63.62-2.63.66-1.07.03-2.2-.87-3.19-1.7-2.02-1.71-3.56-4.83-3.56-7.75 0-4.63 2.91-7.07 5.67-7.07 1.48 0 2.87.97 3.77.97.9 0 2.45-1.15 4.19-1.15 1.74 0 3.39.87 4.26 2.06-3.55 2.13-2.98 6.78.53 8.24-.81 2.03-1.89 4.02-3.35 5.81zM12.03 5.07c-.12-2.18 1.63-4.08 3.55-4.32.22 2.37-2.05 4.47-3.55 4.32z"/></svg>
                  Apple ID
                </button>
                <button 
                  onClick={() => handleSocialSignIn('google')}
                  className="w-full py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google Account
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
                  {mode === 'email' ? 'Enter Email' : 'Secret Phrase'}
                </h3>
                <p className="text-[13px] text-slate-400 font-sans italic">
                  {mode === 'email' ? "We'll send a secure link." : "Your phrase generates your 100% private vault key."}
                </p>
              </div>

              <input 
                autoFocus
                type={mode === 'email' ? 'email' : 'password'}
                className="w-full py-6 px-8 bg-slate-50 border-2 border-slate-900 rounded-[2rem] text-2xl font-black focus:bg-white outline-none transition-all text-center placeholder:text-slate-200 shadow-inner"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={isConnecting}
                placeholder="••••••••"
              />

              <button 
                type="submit"
                disabled={!inputValue.trim() || isConnecting}
                className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-xl font-bold hover:bg-slate-800 shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isConnecting ? "Synchronizing Vault..." : "Open My Vault"}
              </button>
              
              <button 
                type="button"
                onClick={() => { setMode('selection'); setInputValue(''); }}
                className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 mt-4"
              >
                Go Back
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
