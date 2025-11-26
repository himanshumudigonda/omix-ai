import OpenAI from 'openai';

const GEMINI_API_KEY = 'AIzaSyBHbaA2VD8x0eIlVVld1P0IX1wqx_p5JVA';

const client = new OpenAI({
    apiKey: GEMINI_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
});

const testModels = [
    // Gemma 3 Series
    "gemma-3-27b-it",
    "gemma-3-12b-it",
    "gemma-3-4b-it",
    "gemma-3-1b-it",

    // Live Models
    "gemini-2.5-flash-live",
    "gemini-2.0-flash-live",
];

async function runTests() {
    console.log("\n" + "=".repeat(60));
    console.log("🧪 Testing Gemma 3 & Live Models...");
    console.log("=".repeat(60));

    for (const modelName of testModels) {
        try {
            const completion = await client.chat.completions.create({
                model: modelName,
                messages: [{ role: "user", content: "Hi" }],
            });

            const text = completion.choices[0]?.message?.content;

            if (text) {
                console.log(`✅ ${modelName.padEnd(30)} : WORKING`);
            } else {
                console.log(`❓ ${modelName.padEnd(30)} : Empty response`);
            }
        } catch (error) {
            let status = "Error";
            if (error.message) {
                if (error.message.includes('404')) status = "404 Not Found (Deprecated/Unavailable)";
                else if (error.message.includes('403')) status = "403 Permission Denied";
                else if (error.message.includes('400')) status = "400 Bad Request";
                else status = error.message.substring(0, 50);
            }
            console.log(`❌ ${modelName.padEnd(30)} : ${status}`);
        }
    }
    console.log("=".repeat(60) + "\n");
}

runTests();
