const axios = require("axios");
const SearchResult = require("../models/searchResult");
const { scrapeGoogleMaps, scrapePerplexity } = require("../services/puppeteerScraper");
const getSearchResults = async (req, res) => {
    const { keyword, location_code, language_name, device, os } = req.body;
    try {
        console.log("Fetching search data...");
        const results = await Promise.allSettled([
            fetchFromDataForSEO("google", keyword, location_code, language_name, device, os),
            fetchFromDataForSEO("bing", keyword, location_code, language_name, device, os),
            scrapeGoogleMaps(keyword),
            scrapePerplexity(keyword),
        ]);
        const searchData = new SearchResult({
            keyword,
            location_code,
            results: {
                google_desktop: results[0].value,
                google_mobile: results[0].value, // Can adjust if you have separate API for mobile
                bing: results[1].value,
                google_maps: results[2].value,
                perplexity: results[3].value
            }
        });
        await searchData.save();
        res.json({ message: "Search data saved", searchData });
    } catch (error) {
        console.error("Error fetching search results:", error);
        res.status(500).json({ error: "Failed to fetch search data" });
    }
};
const fetchFromDataForSEO = async (engine, keyword, location_code, language_name, device, os) => {
    const postUrl = `https://api.dataforseo.com/v3/serp/${engine}/organic/task_post`;
    const getUrl = `https://api.dataforseo.com/v3/serp/${engine}/organic/task_get/advanced/`;
    const postResponse = await axios.post(postUrl, [{ keyword, location_code, language_name, device, os, async: true }], {
        auth: { username: process.env.DATAFORSEO_API_LOGIN, password: process.env.DATAFORSEO_API_PASSWORD },
        headers: { "Content-Type": "application/json" }
    });
    const taskId = postResponse.data.tasks[0].id;
    console.log(`Task created for ${engine}: ${taskId}`);
    let getResponse;
    for (let attempt = 1; attempt <= 4; attempt++) {
        console.log(`Attempt ${attempt}: Waiting ${attempt * 15} seconds before fetching results...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 15000));
        getResponse = await axios.get(getUrl + taskId, {
            auth: { username: process.env.DATAFORSEO_API_LOGIN, password: process.env.DATAFORSEO_API_PASSWORD }
        });
        if (getResponse.data.tasks[0].result && getResponse.data.tasks[0].result[0]?.items?.length) {
            console.log(`Results received for ${engine}`);
            break;
        }
        console.log(`No results yet for ${engine}. Retrying...`);
    }
    return getResponse?.data?.tasks[0]?.result[0]?.items?.slice(0, 10).map((item, index) => ({
        position: index + 1,
        title: item?.data?.title || item?.title || "No Title",
        url: item?.url || "",
        meta_title: item?.data?.meta_title || item?.meta_title || "No Meta Title",
        meta_description: item?.data?.meta_description || item?.meta_description || "No Meta Description"
    })) || [];
};
module.exports = { getSearchResults };









