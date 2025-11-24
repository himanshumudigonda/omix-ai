export enum MessageType {
  USER = 'user',
  AI = 'ai',
  ERROR = 'error'
}

export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image'
}

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  contentType: ContentType;
  timestamp: number;
  isStreaming?: boolean;
  isDeleted?: boolean;
  replyTo?: {
    id: string;
    content: string;
  };
  modelUsed?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

export enum AppMode {
  CHAT = 'chat',
  IMAGE = 'image',
  LIVE = 'live'
}

export type ThemeType = 'light' | 'dark';
export type Mood = 'neutral' | 'happy' | 'serious' | 'angry';

export interface Theme {
  id: string;
  name: string;
  type: ThemeType;
  bg: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentHover: string;
  panel: string;
  border: string;
  bubbleUser: string;
  bubbleAi: string;
  input: string;
}

export interface AiModel {
  id: string;
  name: string;
  provider: 'groq' | 'gemini';
  type: 'fast' | 'reasoning' | 'balanced' | 'creative' | 'image';
  contextWindow?: number;
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}