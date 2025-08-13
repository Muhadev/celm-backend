import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { EmailService } from '../services/EmailService';
import { AppError, ValidationError, BadRequestError } from '@/utils/AppError';
import { logger } from '@/utils/logger';
import { LoginRequest } from '../types/auth';
import Joi from 'joi';

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required'
    })
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Reset token is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    })
});

export class AuthController {
  private authService: AuthService;
  private emailService: EmailService;

  constructor() {
    this.authService = new AuthService();
    this.emailService = new EmailService();
  }

  // Login with email and password
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      const { email, password } = value as LoginRequest;

      // Authenticate user
      const result = await this.authService.authenticate(email, password);

      if (!result) {
        throw new BadRequestError('Invalid email or password');
      }

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user.toSafeJSON(),
          tokens: result.tokens
        }
      });

      logger.info(`User logged in successfully: ${result.user.email}`);
    } catch (error) {
      next(error);
    }
  };

  // Refresh token
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new BadRequestError('Refresh token is required');
      }

      const tokens = await this.authService.refreshTokens(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: { tokens }
      });

      logger.info('Tokens refreshed successfully');
    } catch (error) {
      next(error);
    }
  };

  // Logout
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        await this.authService.revokeRefreshToken(refreshToken);
      }

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });

      logger.info(`User logged out: ${req.user?.email || 'Unknown'}`);
    } catch (error) {
      next(error);
    }
  };

  // Logout from all devices
  logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      await this.authService.revokeAllUserTokens(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully'
      });

      logger.info(`User logged out from all devices: ${req.user.email}`);
    } catch (error) {
      next(error);
    }
  };

  // Check authentication status
  checkAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      res.status(200).json({
        success: true,
        message: 'User is authenticated',
        data: {
          isAuthenticated: true,
          user: req.user
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Forgot password
  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = forgotPasswordSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      const { email } = value;

      // Generate reset token
      const resetToken = await this.authService.generatePasswordResetToken(email);

      // Send reset email
      await this.emailService.sendPasswordResetEmail(email, resetToken);

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link'
      });

      logger.info(`Password reset requested for: ${email}`);
    } catch (error) {
      next(error);
    }
  };

  // Reset password
  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = resetPasswordSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      const { token, password } = value;

      await this.authService.resetPassword(token, password);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });

      logger.info('Password reset completed successfully');
    } catch (error) {
      next(error);
    }
  };
}