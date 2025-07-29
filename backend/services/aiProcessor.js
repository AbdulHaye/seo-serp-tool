const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const generateSearchInsights = async (searchData) => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4", 
            messages: [
                {
                    role: "system",
                    content: "You are an AI specialized in search engine visibility analysis. Analyze the provided search results data and identify trends, strengths, weaknesses, and opportunities."
                },
                {
                    role: "user",
                    content: `Analyze the following search data:\n\n${JSON.stringify(searchData, null, 2)}`
                }
            ],
            max_tokens: 700,
            temperature: 0.7
        });

        return response.choices[0]?.message?.content || "No insights available.";
    } catch (error) {
        console.error("Error generating AI search insights:", error.response?.data?.error?.message || error.message);
        throw new Error("Failed to generate AI insights");
    }
};

module.exports = { generateSearchInsights };
