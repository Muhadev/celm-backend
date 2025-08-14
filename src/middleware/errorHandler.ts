import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/AppError';
import { logger } from '@/utils/logger';
import { config } from '@/config';

interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  stack?: string;
  statusCode: number;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(`Error ${err.message}`, {
    error: err,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle specific error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Database connection errors
  if (err.message.includes('connect ECONNREFUSED')) {
    statusCode = 503;
    message = 'Database connection failed';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // PostgreSQL errors
  if (err.message.includes('duplicate key value')) {
    statusCode = 409;
    message = 'Resource already exists';
  }

  if (err.message.includes('foreign key constraint')) {
    statusCode = 400;
    message = 'Invalid reference to related resource';
  }

  // Rate limiting errors
  if (err.message.includes('Too many requests')) {
    statusCode = 429;
    message = 'Too many requests, please try again later';
  }

  const errorResponse: ErrorResponse = {
    success: false,
    message,
    statusCode
  };

  // Include error details in development
  // Use config.server.nodeEnv instead of config.nodeEnv
  if (config.server.nodeEnv === 'development') {
    errorResponse.error = err.message;
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Handle 404 routes
export const notFoundHandler = (req: Request, res: Response): void => {
  const message = `Route ${req.originalUrl} not found`;
  
  logger.warn('Route not found', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    message,
    statusCode: 404
  });
};

// Handle uncaught exceptions
export const uncaughtExceptionHandler = (err: Error): void => {
  logger.error('Uncaught Exception:', err);
  console.error('Uncaught Exception:', err);
  process.exit(1);
};

// Handle unhandled promise rejections
export const unhandledRejectionHandler = (reason: unknown, promise: Promise<any>): void => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
};