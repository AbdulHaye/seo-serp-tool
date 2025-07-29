const express = require('express');
const cors = require('cors');
const searchRoutes = require('./routes/searchRoutes');
const searchRankingRoutes = require('./routes/locakRankingRoute');
const chatRoutes = require('./routes/chatRoutes');
const screenshotRoutes = require('./routes/screenshotRoutes');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
const allowedOrigins = ['http://localhost:3000', 'http://168.231.79.29'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/search/phase2', searchRankingRoutes);
app.use('/api', chatRoutes);
app.use('/api', screenshotRoutes);

module.exports = app;