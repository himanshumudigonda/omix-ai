import { streamTextResponse } from './geminiService';
import { streamGroqResponse } from './groqService';
import { MODELS, getBestModelForPrompt } from '../lib/models';

export async function* generateSmartResponse(
  selectedModelId: string,
  prompt: string,
  history: any[]
): AsyncGenerator<{ text: string, model: string }, void, unknown> {
  
  let targetModelId = selectedModelId;
  
  if (targetModelId === 'auto') {
    targetModelId = getBestModelForPrompt(prompt);
  }

  // Find provider
  let modelDef = MODELS.find(m => m.id === targetModelId) || MODELS[2]; // Default to gemini-2.5-flash

  try {
    const stream = modelDef.provider === 'gemini' 
      ? streamTextResponse(targetModelId, prompt, history)
      : streamGroqResponse(targetModelId, prompt, history);

    for await (const chunk of stream) {
      yield { text: chunk, model: modelDef.name };
    }

  } catch (error) {
    console.warn(`Primary model ${targetModelId} failed, switching to backup...`, error);
    
    // Fallback Logic
    const backupModelId = modelDef.provider === 'gemini' ? 'llama-3.3-70b-versatile' : 'gemini-2.0-flash';
    const backupDef = MODELS.find(m => m.id === backupModelId)!;
    
    yield { text: `\n\n*[System: Primary model busy. Switching to ${backupDef.name}...]*\n\n`, model: backupDef.name };

    try {
        const backupStream = backupDef.provider === 'gemini'
            ? streamTextResponse(backupModelId, prompt, history)
            : streamGroqResponse(backupModelId, prompt, history);

        for await (const chunk of backupStream) {
            yield { text: chunk, model: backupDef.name };
        }
    } catch (finalError) {
        yield { text: "\n\n[System Error: All AI nodes are currently overloaded. Please try again in a moment.]", model: 'System' };
    }
  }
}
