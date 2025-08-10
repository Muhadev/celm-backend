import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/AuthService';
import { User, UserRole } from '@/models/User';
import { AppError, UnauthorizedError, ForbiddenError } from '@/utils/AppError';
import { logger } from '@/utils/logger';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
      id?: string;
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // Middleware to authenticate user with JWT
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractTokenFromHeader(req);

      if (!token) {
        throw new UnauthorizedError('No token provided');
      }

      // Validate token and get user data
      const payload = await this.authService.validateAccessToken(token);
      
      // Fetch complete user data
      const user = await User.findById(payload.userId);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Attach user to request object
      req.user = user;
      if (user.id) {
        req.userId = user.id;
      }

      logger.debug(`User ${user.email} authenticated successfully`);
      next();
    } catch (error) {
      logger.error('Authentication error:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          timestamp: error.timestamp
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Authentication failed',
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  // Optional authentication - doesn't fail if no token
  optionalAuthenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractTokenFromHeader(req);

      if (token) {
        const payload = await this.authService.validateAccessToken(token);
        const user = await User.findById(payload.userId);
        
        if (user) {
          req.user = user;
          if (user.id) {
            req.userId = user.id;
          }
        }
      }

      next();
    } catch (error) {
      // Silent fail for optional authentication
      logger.debug('Optional authentication failed:', error);
      next();
    }
  };

  // Middleware to authorize specific roles
  authorize = (...roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }

        if (!roles.includes(req.user.role!)) {
          throw new ForbiddenError('Insufficient permissions');
        }

        logger.debug(`User ${req.user.email} authorized for roles: ${roles.join(', ')}`);
        next();
      } catch (error) {
        logger.error('Authorization error:', error);
        
        if (error instanceof AppError) {
          res.status(error.statusCode).json({
            success: false,
            message: error.message,
            timestamp: error.timestamp
          });
        } else {
          res.status(403).json({
            success: false,
            message: 'Authorization failed',
            timestamp: new Date().toISOString()
          });
        }
      }
    };
  };

  // Middleware to check if user owns the resource
  checkOwnership = (resourceIdParam: string = 'id') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }

        const resourceOwnerId = req.params[resourceIdParam] || req.body.ownerId || req.query.ownerId;
        
        // Admins can access any resource
        if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN) {
          next();
          return;
        }

        // Check if user owns the resource
        if (resourceOwnerId !== req.user.id) {
          throw new ForbiddenError('Access denied - you can only access your own resources');
        }

        next();
      } catch (error) {
        logger.error('Ownership check error:', error);
        
        if (error instanceof AppError) {
          res.status(error.statusCode).json({
            success: false,
            message: error.message,
            timestamp: error.timestamp
          });
        } else {
          res.status(403).json({
            success: false,
            message: 'Ownership check failed',
            timestamp: new Date().toISOString()
          });
        }
      }
    };
  };

  // Middleware for admin only routes
  adminOnly = (req: Request, res: Response, next: NextFunction): void => {
    this.authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN)(req, res, next);
  };

  // Middleware for super admin only routes
  superAdminOnly = (req: Request, res: Response, next: NextFunction): void => {
    this.authorize(UserRole.SUPER_ADMIN)(req, res, next);
  };

  // Middleware to check if user's email is verified
  requireEmailVerification = (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!req.user.emailVerified) {
        throw new ForbiddenError('Email verification required');
      }

      next();
    } catch (error) {
      logger.error('Email verification check error:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          timestamp: error.timestamp
        });
      } else {
        res.status(403).json({
          success: false,
          message: 'Email verification check failed',
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  private extractTokenFromHeader(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return null;
    }

    // Support both "Bearer <token>" and "<token>" formats
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return authHeader;
  }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Export middleware functions
export const authenticate = authMiddleware.authenticate;
export const optionalAuthenticate = authMiddleware.optionalAuthenticate;
export const authorize = authMiddleware.authorize;
export const checkOwnership = authMiddleware.checkOwnership;
export const adminOnly = authMiddleware.adminOnly;
export const superAdminOnly = authMiddleware.superAdminOnly;
export const requireEmailVerification = authMiddleware.requireEmailVerification;