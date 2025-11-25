import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading .env
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

// Try loading .env.local
const envLocalPath = path.join(__dirname, '../.env.local');
dotenv.config({ path: envLocalPath });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not found in environment variables.");
    process.exit(1);
}

console.log(`Using API Key: ${GEMINI_API_KEY.substring(0, 10)}...`);

const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const targetModels = [
    "gemma-3-1b-it",
    "gemma-3-4b-it",
    "gemma-3-12b-it",
    "gemma-3-27b-it"
];

async function testModels() {
    console.log("-".repeat(40));
    console.log("Testing Models with @google/genai SDK");
    console.log("-".repeat(40));

    for (const modelName of targetModels) {
        try {
            const response = await genai.models.generateContent({
                model: modelName,
                contents: [{ parts: [{ text: "Hello, are you working?" }] }]
            });

            if (response && response.text) {
                console.log(`✅ ${modelName}: Working`);
            } else {
                console.log(`❓ ${modelName}: No text returned`);
            }

        } catch (error) {
            console.log(`❌ ${modelName}: Error`);
            console.log(`   Message: ${error.message}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Data: ${JSON.stringify(error.response.data)}`);
            }
        }
    }
}

testModels();
