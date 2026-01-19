
import React from 'react';
import { motion } from 'framer-motion';

interface AuthProps {
  onSignIn: (method: 'google' | 'email') => void;
}

export const Auth: React.FC<AuthProps> = ({ onSignIn }) => {
  return (
    <div className="fixed inset-0 bg-[#F8FAF8] z-[300] flex flex-col items-center justify-center p-6 md:p-12">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[3rem] p-10 md:p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 text-center"
      >
        <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black mx-auto mb-10 shadow-2xl">
          M
        </div>
        
        <h1 className="text-4xl font-serif font-black text-slate-900 mb-4">Welcome to MyLife</h1>
        <p className="text-slate-500 text-lg mb-12 leading-relaxed">
          The private vault for your life's greatest stories. Secure, simple, and forever.
        </p>

        <div className="space-y-4">
          <button 
            onClick={() => onSignIn('google')}
            className="w-full py-5 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl text-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-4 group"
          >
            <svg width="24" height="24" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Sign in with Google
          </button>
          
          <button 
            onClick={() => onSignIn('email')}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl text-xl font-bold hover:bg-slate-800 transition-all shadow-xl"
          >
            Use Email Magic Link
          </button>
        </div>

        <p className="mt-12 text-sm text-slate-400 font-medium">
          By signing in, you agree to our <a href="#" className="underline hover:text-slate-900">Privacy Vault Promise</a>.
        </p>
      </motion.div>
    </div>
  );
};
