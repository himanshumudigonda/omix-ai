import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Groq } from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Keys (Load from environment variables)
const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBhTEPYOuNmx-SXbcXsnUSY1-M21jWKZgA';

// Initialize Clients
const groq = new Groq({ apiKey: GROQ_API_KEY });
const gemini = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// --- Routes ---

// 1. Chat Completion (Streamed)
app.post('/api/chat', async (req, res) => {
    const { model, messages, temperature, max_tokens, top_p, provider } = req.body;

    try {
        if (provider === 'groq') {

            // --- Model Specific Configuration ---
            let temp = temperature || 1;
            let maxTokens = max_tokens || 1024;
            let reasoningEffort = undefined;
            let topP = top_p || 1;
            let headers = {};

            // 1. Compound Models
            if (model === 'groq/compound' || model === 'groq/compound-mini') {
                headers['Groq-Model-Version'] = 'latest';
                // Note: Compound tools handling would need more backend logic, 
                // for now we stick to basic chat or need to pass tools param.
                // Keeping it simple for this migration.
                maxTokens = 1024;
            }
            // 2. Qwen Reasoning
            else if (model === 'qwen/qwen3-32b') {
                temp = 0.6;
                maxTokens = 4096;
                reasoningEffort = "default";
                topP = 0.95;
            }
            // 3. GPT-OSS
            else if (model.startsWith('openai/gpt-oss')) {
                temp = 1;
                maxTokens = 8192;
                reasoningEffort = "medium";
            }
            // 4. Kimi / Allam
            else if (model.includes('kimi') || model.includes('allam')) {
                temp = 0.6;
                maxTokens = 4096;
            }
            // 5. Llama 4 / Default
            else {
                temp = 1;
                maxTokens = 1024;
            }

            const completion = await groq.chat.completions.create({
                messages,
                model,
                temperature: temp,
                max_completion_tokens: maxTokens,
                top_p: topP,
                reasoning_effort: reasoningEffort,
                stream: true,
            }, { headers });

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            for await (const chunk of completion) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
            }
            res.write('data: [DONE]\n\n');
            res.end();

        } else if (provider === 'gemini') {
            // Gemini Logic
            // Note: The @google/genai SDK usage might differ slightly server-side vs client-side
            // For simplicity, we'll use the same structure if possible, or adapt.
            // Since the user was using the new @google/genai SDK, let's stick to it.

            const aiModel = model === 'auto' ? 'gemini-2.5-flash' : model;
            const chat = gemini.chats.create({
                model: aiModel,
                history: messages.slice(0, -1).map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                })),
                config: {
                    systemInstruction: "You are Omix AI. Format responses beautifully in Markdown.",
                }
            });

            const lastMessage = messages[messages.length - 1].content;
            const result = await chat.sendMessageStream({ message: lastMessage });

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            for await (const chunk of result) {
                if (chunk.text) {
                    res.write(`data: ${JSON.stringify({ content: chunk.text })}\n\n`);
                }
            }
            res.write('data: [DONE]\n\n');
            res.end();
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

// 2. Image Generation
app.post('/api/image', async (req, res) => {
    const { prompt, model } = req.body;

    // Pollinations (No Key Needed)
    if (model.startsWith('pollinations/')) {
        const modelName = model.split('/')[1];
        const seed = Math.floor(Math.random() * 10000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${modelName}&width=1024&height=1024&nologo=true&seed=${seed}`;
        return res.json({ imageUrl });
    }

    // Gemini / Imagen
    try {
        const response = await gemini.models.generateContent({
            model: model || 'imagen-3.0-generate-001',
            contents: { parts: [{ text: prompt }] },
        });

        let imageUrl;
        let textOutput;

        if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                } else if (part.text) {
                    textOutput = part.text;
                }
            }
        }

        res.json({ imageUrl, text: textOutput });

    } catch (error) {
        console.error('Image Gen Error:', error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

// Serve Static Files (Production)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));

    app.get('/(.*)', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
