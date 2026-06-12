const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const Url = require('../models/Url');
const Analytics = require('../models/Analytics');

// Fetch Analytics details along with email session and browser metrics
router.get('/:urlId', auth, async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    let url;
    let history;

    if (isDbConnected) {
      url = await Url.findById(req.params.urlId);
    } else {
      const mockDb = require('../mockDb');
      url = mockDb.urls.find(u => u._id === req.params.urlId);
    }

    if (!url) {
      return res.status(404).json({ message: 'URL details not found.' });
    }

    if (url.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Unauthorized access.' });
    }

    if (isDbConnected) {
      history = await Analytics.find({ urlId: req.params.urlId }).sort({ timestamp: -1 });
    } else {
      const mockDb = require('../mockDb');
      history = mockDb.analytics.filter(a => a.urlId === req.params.urlId).sort((a, b) => b.timestamp - a.timestamp);
    }
    
    return res.json({
      totalClicks: url.clicks,
      lastVisited: history.length > 0 ? history[0].timestamp : null,
      history: history // Maps array including timestamp, userEmail, browser, and os
    });
  } catch (err) {
    console.error('Analytics route error:', err);
    return res.status(500).json('Server error');
  }
});

module.exports = router;
