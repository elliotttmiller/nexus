const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const db = require('../models');
const User = db.User;
const { z } = require('zod');

// --- Advanced Secret Rotation ---
// Support multiple valid secrets for JWT and refresh tokens
const JWT_SECRETS = (process.env.JWT_SECRETS ? process.env.JWT_SECRETS.split(',') : []).filter(Boolean);
const REFRESH_SECRETS = (process.env.REFRESH_SECRETS ? process.env.REFRESH_SECRETS.split(',') : []).filter(Boolean);
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!JWT_SECRET && JWT_SECRETS.length === 0) {
  throw new Error('JWT_SECRET or JWT_SECRETS environment variable is required.');
}
if (!REFRESH_SECRET && REFRESH_SECRETS.length === 0) {
  throw new Error('REFRESH_SECRET or REFRESH_SECRETS environment variable is required.');
}

// Always sign with the newest secret, but verify with all
const getAllJwtSecrets = () => [JWT_SECRET, ...JWT_SECRETS].filter(Boolean);
const getAllRefreshSecrets = () => [REFRESH_SECRET, ...REFRESH_SECRETS].filter(Boolean);

// --- Refresh Token Storage for Revocation/Rotation ---
// Store refresh tokens in DB for revocation/rotation

async function storeRefreshToken(userId, token) {
  // Store the refresh token in the user table (or a dedicated table for multiple tokens)
  await db.User.update({ refresh_token: token }, { where: { id: userId } });
}

async function isRefreshTokenValid(userId, token) {
  const user = await db.User.findByPk(userId);
  return user && user.refresh_token === token;
}

function generateRefreshToken(user) {
  // Always sign with the newest secret
  return jwt.sign({ id: user.id, email: user.email }, REFRESH_SECRET || REFRESH_SECRETS[0], { expiresIn: '30d' });
}

function verifyRefreshToken(token) {
  const secrets = getAllRefreshSecrets();
  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret);
    } catch (e) {}
  }
  throw new Error('Invalid or expired refresh token');
}

function verifyJwtToken(token) {
  const secrets = getAllJwtSecrets();
  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret);
    } catch (e) {}
  }
  throw new Error('Invalid or expired JWT token');
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, REFRESH_SECRET, { expiresIn: '30d' });
}

// Register
router.post('/register', async (req, res) => {
  const trace = [];
  trace.push({ step: 'Start', timestamp: new Date().toISOString(), body: req.body });
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required', trace });
  try {
    trace.push({ step: 'Check Existing', email, timestamp: new Date().toISOString() });
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered', trace });
    trace.push({ step: 'Hash Password', timestamp: new Date().toISOString() });
    const password_hash = await bcrypt.hash(password, 10);
    trace.push({ step: 'Create User', timestamp: new Date().toISOString() });
    const user = await User.create({ email, password_hash });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = generateRefreshToken(user);
    await user.update({ refresh_token: refreshToken });
    trace.push({ step: 'User Created', userId: user.id, timestamp: new Date().toISOString() });
    res.json({ token, refreshToken, trace });
  } catch (err) {
    trace.push({ step: 'Error', error: err.message, timestamp: new Date().toISOString() });
    console.error('Error in /register:', err);
    res.status(500).json({ error: err.message, trace });
  }
});

// Login
router.post('/login', async (req, res) => {
  const trace = [];
  trace.push({ step: 'Start', timestamp: new Date().toISOString(), body: req.body });
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
  });
  const parseResult = schema.safeParse(req.body);
  trace.push({ step: 'Input Validation', valid: parseResult.success, errors: parseResult.error ? parseResult.error.errors : null, timestamp: new Date().toISOString() });
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid input', details: parseResult.error.errors, trace });
  }
  const { email, password } = parseResult.data;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required', trace });
  try {
    trace.push({ step: 'Find User', email, timestamp: new Date().toISOString() });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials', trace });
    trace.push({ step: 'Check Password', timestamp: new Date().toISOString() });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials', trace });
    if (user.twofa_secret) {
      trace.push({ step: '2FA Required', userId: user.id, timestamp: new Date().toISOString() });
      return res.json({ twofa_required: true, userId: user.id, trace });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = generateRefreshToken(user);
    await user.update({ refresh_token: refreshToken });
    trace.push({ step: 'Login Success', userId: user.id, timestamp: new Date().toISOString() });
    res.json({ token, refreshToken, trace });
  } catch (err) {
    trace.push({ step: 'Error', error: err.message, timestamp: new Date().toISOString() });
    console.error('Error in /login:', err);
    res.status(500).json({ error: err.message, trace });
  }
});

// Refresh Token Endpoint
router.post('/refresh', async (req, res) => {
  const trace = [];
  trace.push({ step: 'Start', timestamp: new Date().toISOString(), body: req.body });
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required', trace });
  try {
    trace.push({ step: 'Verify Refresh Token', timestamp: new Date().toISOString() });
    let payload, usedSecret;
    const secrets = getAllRefreshSecrets();
    for (const secret of secrets) {
      try {
        payload = jwt.verify(refreshToken, secret);
        usedSecret = secret;
        break;
      } catch (e) {}
    }
    if (!payload) {
      trace.push({ step: 'Invalid Refresh Token', timestamp: new Date().toISOString() });
      return res.status(401).json({ error: 'Invalid refresh token', trace });
    }
    trace.push({ step: 'Refresh Token Verified', usedSecret: !!usedSecret ? '[HIDDEN]' : null, timestamp: new Date().toISOString() });
    const user = await User.findByPk(payload.id);
    if (!user || user.refresh_token !== refreshToken) {
      trace.push({ step: 'Invalid Refresh Token', timestamp: new Date().toISOString() });
      return res.status(401).json({ error: 'Invalid refresh token', trace });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const newRefreshToken = generateRefreshToken(user);
    await user.update({ refresh_token: newRefreshToken });
    trace.push({ step: 'Refresh Success', userId: user.id, timestamp: new Date().toISOString() });
    res.json({ token, refreshToken: newRefreshToken, trace });
  } catch (err) {
    trace.push({ step: 'Error', error: err.message, timestamp: new Date().toISOString() });
    console.error('Error in /refresh:', err);
    res.status(401).json({ error: 'Invalid or expired refresh token', trace });
  }
});

// 2FA Setup (returns QR code data URL)
router.post('/2fa/setup', async (req, res) => {
  const trace = [];
  trace.push({ step: 'Start', timestamp: new Date().toISOString(), body: req.body });
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required', trace });
  try {
    trace.push({ step: 'Find User', userId, timestamp: new Date().toISOString() });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found', trace });
    trace.push({ step: 'Generate 2FA Secret', timestamp: new Date().toISOString() });
    const secret = speakeasy.generateSecret({ name: `Nexus (${user.email})` });
    await user.update({ twofa_secret: secret.base32 });
    const otpauth = secret.otpauth_url;
    const qr = await qrcode.toDataURL(otpauth);
    trace.push({ step: '2FA Setup Success', timestamp: new Date().toISOString() });
    res.json({ qr, secret: secret.base32, trace });
  } catch (err) {
    trace.push({ step: 'Error', error: err.message, timestamp: new Date().toISOString() });
    console.error('Error in /2fa/setup:', err);
    res.status(500).json({ error: err.message, trace });
  }
});

// 2FA Verify (login step)
router.post('/2fa/verify', async (req, res) => {
  const trace = [];
  trace.push({ step: 'Start', timestamp: new Date().toISOString(), body: req.body });
  const { userId, token: userToken } = req.body;
  if (!userId || !userToken) return res.status(400).json({ error: 'userId and token required', trace });
  try {
    trace.push({ step: 'Find User', userId, timestamp: new Date().toISOString() });
    const user = await User.findByPk(userId);
    if (!user || !user.twofa_secret) return res.status(404).json({ error: '2FA not set up', trace });
    trace.push({ step: 'Verify 2FA Token', timestamp: new Date().toISOString() });
    const verified = speakeasy.totp.verify({
      secret: user.twofa_secret,
      encoding: 'base32',
      token: userToken,
      window: 1
    });
    if (!verified) return res.status(401).json({ error: 'Invalid 2FA token', trace });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    trace.push({ step: '2FA Verify Success', userId: user.id, timestamp: new Date().toISOString() });
    res.json({ token, trace });
  } catch (err) {
    trace.push({ step: 'Error', error: err.message, timestamp: new Date().toISOString() });
    console.error('Error in /2fa/verify:', err);
    res.status(500).json({ error: err.message, trace });
  }
});

// Get authenticated user profile
router.get('/profile', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      id: user.id,
      user_id: user.id, // Support both formats for compatibility
      email: user.email,
      username: user.username || user.email // fallback to email if no username
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Error in /profile:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 