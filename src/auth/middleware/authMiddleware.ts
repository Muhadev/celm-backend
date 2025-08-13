import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { User } from '../models/User';
import { AppError, UnauthorizedError } from '@/utils/AppError';
import { logger } from '@/utils/logger';

const authService = new AuthService();

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate token
    const payload = await authService.validateAccessToken(token);

    // Get user details
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      shopUrl: user.shopUrl || '',
      businessName: user.businessName || ''
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    next(error);
  }
};

// Optional auth middleware (doesn't throw error if no token)
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const payload = await authService.validateAccessToken(token);
        const user = await User.findById(payload.userId);
        
        if (user && user.isActive) {
          req.user = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            shopUrl: user.shopUrl || '',
            businessName: user.businessName || ''
          };
        }
      } catch (error) {
        // Ignore token validation errors in optional middleware
      }
    }

    next();
  } catch (error) {
    next();
  }
};