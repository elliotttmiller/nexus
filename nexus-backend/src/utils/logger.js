const { createLogger, format, transports } = require('winston');

// Redact sensitive fields from objects/strings
function redactSensitive(input) {
  if (!input) return input;
  let str = typeof input === 'string' ? input : JSON.stringify(input);
  // Redact common sensitive fields
  str = str.replace(/("?(password|token|apiKey|apikey|secret|refreshToken|email)"?\s*:\s*")([^"]*)"/gi, '$1[REDACTED]"');
  str = str.replace(/(Bearer\s+)[A-Za-z0-9\-\._~\+\/]+=*/gi, '$1[REDACTED]');
  return str;
}

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${redactSensitive(message)}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'backend.log' })
  ]
});

function auditLog(userId, action, details) {
  logger.info(`[AUDIT] userId=${userId} action=${action} details=${redactSensitive(details)}`);
}

// Example usage in a route:
// const { auditLog } = require('../utils/logger');
// auditLog(userId, 'account_linked', { accountId });

module.exports = logger;
module.exports.auditLog = auditLog;
module.exports.redactSensitive = redactSensitive; 