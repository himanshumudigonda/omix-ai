import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Groq } from 'groq-sdk';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Keys (Load from environment variables)
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GROQ_API_KEY) console.warn("⚠️ GROQ_API_KEY is missing!");
if (!GEMINI_API_KEY) console.warn("⚠️ GEMINI_API_KEY is missing!");

// Initialize Clients
const groq = new Groq({ apiKey: GROQ_API_KEY });
const gemini = new OpenAI({
    apiKey: GEMINI_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
});

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
            let compoundCustom = undefined;
            let stream = true;

            // 1. Compound Models
            if (model === 'groq/compound' || model === 'groq/compound-mini') {
                headers['Groq-Model-Version'] = 'latest';
                maxTokens = 1024;
                compoundCustom = { "tools": { "enabled_tools": ["web_search", "code_interpreter", "visit_website"] } };
            }
            // 2. GPT-OSS Models
            else if (model.startsWith('openai/gpt-oss')) {
                temp = 1;
                maxTokens = 8192;
                reasoningEffort = "medium";
            }
            // 3. Llama 4 / Guard Models
            else if (model.startsWith('meta-llama/llama-4') || model.startsWith('meta-llama/llama-guard')) {
                maxTokens = 1024;
            }
            // 4. Prompt Guard (Classifiers)
            else if (model.startsWith('meta-llama/llama-prompt-guard')) {
                maxTokens = 1;
                stream = false; // User specified stream=False
            }
            // 5. Qwen
            else if (model === 'qwen/qwen3-32b') {
                temp = 0.6;
                maxTokens = 4096;
                reasoningEffort = "default";
                topP = 0.95;
            }
            // 6. Default Llama
            else if (model.includes('llama')) {
                temp = 0.7;
                maxTokens = 8192;
            }
            // Gemini via OpenAI Compatibility Layer
            const aiModel = model === 'auto' ? 'gemini-2.5-flash' : model;

            try {
                const stream = await gemini.chat.completions.create({
                    model: aiModel,
                    messages: messages,
                    stream: true,
                });

                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        res.write(`data: ${JSON.stringify({ content })}\n\n`);
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

    // For Gemini image generation, we'd need a different endpoint
    // For now, just return error
    res.status(501).json({ error: 'Gemini image generation not yet implemented with OpenAI compatibility layer' });
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
