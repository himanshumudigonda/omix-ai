import React from 'react';
import { Theme, Mood } from '../types';

interface BackgroundProps {
  theme: Theme;
  mood?: Mood;
}

export const Background: React.FC<BackgroundProps> = ({ theme, mood = 'neutral' }) => {
  const baseClasses = `fixed inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-700 ${theme.bg}`;
  
  // Mood Overlay Colors
  let moodOverlay = '';
  if (mood === 'happy') moodOverlay = 'bg-orange-500/10 mix-blend-overlay';
  if (mood === 'serious') moodOverlay = 'bg-blue-900/20 mix-blend-overlay';
  if (mood === 'angry') moodOverlay = 'bg-red-900/10 mix-blend-overlay';

  return (
    <div className={baseClasses}>
      {/* Mood Ring Layer */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${moodOverlay} z-0`}></div>

      {/* 1. Obsidian Flow */}
      {theme.id === 'obsidian' && (
        <>
          <div className="absolute inset-0 bg-black"></div>
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-blob opacity-20"></div>
        </>
      )}

      {/* 2. Nebula Glass */}
      {theme.id === 'nebula' && (
        <>
           <div className="absolute inset-0 bg-[#050510]"></div>
           <div className="absolute inset-0 opacity-40">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-violet-900/30 via-fuchsia-900/20 to-transparent blur-3xl animate-aurora"></div>
           </div>
        </>
      )}

      {/* 3. Kinetic */}
      {theme.id === 'kinetic' && (
        <div className="absolute inset-0 bg-neutral-950"></div>
      )}

      {/* 4. Bioluminescent */}
      {theme.id === 'bioluminescent' && (
        <>
          <div className="absolute inset-0 bg-[#020617]"></div>
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full blur-[2px] animate-float opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-cyan-900/20 to-transparent"></div>
        </>
      )}

      {/* 5. Porcelain */}
      {theme.id === 'porcelain' && (
        <div className="absolute inset-0 bg-[#FDFBF7]"></div>
      )}

      {/* 6. Prism */}
      {theme.id === 'prism' && (
        <>
           <div className="absolute inset-0 bg-white"></div>
           <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_90deg_at_50%_50%,#ff0000_0%,#00ff00_33%,#0000ff_66%,#ff0000_100%)] opacity-[0.03] animate-spin-[20s_linear_infinite] blur-3xl"></div>
        </>
      )}

      {/* 7. Cyber */}
      {theme.id === 'cyber' && (
        <>
          <div className="absolute inset-0 bg-[#050505]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,42,109,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
        </>
      )}

      {/* 8. Zen */}
      {theme.id === 'zen' && (
        <div className="absolute inset-0 bg-[#E6E0D4]"></div>
      )}

      {/* 9. Invisible */}
      {theme.id === 'invisible' && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-black"></div>
      )}

      {/* 10. Morphic */}
      {theme.id === 'morphic' && (
        <>
          <div className="absolute inset-0 bg-[#1a1a1a]"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50 animate-shimmer bg-[length:200%_200%]"></div>
        </>
      )}

      {/* Arcade / Fun Mode */}
      {theme.id === 'arcade' && (
        <>
           <div className="absolute inset-0 bg-indigo-950"></div>
           <div className="absolute bottom-0 w-full h-1/2 bg-[linear-gradient(transparent_0%,#a855f7_100%)] opacity-20" style={{ perspective: '500px' }}>
              <div className="w-full h-full border-t border-purple-500 opacity-20" style={{ transform: 'rotateX(60deg)' }}></div>
           </div>
           <div className="absolute top-10 left-10 w-1 h-1 bg-white animate-pulse"></div>
        </>
      )}
    </div>
  );
};