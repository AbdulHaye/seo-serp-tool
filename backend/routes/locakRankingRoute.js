// routes/searchRoutes.js
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/localRankingController');

router.post('/rankings', searchController.getSearchRankings);
router.get('/heatmap-data', searchController.getHeatmapData);
// router.post('/fetch-rankings', searchController.fetchLocalRankings);


module.exports = router;