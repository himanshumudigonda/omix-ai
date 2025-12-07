import React from 'react';
import { MessageSquare, Image as ImageIcon, Plus, Trash2, LogOut } from 'lucide-react';
import { AppMode, ChatSession, Theme, UserProfile } from '../types';

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
  user
}) => {
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
          O
        </div>
        <span className={`font-display font-bold text-xl tracking-tight ${theme.text}`}>
          Omix AI
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

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
        <div className={`px-2 text-[10px] font-bold uppercase tracking-widest mb-2 mt-2 ${theme.textSecondary}`}>
          Recent Activity
        </div>
        {sessions.length === 0 ? (
          <div className={`text-sm italic px-2 py-4 text-center ${theme.textSecondary}`}>
            Start a new conversation.
          </div>
        ) : (
          sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => onLoadSession(session.id)}
              className={`
                group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
                ${activeSessionId === session.id 
                  ? `${theme.type === 'dark' ? 'bg-white/10' : 'bg-gray-200'} ${theme.text} border ${theme.border}` 
                  : `${theme.textSecondary} hover:bg-white/5 border border-transparent`}
              `}
            >
              <span className="text-sm truncate max-w-[160px]">
                {session.title || 'Untitled Chat'}
              </span>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className={`
                  p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-500 transition-colors
                  ${activeSessionId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                `}
                title="Delete Chat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

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
              <span className={`text-[10px] ${theme.textSecondary}`}>Omix Pro</span>
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