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
            // --- Groq Logic ---
            let targetModel = model;
            let temp = temperature || 0.7;
            let maxTokens = max_tokens || 1024;
            let stream = true;
            let compoundCustom = undefined;

            // 1. Simplified Category Routing (Deterministic)
            // We map categories directly to the best available model to avoid "router" latency/failure.
            if (model === 'auto') {
                targetModel = 'llama-3.3-70b-versatile'; // Best all-rounder
                maxTokens = 4096;
            } else if (model === 'openai') {
                targetModel = 'openai/gpt-oss-120b'; // Best OpenAI-like
                maxTokens = 4096;
            } else if (model === 'meta') {
                targetModel = 'llama-3.3-70b-versatile'; // Best Meta
                maxTokens = 4096;
            } else if (model === 'groq/compound' || model === 'groq/compound-mini') {
                // Web Search / Tools
                targetModel = model;
                compoundCustom = { "tools": { "enabled_tools": ["web_search", "code_interpreter", "visit_website"] } };
            }

            // 2. Model Specific Config
            if (targetModel.startsWith('meta-llama/llama-prompt-guard')) {
                maxTokens = 1;
                stream = false;
            }

            console.log(`🚀 Groq Request: ${targetModel} (Original: ${model})`);

            const params = {
                messages,
                model: targetModel,
                temperature: temp,
                max_completion_tokens: maxTokens,
                top_p: top_p || 1,
                stream: stream
            };
            if (compoundCustom) params.compound_custom = compoundCustom;

            try {
                const completion = await groq.chat.completions.create(params);

                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                if (stream) {
                    for await (const chunk of completion) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        if (content) {
                            res.write(`data: ${JSON.stringify({ content, model: targetModel })}\n\n`);
                        }
                    }
                } else {
                    const content = completion.choices[0]?.message?.content || JSON.stringify(completion.choices[0]?.message);
                    res.write(`data: ${JSON.stringify({ content, model: targetModel })}\n\n`);
                }
                res.write('data: [DONE]\n\n');
                res.end();

            } catch (groqError) {
                console.error(`Groq Error (${targetModel}):`, groqError.message);

                // Simple Fallback if primary fails
                if (targetModel !== 'llama-3.1-8b-instant') {
                    console.log("🔄 Fallback to llama-3.1-8b-instant...");
                    try {
                        const fallbackCompletion = await groq.chat.completions.create({
                            messages,
                            model: 'llama-3.1-8b-instant',
                            temperature: 0.7,
                            max_completion_tokens: 1024,
                            stream: true
                        });

                        res.setHeader('Content-Type', 'text/event-stream');
                        for await (const chunk of fallbackCompletion) {
                            const content = chunk.choices[0]?.delta?.content || '';
                            if (content) {
                                res.write(`data: ${JSON.stringify({ content, model: 'llama-3.1-8b-instant' })}\n\n`);
                            }
                        }
                        res.write('data: [DONE]\n\n');
                        res.end();
                    } catch (fallbackError) {
                        console.error("Fallback failed:", fallbackError);
                        res.write(`data: ${JSON.stringify({ content: "Error: AI service temporarily unavailable." })}\n\n`);
                        res.write('data: [DONE]\n\n');
                        res.end();
                    }
                } else {
                    res.write(`data: ${JSON.stringify({ content: "Error: AI service temporarily unavailable." })}\n\n`);
                    res.write('data: [DONE]\n\n');
                    res.end();
                }
            }

        } else if (provider === 'gemini') {
            // --- Gemini Logic ---
            let targetModel = model;
            if (model === 'gemini' || model === 'auto') {
                targetModel = 'gemini-2.5-flash';
            }

            console.log(`✨ Gemini Request: ${targetModel}`);

            try {
                const stream = await gemini.chat.completions.create({
                    model: targetModel,
                    messages: messages,
                    stream: true,
                });

                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        res.write(`data: ${JSON.stringify({ content, model: targetModel })}\n\n`);
                    }
                }
                res.write('data: [DONE]\n\n');
                res.end();
            } catch (geminiError) {
                console.error('Gemini Error:', geminiError);
                res.status(500).json({ error: 'Gemini failed', details: geminiError.message });
            }
        } else {
            res.status(400).json({ error: 'Invalid provider' });
        }
    } catch (error) {
        console.error('API Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate response' });
        }
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

    res.status(501).json({ error: 'Image generation not implemented for this provider' });
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
