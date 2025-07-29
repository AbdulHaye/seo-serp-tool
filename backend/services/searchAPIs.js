const axios = require("axios");

const fetchFromDataForSEO = async (engine, keyword, location_code, language_name, device, os) => {
    const postUrl = `https://api.dataforseo.com/v3/serp/${engine}/organic/task_post`;
    const getUrl = `https://api.dataforseo.com/v3/serp/${engine}/organic/task_get/advanced/`;

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const delayBetweenAttempts = 15000; 
    const maxAttempts = 20;

    const postResponse = await axios.post(postUrl, [{ keyword, location_code, language_name, device, os, async: true }], {
        auth: { username: process.env.DATAFORSEO_API_LOGIN, password: process.env.DATAFORSEO_API_PASSWORD },
        headers: { "Content-Type": "application/json" }
    });

    const taskId = postResponse.data.tasks[0].id;
    console.log(`Task created for ${engine}: ${taskId}`);

    let getResponse;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`Attempt ${attempt}: Waiting ${attempt * 5} seconds before fetching results...`);
        await delay(delayBetweenAttempts); 

        try {
            getResponse = await axios.get(getUrl + taskId, {
                auth: { username: process.env.DATAFORSEO_API_LOGIN, password: process.env.DATAFORSEO_API_PASSWORD }
            });

            if (getResponse.data.tasks[0].result && getResponse.data.tasks[0].result[0]?.items?.length) {
                console.log(`Results received for ${engine}`);
                break;
            }
        } catch (error) {
            console.error(`Error fetching results for ${engine}:`, error.message);
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

module.exports = { fetchFromDataForSEO };
