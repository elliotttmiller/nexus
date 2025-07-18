const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'backend.log' })
  ]
});

function auditLog(userId, action, details) {
  logger.info(`[AUDIT] userId=${userId} action=${action} details=${JSON.stringify(details)}`);
}

// Example usage in a route:
// const { auditLog } = require('../utils/logger');
// auditLog(userId, 'account_linked', { accountId });

module.exports = logger;
module.exports.auditLog = auditLog; 