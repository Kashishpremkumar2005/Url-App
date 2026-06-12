const bcrypt = require('bcryptjs');

const mockUsers = [
  {
    _id: 'usr_demo',
    email: 'demo@example.com',
    password: '' // Initialized below
  }
];

const mockUrls = [
  {
    _id: 'lnk_1',
    userId: 'usr_demo',
    originalUrl: 'https://github.com/google/antigravity',
    shortCode: 'antigrav',
    clicks: 142,
    createdAt: new Date('2026-06-01T12:00:00Z')
  },
  {
    _id: 'lnk_2',
    userId: 'usr_demo',
    originalUrl: 'https://news.ycombinator.com',
    shortCode: 'ycomb',
    clicks: 85,
    createdAt: new Date('2026-06-03T15:30:00Z')
  }
];

const mockAnalytics = [
  {
    _id: 'an_1',
    urlId: 'lnk_1',
    timestamp: new Date('2026-06-08T10:00:00Z'),
    userEmail: 'demo@example.com',
    browser: 'Chrome',
    os: 'Windows'
  },
  {
    _id: 'an_2',
    urlId: 'lnk_1',
    timestamp: new Date('2026-06-10T12:00:00Z'),
    userEmail: 'alice@domain.com',
    browser: 'Safari',
    os: 'macOS'
  }
];

// Hash initial password for the demo user
bcrypt.hash('password123', 10).then(hash => {
  mockUsers[0].password = hash;
});

module.exports = {
  users: mockUsers,
  urls: mockUrls,
  analytics: mockAnalytics
};
