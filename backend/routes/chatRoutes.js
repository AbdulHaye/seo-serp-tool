const express = require('express');
const { handleChatRequest } = require('../controllers/chatController');
const router = express.Router();

// Route to handle chat requests
router.post('/chat', handleChatRequest);

module.exports = router;

