import React, { useState, useEffect } from 'react';

interface FunAvatarProps {
  isTalking: boolean;
  isDizzy?: boolean;
}

export const FunAvatar: React.FC<FunAvatarProps> = ({ isTalking, isDizzy }) => {
  const [blink, setBlink] = useState(false);

  // Random Blink
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, Math.random() * 4000 + 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div 
      className={`
        fixed bottom-24 right-2 z-50 pointer-events-none transition-all duration-700
        ${isDizzy ? 'animate-shake scale-90 rotate-12' : ''}
      `}
    >
      {/* Mobile version - simpler static robot */}
      <div className="block md:hidden w-20 h-24">
        <svg viewBox="0 0 100 120" className="w-full h-full">
          <defs>
            <linearGradient id="mobileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>
          {/* Simple body */}
          <rect x="30" y="50" width="40" height="50" rx="5" fill="#1e293b" stroke="#22d3ee" strokeWidth="2" />
          {/* Core */}
          <circle cx="50" cy="75" r="10" fill="url(#mobileGrad)" className={isTalking ? 'animate-pulse' : ''} />
          {/* Head */}
          <rect x="25" y="15" width="50" height="35" rx="8" fill="#334155" stroke="#22d3ee" strokeWidth="2" />
          {/* Eyes */}
          <rect x="32" y="25" width="12" height="6" rx="2" fill="#22d3ee" className={blink ? 'opacity-0' : 'opacity-100'} />
          <rect x="56" y="25" width="12" height="6" rx="2" fill="#22d3ee" className={blink ? 'opacity-0' : 'opacity-100'} />
          {/* Antenna */}
          <line x1="50" y1="15" x2="50" y2="5" stroke="#64748b" strokeWidth="2" />
          <circle cx="50" cy="5" r="3" fill={isTalking ? "#ef4444" : "#22c55e"} className={isTalking ? 'animate-pulse' : ''} />
        </svg>
      </div>
      
      {/* Desktop version - full animated robot */}
      <div className={`hidden md:block relative w-48 h-56 filter drop-shadow-[0_0_15px_rgba(34,211,238,0.4)] ${isTalking ? 'animate-float-fast' : 'animate-float'}`}>
        <svg viewBox="0 0 300 350" className="w-full h-full overflow-visible">
          <defs>
            {/* Metallic Gradient */}
            <linearGradient id="armorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            {/* Core Glow */}
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
              <stop offset="70%" stopColor="#0891b2" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
            </radialGradient>
            {/* Hologram */}
            <linearGradient id="hologram" x1="0%" y1="0%" x2="0%" y2="100%">
               <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
               <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.3" />
               <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* --- THRUSTER FLAMES (Behind) --- */}
          <g className="animate-pulse" style={{ transformOrigin: '150px 280px' }}>
             <ellipse cx="150" cy="300" rx="15" ry="40" fill="#3b82f6" opacity="0.6" className="blur-md" />
             <ellipse cx="150" cy="290" rx="8" ry="25" fill="#60a5fa" opacity="0.8" className="blur-sm" />
             <ellipse cx="150" cy="285" rx="4" ry="15" fill="#fff" />
          </g>

          {/* --- FLOATING ARMOR PLATES (Wings) --- */}
          <path 
            d="M60 120 L40 100 L20 130 L50 200 L70 180 Z" 
            fill="url(#armorGradient)" 
            stroke="#22d3ee" 
            strokeWidth="1"
            className="animate-float opacity-90"
            style={{ animationDelay: '0.2s' }}
          />
           <path 
            d="M240 120 L260 100 L280 130 L250 200 L230 180 Z" 
            fill="url(#armorGradient)" 
            stroke="#22d3ee" 
            strokeWidth="1"
            className="animate-float opacity-90"
            style={{ animationDelay: '0.5s' }}
          />

          {/* --- HOLOGRAPHIC WINGS --- */}
          <path 
            d="M50 200 L10 180 L5 250 L60 230 Z" 
            fill="url(#hologram)" 
            className="animate-hologram-flicker"
          />
          <path 
            d="M250 200 L290 180 L295 250 L240 230 Z" 
            fill="url(#hologram)" 
            className="animate-hologram-flicker"
            style={{ animationDelay: '0.1s' }}
          />

          {/* --- MAIN BODY --- */}
          <g className={isTalking ? 'animate-bounce-subtle' : ''}>
             {/* Lower Chassis */}
             <path d="M110 220 L190 220 L170 280 L130 280 Z" fill="#334155" stroke="#1e293b" strokeWidth="2" />
             
             {/* Core Housing */}
             <circle cx="150" cy="190" r="50" fill="#1e293b" stroke="#475569" strokeWidth="4" />
             
             {/* The CORE (Arc Reactor) */}
             <circle cx="150" cy="190" r="25" fill="url(#coreGlow)" className={isTalking ? 'animate-pulse-fast' : 'animate-pulse-slow'} />
             <circle cx="150" cy="190" r="30" stroke="#22d3ee" strokeWidth="2" strokeDasharray="4 2" className="animate-spin-slow origin-center" style={{ transformBox: 'fill-box' }} />
          </g>

          {/* --- HEAD --- */}
          <g className="origin-bottom" style={{ transformOrigin: '150px 150px', transform: isDizzy ? 'rotate(20deg)' : 'rotate(0deg)' }}>
            {/* Neck */}
             <rect x="135" y="130" width="30" height="20" fill="#64748b" />

             {/* Head Helmet */}
             <path 
               d="M100 60 Q150 10 200 60 L200 120 Q150 140 100 120 Z" 
               fill="url(#armorGradient)" 
               stroke="#94a3b8" 
               strokeWidth="2"
             />
             
             {/* Visor / Face Screen */}
             <path d="M110 70 Q150 40 190 70 L190 100 Q150 120 110 100 Z" fill="#000" stroke="#1e293b" strokeWidth="2" />

             {/* EYES */}
             {isDizzy ? (
                <g>
                   <path d="M125 75 L145 95 M145 75 L125 95" stroke="#ef4444" strokeWidth="4" className="animate-spin origin-center" style={{ transformBox: 'fill-box' }} />
                   <path d="M155 75 L175 95 M175 75 L155 95" stroke="#ef4444" strokeWidth="4" className="animate-spin origin-center" style={{ transformBox: 'fill-box' }} />
                </g>
             ) : (
               <g className={isTalking ? '' : 'animate-scan-eyes'}>
                 {/* Left Eye */}
                 <rect x="125" y="80" width="20" height="10" rx="2" fill="#22d3ee" className={blink ? 'scale-y-0' : 'scale-y-100 transition-transform'} />
                 {/* Right Eye */}
                 <rect x="155" y="80" width="20" height="10" rx="2" fill="#22d3ee" className={blink ? 'scale-y-0' : 'scale-y-100 transition-transform'} />
               </g>
             )}

             {/* Antenna */}
             <line x1="110" y1="60" x2="90" y2="30" stroke="#94a3b8" strokeWidth="3" />
             <circle cx="90" cy="30" r="4" fill={isTalking ? "#ef4444" : "#10b981"} className="animate-ping" />

             {/* Voice Visualizer (Only when talking) */}
             {isTalking && (
                <g transform="translate(135, 110)">
                   <rect x="0" y="0" width="4" height="10" fill="#22d3ee" className="animate-equalizer-1" />
                   <rect x="8" y="0" width="4" height="10" fill="#22d3ee" className="animate-equalizer-2" />
                   <rect x="16" y="0" width="4" height="10" fill="#22d3ee" className="animate-equalizer-3" />
                   <rect x="24" y="0" width="4" height="10" fill="#22d3ee" className="animate-equalizer-1" />
                </g>
             )}
          </g>

          {/* --- SCAN BEAM (Random) --- */}
          {!isTalking && !isDizzy && (
             <path 
               d="M150 100 L50 300 L250 300 Z" 
               fill="url(#hologram)" 
               className="animate-scan-beam opacity-0"
             />
          )}
        </svg>
      </div>
    </div>
  );
};