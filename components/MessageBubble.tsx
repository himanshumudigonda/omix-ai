import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, ghcolors } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, User, Sparkles, Eraser, Check, Reply, Gamepad2, ImageIcon } from 'lucide-react';
import { MessageType, ChatMessage, ContentType, Theme } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  theme: Theme;
  onDelete: (id: string) => void;
  onReply: (message: ChatMessage) => void;
}

const HackerText: React.FC<{ text: string }> = ({ text }) => {
  const [display, setDisplay] = useState('');
  
  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return text[index];
            }
            return String.fromCharCode(0x30A0 + Math.random() * 96); 
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }
      iteration += 1/3; 
    }, 30); 

    return () => clearInterval(interval);
  }, [text]);

  return <span className="font-mono text-green-500 bg-black/80 px-1 break-words">{display}</span>;
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, theme, onDelete, onReply }) => {
  const [isPopped, setIsPopped] = useState(false);
  const [isDusting, setIsDusting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const isUser = message.type === MessageType.USER;
  const isError = message.type === MessageType.ERROR;
  const isFunMode = theme.id === 'arcade' || theme.id === 'cyber';
  const isImage = message.contentType === ContentType.IMAGE;

  if (message.isDeleted) return null;

  const handlePop = () => {
    if (!isFunMode) return;
    setIsPopped(true);
    setTimeout(() => onDelete(message.id), 300);
  };

  const handleThanosSnap = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDusting(true);
    setTimeout(() => onDelete(message.id), 1000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isPopped) {
    return (
       <div className={`w-full mb-8 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
          <div className="scale-150 opacity-0 transition-all duration-300">💥</div>
       </div>
    );
  }

  return (
    <div 
      className={`
        flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up group
        ${isDusting ? 'animate-dust-dissolve' : ''}
      `}
    >
      <div 
        onDoubleClick={handlePop}
        className={`relative flex max-w-[90%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3 transition-transform duration-200`}
      >
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser 
            ? `${theme.accent} shadow-glow` 
            : isError
              ? 'bg-red-500/10 border border-red-500/50'
              : `${theme.panel} ${theme.border} border shadow-lg`}
        `}>
          {isUser ? (
            <User size={14} className="text-current" />
          ) : isFunMode ? (
            <Gamepad2 size={16} className="text-green-400" />
          ) : (
            <Sparkles size={14} className={theme.id === 'cyber' ? 'text-[#ff2a6d]' : 'text-current'} />
          )}
        </div>

        {/* Bubble */}
        <div className={`
          relative p-4 transition-all duration-300 overflow-visible group/bubble
          rounded-2xl shadow-sm
          ${isUser 
            ? `${theme.bubbleUser} rounded-tr-sm` 
            : `${theme.bubbleAi} rounded-tl-sm`}
        `}>
          
          {/* Actions Bar (Reply / Copy) */}
          <div className={`absolute -top-8 ${isUser ? 'right-0' : 'left-0'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-2 py-1 z-10`}>
             <button onClick={() => onReply(message)} className="p-1.5 text-white hover:text-blue-400" title="Reply">
                <Reply size={12} />
             </button>
             <button onClick={handleCopy} className="p-1.5 text-white hover:text-green-400" title="Copy">
                {copied ? <Check size={12} /> : <Copy size={12} />}
             </button>
          </div>

          {/* Fun Mode Actions */}
          {isFunMode && (
            <button 
                onClick={handleThanosSnap}
                className="absolute top-2 right-2 opacity-0 group-hover/bubble:opacity-100 p-1 hover:bg-black/20 rounded transition-all"
                title="Snap to Dust"
            >
                <Eraser size={12} className="text-gray-400" />
            </button>
          )}

          {/* Reply Context */}
          {message.replyTo && (
             <div className={`mb-2 text-xs opacity-70 border-l-2 pl-2 ${theme.type === 'dark' ? 'border-white/30' : 'border-black/30'}`}>
                <div className="font-bold mb-0.5">Replying to:</div>
                <div className="truncate max-w-[200px]">{message.replyTo.content}</div>
             </div>
          )}

          {/* Text Content */}
          {message.contentType === ContentType.TEXT && (
            <div className={`prose max-w-none ${theme.type === 'dark' ? 'prose-invert' : ''} prose-p:leading-relaxed`}>
              {message.content ? (
                 isFunMode && !isUser && message.isStreaming ? (
                    <HackerText text={message.content.slice(-100)} /> 
                 ) : (
                    <ReactMarkdown
                    components={{
                        code({node, inline, className, children, ...props}: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <SyntaxHighlighter
                            {...props}
                            children={String(children).replace(/\n$/, '')}
                            style={theme.type === 'dark' ? vscDarkPlus : ghcolors}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{ margin: '1em 0', borderRadius: '0.5em', fontSize: '0.85rem' }}
                            />
                        ) : (
                            <code {...props} className={`${className} bg-white/10 px-1 py-0.5 rounded text-sm`}>
                            {children}
                            </code>
                        )
                        }
                    }}
                    >
                    {message.content}
                    </ReactMarkdown>
                 )
              ) : (
                 <span className={`inline-block w-2 h-5 animate-pulse ${theme.id === 'cyber' ? 'bg-[#ff2a6d]' : 'bg-current'}`}></span>
              )}
            </div>
          )}

          {/* Image Content */}
          {message.contentType === ContentType.IMAGE && (
             <div className="rounded-lg overflow-hidden mt-1 border border-white/10 shadow-2xl relative">
                <img src={message.content} alt="AI Generated" className="max-w-full h-auto" />
             </div>
          )}

          {/* Model Badge - ONLY for Images */}
          {isImage && !isUser && (
             <div className={`
                absolute -bottom-6 left-0 
                flex items-center gap-1.5 px-2 py-0.5 rounded-full 
                bg-black/40 border border-white/10 backdrop-blur-md
                text-[9px] uppercase tracking-wider font-medium text-white/70
                animate-fade-in
             `}>
               <ImageIcon size={10} className="text-purple-400" />
               <span>{message.modelUsed || 'Gemini Generated'}</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};