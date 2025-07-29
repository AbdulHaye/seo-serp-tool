// require("dotenv").config();
// const axios = require("axios");

// async function postSearchTask() {
//     try {
//         const response = await axios.post(
//             "https://api.dataforseo.com/v3/serp/google/organic/task_post",
//             [{
//                 keyword: "best laptops",
//                 location_code: 2840, // New York, USA
//                 language_name: "English",
//                 device: "desktop",
//                 os: "windows",
//                 async: true // Ensure async processing
//             }],
//             {
//                 auth: {
//                     username: process.env.DATAFORSEO_API_LOGIN,
//                     password: process.env.DATAFORSEO_API_PASSWORD
//                 },
//                 headers: {
//                     "Content-Type": "application/json"
//                 }
//             }
//         );

//         const taskId = response.data.tasks[0].id;
//         console.log(`✅ Task Created. Task ID: ${taskId}`);
        
//         // Wait before fetching results
//         console.log("⏳ Waiting 45 seconds before fetching results...");
//         setTimeout(() => getSearchResults(taskId, 10), 45000);

//     } catch (error) {
//         console.error("❌ API Error (POST):", error.response ? error.response.data : error.message);
//     }
// }

// async function getSearchResults(taskId, retries) {
//     if (retries === 0) {
//         console.error("❌ No results found after multiple retries.");
//         return;
//     }

//     console.log(`🔍 Fetching results for Task ID: ${taskId} (Retries left: ${retries})`);

//     try {
//         const response = await axios.get(
//             `https://api.dataforseo.com/v3/serp/google/organic/task_get/advanced/${taskId}`,
//             {
//                 auth: {
//                     username: process.env.DATAFORSEO_API_LOGIN,
//                     password: process.env.DATAFORSEO_API_PASSWORD
//                 }
//             }
//         );

//         if (response.data.tasks && response.data.tasks.length > 0 && response.data.tasks[0].result) {
//             console.log("✅ Search Results:", JSON.stringify(response.data, null, 2));
//             return;
//         } else {
//             console.log("🔄 No results yet. Retrying in 30 seconds...");
//             setTimeout(() => getSearchResults(taskId, retries - 1), 30000);
//         }

//     } catch (error) {
//         console.error(`❌ API Error (GET): Task not found (ID: ${taskId}). Retrying in 30 seconds...`);
//         setTimeout(() => getSearchResults(taskId, retries - 1), 30000);
//     }
// }

// // Run the API call
// postSearchTask();

const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const fetchLocalRankings = async (keyword, lat, lon, language_name = "English") => {
    const postUrl = `https://api.dataforseo.com/v3/serp/google/local_finder/task_post`;
    const getUrl = `https://api.dataforseo.com/v3/serp/google/local_finder/task_get/advanced/`;
    const location_code = lat === 40.7128 ? 1023191 : 21137; // New York or Los Angeles

    try {
        console.log(`Sending POST with: keyword=${keyword}, lat=${lat}, lon=${lon}, language_name=${language_name}, location_code=${location_code}`);
        const postResponse = await axios.post(postUrl, [{
            keyword,
            language_name,
            location_code,
            gps_coordinates: `${lat},${lon}`,
            async: true
        }], {
            auth: { username: process.env.DATAFORSEO_API_LOGIN, password: process.env.DATAFORSEO_API_PASSWORD },
            headers: { "Content-Type": "application/json" }
        });

        console.log(`POST Response:`, JSON.stringify(postResponse.data, null, 2));
        const task = postResponse.data.tasks[0];
        const taskId = task?.id;
        // Accept 20100 (Task Created) as a valid status for async tasks
        if (!taskId || (task.status_code !== 20000 && task.status_code !== 20100)) {
            throw new Error(`Failed to create task for ${lat},${lon}: ${task?.status_message || "No task ID"}`);
        }

        console.log(`Task created for ${lat},${lon}: ${taskId}`);

        let getResponse;
        let delay = 15;
        for (let attempt = 1; attempt <= 5; attempt++) {
            console.log(`Attempt ${attempt}: Waiting ${delay} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay * 1000));
            delay *= 2;

            getResponse = await axios.get(getUrl + taskId, {
                auth: { username: process.env.DATAFORSEO_API_LOGIN, password: process.env.DATAFORSEO_API_PASSWORD }
            });

            console.log(`GET Response Attempt ${attempt}:`, JSON.stringify(getResponse.data, null, 2));
            const result = getResponse?.data?.tasks[0]?.result?.[0]?.items;
            if (result?.length) {
                console.log(`Local rankings received for ${lat},${lon}`);
                break;
            }

            console.log(`No results yet for ${lat},${lon}. Retrying...`);
        }

        if (!getResponse?.data?.tasks[0]?.result?.[0]?.items?.length) {
            console.error(`No local rankings after max attempts for ${lat},${lon}`);
            return [];
        }

        return getResponse.data.tasks[0].result[0].items.slice(0, 10).map((item, index) => ({
            position: index + 1,
            title: item?.title || "No Title",
            url: item?.url || "",
            address: item?.address || "No Address",
            phone: item?.phone || "No Phone",
            description: item?.description || "No Description",
            rating: item?.rating?.value || "No Rating",
            votes: item?.rating?.votes_count || 0,
            cid: item?.cid || "No CID",
            rank_group: item?.rank_group || "No Rank Group",
            rank_absolute: item?.rank_absolute || "No Rank Absolute",
            position_type: item?.position || "No Position",
            xpath: item?.xpath || "No XPath",
            lat,
            lon
        }));
        

    } catch (error) {
        console.error(`Error fetching local rankings for ${lat},${lon}:`, error.response?.data || error.message);
        return [];
    }
};

app.post('/api/rankings', async (req, res) => {
    const { keyword, locations, language_name } = req.body;

    console.log("Incoming request:", { keyword, locations });

    if (!keyword || !Array.isArray(locations) || locations.length === 0) {
        return res.status(400).json({ error: "Invalid input: keyword and locations array are required" });
    }

    try {
        let allResults = [];

        for (const { lat, lon } of locations) {
            console.log(`Fetching rankings for ${lat},${lon}...`);
            const results = await fetchLocalRankings(keyword, lat, lon, language_name);
            if (results.length) {
                allResults.push(...results);
            }
        }

        console.log("Search results:", allResults);

        if (allResults.length === 0) {
            return res.status(404).json({ error: "No rankings found for given locations" });
        }

        res.json({ success: true, data: allResults });

    } catch (err) {
        console.error("Error retrieving rankings:", err);
        res.status(500).json({ error: "Failed to retrieve rankings" });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));