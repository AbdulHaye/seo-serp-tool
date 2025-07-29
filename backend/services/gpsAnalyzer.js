const searchAPIs = require("./searchAPIs");

const fetchMultiLocationRankings = async (keyword, location_codes, language_name, device, os) => {
    try {
        const results = {};

        for (const location_code of location_codes) {
            console.log(`Fetching rankings for location: ${location_code}`);

            const rankingData = await searchAPIs.fetchFromDataForSEO("google", keyword, location_code, language_name, device, os);

            results[location_code] = rankingData;
        }

        return results;

    } catch (error) {
        console.error("Error in multi-location ranking analysis:", error);
        throw new Error("Failed to analyze rankings across locations");
    }
};

module.exports = { fetchMultiLocationRankings };
