const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const db = require('../models');
const User = db.User;

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your_refresh_secret_key_here';

function generateRefreshToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, REFRESH_SECRET, { expiresIn: '30d' });
}

// Register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = generateRefreshToken(user);
    await user.update({ refresh_token: refreshToken });
    res.json({ token, refreshToken });
  } catch (err) {
    console.error('Error in /register:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    // If 2FA is enabled, require verification
    if (user.twofa_secret) {
      return res.json({ twofa_required: true, userId: user.id });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = generateRefreshToken(user);
    await user.update({ refresh_token: refreshToken });
    res.json({ token, refreshToken });
  } catch (err) {
    console.error('Error in /login:', err);
    res.status(500).json({ error: err.message });
  }
});

// Refresh Token Endpoint
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findByPk(payload.id);
    if (!user || user.refresh_token !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    // Optionally rotate refresh token
    const newRefreshToken = generateRefreshToken(user);
    await user.update({ refresh_token: newRefreshToken });
    res.json({ token, refreshToken: newRefreshToken });
  } catch (err) {
    console.error('Error in /refresh:', err);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// 2FA Setup (returns QR code data URL)
router.post('/2fa/setup', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const secret = speakeasy.generateSecret({ name: `Nexus (${user.email})` });
    await user.update({ twofa_secret: secret.base32 });
    const otpauth = secret.otpauth_url;
    const qr = await qrcode.toDataURL(otpauth);
    res.json({ qr, secret: secret.base32 });
  } catch (err) {
    console.error('Error in /2fa/setup:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2FA Verify (login step)
router.post('/2fa/verify', async (req, res) => {
  const { userId, token: userToken } = req.body;
  if (!userId || !userToken) return res.status(400).json({ error: 'userId and token required' });
  try {
    const user = await User.findByPk(userId);
    if (!user || !user.twofa_secret) return res.status(404).json({ error: '2FA not set up' });
    const verified = speakeasy.totp.verify({
      secret: user.twofa_secret,
      encoding: 'base32',
      token: userToken,
      window: 1
    });
    if (!verified) return res.status(401).json({ error: 'Invalid 2FA token' });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error('Error in /2fa/verify:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 