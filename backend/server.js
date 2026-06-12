require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const urlRoutes = require('./routes/url');
const analyticsRoutes = require('./routes/analytics');

const Url = require('./models/Url');
const Analytics = require('./models/Analytics');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/url', urlRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    if (code === 'favicon.ico') {
      return res.status(204).end();
    }

    let url;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      url = await Url.findOne({ shortCode: code });
    } else {
      const mockDb = require('./mockDb');
      url = mockDb.urls.find(u => u.shortCode.toLowerCase() === code.toLowerCase());
    }

    if (!url) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Link Not Found</title>
            <style>
              body { background-color: #070a13; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 1rem; box-sizing: border-box; }
              .card { background: rgba(22, 28, 45, 0.4); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 12px; padding: 2rem; max-width: 420px; text-align: center; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); }
              h1 { color: #f87171; font-size: 1.75rem; margin-top: 0; margin-bottom: 0.75rem; }
              p { color: #9ca3af; font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5; }
              a { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: #fff; text-decoration: none; font-weight: 600; padding: 0.75rem 1.5rem; border-radius: 8px; display: inline-block; transition: opacity 0.2s; }
              a:hover { opacity: 0.9; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Link Not Found</h1>
              <p>The shortened URL path you are trying to visit does not exist or has expired.</p>
              <a href="http://localhost:5173">Back to Trimly Hub</a>
            </div>
          </body>
        </html>
      `);
    }

    // Capture User Agent / Referer details
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    const userEmail = req.query.email || 'Anonymous';

    // Parse OS
    let os = 'Unknown OS';
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
    else if (/linux/i.test(ua)) os = 'Linux';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

    // Parse Browser
    let browser = 'Other';
    if (/chrome|chromium|crios/i.test(ua) && !/edge|edg/i.test(ua)) {
      browser = 'Chrome';
    } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
      browser = 'Safari';
    } else if (/firefox|iceweasel/i.test(ua)) {
      browser = 'Firefox';
    } else if (/edge|edg/i.test(ua)) {
      browser = 'Edge';
    }

    if (isDbConnected) {
      url.clicks += 1;
      await url.save();

      const clickLog = new Analytics({
        urlId: url._id,
        userEmail,
        browser,
        os
      });
      await clickLog.save();
    } else {
      url.clicks += 1;
      const mockDb = require('./mockDb');
      mockDb.analytics.push({
        _id: `an_${Date.now()}`,
        urlId: url._id,
        timestamp: new Date(),
        userEmail,
        browser,
        os
      });
    }

    return res.redirect(url.longUrl);
  } catch (error) {
    console.error('Redirect handler error:', error);
    return res.status(500).send('Internal server error during redirection.');
  }
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/urlshortener';

// Boot server immediately and attempt database connection asynchronously
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Connecting to database...');
  
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('🟢 Connected to MongoDB database successfully.');
    })
    .catch((err) => {
      console.warn('🔴 Database connection failed. Falling back to IN-MEMORY MOCK database mode.');
      console.warn(`Error detail: ${err.message}`);
      console.warn('Note: Feel free to use the website at http://localhost:5173 - auth, dashboard, redirecting, and analytics are mock-simulated.');
    });
});
