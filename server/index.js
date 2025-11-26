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
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GROQ_API_KEY) console.warn("⚠️ GROQ_API_KEY is missing!");
if (!GEMINI_API_KEY) console.warn("⚠️ GEMINI_API_KEY is missing!");

// Initialize Clients
const groq = new Groq({ apiKey: GROQ_API_KEY });
const gemini = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// --- Routes ---

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: {
            groqKeySet: !!process.env.GROQ_API_KEY,
            geminiKeySet: !!process.env.GEMINI_API_KEY,
            nodeEnv: process.env.NODE_ENV
        }
    });
});

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
            // 5. Llama Models (3.3, 3.1)
            else if (model.includes('llama')) {
                temp = 0.7;
                maxTokens = 8192;
            }
            // 6. Mixtral
            else if (model.includes('mixtral')) {
                temp = 0.6;
                maxTokens = 4096;
            }
            // 7. Gemma 2
            else if (model.includes('gemma')) {
                temp = 0.7;
                maxTokens = 8192;
            }
            // 8. Default
            else {
                temp = 1;
                maxTokens = 1024;
            }

            const targetModel = model === 'auto' ? 'llama-3.3-70b-versatile' : model;

            const completion = await groq.chat.completions.create({
                messages,
                model: targetModel,
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
            // Gemini - Using generateContentStream (correct SDK method)
            // Defaulting to gemini-2.5-flash as it is the standard high-capacity model
            const aiModel = model === 'auto' ? 'gemini-1.5-flash' : model;

            // Build conversation from history
            let conversationText = "You are Omix AI. Format responses beautifully in Markdown.\n\n";
            conversationText += messages.map(m =>
                `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
            ).join('\n\n');

            try {
                const result = await gemini.models.generateContentStream({
                    model: aiModel,
                    contents: [{ parts: [{ text: conversationText }] }]
                });

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
            } catch (geminiError) {
                console.error('Gemini Error:', geminiError);
                res.status(500).json({ error: 'Gemini failed', details: geminiError.message });
            }
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

    // Serve index.html for all other routes (SPA fallback)
    app.use((req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
