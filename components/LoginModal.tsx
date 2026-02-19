
import React, { useState, useEffect } from 'react';

interface LoginModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onSuccess, onClose }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    
    // Simulate high-end frequency verification
    setTimeout(() => {
      if (password === 'maitredelachattemouillee' || password === '8888') {
        onSuccess();
      } else {
        setError(true);
        setPassword('');
        setIsAuthenticating(false);
        setTimeout(() => setError(false), 600);
      }
    }, 800);
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/60 dark:bg-black/90 animate-in fade-in duration-1000"
      onClick={onClose}
    >
      <div 
        className={`relative bg-white dark:bg-[#0a0a0c] rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] w-full max-w-md p-12 border border-zinc-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-700 ${error ? 'animate-shake border-red-500/30' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grainy Texture Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat"></div>
        
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-600/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 mb-8 group transition-all duration-700 hover:border-purple-500/50 hover:scale-105 active:scale-95 shadow-sm">
            <div className={`transition-all duration-700 ${isAuthenticating ? 'animate-pulse scale-90' : ''}`}>
              <svg className={`w-8 h-8 ${isAdminIconActive ? 'text-purple-500' : 'text-zinc-400 dark:text-zinc-600'} transition-colors duration-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h2 className="text-4xl font-serif font-bold text-zinc-900 dark:text-white mb-4 tracking-tighter italic">The Gate</h2>
          <div className="flex items-center justify-center gap-3">
             <span className="h-[1px] w-6 bg-zinc-200 dark:bg-zinc-800"></span>
             <p className="text-zinc-400 dark:text-zinc-600 text-[9px] uppercase tracking-[0.6em] font-black">
               Frequency Entry
             </p>
             <span className="h-[1px] w-6 bg-zinc-200 dark:bg-zinc-800"></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-12">
          <div className="relative group">
            <input
              type={showPassword ? "text" : "password"}
              autoFocus
              disabled={isAuthenticating}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full bg-transparent border-b-2 ${error ? 'border-red-500/50 text-red-500' : 'border-zinc-200 dark:border-white/10 focus:border-purple-500/50'} py-6 px-12 outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-800 text-center text-lg tracking-[0.15em] font-mono font-medium text-zinc-900 dark:text-white`}
              placeholder="••••••••"
            />
            
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 hover:text-purple-500 transition-all p-2 rounded-xl active:scale-90"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <button
              type="submit"
              disabled={isAuthenticating || !password}
              className={`relative w-full overflow-hidden group/btn py-5 rounded-full font-black uppercase tracking-[0.4em] text-[11px] transition-all duration-700 shadow-2xl active:scale-[0.97] ${
                isAuthenticating 
                ? 'bg-zinc-100 dark:bg-white/5 text-zinc-400 cursor-not-allowed' 
                : 'bg-zinc-900 text-white dark:bg-white dark:text-black hover:shadow-purple-500/20'
              }`}
            >
              <span className={`relative z-10 transition-all duration-700 ${isAuthenticating ? 'opacity-0' : 'opacity-100'}`}>
                ВОЙТИ ЕБАТЬ
              </span>
              
              {isAuthenticating && (
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                </div>
              )}
              
              {/* Button Shine Effect */}
              {!isAuthenticating && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="group py-2 text-zinc-400 dark:text-zinc-600 font-bold uppercase tracking-[0.4em] hover:text-zinc-600 dark:hover:text-zinc-400 transition-all text-[9px] flex items-center justify-center gap-2"
            >
              <svg className="w-3 h-3 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              СЪЕБАТЬСЯ
            </button>
          </div>
        </form>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-15px); }
          30% { transform: translateX(15px); }
          45% { transform: translateX(-12px); }
          60% { transform: translateX(12px); }
          75% { transform: translateX(-8px); }
          90% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

const isAdminIconActive = true; 

export default LoginModal;
