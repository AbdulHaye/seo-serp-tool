const aiProcessor = require("../services/aiProcessor");

const analyzeSearchPatterns = async (req, res) => {
    try {
        const { searchResults } = req.body;

        if (!searchResults || !Array.isArray(searchResults)) {
            return res.status(400).json({ error: "Invalid input: searchResults should be an array" });
        }

        console.log("Processing AI-based insights...");

        const insights = await aiProcessor.generateSearchInsights(searchResults);

        res.json({ message: "AI analysis complete", insights });

    } catch (error) {
        console.error("Error in AI-based search analysis:", error);
        res.status(500).json({ error: "Failed to analyze search patterns" });
    }
};

module.exports = { analyzeSearchPatterns };
                  