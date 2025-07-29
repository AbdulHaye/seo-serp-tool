// const mongoose = require('mongoose');

// const SearchResultSchema = new mongoose.Schema({
//     keyword: String,
//     location: String,
//     searchDate: { type: Date, default: Date.now },
//     results: [
//         {
//             position: Number,
//             title: String,
//             url: String,
//             meta_description: String
//         }
//     ]
// });

// module.exports = mongoose.model('SearchResult', SearchResultSchema);



// const mongoose = require('mongoose');

// const SearchResultSchema = new mongoose.Schema({
//     keyword: { type: String, required: true },
//     location_code: { type: String, required: true },
//     searchDate: { type: Date, default: Date.now },
//     results: [
//         {
//             position: Number,
//             title: String,
//             url: String,
//             meta_title: String, 
//             meta_description: String
//         }
//     ],
//     screenshots: {
//         desktop: String, 
//         mobile: String, 
//         maps: String    
//     }
// });

// module.exports = mongoose.model('SearchResult', SearchResultSchema);



const mongoose = require("mongoose");

const SearchResultSchema = new mongoose.Schema({
    keyword: { type: String, required: true },
    location_code: { type: String, required: true },
    searchDate: { type: Date, default: Date.now },
    results: {
        google_desktop: [{ position: Number, title: String, url: String, meta_title: String, meta_description: String }],
        google_mobile: [{ position: Number, title: String, url: String, meta_title: String, meta_description: String }],
        google_maps: [{ position: Number, title: String, url: String, meta_title: String, meta_description: String }],
        bing: [{ position: Number, title: String, url: String, meta_title: String, meta_description: String }],
        perplexity: [{ position: Number, title: String, url: String, meta_title: String, meta_description: String }]
    },
    screenshots: {
        google_desktop: String,
        google_mobile: String,
        google_maps: String,
        bing: String,
        perplexity: String
    }
});

module.exports = mongoose.model("SearchResult", SearchResultSchema);
