const express = require('express');
const router = express.Router();
const validUrl = require('valid-url');
const mongoose = require('mongoose');
const Url = require('../models/Url');
const auth = require('../middleware/auth');

let generateCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

try {
  const { customAlphabet } = require('nanoid');
  generateCode = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);
} catch (e) {
  // Nanoid fallback active
}

// POST /api/url/shorten
router.post('/shorten', auth, async (req, res) => {
  try {
    const { longUrl, customCode } = req.body;

    if (!longUrl) {
      return res.status(400).json({ error: 'Destination URL is required.' });
    }

    if (!validUrl.isUri(longUrl) || !/^https?:\/\//i.test(longUrl)) {
      return res.status(400).json({ error: 'Please enter a valid HTTP/HTTPS URL.' });
    }

    let shortCode = customCode;
    const isDbConnected = mongoose.connection.readyState === 1;
    
    if (shortCode) {
      if (shortCode.length < 3) {
        return res.status(400).json({ error: 'Custom shortcode must be at least 3 characters long.' });
      }
      
      let existing;
      if (isDbConnected) {
        existing = await Url.findOne({ shortCode });
      } else {
        const mockDb = require('../mockDb');
        existing = mockDb.urls.find(u => u.shortCode.toLowerCase() === shortCode.toLowerCase());
      }

      if (existing) {
        return res.status(400).json({ error: 'This custom alias is already taken.' });
      }
    } else {
      let codeExists = true;
      while (codeExists) {
        shortCode = generateCode();
        let existing;
        if (isDbConnected) {
          existing = await Url.findOne({ shortCode });
        } else {
          const mockDb = require('../mockDb');
          existing = mockDb.urls.find(u => u.shortCode.toLowerCase() === shortCode.toLowerCase());
        }
        if (!existing) {
          codeExists = false;
        }
      }
    }

    let returnedUrl;

    if (isDbConnected) {
      const newUrl = new Url({
        userId: req.user.id,
        longUrl,
        shortCode
      });
      await newUrl.save();
      returnedUrl = newUrl;
    } else {
      const mockDb = require('../mockDb');
      returnedUrl = {
        _id: `lnk_${Date.now()}`,
        userId: req.user.id,
        longUrl,
        shortCode,
        clicks: 0,
        createdAt: new Date()
      };
      mockDb.urls.push(returnedUrl);
    }

    return res.status(201).json(returnedUrl);
  } catch (error) {
    console.error('URL creation error:', error);
    return res.status(500).json({ error: 'Internal server error while saving URL.' });
  }
});

// GET /api/url/myurls
router.get('/myurls', auth, async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    let urls;

    if (isDbConnected) {
      urls = await Url.find({ userId: req.user.id }).sort({ createdAt: -1 });
    } else {
      const mockDb = require('../mockDb');
      urls = mockDb.urls.filter(u => u.userId === req.user.id).sort((a, b) => b.createdAt - a.createdAt);
    }

    return res.status(200).json(urls);
  } catch (error) {
    console.error('Fetch URLs error:', error);
    return res.status(500).json({ error: 'Internal server error while fetching links.' });
  }
});

// DELETE /api/url/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    let url;

    if (isDbConnected) {
      url = await Url.findById(req.params.id);
    } else {
      const mockDb = require('../mockDb');
      url = mockDb.urls.find(u => u._id === req.params.id);
    }

    if (!url) {
      return res.status(404).json({ error: 'URL not found.' });
    }

    if (url.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You do not own this URL.' });
    }

    if (isDbConnected) {
      await Url.deleteOne({ _id: req.params.id });
    } else {
      const mockDb = require('../mockDb');
      const index = mockDb.urls.findIndex(u => u._id === req.params.id);
      mockDb.urls.splice(index, 1);
    }

    return res.status(200).json({ message: 'URL deleted successfully.' });
  } catch (error) {
    console.error('Delete URL error:', error);
    return res.status(500).json({ error: 'Internal server error while deleting URL.' });
  }
});

module.exports = router;
