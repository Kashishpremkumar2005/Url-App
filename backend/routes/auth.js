const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter all required fields.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const emailKey = email.toLowerCase();
    const isDbConnected = mongoose.connection.readyState === 1;
    let existingUser;

    if (isDbConnected) {
      existingUser = await User.findOne({ email: emailKey });
    } else {
      const mockDb = require('../mockDb');
      existingUser = mockDb.users.find(u => u.email === emailKey);
    }

    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    let userId;

    if (isDbConnected) {
      const newUser = new User({
        email: emailKey,
        password: hashedPassword
      });
      await newUser.save();
      userId = newUser._id;
    } else {
      const mockDb = require('../mockDb');
      userId = `usr_${Date.now()}`;
      const newUser = {
        _id: userId,
        email: emailKey,
        password: hashedPassword
      };
      mockDb.users.push(newUser);
    }

    const token = jwt.sign(
      { id: userId, email: emailKey },
      process.env.JWT_SECRET || 'hackathon_secret_key_2026',
      { expiresIn: '2h' }
    );

    return res.status(201).json({
      message: 'Registration successful!',
      token,
      email: emailKey
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error during signup.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter all required fields.' });
    }

    const emailKey = email.toLowerCase();
    const isDbConnected = mongoose.connection.readyState === 1;
    let user;

    if (isDbConnected) {
      user = await User.findOne({ email: emailKey });
    } else {
      const mockDb = require('../mockDb');
      user = mockDb.users.find(u => u.email === emailKey);
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'hackathon_secret_key_2026',
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      message: 'Login successful!',
      token,
      email: user.email
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

module.exports = router;
