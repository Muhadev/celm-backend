import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/AuthService';
import { EmailService } from '@/services/EmailService';
import { AppError, ValidationError } from '@/utils/AppError';
import { logger } from '@/utils/logger';
import Joi from 'joi';

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required'
  }),
  firstName: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name must not exceed 50 characters'
  }),
  lastName: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name must not exceed 50 characters'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required'
  })
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required'
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required'
  })
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'New password is required'
  })
});

const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

export class AuthController {
  private authService: AuthService;
  private emailService: EmailService;

  constructor() {
    this.authService = new AuthService();
    this.emailService = new EmailService();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      const { email, password, firstName, lastName } = value;

      const user = await this.authService.register(email, password, firstName, lastName);

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        data: {
          user: user.toJSON(),
        },
      });

      logger.info(`User registered successfully: ${email}`);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      const { email, password } = value;

      const result = await this.authService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user.toJSON(),
          tokens: result.tokens,
        },
      });

      logger.info(`User logged in successfully: ${email}`);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const refreshToken = req.body.refreshToken;

      if (userId) {
        await this.authService.logout(userId, refreshToken);
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = refreshTokenSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      const { refreshToken } = value;

      const tokens = await this.authService.refreshTokens(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params;

      if (!token) {
        throw new ValidationError('Verification token is required');
      }

      const user = await this.authService.verifyEmail(token);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        data: {
          user: user.toJSON(),
        },
      });

      logger.info(`Email verified for user: ${user.email}`);
    } catch (error) {
      next(error);
    }
  };

  resendVerificationEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = resendVerificationSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      const { email } = value;

      await this.authService.resendVerificationEmail(email);

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully',
      });

      logger.info(`Verification email resent to: ${email}`);
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = forgotPasswordSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      const { email } = value;

      await this.authService.requestPasswordReset(email);

      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully',
      });

      logger.info(`Password reset requested for: ${email}`);
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = resetPasswordSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      const { token, password } = value;

      await this.authService.resetPassword(token, password);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });

      logger.info(`Password reset completed for token: ${token.substring(0, 10)}...`);
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new AppError('User not authenticated', 401);
      }

      // Validate request body
      const { error, value } = changePasswordSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      const { currentPassword, newPassword } = value;

      await this.authService.changePassword(req.user.id, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });

      logger.info(`Password changed for user: ${req.user.id}`);
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: req.user.toJSON(),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  checkAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isAuthenticated = !!req.user;

      res.status(200).json({
        success: true,
        message: isAuthenticated ? 'User is authenticated' : 'User is not authenticated',
        data: {
          isAuthenticated,
          user: req.user ? req.user.toJSON() : null,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}