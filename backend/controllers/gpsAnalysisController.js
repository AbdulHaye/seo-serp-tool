const gpsAnalyzer = require("../services/gpsAnalyzer");

const analyzeMultiLocationRankings = async (req, res) => {
    try {
        const { keyword, location_codes, language_name, device, os } = req.body;

        if (!keyword || !location_codes || !location_codes.length) {
            return res.status(400).json({ error: "Invalid input: keyword and location_codes are required" });
        }

        console.log("Starting multi-location analysis...");

        const rankings = await gpsAnalyzer.fetchMultiLocationRankings(keyword, location_codes, language_name, device, os);

        res.json({ message: "Multi-location analysis complete", rankings });

    } catch (error) {
        console.error("Error in multi-location ranking analysis:", error);
        res.status(500).json({ error: "Failed to analyze rankings" });
    }
};

module.exports = { analyzeMultiLocationRankings };
