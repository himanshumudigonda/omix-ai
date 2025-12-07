import { API_ENDPOINTS } from '../lib/api';

export async function* streamTextResponse(
  modelId: string,
  prompt: string,
  history: { role: string; parts: { text: string }[] }[] = []
): AsyncGenerator<string, void, unknown> {

  // Format messages for backend
  const messages = history.map(h => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.parts[0].text
  }));
  messages.push({ role: 'user', content: prompt });

  try {
    const response = await fetch(API_ENDPOINTS.chat, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'gemini',
        model: modelId,
        messages: messages
      })
    });

    if (!response.ok) throw new Error(`Backend Error: ${response.status}`);

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error("No response body");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) yield data.content;
          } catch (e) { }
        }
      }
    }
  } catch (error) {
    console.error("Gemini Stream Error:", error);
    throw error;
  }
}

export interface ImageGenerationResult {
  imageUrl?: string;
  text?: string;
}

export const generateImageResponse = async (prompt: string, modelId: string = 'imagen-3.0-generate-001'): Promise<ImageGenerationResult> => {

  // Handle Pollinations AI Models (Unlimited / No Key)
  if (modelId.startsWith('pollinations/')) {
    const modelName = modelId.split('/')[1]; // turbo, flux, etc.
    const seed = Math.floor(Math.random() * 10000000);
    const width = 1024;
    const height = 1024;

    // Construct URL
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${modelName}&width=${width}&height=${height}&nologo=true&seed=${seed}`;

    // We return the URL directly. The frontend will render it.
    // Note: Pollinations generates on-the-fly when the URL is requested.
    return { imageUrl };
  }

  try {
    const response = await fetch(API_ENDPOINTS.image, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: modelId })
    });

    if (!response.ok) throw new Error("Backend Image Error");
    return await response.json();

  } catch (error) {
    console.error("Gemini Image Error:", error);
    throw error;
  }
};
