const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Please include username, password and role.' });
  }
  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists.' });
    }
    const user = await User.create({
      username,
      password,
      role: role.toLowerCase()
    });
    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        role: user.role,
        message: 'Registration successful!'
      });
    } else {
      res.status(400).json({ message: 'Invalid user data.' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide username and password.' });
  }
  try {
    const user = await User.findOne({ username }).select('+password');
    if (user && await user.matchPassword(password)) {
      const token = generateToken(user._id);
      res.json({
        user: {
          id: user._id,
          username: user.username,
          role: user.role
        },
        token
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password.' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed. Server error.' });
  }
});

module.exports = router;
