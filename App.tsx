import React, { useState, useEffect, useRef } from 'react';
import { Send, Menu, ArrowUp, Plus, Mic, Gamepad2, Trash2, X, ChevronDown, MicOff, Users, Globe } from 'lucide-react';
import { generateImageResponse } from './services/geminiService';
import { generateSmartResponse } from './services/aiManager';
import { Sidebar } from './components/Sidebar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MessageBubble } from './components/MessageBubble';
import { LoginScreen } from './components/LoginScreen';
import { LoadingSpinner, ImageGeneratingLoader } from './components/ui/LoadingSpinner';
import { SlotMachineLoader, RadarScanner } from './components/ui/FunLoaders';
import { GravityInput } from './components/GravityInput';
import { ChatMessage, MessageType, ContentType, AppMode, ChatSession, Theme, Mood, UserProfile } from './types';
import { ThemeSelector } from './components/ThemeSelector';
import { Background } from './components/Background';
import { THEMES } from './lib/themes';
import { FunAvatar } from './components/FunAvatar';
import { speak, stopSpeaking } from './services/tts';
import { analyzeSentiment, triggerConfetti } from './lib/utils';
import { MODEL_CATEGORIES, LIVE_MODELS } from './lib/models';
import { connectLiveSession, disconnectLiveSession, VoiceGender } from './services/liveService';

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES.obsidian);
  const [isFunMode, setIsFunMode] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>('auto');
  const [activeTab, setActiveTab] = useState<'auto' | 'gemini' | 'openai' | 'meta'>('auto');
  const [useWebSearch, setUseWebSearch] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Fun Features State
  const [isTalking, setIsTalking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDizzy, setIsDizzy] = useState(false);
  const [currentMood, setCurrentMood] = useState<Mood>('neutral');
  const [isBlackHoleActive, setIsBlackHoleActive] = useState(false);

  // Live Mode State
  const [liveSessionActive, setLiveSessionActive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('Disconnected');
  const [liveVoice, setLiveVoice] = useState<VoiceGender>('female');
  const [liveModel, setLiveModel] = useState<string>(LIVE_MODELS[0].id);

  const [isInputFocused, setIsInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Voice Input (STT)
  const [isListening, setIsListening] = useState(false);

  // Firebase Auth State Listener
  useEffect(() => {
    const initAuth = async () => {
      const { auth } = await import('./lib/firebase');
      const { onAuthStateChanged } = await import('firebase/auth');

      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const profile: UserProfile = {
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            picture: firebaseUser.photoURL || ''
          };
          setUser(profile);
        } else {
          setUser(null);
        }
      });

      return unsubscribe;
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (currentTheme.type === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme]);

  // Clean up live session on unmount or mode change
  useEffect(() => {
    return () => {
      disconnectLiveSession();
    };
  }, []);

  useEffect(() => {
    if (mode !== AppMode.LIVE && liveSessionActive) {
      handleStopLiveSession();
    }
  }, [mode]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  // Shake to Wake Listener
  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0;
    let lastUpdate = 0;
    const SHAKE_THRESHOLD = 15;

    const handleMotion = (event: DeviceMotionEvent) => {
      if (!isFunMode) return;
      const current = event.accelerationIncludingGravity;
      if (!current) return;

      const curTime = Date.now();
      if ((curTime - lastUpdate) > 100) {
        const diffTime = curTime - lastUpdate;
        lastUpdate = curTime;

        const speed = Math.abs(current.x! + current.y! + current.z! - lastX - lastY - lastZ) / diffTime * 10000;

        if (speed > SHAKE_THRESHOLD) {
          handleShake();
        }

        lastX = current.x!;
        lastY = current.y!;
        lastZ = current.z!;
      }
    };

    // Note: Request permission might be needed on iOS 13+
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isFunMode]);

  const handleShake = () => {
    if (isDizzy) return;
    setIsDizzy(true);
    speak("Whoa! The world is spinning!");
    setTimeout(() => setIsDizzy(false), 3000);
  };

  const toggleFunMode = () => {
    const nextState = !isFunMode;
    setIsFunMode(nextState);
    if (nextState) {
      setCurrentTheme(THEMES.arcade);
    } else {
      setCurrentTheme(THEMES.obsidian);
      stopSpeaking();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Update Mood
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const sentiment = analyzeSentiment(lastMsg.content);
      setCurrentMood(sentiment);

      if (sentiment === 'happy' && isFunMode) {
        triggerConfetti();
      }
    }
  }, [messages, isProcessing]);

  // Liquid Scroll Effect
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container || !isFunMode) return;

    let isScrolling: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      container.style.transform = 'skewY(1deg)';
      clearTimeout(isScrolling);
      isScrolling = setTimeout(() => {
        container.style.transform = 'skewY(0deg)';
      }, 100);
    };
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [isFunMode]);

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
  };

  const handleSignOut = async () => {
    try {
      const { auth } = await import('./lib/firebase');
      const { signOut } = await import('firebase/auth');
      await signOut(auth);

      setUser(null);
      setMessages([]);
      setInput('');
      setActiveSessionId(null);
      stopSpeaking();
      disconnectLiveSession();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setMode(AppMode.CHAT);
    setIsSidebarOpen(false);
    stopSpeaking();
    setReplyingTo(null);
    disconnectLiveSession();
  };

  const handleBlackHoleClear = () => {
    setIsBlackHoleActive(true);
    speak("Into the void!");
    setTimeout(() => {
      setMessages([]);
      setIsBlackHoleActive(false);
    }, 1500);
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice recognition not supported in this browser.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + text);
    };
    recognition.start();
  };

  const handleStartLiveSession = () => {
    setLiveSessionActive(true);
    connectLiveSession(liveVoice, liveModel, (status) => {
      setLiveStatus(status);
      if (status === 'Disconnected' || status.includes('Error')) {
        setLiveSessionActive(false);
      }
    });
  };

  const handleStopLiveSession = () => {
    disconnectLiveSession();
    setLiveSessionActive(false);
    setLiveStatus('Disconnected');
  };

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim() || isProcessing) return;

    if (isFunMode) {
      setIsSending(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSending(false);
    }

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      currentSessionId = Date.now().toString();
      const newSession: ChatSession = {
        id: currentSessionId,
        title: text.slice(0, 30),
        messages: [],
        createdAt: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(currentSessionId);
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: MessageType.USER,
      content: text,
      contentType: ContentType.TEXT,
      timestamp: Date.now(),
      replyTo: replyingTo ? { id: replyingTo.id, content: replyingTo.content } : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setReplyingTo(null);
    setIsProcessing(true);

    // Reset height of textarea
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      if (mode === AppMode.CHAT) {
        const history = messages.slice(-15).map(m => ({
          role: m.type === MessageType.USER ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));

        // Web Search Logic
        let targetModelId = selectedModelId;
        if (useWebSearch) {
          // If the user hasn't selected a compound model, default to the main compound model
          if (selectedModelId !== 'groq/compound' && selectedModelId !== 'groq/compound-mini') {
            targetModelId = 'groq/compound';
          }
          // If they HAVE selected a compound model (e.g. mini), keep it.
        }

        const stream = generateSmartResponse(targetModelId, text, history);

        let aiMessageId = (Date.now() + 1).toString();
        let fullContent = '';
        let messageAdded = false;
        let modelUsedName = '';

        if (isFunMode) setIsTalking(true);

        for await (const chunk of stream) {
          fullContent += chunk.text;
          modelUsedName = chunk.model;

          if (!messageAdded) {
            setIsProcessing(false);
            const initialAiMessage: ChatMessage = {
              id: aiMessageId,
              type: MessageType.AI,
              content: fullContent,
              contentType: ContentType.TEXT,
              timestamp: Date.now(),
              isStreaming: true,
              modelUsed: chunk.model
            };
            setMessages(prev => [...prev, initialAiMessage]);
            messageAdded = true;
          } else {
            setMessages(prev => prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, content: fullContent, modelUsed: modelUsedName }
                : msg
            ));
          }
        }

        if (messageAdded) {
          setMessages(prev => prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, isStreaming: false }
              : msg
          ));

          if (isFunMode) {
            speak(fullContent);
            setTimeout(() => setIsTalking(false), fullContent.length * 80);
          }

        } else {
          setIsProcessing(false);
          setIsTalking(false);
          const errorMessage: ChatMessage = {
            id: aiMessageId,
            type: MessageType.ERROR,
            content: "No response received.",
            contentType: ContentType.TEXT,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, errorMessage]);
        }

      } else if (mode === AppMode.IMAGE) {
        const imageModel = selectedModelId === 'auto' ? 'imagen-3.0-generate-001' : selectedModelId;
        const result = await generateImageResponse(text, imageModel);

        if (result.imageUrl) {
          const imageMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: MessageType.AI,
            content: result.imageUrl,
            contentType: ContentType.IMAGE,
            timestamp: Date.now(),
            modelUsed: imageModel
          };
          setMessages(prev => [...prev, imageMessage]);
        }

        if (result.text) {
          const textMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            type: MessageType.AI,
            content: result.text,
            contentType: ContentType.TEXT,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, textMessage]);
          if (isFunMode) speak(result.text);
        }
        setIsProcessing(false);
      }
    } catch (error) {
      setIsProcessing(false);
      setIsTalking(false);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: MessageType.ERROR,
        content: "System connection interrupted.",
        contentType: ContentType.TEXT,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const deleteMessage = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isDeleted: true } : m));
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className={`flex h-screen overflow-hidden ${currentTheme.text} font-sans transition-colors duration-500 relative`}>
      <Background theme={currentTheme} mood={isFunMode ? currentMood : undefined} />

      {isFunMode && <FunAvatar isTalking={isTalking} isDizzy={isDizzy} />}

      <Sidebar
        isOpen={isSidebarOpen}
        currentMode={mode}
        setMode={(newMode) => {
          setMode(newMode);
          if (newMode === AppMode.IMAGE) setSelectedModelId('pollinations/flux-pro');
          else setSelectedModelId('auto');
        }}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onLoadSession={(id) => { setActiveSessionId(id); setMessages(sessions.find(s => s.id === id)?.messages || []); }}
        onDeleteSession={(id) => setSessions(prev => prev.filter(s => s.id !== id))}
        onSignOut={handleSignOut}
        onNewChat={handleNewChat}
        theme={currentTheme}
        user={user}
      />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col h-full relative z-0">

        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pointer-events-none">
          <div className="pointer-events-auto md:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className={`p-2.5 backdrop-blur-md rounded-xl shadow-sm ${currentTheme.panel} ${currentTheme.border} ${currentTheme.text}`}>
              <Menu size={20} />
            </button>
          </div>

          <div className="pointer-events-auto ml-auto flex items-center gap-3">
            {/* Model Selector Tabs */}
            {mode !== AppMode.LIVE && (
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md p-1 rounded-full border border-white/10">
                {['auto', 'gemini', 'openai', 'meta'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`relative p-2 rounded-full transition-all duration-300 ${activeTab === tab ? 'bg-white/20 shadow-lg scale-110' : 'hover:bg-white/10 opacity-70 hover:opacity-100'}`}
                    title={tab.charAt(0).toUpperCase() + tab.slice(1)}
                  >
                    {tab === 'auto' ? (
                      <div className="w-6 h-6 flex items-center justify-center font-bold text-xs">A</div>
                    ) : (
                      <img
                        src={`/assets/${tab}_icon.png`}
                        alt={tab}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          // Fallback if image fails
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerText = tab.charAt(0).toUpperCase();
                        }}
                      />
                    )}
                  </button>
                ))}

                {/* Model Dropdown for Active Tab */}
                <div className="relative ml-2">
                  <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    className={`appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs font-medium border cursor-pointer focus:outline-none bg-transparent ${currentTheme.text}`}
                    style={{ maxWidth: '120px' }}
                  >
                    {MODEL_CATEGORIES
                      .find(cat => cat.id === activeTab)
                      ?.models.map(m => (
                        <option key={m.id} value={m.id} className="text-black">{m.name}</option>
                      ))}
                  </select>
                  <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${currentTheme.textSecondary}`} />
                </div>
              </div>
            )}

            {messages.length > 0 && isFunMode && (
              <button
                onClick={handleBlackHoleClear}
                className="p-2.5 rounded-full bg-black text-white hover:scale-110 transition-transform shadow-lg"
                title="Black Hole Delete"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={toggleFunMode}
              className={`p-2.5 rounded-full backdrop-blur-md shadow-sm border transition-all duration-300 ${isFunMode ? 'bg-green-500 text-black border-black animate-pulse' : `${currentTheme.panel} ${currentTheme.border} ${currentTheme.textSecondary}`}`}
              title="Fun Mode"
            >
              <Gamepad2 size={18} />
            </button>

            <ThemeSelector currentTheme={currentTheme} onThemeChange={setCurrentTheme} />
          </div>
        </header>

        {/* Live Mode Overlay */}
        {mode === AppMode.LIVE && (
          <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-6 text-center">
            {/* ... Live Mode UI ... */}
            <div className={`relative w-48 h-48 rounded-full border-4 flex items-center justify-center mb-8 ${liveSessionActive ? 'border-green-500 animate-pulse' : 'border-gray-700'}`}>
              <div className={`w-40 h-40 rounded-full ${liveSessionActive ? 'bg-green-500/20' : 'bg-gray-800'} backdrop-blur-xl flex items-center justify-center`}>
                {liveSessionActive ? (
                  <div className="space-y-1">
                    <div className="w-16 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="w-24 h-2 bg-green-400 rounded-full animate-pulse delay-75"></div>
                    <div className="w-10 h-2 bg-green-400 rounded-full animate-pulse delay-150"></div>
                  </div>
                ) : (
                  <MicOff size={48} className="opacity-50" />
                )}
              </div>
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${currentTheme.text}`}>{liveStatus}</h2>
            <p className={`mb-8 ${currentTheme.textSecondary}`}>Conversational mode enabled. Speak naturally.</p>

            {/* Live Model Selector */}
            <div className="mb-6 relative">
              <select
                value={liveModel}
                onChange={(e) => setLiveModel(e.target.value)}
                disabled={liveSessionActive}
                className={`appearance-none pl-4 pr-10 py-2 rounded-full text-sm font-medium border cursor-pointer focus:outline-none bg-black/20 border-white/10 ${currentTheme.text} ${liveSessionActive ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/30'}`}
              >
                {LIVE_MODELS.map(m => (
                  <option key={m.id} value={m.id} className="text-black">{m.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${currentTheme.textSecondary}`} />
            </div>

            <div className="flex items-center gap-4 mb-8 bg-black/20 p-1.5 rounded-full border border-white/10">
              <button
                onClick={() => setLiveVoice('female')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${liveVoice === 'female' ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Sweet (Female)
              </button>
              <button
                onClick={() => setLiveVoice('male')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${liveVoice === 'male' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Huge (Male)
              </button>
            </div>

            <button
              onClick={liveSessionActive ? handleStopLiveSession : handleStartLiveSession}
              className={`px-8 py-3 rounded-full font-bold text-lg shadow-xl transition-transform hover:scale-105 ${liveSessionActive ? 'bg-red-500 text-white' : 'bg-green-500 text-black'}`}
            >
              {liveSessionActive ? 'End Session' : 'Start Live Conversation'}
            </button>
          </div>
        )}

        {/* Chat Area */}
        {mode !== AppMode.LIVE && (
          <div
            ref={chatContainerRef}
            className={`flex-1 overflow-y-auto pt-20 px-4 scroll-smooth custom-scrollbar liquid-scroll ${isBlackHoleActive ? 'animate-black-hole' : ''}`}
          >
            <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center w-full">
                  <WelcomeScreen userName={user.name.split(' ')[0]} onQuickAction={handleSendMessage} theme={currentTheme} />
                </div>
              ) : (
                <div className="space-y-6 pb-48 pt-4">
                  {messages.map(msg => (
                    <div key={msg.id} className="break-words overflow-hidden">
                      <MessageBubble
                        message={msg}
                        theme={currentTheme}
                        onDelete={deleteMessage}
                        onReply={(m) => setReplyingTo(m)}
                      />
                    </div>
                  ))}

                  {isProcessing && (
                    <div className="flex justify-start mb-6 animate-fade-in pl-1">
                      <div className="flex items-center gap-4">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center shadow-lg ${currentTheme.panel} ${currentTheme.border}`}>
                          <div className={`w-4 h-4 animate-spin ${currentTheme.text}`}>
                            <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="30 60" /></svg>
                          </div>
                        </div>

                        <div className={`px-5 py-3 rounded-2xl rounded-tl-sm flex items-center gap-3 ${currentTheme.bubbleAi}`}>
                          {isFunMode ? (
                            Math.random() > 0.5 ? <SlotMachineLoader /> : <RadarScanner />
                          ) : (
                            mode === AppMode.IMAGE ? (
                              <><ImageGeneratingLoader theme={currentTheme} /><span className={currentTheme.textSecondary}>Visualizing...</span></>
                            ) : (
                              <><LoadingSpinner theme={currentTheme} /><span className={currentTheme.textSecondary}>Processing...</span></>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Input Area */}
        {mode !== AppMode.LIVE && (
          <div className={`absolute bottom-0 left-0 right-0 z-20 p-4 pb-6 md:pb-10 pointer-events-none bg-gradient-to-t ${currentTheme.type === 'dark' ? 'from-black via-black/90 to-transparent' : 'from-white via-white/90 to-transparent'}`}>
            <div className="max-w-4xl mx-auto pointer-events-auto transition-all duration-300 ease-out">
              {/* Replying Indicator */}
              {replyingTo && (
                <div className={`mx-4 mb-2 p-3 rounded-t-xl backdrop-blur-md border border-b-0 flex justify-between items-center ${currentTheme.panel} ${currentTheme.border}`}>
                  <div className="flex flex-col text-xs">
                    <span className={`${currentTheme.textSecondary} font-bold`}>Replying to {replyingTo.type === MessageType.USER ? 'You' : 'Omix'}</span>
                    <span className={`${currentTheme.text} truncate max-w-xs opacity-80`}>{replyingTo.content}</span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-white/10 rounded-full">
                    <X size={14} className={currentTheme.text} />
                  </button>
                </div>
              )}

              <div className={`relative group transition-all duration-500 ${isInputFocused ? 'scale-[1.03] translate-y-[-10px]' : 'scale-100'}`}>

                {/* Grand Aura (Fun Mode Only) */}
                <div className={`
                    absolute -inset-[3px] rounded-[2rem] opacity-0 transition-opacity duration-700 blur-2xl
                    ${isFunMode ? 'bg-green-500 opacity-40 scale-105' : 'opacity-0'}
                    ${isInputFocused && isFunMode ? 'opacity-60 scale-105' : ''}
                    `}></div>

                <div className={`
                    relative flex items-end gap-3 p-4 rounded-[1.9rem] shadow-2xl border backdrop-blur-3xl transition-all duration-300
                    ${currentTheme.input} ${currentTheme.border}
                    ${isInputFocused ? 'border-opacity-60 bg-opacity-90 shadow-[0_10px_50px_-10px_rgba(0,0,0,0.5)]' : 'border-opacity-30 bg-opacity-70'}
                    ${replyingTo ? 'rounded-t-none' : ''}
                    `}>

                  <div className="flex-1 py-2.5 pl-2">
                    {isFunMode ? (
                      <GravityInput
                        value={input}
                        onChange={setInput}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                        onEnter={handleSendMessage}
                        placeholder="Type to drop letters..."
                        theme={currentTheme}
                      />
                    ) : (
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        placeholder="Ask me anything..."
                        className={`w-full max-h-[150px] bg-transparent border-none p-0 focus:ring-0 resize-none leading-relaxed font-medium text-[16px] tracking-wide ${currentTheme.text} placeholder:opacity-40`}
                        rows={1}
                        style={{ minHeight: '24px' }}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2 pb-0.5">
                    {/* Web Search Toggle */}
                    <button
                      onClick={() => setUseWebSearch(!useWebSearch)}
                      className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${useWebSearch ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : `${currentTheme.textSecondary} hover:${currentTheme.text} hover:bg-white/10`}`}
                      title="Web Search"
                    >
                      <Globe size={20} strokeWidth={2} />
                    </button>

                    <button
                      onClick={startVoiceInput}
                      className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : `${currentTheme.textSecondary} hover:${currentTheme.text} hover:bg-white/10`}`}
                      title="Voice Input"
                    >
                      <Mic size={20} strokeWidth={2} />
                    </button>

                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!input.trim() || isProcessing}
                      className={`
                            relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-500 overflow-visible
                            ${isSending && isFunMode ? 'animate-rocket-complex pointer-events-none' : ''}
                            ${input.trim() && !isProcessing ? `${currentTheme.accent} shadow-lg hover:shadow-xl hover:scale-105 active:scale-95` : 'bg-white/5 text-gray-500 cursor-not-allowed'}
                        `}
                    >
                      {input.trim() ? <ArrowUp size={22} strokeWidth={3} className="relative z-10" /> : <div className="w-2.5 h-2.5 rounded-full bg-current opacity-30" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;