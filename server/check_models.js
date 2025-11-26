import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// --- Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env or .env.local
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// API Key Strategy: Env Var Only
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBHbaA2VD8x0eIlVVld1P0IX1wqx_p5JVA';

console.log(`\n🔑 Using API Key: ${GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 10) + '...' : 'NONE'}`);

const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// List of models to test
const targetModels = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-2.0-flash-exp",
    "gemini-2.5-flash",
    "gemini-2.5-pro"
];

async function accessModels() {
    const logStream = fs.createWriteStream(path.join(__dirname, '../check_results.txt'));
    const log = (msg) => {
        console.log(msg);
        logStream.write(msg + '\n');
    };

    log("\n" + "-".repeat(50));
    log("🚀 Attempting to initialize and test models...");
    log("-".repeat(50));

    for (const modelName of targetModels) {
        try {
            // Attempt to generate simple content to verify access
            let response;
            if (modelName.includes('gemini')) {
                response = await genai.models.generateContent({
                    model: modelName,
                    contents: [{ parts: [{ text: "Hi" }] }]
                });
            } else {
                const { Groq } = await import('groq-sdk');
                const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
                const completion = await groq.chat.completions.create({
                    messages: [{ role: "user", content: "Hi" }],
                    model: modelName,
                });
                response = { text: completion.choices[0]?.message?.content };
            }

            if (response && response.text) {
                log(`✅ ${modelName.padEnd(35)} : Working`);
            } else {
                log(`❓ ${modelName.padEnd(35)} : Empty Response (Access OK)`);
            }

        } catch (error) {
            let status = "Error";
            if (error.response) {
                status = `${error.response.status} ${error.response.statusText || ''}`;
            } else if (error.message && error.message.includes('404')) {
                status = "404 Not Found";
            } else if (error.message && error.message.includes('403')) {
                status = "403 Permission Denied";
            } else if (error.message && error.message.includes('400')) {
                status = "400 Bad Request";
            }

            log(`❌ ${modelName.padEnd(35)} : ${status}`);
            if (modelName.includes('exp')) {
                log(`   Full Error: ${error.message}`);
            }
        }
    }
    log("-".repeat(50) + "\n");
    logStream.end();
}

accessModels();
