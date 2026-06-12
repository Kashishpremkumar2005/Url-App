require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Url = require('./models/Url');
const Analytics = require('./models/Analytics');

async function testConnection() {
  console.log('==================================================');
  console.log('  Trimly Backend & Database Diagnostic Checker  ');
  console.log('==================================================\n');

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/urlshortener';
  const port = process.env.PORT || 5000;
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  console.log(`[Config] Target Port: ${port}`);
  console.log(`[Config] Base URL: ${baseUrl}`);
  console.log(`[Config] MongoDB URI: ${mongoUri}\n`);

  console.log('[Connection] Attempting database connection...');

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });

    console.log('🟢 [Database] Connection SUCCESSFUL!');

    const userCount = await User.countDocuments();
    const urlCount = await Url.countDocuments();
    const clickCount = await Analytics.countDocuments();

    console.log('\n==================================================');
    console.log('  Database Diagnostics Report                     ');
    console.log('==================================================');
    console.log(`  Users Registered : ${userCount}`);
    console.log(`  URLs Shortened   : ${urlCount}`);
    console.log(`  Visits Logged    : ${clickCount}`);
    console.log('==================================================\n');

    console.log('🟢 Diagnosis: MongoDB is active and database collections are fully accessible.');
    console.log('You can safely execute "npm start" to launch the backend server.');
  } catch (error) {
    console.log('\n🔴 [Database] Connection FAILED!');
    console.log(`Error Message: ${error.message}\n`);
    console.log('--------------------------------------------------');
    console.log('Troubleshooting Actions:');
    console.log('1. Verify your local MongoDB service is running:');
    console.log('   Run: net start MongoDB (on Windows Command Prompt as Admin)');
    console.log('2. Check if the port 27017 is already in use by another process.');
    console.log('3. If using MongoDB Atlas, check your network connect, credentials,');
    console.log('   and IP Access List whitelist settings in the Atlas Dashboard.');
    console.log('--------------------------------------------------');
  } finally {
    await mongoose.disconnect();
    console.log('\n[Connection] Database connection closed.');
    console.log('==================================================');
  }
}

testConnection();
