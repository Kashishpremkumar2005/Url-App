const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userEmail: {
    type: String,
    default: 'Anonymous'
  },
  browser: {
    type: String,
    default: 'Chrome'
  },
  os: {
    type: String,
    default: 'Windows'
  }
});

module.exports = mongoose.model('Analytics', analyticsSchema);
