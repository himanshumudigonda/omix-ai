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

    try {
        let targetModel = model;
        let finalProvider = provider;

        // --- 1. Smart Router Logic ---
        // If the user selected a category, we ask a fast model to pick the best model.
        if (['auto', 'gemini', 'openai', 'meta', 'moonshot'].includes(model)) {
            console.log(`🔄 Smart Router: Analyzing request for category '${model}'...`);

            try {
                const modelPools = {
                    'auto': ['groq/compound', 'groq/compound-mini'],
                    'gemini': ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemma-3-27b', 'gemma-3-12b', 'gemma-3-4b'],
                    'openai': ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'openai/gpt-oss-safeguard-20b'],
                    'meta': ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'meta-llama/llama-4-maverick-17b-128e-instruct', 'meta-llama/llama-4-scout-17b-16e-instruct'],
                    'moonshot': ['moonshotai/kimi-k2-instruct', 'moonshotai/kimi-k2-instruct-0905']
                };

                const pool = modelPools[model] || modelPools['auto'];

                let systemPrompt = `
                    You are the Model Router.
                    User Category: '${model}'.
                    User Request: "${messages[messages.length - 1].content.substring(0, 300)}..."
                    
                    Available Models: ${pool.join(', ')}
                    
                    Task: Pick the SINGLE BEST model ID from the list.
                    Rules:
                    - For 'auto' category: PREFER 'groq/compound' for complex tasks, 'groq/compound-mini' for speed.
                    - For 'gemini' category: PREFER 'gemini-2.5-flash' for complex reasoning.
                    - For 'meta' category: PREFER 'llama-3.3-70b-versatile' for complex tasks.
                    
                    Return ONLY the model ID.
                `;

                const routerCompletion = await groq.chat.completions.create({
                    messages: [{ role: "system", content: systemPrompt }],
                    model: 'llama-3.1-8b-instant', // Using a fast, real model for routing
                    temperature: 0.1,
                    max_completion_tokens: 20,
                });

                let suggestedModel = routerCompletion.choices[0]?.message?.content?.trim();
                suggestedModel = suggestedModel?.replace(/['"]/g, '');

                if (suggestedModel && pool.includes(suggestedModel)) {
                    console.log(`👉 Router Selected: ${suggestedModel}`);
                    targetModel = suggestedModel;
                } else {
                    console.warn(`⚠️ Router returned invalid/empty model: '${suggestedModel}'. Using default.`);
                    throw new Error("Invalid router selection");
                }

            } catch (routerError) {
                console.error("❌ Router Failed (using fallback):", routerError.message);
                // Guaranteed Fallbacks
                if (model === 'gemini') targetModel = 'gemini-2.5-flash';
                else if (model === 'openai') targetModel = 'openai/gpt-oss-120b';
                else if (model === 'meta') targetModel = 'llama-3.3-70b-versatile';
                else if (model === 'moonshot') targetModel = 'moonshotai/kimi-k2-instruct';
                else targetModel = 'groq/compound-mini'; // Auto fallback
            }
        }

        // --- 2. Determine Provider based on Target Model ---
        // CRITICAL: Ensure correct provider mapping
        // Gemini/Gemma models from Google go to 'gemini' provider
        if (targetModel.startsWith('gemini') || targetModel.startsWith('gemma-')) {
            finalProvider = 'gemini';
        } else {
            finalProvider = 'groq';
        }

        // --- 3. Execute Request ---
        if (finalProvider === 'groq') {
            // --- Groq Execution ---
            let temp = temperature || 0.7;
            let maxTokens = max_tokens || 1024;
            let stream = true;
            let compoundCustom = undefined;
            let extraHeaders = {};

            // Special handling for Compound models
            if (targetModel === 'groq/compound' || targetModel === 'groq/compound-mini') {
                compoundCustom = { "tools": { "enabled_tools": ["web_search", "code_interpreter", "visit_website"] } };
                extraHeaders = { "Groq-Model-Version": "latest" };
                temp = 1;
            }
            
            // High spec models / Reasoning models
            if (targetModel.includes('70b') || targetModel.includes('120b') || targetModel.includes('gpt-oss') || targetModel.includes('kimi') || targetModel.includes('maverick')) {
                maxTokens = 8192; // Increased for larger models
            }

            const params = {
                messages,
                model: targetModel,
                temperature: temp,
                max_completion_tokens: maxTokens,
                top_p: top_p || 1,
                stream: stream
            };
            
            // Add compound_custom if applicable
            if (compoundCustom) {
                params.compound_custom = compoundCustom;
            }

            try {
                const completion = await groq.chat.completions.create(params, { headers: extraHeaders });

                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        res.write(`data: ${JSON.stringify({ content, model: targetModel })}\n\n`);
                    }
                }
                res.write('data: [DONE]\n\n');
                res.end();

            } catch (groqError) {
                console.error(`Groq Execution Error (${targetModel}):`, groqError.message);
                res.write(`data: ${JSON.stringify({ content: "Error: Failed to generate response. Please try again." })}\n\n`);
                res.write('data: [DONE]\n\n');
                res.end();
            }

        } else if (finalProvider === 'gemini') {
            // --- Gemini Execution ---
            console.log(`✨ Executing via Gemini: ${targetModel}`);
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
                console.error('Gemini Execution Error:', geminiError);
                res.status(500).json({ error: 'Gemini failed', details: geminiError.message });
            }
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

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
