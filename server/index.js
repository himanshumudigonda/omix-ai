import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Groq } from 'groq-sdk';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

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

// Create HTTP Server
const server = http.createServer(app);

// WebSocket Server for Gemini Live
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Client connected to Live WebSocket');

    const geminiWs = new WebSocket(
        `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`
    );

    geminiWs.on('open', () => {
        console.log('Connected to Gemini Live API');
    });

    geminiWs.on('message', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    });

    geminiWs.on('error', (error) => {
        console.error('Gemini WebSocket Error:', error);
        ws.close();
    });

    geminiWs.on('close', () => {
        console.log('Gemini WebSocket closed');
        ws.close();
    });

    ws.on('message', (data) => {
        if (geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.send(data);
        }
    });

    ws.on('close', () => {
        console.log('Client WebSocket closed');
        geminiWs.close();
    });
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

    // Define model fallback chains for each category
    const fallbackChains = {
        'auto': ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
        'gemini': ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemma-3-27b', 'gemma-3-12b', 'gemma-3-4b', 'gemma-3-1b'],
        'openai': ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'openai/gpt-oss-safeguard-20b'],
        'meta': ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'meta-llama/llama-4-maverick-17b-128e-instruct', 'meta-llama/llama-4-scout-17b-16e-instruct'],
        'moonshot': ['moonshotai/kimi-k2-instruct', 'moonshotai/kimi-k2-instruct-0905']
    };

    // Helper to determine provider
    const getProvider = (modelId) => {
        if (modelId.startsWith('gemini') || modelId.startsWith('gemma-')) {
            return 'gemini';
        }
        return 'groq';
    };

    // Helper to execute a single model request
    const executeModel = async (targetModel, isRetry = false) => {
        const finalProvider = getProvider(targetModel);
        console.log(`${isRetry ? '🔄 Retrying' : '🚀 Executing'}: ${targetModel} via ${finalProvider}`);

        if (finalProvider === 'groq') {
            const params = {
                messages,
                model: targetModel,
                temperature: temperature || 0.7,
                max_completion_tokens: max_tokens || 4096,
                top_p: top_p || 1,
                stream: true
            };

            return await groq.chat.completions.create(params);
        } else {
            return await gemini.chat.completions.create({
                model: targetModel,
                messages: messages,
                stream: true,
            });
        }
    };

    try {
        let targetModel = model;
        let fallbackList = [];

        // If user selected a category (auto, gemini, etc.), get the fallback chain
        if (fallbackChains[model]) {
            fallbackList = [...fallbackChains[model]];
            targetModel = fallbackList.shift(); // Start with the first model
        } else {
            // User selected a specific model, create fallback based on its provider
            const modelProvider = getProvider(model);
            if (modelProvider === 'gemini') {
                fallbackList = fallbackChains['gemini'].filter(m => m !== model);
            } else {
                fallbackList = fallbackChains['auto'].filter(m => m !== model);
            }
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let success = false;
        let lastError = null;

        // Try the target model, then fallbacks
        const modelsToTry = [targetModel, ...fallbackList];
        
        for (const currentModel of modelsToTry) {
            try {
                const completion = await executeModel(currentModel, currentModel !== targetModel);

                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        res.write(`data: ${JSON.stringify({ content, model: currentModel })}\n\n`);
                    }
                }
                
                success = true;
                break; // Success, exit the loop

            } catch (modelError) {
                console.error(`❌ Model ${currentModel} failed:`, modelError.message);
                lastError = modelError;
                // Continue to next model in fallback chain
            }
        }

        if (!success) {
            res.write(`data: ${JSON.stringify({ content: "All models are currently unavailable. Please try again later." })}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('API Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate response' });
        } else {
            res.write(`data: ${JSON.stringify({ content: "Error occurred. Please try again." })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
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

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
