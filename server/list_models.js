import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('No API key found');
    process.exit(1);
}

const genai = new GoogleGenAI({ apiKey });

async function listModels() {
    console.log('Fetching available models...');
    try {
        // The SDK structure for listing models might vary. 
        // Trying the standard list() method if available on the models namespace
        // or falling back to a raw request if needed.

        // Note: @google/genai v0.x/1.x might use different patterns.
        // If genai.models.list is not a function, we might need to check the docs or prototype.

        const response = await genai.models.list();

        if (response && response.models) {
            console.log('\nAvailable Models:');
            response.models.forEach(model => {
                console.log(`- ${model.name} (${model.displayName})`);
                console.log(`  Description: ${model.description}`);
                console.log(`  Supported Generation Methods: ${model.supportedGenerationMethods.join(', ')}`);
                console.log('---');
            });
        } else {
            console.log('No models found or unexpected response structure:', response);
        }
    } catch (error) {
        console.error('Error listing models:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Full Error:', error);
        }
    }
}

listModels();
