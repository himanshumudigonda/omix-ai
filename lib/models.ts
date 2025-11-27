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
    name: '✨ Auto-Pilot',
    models: [
      createModel('auto', 'Auto (Best)', 'groq', 'balanced')
    ]
  },
  {
    id: 'groq',
    name: '🚀 Hyper-Fast (Groq)',
    models: [
      createModel('llama-3.3-70b-versatile', 'Llama 3.3 70B (Groq)', 'groq', 'balanced'),
      createModel('llama-3.1-8b-instant', 'Llama 3.1 8B (Groq)', 'groq', 'fast'),
      createModel('mixtral-8x7b-32768', 'Mixtral 8x7B', 'groq', 'balanced'),
      createModel('gemma-2-9b-it', 'Gemma 2 9B', 'groq', 'fast'),
    ]
  },
  {
    id: 'fast',
    name: '⚡ Lightning Fast (Gemini 2.5)',
    models: [
      createModel('gemini-2.5-flash', 'Gemini 2.5 Flash', 'gemini', 'fast'),
      createModel('gemini-2.0-flash', 'Gemini 2.0 Flash', 'gemini', 'fast'),
    ]
  },
  {
    id: 'gemma',
    name: '💎 Gemma 3 Open Series',
    models: [
      createModel('gemma-3-27b-it', 'Gemma 3 27B Instruct', 'gemini', 'balanced'),
      createModel('gemma-3-12b-it', 'Gemma 3 12B Instruct', 'gemini', 'balanced'),
      createModel('gemma-3-4b-it', 'Gemma 3 4B Instruct', 'gemini', 'fast'),
      createModel('gemma-3-1b-it', 'Gemma 3 1B Instruct', 'gemini', 'fast'),
    ]
  },

  {
    id: 'image',
    name: '🎨 Image Generation',
    models: [
      createModel('imagen-3.0-generate-001', 'Imagen 3', 'gemini', 'image'),
      createModel('pollinations/flux-pro', 'High Quality (FLUX Pro)', 'gemini', 'image'),
      createModel('pollinations/flux-realism', 'Photorealistic', 'gemini', 'image'),
    ]
  }
];

// Flattened list for internal logic
export const MODELS: AiModel[] = MODEL_CATEGORIES.flatMap(c => c.models);

export const getBestModelForPrompt = (prompt: string): string => {
  const p = prompt.toLowerCase();

  // Image Generation Intent
  if (p.includes('generate image') || p.includes('create an image') || p.includes('draw')) {
    return 'pollinations/flux-pro';
  }

  // Complex tasks / Research -> Llama 3.3 (Groq)
  if (p.includes('search') || p.includes('browse') || p.includes('analyze') || p.includes('summary') || p.length > 500) {
    return 'llama-3.3-70b-versatile';
  }

  // Coding & Math -> Llama 3.3 (Groq)
  if (p.includes('code') || p.includes('math') || p.includes('solve') || p.includes('logic') || p.includes('function')) {
    return 'llama-3.3-70b-versatile';
  }

  // Creative writing -> Llama 3.3 (Groq)
  if (p.includes('story') || p.includes('poem') || p.includes('write') || p.includes('email')) {
    return 'llama-3.3-70b-versatile';
  }

  // Default -> Fast & Efficient
  return 'gemini-2.5-flash';
};