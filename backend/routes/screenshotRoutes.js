const express = require('express');
const router = express.Router();
const Screenshot = require('../models/Screenshot');

// POST /api/save-screenshot
router.post('/save-screenshot', async (req, res) => {
  console.log('Received request to /api/save-screenshot');
  console.log('Request body:', req.body);
  try {
    const { image, type } = req.body;

    // Validate request
    if (!image || !type) {
      console.log('Validation failed: Missing image or type');
      return res.status(400).json({ message: 'Image and type are required' });
    }

    // Create new screenshot document
    const screenshot = new Screenshot({
      image,
      type,
      // userId would be set here if you have authentication middleware
      // userId: req.user?.id || 'anonymous',
    });

    // Save to database
    await screenshot.save();
    console.log('Screenshot saved to database:', { type });

    res.status(200).json({ message: 'Screenshot saved successfully' });
  } catch (error) {
    console.error('Error saving screenshot:', error);
    res.status(500).json({ message: 'Error saving screenshot' });
  }
});

// GET /api/get-screenshots
router.get('/get-screenshots', async (req, res) => {
  try {
    // Fetch all screenshots from the database
    const screenshots = await Screenshot.find();
    // Map the screenshots to the format expected by the frontend
    const formattedScreenshots = screenshots.map((screenshot, index) => ({
      name: `${screenshot.type}_${index + 1}.png`, // Generate a unique name
      image: screenshot.image, // Base64 string
    }));
    res.status(200).json(formattedScreenshots);
  } catch (error) {
    console.error('Error fetching screenshots:', error);
    res.status(500).json({ message: 'Error fetching screenshots' });
  }
});

module.exports = router;