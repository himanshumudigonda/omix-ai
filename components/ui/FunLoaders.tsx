import React, { useState, useEffect } from 'react';
import { Globe, Search, Database, Newspaper, Zap } from 'lucide-react';

export const SlotMachineLoader: React.FC = () => {
  const icons = [<Globe size={20} />, <Search size={20} />, <Database size={20} />, <Newspaper size={20} />, <Zap size={20} />];
  
  return (
    <div className="flex items-center gap-2 bg-black/80 px-4 py-2 rounded-lg border border-green-500/30">
      <span className="text-green-400 font-arcade text-xs mr-2">SOURCING:</span>
      <div className="relative h-6 w-6 overflow-hidden bg-black/50 rounded border border-white/10">
         <div className="flex flex-col items-center animate-slot-spin space-y-2">
            {[...icons, ...icons, ...icons].map((icon, i) => (
              <div key={i} className="text-green-400">{icon}</div>
            ))}
         </div>
      </div>
      <div className="relative h-6 w-6 overflow-hidden bg-black/50 rounded border border-white/10">
         <div className="flex flex-col items-center animate-slot-spin space-y-2" style={{ animationDelay: '0.1s' }}>
            {[...icons, ...icons, ...icons].map((icon, i) => (
              <div key={i} className="text-green-400">{icon}</div>
            ))}
         </div>
      </div>
      <div className="relative h-6 w-6 overflow-hidden bg-black/50 rounded border border-white/10">
         <div className="flex flex-col items-center animate-slot-spin space-y-2" style={{ animationDelay: '0.2s' }}>
            {[...icons, ...icons, ...icons].map((icon, i) => (
              <div key={i} className="text-green-400">{icon}</div>
            ))}
         </div>
      </div>
    </div>
  );
};

export const RadarScanner: React.FC = () => {
  return (
    <div className="relative w-16 h-16 rounded-full border border-green-500/30 bg-black overflow-hidden flex items-center justify-center">
      {/* Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,#22c55e_31%,transparent_32%,transparent_60%,#22c55e_61%,transparent_62%)] opacity-30"></div>
      <div className="absolute inset-0 border-r border-t border-transparent border-r-green-500/50 rounded-full animate-spin"></div>
      {/* Blip */}
      <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_#4ade80]"></div>
      <span className="text-[8px] font-arcade text-green-500 mt-8">SCAN</span>
    </div>
  );
};