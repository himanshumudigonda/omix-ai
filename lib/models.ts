import { AiModel } from '../types';

// API Keys should be loaded from environment variables in the backend
// Do not expose keys in frontend code


export interface ModelCategory {
  id: string;
  name: string;
  models: AiModel[];
}

// Helper to create model objects cleanly
const createModel = (id: string, name: string, provider: 'groq' | 'gemini', type: AiModel['type']): AiModel => ({
  id, name, provider, type
});

export const MODEL_CATEGORIES: ModelCategory[] = [
  {
    id: 'auto',
    name: 'Auto',
    models: [
      createModel('auto', 'Auto (Smart Router)', 'groq', 'balanced'),
    ]
  },
  {
    id: 'gemini',
    name: 'Gemini', // Tab Name
    models: [
      // Latest
      createModel('gemini-3-pro-preview', 'Gemini 3 Pro (Preview)', 'gemini', 'reasoning'),
      createModel('gemini-2.5-pro', 'Gemini 2.5 Pro', 'gemini', 'reasoning'),
      createModel('gemini-2.5-flash', 'Gemini 2.5 Flash', 'gemini', 'fast'),
      createModel('gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite', 'gemini', 'fast'),
      // Gemma
      createModel('gemma-2-27b-it', 'Gemma 2 27B', 'gemini', 'balanced'),
      createModel('gemma-2-9b-it', 'Gemma 2 9B', 'gemini', 'balanced'),
    ]
  },
  {
    id: 'openai',
    name: 'Groq/OpenAI', // Tab Name
    models: [
      createModel('llama-3.3-70b-versatile', 'Llama 3.3 70B', 'groq', 'balanced'),
      createModel('llama-3.1-8b-instant', 'Llama 3.1 8B', 'groq', 'fast'),
      createModel('mixtral-8x7b-32768', 'Mixtral 8x7B', 'groq', 'balanced'),
    ]
  },
  {
    id: 'meta',
    name: 'Meta', // Tab Name
    models: [
      createModel('llama-3.3-70b-versatile', 'Llama 3.3 70B', 'groq', 'balanced'),
      createModel('llama-3.1-8b-instant', 'Llama 3.1 8B', 'groq', 'fast'),
      createModel('llama-guard-3-8b', 'Llama Guard 3 8B', 'groq', 'fast'),
    ]
  },
  {
    id: 'image',
    name: 'Image',
    models: [
      createModel('imagen-3.0-generate-001', 'Imagen 3', 'gemini', 'image'),
      createModel('pollinations/flux-pro', 'FLUX Pro', 'gemini', 'image'),
      createModel('pollinations/flux-realism', 'Realism', 'gemini', 'image'),
    ]
  }
];

// Flattened list for internal logic
export const MODELS: AiModel[] = MODEL_CATEGORIES.flatMap(c => c.models);

export const LIVE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash Live' },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Live' },
];

export const getBestModelForPrompt = (prompt: string): string => {
  const p = prompt.toLowerCase();

  // Image Generation Intent
  if (p.includes('generate image') || p.includes('create an image') || p.includes('draw')) {
    return 'pollinations/flux-pro';
  }

  // Complex tasks / Research -> Compound
  if (p.includes('search') || p.includes('browse') || p.includes('analyze') || p.includes('summary') || p.length > 500) {
    return 'llama-3.3-70b-versatile';
  }

  // Coding & Math -> Llama 3.3 or Compound
  if (p.includes('code') || p.includes('math') || p.includes('solve') || p.includes('logic') || p.includes('function')) {
    return 'llama-3.3-70b-versatile';
  }

  // Default -> Compound Mini
  return 'llama-3.1-8b-instant';
};