const SearchResult = require("../models/searchResult");
const { generateEmbedding, generateChatCompletion, cosineSimilarity } = require("../services/openaiService");

// Helper function to extract keywords from the user query
const extractKeywords = (message) => {
  const words = message.toLowerCase().split(/\W+/).filter(word => word.length > 2); // Simple keyword extraction
  return words;
};

// Helper function to detect greetings with robust matching
const isGreeting = (message) => {
  const greetings = ["hello", "hi", "hey", "greetings", "howdy", "yo"];
  const messageLower = message.toLowerCase().trim();
  console.log("Checking for greeting in message:", messageLower); // Debug log
  const words = messageLower.split(/\W+/); // Split into words
  const isGreetingMatch = words.some(word => greetings.includes(word));
  console.log("Words in message:", words); // Debug log
  console.log("Is greeting:", isGreetingMatch); // Debug log
  return isGreetingMatch;
};

// Helper function to handle conversational inputs (non-search, non-greeting)
const handleConversationalInput = (message) => {
  const conversationalPatterns = [
    { pattern: /\b(how are you|how're you)\b/i, response: "I'm doing great, thanks for asking! How can I help you with your search data today?" },
    { pattern: /\b(what can you do|what do you do)\b/i, response: "I can help you analyze search result data! Just ask me about a topic or keyword, like 'top coffee shops in New York'." },
    { pattern: /\b(bye|goodbye|see you)\b/i, response: "Goodbye! Feel free to come back if you need help with search data!" },
  ];
  const messageLower = message.toLowerCase().trim();
  const match = conversationalPatterns.find(pattern => pattern.pattern.test(messageLower));
  return match ? match.response : null;
};

// Helper function to determine if the query is likely search-related
const isSearchRelated = (message) => {
  const searchIndicators = ["what", "top", "best", "in", "for", "results", "search", "find", "where", "list"];
  const messageLower = message.toLowerCase().trim();
  const hasSearchIndicator = searchIndicators.some(indicator => messageLower.includes(indicator));
  const hasQuestionMark = messageLower.includes("?");
  console.log("Is search-related query:", hasSearchIndicator || hasQuestionMark); // Debug log
  return hasSearchIndicator || hasQuestionMark;
};

// Handle chat requests
const handleChatRequest = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  console.log("Received message:", message); // Debug log

  try {
    // Step 1: Check if the message is a greeting
    if (isGreeting(message)) {
      const greetingResponse = "Hello! How can I assist you today? I can help you analyze search result data—just ask me about a topic or keyword!";
      console.log("Returning greeting response:", greetingResponse); // Debug log
      return res.json({ response: greetingResponse });
    }

    // Step 2: Check for other conversational inputs
    const conversationalResponse = handleConversationalInput(message);
    if (conversationalResponse) {
      console.log("Returning conversational response:", conversationalResponse); // Debug log
      return res.json({ response: conversationalResponse });
    }

    // Step 3: Check if the message is likely a search-related query
    if (!isSearchRelated(message)) {
      const clarificationResponse = "I’m not sure what you mean. Could you ask about a specific topic or keyword, like 'top coffee shops in New York'?";
      console.log("Returning clarification response:", clarificationResponse); // Debug log
      return res.json({ response: clarificationResponse });
    }

    // Step 4: If it's a search-related query, proceed with search result analysis
    // Extract keywords from the user query for pre-filtering
    const queryKeywords = extractKeywords(message);

    // Step 5: Fetch search results from the database, pre-filtering by keywords
    const searchResults = await SearchResult.find({
      $or: [
        { keyword: { $regex: queryKeywords.join("|"), $options: "i" } }, // Match any keyword in the query
        { "results.google_desktop.title": { $regex: queryKeywords.join("|"), $options: "i" } },
        { "results.google_desktop.meta_description": { $regex: queryKeywords.join("|"), $options: "i" } },
        { "results.google_maps.title": { $regex: queryKeywords.join("|"), $options: "i" } },
        { "results.google_maps.description": { $regex: queryKeywords.join("|"), $options: "i" } },
        { "results.bing.title": { $regex: queryKeywords.join("|"), $options: "i" } },
        { "results.bing.meta_description": { $regex: queryKeywords.join("|"), $options: "i" } },
        { "results.perplexity.title": { $regex: queryKeywords.join("|"), $options: "i" } },
        { "results.perplexity.description": { $regex: queryKeywords.join("|"), $options: "i" } },
      ],
    })
      .sort({ createdAt: -1 }) // Sort by most recent
      .limit(50); // Limit to 50 results for performance

    if (!searchResults.length) {
      return res.status(404).json({ error: "No relevant search result data found for your query." });
    }

    // Step 6: Prepare search result data for vector-based analysis
    const searchItems = [];
    for (const result of searchResults) {
      const keyword = result.keyword;
      const locationCode = result.location_code;
      const latitude = result.latitude || 'N/A'; // Include latitude from SearchResult
      const longitude = result.longitude || 'N/A'; // Include longitude from SearchResult

      // Process google_desktop, google_maps, bing, and perplexity results
      const engines = ['google_desktop', 'google_maps', 'bing', 'perplexity'];
      for (const engine of engines) {
        if (result.results[engine] && result.results[engine].length) {
          result.results[engine].forEach((item, index) => {
            const text = `${item.title || ''} ${item.meta_description || item.description || ''}`.trim();
            if (text) {
              searchItems.push({
                text,
                metadata: {
                  keyword,
                  locationCode,
                  engine,
                  position: item.position || index + 1,
                  title: item.title || 'No Title',
                  url: item.url || '',
                  description: item.meta_description || item.description || 'No Description',
                  latitude, // Add latitude to metadata
                  longitude, // Add longitude to metadata
                },
              });
            }
          });
        }
      }
    }

    if (!searchItems.length) {
      return res.status(404).json({ error: "No relevant search result data found after processing." });
    }

    // Step 7: Generate embeddings for the user message and search result texts
    const userEmbedding = await generateEmbedding(message);
    const searchEmbeddings = await Promise.all(
      searchItems.map(async (item) => ({
        embedding: await generateEmbedding(item.text),
        metadata: item.metadata,
      }))
    );

    // Step 8: Find the most relevant search results using cosine similarity
    const similarities = searchEmbeddings.map((item, index) => ({
      index,
      similarity: cosineSimilarity(userEmbedding, item.embedding),
    }));

    // Sort by similarity (descending) and take the top 5 matches
    const topMatches = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map((match) => searchItems[match.index].metadata);

    // Log the top matches for debugging
    console.log("Top matches:", topMatches);

    // Step 9: Format the context for ChatGPT with more specific instructions
    let context = "Here are some relevant search results based on the user's query:\n\n";
    topMatches.forEach((match, idx) => {
      context += `Result ${idx + 1}:\n`;
      context += `Keyword: ${match.keyword}\n`;
      context += `Location: ${match.locationCode}\n`;
      context += `Engine: ${match.engine}\n`;
      context += `Position: ${match.position}\n`;
      context += `Title: ${match.title}\n`;
      context += `URL: ${match.url}\n`;
      context += `Description: ${match.description}\n`;
      context += `Latitude: ${match.latitude}\n`; // Add latitude to context
      context += `Longitude: ${match.longitude}\n\n`; // Add longitude to context
    });

    // Step 10: Generate a response using ChatGPT with an improved prompt
    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant that analyzes search result data and answers user queries in a natural, concise, and varied way. Focus on the user's query intent and provide specific details from the search results, including location data like latitude and longitude when relevant. Avoid repeating the same response for different queries by paying attention to the query's keywords and context.",
      },
      {
        role: "user",
        content: `User Query: ${message}\n\nSearch Result Context:\n${context}\n\nBased on the search results, provide a concise and relevant answer that directly addresses the user's query. Include specific details like titles, positions, URLs, and location data (latitude and longitude) if relevant, and avoid generic responses.`,
      },
    ];

    const chatResponse = await generateChatCompletion(messages);

    // Step 11: Send the response back to the frontend
    res.json({ response: chatResponse });
  } catch (error) {
    console.error("Error handling chat request:", error.message);
    res.status(500).json({ error: "Failed to process chat request" });
  }
};

module.exports = { handleChatRequest };