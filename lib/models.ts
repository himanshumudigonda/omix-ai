import { AiModel } from '../types';

export const GROQ_API_KEY = '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';
export const GEMINI_API_KEY = 'AIzaSyBhTEPYOuNmx-SXbcXsnUSY1-M21jWKZgA';

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
    id: 'reasoning',
    name: '🧠 High Reasoning (Gemini 3)',
    models: [
      createModel('gemini-3-pro-preview', 'Gemini 3 Pro (Preview)', 'gemini', 'reasoning'),
      createModel('gemini-2.5-pro', 'Gemini 2.5 Pro', 'gemini', 'reasoning'),
      createModel('gemini-2.0-flash-exp', 'Gemini 2.0 Flash (Exp)', 'gemini', 'reasoning'),
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

  // Complex tasks / Research -> High Reasoning
  if (p.includes('search') || p.includes('browse') || p.includes('analyze') || p.includes('summary') || p.length > 500) {
    return 'gemini-3-pro-preview';
  }

  // Coding & Math -> Deep Reasoning
  if (p.includes('code') || p.includes('math') || p.includes('solve') || p.includes('logic') || p.includes('function')) {
    return 'gemini-3-pro-preview';
  }

  // Creative writing -> Versatile High Quality
  if (p.includes('story') || p.includes('poem') || p.includes('write') || p.includes('email')) {
    return 'gemini-2.5-pro';
  }

  // Default -> Fast & Efficient
  return 'gemini-2.5-flash';
};