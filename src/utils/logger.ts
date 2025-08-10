import winston from 'winston';
import { config } from '@/config';

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, stack }) => {
        return `${timestamp} [${level}]: ${stack || message}`;
      })
    )
  })
];

// Add file transports for production
if (config.server.nodeEnv === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'celm-backend' },
  transports,
  exceptionHandlers: [
    new winston.transports.Console(),
    ...(config.server.nodeEnv === 'production' ? [
      new winston.transports.File({ filename: 'logs/exceptions.log' })
    ] : [])
  ],
  rejectionHandlers: [
    new winston.transports.Console(),
    ...(config.server.nodeEnv === 'production' ? [
      new winston.transports.File({ filename: 'logs/rejections.log' })
    ] : [])
  ],
  exitOnError: false,
});

// Create logs directory if it doesn't exist in production
if (config.server.nodeEnv === 'production') {
  const fs = require('fs');
  const path = require('path');
  const logDir = path.join(process.cwd(), 'logs');
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
}