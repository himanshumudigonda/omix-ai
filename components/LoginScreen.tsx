import React, { useState } from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { UserProfile } from '../types';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    try {
      const { signInWithPopup } = await import('firebase/auth');
      const { auth, googleProvider } = await import('../lib/firebase');

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const profile: UserProfile = {
        name: user.displayName || 'User',
        email: user.email || '',
        picture: user.photoURL || ''
      };

      onLogin(profile);
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      alert(`Sign-in failed: ${error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8F9FA] dark:bg-void-950 overflow-hidden relative selection:bg-lux-accent selection:text-white">
      {/* Abstract Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-lux-accent/5 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px] animate-pulse-slow [animation-delay:2s]"></div>
      </div>

      <div className="z-10 w-full max-w-md p-8 md:p-12 text-center transform transition-all animate-slide-up">
        <div className="mb-10 inline-block">
          <div className="w-20 h-20 bg-gradient-to-tr from-void-900 to-void-800 rounded-3xl mx-auto flex items-center justify-center shadow-2xl border border-white/5 rotate-3 hover:rotate-6 transition-transform duration-500">
            <span className="text-4xl font-display font-bold text-white">O</span>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
          Omix AI
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-12 text-lg font-light leading-relaxed">
          The ultimate convergence of speed and intelligence.<br />
          Sign in to access your Omix workspace.
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className={`
            w-full bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-white 
            font-medium py-4 px-6 rounded-2xl flex items-center justify-center gap-4 
            border border-gray-200 dark:border-white/10
            hover:bg-gray-50 dark:hover:bg-[#252525]
            hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-xl
            relative overflow-hidden
          `}
        >
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting to Google...</span>
            </div>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Lock size={12} />
          <span>Secured by Google Identity Services</span>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          <span className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 transition-colors">Privacy</span>
          <span className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full"></span>
          <span className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 transition-colors">Terms</span>
        </div>
      </div>
    </div>
  );
};