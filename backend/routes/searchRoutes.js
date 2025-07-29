const express = require('express');
const { getSearchResults } = require('../controllers/searchController');
const { analyzeMultiLocationRankings } = require("../controllers/gpsAnalysisController");
const { analyzeSearchPatterns } = require("../controllers/aiAnalysisController");
const router = express.Router();

router.post('/get-results', getSearchResults);
router.post("/analyze-multi-location", analyzeMultiLocationRankings);
router.post("/analyze-ai-patterns", analyzeSearchPatterns);

module.exports = router;






