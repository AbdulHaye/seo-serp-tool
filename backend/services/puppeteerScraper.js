const puppeteer = require("puppeteer");

const browserConfig = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
};

const scrapeGoogleMaps = async (keyword) => {
    const browser = await puppeteer.launch(browserConfig);
    const page = await browser.newPage();
    const url = `https://www.google.com/maps/search/${encodeURIComponent(keyword)}`;
    await page.goto(url, { waitUntil: "networkidle2" });

    const results = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".Nv2PK")).slice(0, 10).map((el, index) => ({
            position: index + 1,
            title: el.querySelector(".qBF1Pd")?.innerText || "",
            url: el.querySelector("a")?.href || "",
            meta_description: el.querySelector(".UY7F9")?.innerText || ""
        }));
    });

    await browser.close();
    return results;
};

const scrapePerplexity = async (keyword) => {
    const browser = await puppeteer.launch(browserConfig);
    const page = await browser.newPage();
    const url = `https://www.perplexity.ai/search?q=${encodeURIComponent(keyword)}`;
    await page.goto(url, { waitUntil: "networkidle2" });

    const results = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".search-result")).slice(0, 10).map((el, index) => ({
            position: index + 1,
            title: el.querySelector("h2")?.innerText || "",
            url: el.querySelector("a")?.href || "",
            meta_description: el.querySelector(".snippet")?.innerText || ""
        }));
    });

    await browser.close();
    return results;
};

module.exports = { scrapeGoogleMaps, scrapePerplexity };
