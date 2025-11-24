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
      createModel('auto', 'Auto (Best)', 'gemini', 'balanced')
    ]
  },
  {
    id: 'compound',
    name: '🧠 Smart Compound (Web)',
    models: [
      createModel('groq/compound', 'Groq Compound (70B)', 'groq', 'balanced'),
      createModel('groq/compound-mini', 'Groq Compound Mini (8B)', 'groq', 'fast'),
    ]
  },
  {
    id: 'flagship',
    name: '🚀 Flagship & Versatile',
    models: [
      createModel('gemini-2.5-flash', 'Gemini 2.5 Flash', 'gemini', 'balanced'),
      createModel('gemini-2.5-pro', 'Gemini 2.5 Pro', 'gemini', 'balanced'),
      createModel('llama-3.3-70b-versatile', 'Llama 3.3 70B', 'groq', 'balanced'),
      createModel('moonshotai/kimi-k2-instruct', 'Kimi K2 Instruct', 'groq', 'balanced'),
      createModel('moonshotai/kimi-k2-instruct-0905', 'Kimi K2 Instruct (0905)', 'groq', 'balanced'),
      createModel('allam-2-7b', 'Allam 2 7B', 'groq', 'balanced'),
    ]
  },
  {
    id: 'reasoning',
    name: '🤔 Deep Reasoning',
    models: [
      createModel('qwen/qwen3-32b', 'Qwen 3 32B', 'groq', 'reasoning'),
      createModel('openai/gpt-oss-120b', 'GPT-OSS 120B', 'groq', 'reasoning'),
      createModel('gemini-3-pro', 'Gemini 3.0 Pro', 'gemini', 'reasoning'),
      createModel('gemini-2.0-flash-exp', 'Gemini 2.0 Flash Exp', 'gemini', 'reasoning'),
    ]
  },
  {
    id: 'fast',
    name: '⚡ Lightning Fast',
    models: [
      createModel('llama-3.1-8b-instant', 'Llama 3.1 8B Instant', 'groq', 'fast'),
      createModel('gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite', 'gemini', 'fast'),
      createModel('gemini-2.0-flash-lite', 'Gemini 2.0 Flash Lite', 'gemini', 'fast'),
      createModel('gemini-2.0-flash', 'Gemini 2.0 Flash', 'gemini', 'fast'),
    ]
  },
  {
    id: 'experimental',
    name: '🧪 Experimental',
    models: [
      createModel('meta-llama/llama-4-maverick-17b-128e-instruct', 'Llama 4 Maverick', 'groq', 'creative'),
      createModel('meta-llama/llama-4-scout-17b-16e-instruct', 'Llama 4 Scout', 'groq', 'creative'),
      createModel('openai/gpt-oss-20b', 'GPT-OSS 20B', 'groq', 'creative'),
      createModel('openai/gpt-oss-safeguard-20b', 'GPT-OSS Safeguard', 'groq', 'creative'),
      createModel('learnlm-2.0-flash-experimental', 'LearnLM 2.0 Flash', 'gemini', 'creative'),
      createModel('gemini-robotics-er-1.5-preview', 'Gemini Robotics 1.5', 'gemini', 'creative'),
    ]
  },
  {
    id: 'gemma',
    name: '💎 Gemma 3 Series',
    models: [
      createModel('gemma-3-27b', 'Gemma 3 27B', 'gemini', 'balanced'),
      createModel('gemma-3-12b', 'Gemma 3 12B', 'gemini', 'balanced'),
      createModel('gemma-3-4b', 'Gemma 3 4B', 'gemini', 'fast'),
      createModel('gemma-3-2b', 'Gemma 3 2B', 'gemini', 'fast'),
      createModel('gemma-3-1b', 'Gemma 3 1B', 'gemini', 'fast'),
    ]
  },
  {
    id: 'safety',
    name: '🛡️ Safety & Guardrails',
    models: [
      createModel('meta-llama/llama-guard-4-12b', 'Llama Guard 4', 'groq', 'balanced'),
      createModel('meta-llama/llama-prompt-guard-2-86m', 'Prompt Guard 2 (86M)', 'groq', 'fast'),
      createModel('meta-llama/llama-prompt-guard-2-22m', 'Prompt Guard 2 (22M)', 'groq', 'fast'),
    ]
  },
  {
    id: 'image',
    name: '🎨 Image Generation',
    models: [
      createModel('imagen-3.0-generate-001', 'Imagen 3', 'gemini', 'image'),
      createModel('gemini-2.5-flash', 'Gemini 2.5 Flash (Multimodal)', 'gemini', 'image'),
      createModel('pollinations/turbo', 'Ultra Fast (Turbo)', 'gemini', 'image'),
      createModel('pollinations/flux', 'Fast (FLUX)', 'gemini', 'image'),
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

  // Complex tasks / Research -> High Context & Reasoning
  if (p.includes('search') || p.includes('browse') || p.includes('analyze') || p.includes('summary') || p.length > 500) {
    return 'gemini-2.5-pro'; // 2M Context Window - Best for large tasks
  }

  // Coding & Math -> Deep Reasoning
  if (p.includes('code') || p.includes('math') || p.includes('solve') || p.includes('logic') || p.includes('function')) {
    return 'qwen/qwen3-32b';
  }

  // Creative writing -> Versatile High Quality
  if (p.includes('story') || p.includes('poem') || p.includes('write') || p.includes('email')) {
    return 'llama-3.3-70b-versatile';
  }

  // Default -> High Quality Balanced (instead of mini/fast)
  return 'gemini-2.5-flash';
};