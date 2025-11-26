import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = 'AIzaSyDgd6vyRrBZRe3gK0vuKlXcRlluasIQKeM';

console.log(`\n🔑 Testing API Key: ${GEMINI_API_KEY.substring(0, 10)}...`);

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const targetModels = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro"
];

async function testModels() {
    console.log("\n" + "-".repeat(50));
    console.log("🚀 Testing models with proper formatting...");
    console.log("-".repeat(50));

    for (const modelName of targetModels) {
        try {
            // Create model instance
            const model = genAI.getGenerativeModel({ model: modelName });

            // Send a simple, clean message (no history, no system prompts)
            const result = await model.generateContent("Hello");
            const response = await result.response;
            const text = response.text();

            if (text) {
                console.log(`✅ ${modelName.padEnd(25)} : Working! Response: "${text.substring(0, 40)}..."`);
            } else {
                console.log(`❓ ${modelName.padEnd(25)} : Empty response`);
            }
        } catch (error) {
            let status = "Error";
            if (error.message) {
                if (error.message.includes('404')) status = "404 Not Found";
                else if (error.message.includes('403')) status = "403 Permission Denied";
                else if (error.message.includes('400')) status = "400 Bad Request";
                else status = error.message.substring(0, 60);
            }
            console.log(`❌ ${modelName.padEnd(25)} : ${status}`);
        }
    }
    console.log("-".repeat(50) + "\n");
}

testModels();
