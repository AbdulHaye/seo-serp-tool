// openaiService.js
const OpenAI = require("openai");
require("dotenv").config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate an embedding for a given text
const generateEmbedding = async (text) => {
  try {
    if (!text || typeof text !== "string") {
      throw new Error("Invalid input: Text is required for embedding");
    }

    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002", // Use a suitable embedding model
      input: text.trim(),
    });

    const embedding = response.data[0].embedding;
    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error.message);
    throw new Error("Failed to generate embedding");
  }
};

// Generate a chat completion response
const generateChatCompletion = async (messages) => {
  try {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("Invalid input: Messages array is required");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4", // Use a suitable chat model (e.g., gpt-4, gpt-3.5-turbo)
      messages,
      max_tokens: 500, // Adjust based on desired response length
      temperature: 0.7, // Adjust for creativity vs. determinism
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating chat completion:", error.message);
    throw new Error("Failed to generate chat completion");
  }
};

// Calculate cosine similarity between two vectors
const cosineSimilarity = (vectorA, vectorB) => {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
    throw new Error("Invalid vectors for cosine similarity");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    throw new Error("Invalid vectors: Norm cannot be zero");
  }

  return dotProduct / (normA * normB);
};

module.exports = {
  generateEmbedding,
  generateChatCompletion,
  cosineSimilarity,
};