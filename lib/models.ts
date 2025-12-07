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
      createModel('groq/compound', 'Compound (Web Search)', 'groq', 'balanced'),
      createModel('groq/compound-mini', 'Compound Mini', 'groq', 'fast'),
    ]
  },
  {
    id: 'gemini',
    name: 'Gemini', // Tab Name - Google Models
    models: [
      createModel('gemini-2.5-flash', 'Gemini 2.5 Flash', 'gemini', 'fast'),
      createModel('gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite', 'gemini', 'fast'),
      createModel('gemma-3-27b', 'Gemma 3 27B', 'gemini', 'balanced'),
      createModel('gemma-3-12b', 'Gemma 3 12B', 'gemini', 'balanced'),
      createModel('gemma-3-4b', 'Gemma 3 4B', 'gemini', 'fast'),
      createModel('gemma-3-2b', 'Gemma 3 2B', 'gemini', 'fast'),
      createModel('gemma-3-1b', 'Gemma 3 1B', 'gemini', 'fast'),
    ]
  },
  {
    id: 'openai',
    name: 'GPT-OSS', // Tab Name - Groq OpenAI compatible
    models: [
      createModel('openai/gpt-oss-120b', 'GPT-OSS 120B', 'groq', 'balanced'),
      createModel('openai/gpt-oss-20b', 'GPT-OSS 20B', 'groq', 'fast'),
      createModel('openai/gpt-oss-safeguard-20b', 'GPT-OSS Safeguard 20B', 'groq', 'fast'),
    ]
  },
  {
    id: 'meta',
    name: 'Meta', // Tab Name - Groq Meta Models
    models: [
      createModel('llama-3.3-70b-versatile', 'Llama 3.3 70B', 'groq', 'balanced'),
      createModel('llama-3.1-8b-instant', 'Llama 3.1 8B', 'groq', 'fast'),
      createModel('meta-llama/llama-4-maverick-17b-128e-instruct', 'Llama 4 Maverick 17B', 'groq', 'balanced'),
      createModel('meta-llama/llama-4-scout-17b-16e-instruct', 'Llama 4 Scout 17B', 'groq', 'fast'),
      createModel('meta-llama/llama-guard-4-12b', 'Llama Guard 4 12B', 'groq', 'fast'),
      createModel('meta-llama/llama-prompt-guard-2-22m', 'Prompt Guard 2 22M', 'groq', 'fast'),
      createModel('meta-llama/llama-prompt-guard-2-86m', 'Prompt Guard 2 86M', 'groq', 'fast'),
    ]
  },
  {
    id: 'moonshot',
    name: 'Moonshot', // Tab Name - Groq Moonshot Models
    models: [
      createModel('moonshotai/kimi-k2-instruct', 'Kimi K2 Instruct', 'groq', 'balanced'),
      createModel('moonshotai/kimi-k2-instruct-0905', 'Kimi K2 (0905)', 'groq', 'balanced'),
    ]
  },
  {
    id: 'image',
    name: 'Image',
    models: [
      createModel('pollinations/flux-pro', 'FLUX Pro', 'gemini', 'image'),
      createModel('pollinations/flux-realism', 'Realism', 'gemini', 'image'),
    ]
  }
];

// Flattened list for internal logic
export const MODELS: AiModel[] = MODEL_CATEGORIES.flatMap(c => c.models);

export const LIVE_MODELS = [
  { id: 'gemini-2.0-flash-live', name: 'Gemini 2.0 Flash Live' },
  { id: 'gemini-2.5-flash-live', name: 'Gemini 2.5 Flash Live' },
];

export const getBestModelForPrompt = (prompt: string): string => {
  const p = prompt.toLowerCase();

  // Image Generation Intent
  if (p.includes('generate image') || p.includes('create an image') || p.includes('draw')) {
    return 'pollinations/flux-pro';
  }

  // Complex tasks / Research -> Compound
  if (p.includes('search') || p.includes('browse') || p.includes('analyze') || p.includes('summary') || p.length > 500) {
    return 'groq/compound';
  }

  // Coding & Math -> Llama 3.3 or Compound
  if (p.includes('code') || p.includes('math') || p.includes('solve') || p.includes('logic') || p.includes('function')) {
    return 'llama-3.3-70b-versatile';
  }

  // Default -> Compound Mini
  return 'groq/compound-mini';
};