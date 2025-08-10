import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/AppError';
import { logger } from '@/utils/logger';
import { config } from '@/config';

interface ErrorResponse {
  success: false;
  message: string;
  error?: {
    type: string;
    details?: any;
  };
  timestamp: string;
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errorDetails: any = undefined;

  // Log the error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errorDetails = {
      type: error.constructor.name,
      isOperational: error.isOperational,
    };
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    errorDetails = {
      type: 'ValidationError',
    };
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorDetails = {
      type: 'AuthenticationError',
    };
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    errorDetails = {
      type: 'AuthenticationError',
    };
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    errorDetails = {
      type: 'ValidationError',
    };
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    message = `File upload error: ${error.message}`;
    errorDetails = {
      type: 'FileUploadError',
    };
  }

  const errorResponse: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  // Include error details in development mode
  if (config.server.nodeEnv === 'development') {
    errorResponse.error = {
      type: error.constructor.name,
      details: error.stack,
      ...errorDetails,
    };
  } else if (errorDetails) {
    errorResponse.error = errorDetails;
  }

  res.status(statusCode).json(errorResponse);
};
