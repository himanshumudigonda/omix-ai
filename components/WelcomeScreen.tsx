import React from 'react';
import { Code, PenTool, Smile, Zap, Sparkles } from 'lucide-react';
import { Theme } from '../types';

interface WelcomeScreenProps {
  userName: string;
  onQuickAction: (text: string) => void;
  theme: Theme;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ userName, onQuickAction, theme }) => {
  const actions = [
    { icon: <Code size={20} />, label: 'Code Architect', prompt: 'Write a React functional component for a card with Tailwind CSS.', gradient: 'from-blue-500 to-cyan-500' },
    { icon: <PenTool size={20} />, label: 'Content Creator', prompt: 'Draft a professional email to a client about a project delay.', gradient: 'from-purple-500 to-pink-500' },
    { icon: <Smile size={20} />, label: 'Entertainer', prompt: 'Tell me a witty programming joke.', gradient: 'from-amber-500 to-orange-500' },
    { icon: <Zap size={20} />, label: 'Strategist', prompt: 'Give me 5 unique ideas for a new AI startup.', gradient: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-6 animate-fade-in pb-32 pt-10">
      <div className="mb-12 text-center relative">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-[50px] animate-pulse-slow ${theme.id === 'golden' ? 'bg-amber-500/20' : theme.id === 'cyber' ? 'bg-red-600/20' : 'bg-lux-accent/20'}`}></div>
        
        <div className={`relative inline-flex items-center justify-center p-4 mb-8 rounded-3xl border shadow-2xl ${theme.panel} ${theme.border}`}>
          <Sparkles className={`w-8 h-8 animate-float ${theme.id === 'golden' ? 'text-amber-400' : theme.id === 'cyber' ? 'text-red-500' : 'text-lux-gold'}`} />
        </div>
        
        <h1 className={`text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight ${theme.text}`}>
          <span className="">Hello, </span>
          <span className={`font-light italic opacity-80`}>{userName}</span>
        </h1>
        <p className={`text-lg max-w-xl mx-auto leading-relaxed font-light ${theme.textSecondary}`}>
          I am Sarvix. Your intelligent engine for the future. <br/>
          Select a capability below to begin your session.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => onQuickAction(action.prompt)}
            className="group relative overflow-hidden p-[1px] rounded-2xl transition-all duration-300 hover:scale-[1.01]"
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`}></div>
            <div className={`relative flex items-center p-5 h-full rounded-2xl border backdrop-blur-sm transition-colors ${theme.panel} ${theme.border} hover:bg-white/5`}>
              <div className={`p-3 rounded-xl mr-5 bg-gradient-to-br ${action.gradient} text-white shadow-lg`}>
                {action.icon}
              </div>
              <div className="text-left">
                <span className={`block font-medium text-lg mb-0.5 ${theme.text}`}>
                  {action.label}
                </span>
                <span className={`text-xs ${theme.textSecondary}`}>
                  Tap to generate
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};