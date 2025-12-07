import React from 'react';
import { MessageSquare, Image as ImageIcon, Plus, Trash2, LogOut, Gamepad2, Palette } from 'lucide-react';
import { AppMode, ChatSession, Theme, UserProfile } from '../types';
import { THEMES } from '../lib/themes';

interface SidebarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onLoadSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onSignOut: () => void;
  onNewChat: () => void;
  isOpen: boolean;
  theme: Theme;
  user: UserProfile | null;
  isFunMode: boolean;
  onToggleFunMode: () => void;
  onThemeChange: (theme: Theme) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentMode, 
  setMode, 
  sessions,
  activeSessionId,
  onLoadSession,
  onDeleteSession,
  onSignOut,
  onNewChat,
  isOpen,
  theme,
  user,
  isFunMode,
  onToggleFunMode,
  onThemeChange
}) => {
  const themeOptions = Object.values(THEMES);
  
  return (
    <div className={`
      fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1)
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0 md:static md:inset-0
      ${theme.panel} ${theme.border} border-r
      flex flex-col
    `}>
      {/* Header */}
      <div className="p-6 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-glow ${theme.accent}`}>
          S
        </div>
        <span className={`font-display font-bold text-xl tracking-tight ${theme.text}`}>
          Sarvix AI
        </span>
      </div>

      {/* New Chat Button */}
      <div className="px-6 pb-2">
        <button 
          onClick={onNewChat}
          className={`w-full group flex items-center justify-between border py-3 px-4 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md ${theme.border} ${theme.type === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-gray-50'}`}
        >
          <div className="flex items-center gap-3">
             <Plus size={18} className={theme.type === 'dark' ? 'text-white' : 'text-gray-900'} />
             <span className={`text-sm font-medium ${theme.text}`}>New Chat</span>
          </div>
          <span className={`opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[10px] ${theme.textSecondary} bg-white/10`}>⌘N</span>
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="px-6 py-4">
        <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${theme.textSecondary}`}>Modes</div>
        <div className="space-y-1">
          <button
            onClick={() => setMode(AppMode.CHAT)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentMode === AppMode.CHAT 
              ? `${theme.accent} shadow-md` 
              : `${theme.textSecondary} hover:${theme.text} hover:bg-white/5`
            }`}
          >
            <MessageSquare size={16} />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setMode(AppMode.IMAGE)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentMode === AppMode.IMAGE
              ? `${theme.accent} shadow-md`
              : `${theme.textSecondary} hover:${theme.text} hover:bg-white/5`
            }`}
          >
            <ImageIcon size={16} />
            <span>Image Generation</span>
          </button>
        </div>
      </div>

      {/* Customization Section */}
      <div className="px-6 py-4 border-t border-white/10">
        <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${theme.textSecondary}`}>Customize</div>
        <div className="space-y-2">
          {/* Arcade Mode Toggle */}
          <button
            onClick={onToggleFunMode}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isFunMode 
              ? 'bg-green-500 text-black shadow-md' 
              : `${theme.textSecondary} hover:${theme.text} hover:bg-white/5`
            }`}
          >
            <Gamepad2 size={16} />
            <span>Arcade Mode</span>
            {isFunMode && <span className="ml-auto text-[10px] bg-black/20 px-2 py-0.5 rounded-full">ON</span>}
          </button>

          {/* Theme Selector */}
          <div className="space-y-2">
            <div className={`flex items-center gap-3 px-3 py-2 ${theme.textSecondary}`}>
              <Palette size={16} />
              <span className="text-sm font-medium">Theme</span>
            </div>
            <div className="grid grid-cols-4 gap-2 px-3">
              {themeOptions.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onThemeChange(t)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                    theme.id === t.id ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ background: t.preview }}
                  title={t.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* User Profile / Footer */}
      <div className={`p-4 border-t ${theme.border}`}>
        <div className={`flex items-center justify-between p-3 rounded-xl border hover:border-opacity-50 transition-colors cursor-pointer group ${theme.border} ${theme.type === 'dark' ? 'bg-white/5' : 'bg-white'}`}>
          <div className="flex items-center gap-3">
            {user?.picture ? (
                 <img src={user.picture} alt="User" className="w-8 h-8 rounded-full shadow-sm" />
            ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-glow-gold ${theme.accent}`}>
                ME
                </div>
            )}
            <div className="flex flex-col">
              <span className={`text-xs font-semibold ${theme.text}`}>{user?.name || 'User'}</span>
              <span className={`text-[10px] ${theme.textSecondary}`}>Sarvix Pro</span>
            </div>
          </div>
          
          <button 
            onClick={onSignOut}
            className={`${theme.textSecondary} hover:${theme.text} transition-colors`}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};