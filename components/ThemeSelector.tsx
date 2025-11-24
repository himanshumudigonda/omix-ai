import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { Theme } from '../types';
import { THEMES } from '../lib/themes';

interface ThemeSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-full backdrop-blur-md shadow-sm border transition-all duration-300 ${currentTheme.panel} ${currentTheme.border} ${currentTheme.textSecondary} hover:${currentTheme.text}`}
        title="Change Theme"
      >
        <Palette size={18} />
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-3 w-56 rounded-xl border backdrop-blur-xl shadow-2xl py-2 z-50 animate-fade-in ${currentTheme.panel} ${currentTheme.border}`}>
          <div className={`px-4 py-2 text-xs font-bold uppercase tracking-widest opacity-50 ${currentTheme.text}`}>
            Select Theme
          </div>
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {Object.values(THEMES).map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  onThemeChange(theme);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                  currentTheme.id === theme.id 
                    ? 'bg-white/10' 
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex flex-col">
                  <span className={`font-medium ${theme.text}`}>{theme.name}</span>
                  <span className={`text-[10px] opacity-60 ${theme.textSecondary}`}>
                    {theme.type === 'dark' ? 'Dark' : 'Light'} Mode
                  </span>
                </div>
                {currentTheme.id === theme.id && (
                  <Check size={14} className={currentTheme.text} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
