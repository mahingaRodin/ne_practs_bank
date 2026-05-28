const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, service, stack }) => {
      const svc = service ? `[${service}] ` : '';
      return stack
        ? `${timestamp} ${level.toUpperCase()} ${svc}${message}\n${stack}`
        : `${timestamp} ${level.toUpperCase()} ${svc}${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }),
  ],
});

function createLogger(serviceName) {
  return logger.child({ service: serviceName });
}

module.exports = { logger, createLogger };
