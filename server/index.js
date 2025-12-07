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
        let targetModel = model;
        let finalProvider = provider;

        // --- 1. Smart Router Logic (Compound Mini) ---
        // If the user selected a category, we ask compound-mini to pick the best model.
        if (['auto', 'gemini', 'openai', 'meta'].includes(model)) {
            console.log(`🔄 Smart Router: Analyzing request for category '${model}'...`);

            try {
                const modelPools = {
                    'auto': ['gemma-2-9b-it', 'llama-3.3-70b-versatile'],
                    'gemini': ['gemini-3-pro-preview', 'gemini-2.5-flash', 'gemma-2-9b-it'],
                    'openai': ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
                    'meta': ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
                };

                const pool = modelPools[model] || modelPools['auto'];

                let systemPrompt = `
                    You are the Model Router.
                    User Category: '${model}'.
                    User Request: "${messages[messages.length - 1].content.substring(0, 300)}..."
                    
                    Available Models: ${pool.join(', ')}
                    
                    Task: Pick the SINGLE BEST model ID from the list.
                    Rules:
                    - For 'auto' category:
                        - PREFER 'gemma-2-9b-it' for normal conversation, simple queries, and basic code.
                        - PREFER 'llama-3.3-70b-versatile' ONLY for complex coding tasks, advanced logic, or "more code".
                    - For 'gemini' category: PREFER 'gemini-3-pro-preview' for complex reasoning, 'gemini-2.5-flash' for speed.
                    
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
                if (model === 'gemini') targetModel = 'gemma-2-9b-it';
                else if (model === 'openai') targetModel = 'openai/gpt-oss-120b';
                else if (model === 'meta') targetModel = 'llama-3.3-70b-versatile';
                else targetModel = 'llama-3.3-70b-versatile'; // Auto fallback
            }
        }

        // --- 2. Determine Provider based on Target Model ---
        // CRITICAL: Ensure correct provider mapping
        if (targetModel.startsWith('gemini')) {
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

            if (targetModel === 'groq/compound' || targetModel === 'groq/compound-mini') {
                compoundCustom = { "tools": { "enabled_tools": ["web_search", "code_interpreter", "visit_website"] } };
            }
            // High spec models
            if (targetModel.includes('70b') || targetModel.includes('120b') || targetModel.includes('gpt-oss')) {
                maxTokens = 4096;
            }

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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
