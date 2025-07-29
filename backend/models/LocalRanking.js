const mongoose = require('mongoose');

const LocalRankingSchema = new mongoose.Schema({
    keyword: String,
    gpsLocation: { lat: Number, lng: Number },
    rankings: Array,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LocalRanking', LocalRankingSchema);