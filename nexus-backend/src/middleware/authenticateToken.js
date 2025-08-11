const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('[DEBUG] Authorization header:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  console.log('[DEBUG] Parsed token:', token);
  if (!token) {
    console.warn('[auth] No token provided in Authorization header.');
    return res.sendStatus(401);
  }

  // Support secret rotation: try all secrets in JWT_SECRETS, fallback to JWT_SECRET
  const secrets = process.env.JWT_SECRETS
    ? process.env.JWT_SECRETS.split(',').map(s => s.trim()).filter(Boolean)
    : (process.env.JWT_SECRET ? [process.env.JWT_SECRET] : []);

  let verified = false;
  let lastError = null;
  console.log(`[auth] Verifying token: ${token.slice(0, 12)}... (length: ${token.length})`);
  for (const [i, secret] of secrets.entries()) {
    try {
      const user = jwt.verify(token, secret);
      req.user = user;
      verified = true;
      console.log(`[auth] Token verified with secret #${i + 1} (length: ${secret.length})`);
      break;
    } catch (err) {
      console.warn(`[auth] Secret #${i + 1} failed: ${err.message}`);
      lastError = err;
    }
  }
  if (!verified) {
    console.error(`[auth] All secrets failed to verify token. Last error: ${lastError && lastError.message}`);
    return res.sendStatus(403);
  }
  next();
}

module.exports = authenticateToken;