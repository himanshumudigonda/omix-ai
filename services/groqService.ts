import { GROQ_API_KEY } from '../lib/models';

export async function* streamGroqResponse(
  modelId: string,
  prompt: string,
  history: any[]
): AsyncGenerator<string, void, unknown> {

  // Format messages
  const messages = history.map(h => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.parts[0].text
  }));
  messages.push({ role: 'user', content: prompt });

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'groq',
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
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) yield data.content;
          } catch (e) { }
        }
      }
    }
  } catch (error) {
    console.error("Groq Stream Error:", error);
    throw error;
  }
}