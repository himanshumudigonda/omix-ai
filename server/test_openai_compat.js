import OpenAI from 'openai';

const GEMINI_API_KEY = 'AIzaSyBHbaA2VD8x0eIlVVld1P0IX1wqx_p5JVA';

console.log(`\n🔑 Testing with OpenAI Compatibility Layer...`);

const client = new OpenAI({
    apiKey: GEMINI_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
});

const targetModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-exp"
];

async function testModels() {
    console.log("\n" + "-".repeat(50));
    console.log("🚀 Testing Gemini via OpenAI Compatibility...");
    console.log("-".repeat(50));

    for (const modelName of targetModels) {
        try {
            const completion = await client.chat.completions.create({
                model: modelName,
                messages: [{ role: "user", content: "Hello" }],
            });

            const text = completion.choices[0]?.message?.content;

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
