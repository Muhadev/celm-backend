import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, UserStatus } from '@/models/User';
import { config } from '@/config';
import { RedisService } from '@/database/redis';
import EmailService from '@/services/EmailService'; // Use default import
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/AppError';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

interface AuthResult {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export class AuthService {
  private redisService: RedisService | null = null;
  private emailService: EmailService;

  constructor() {
    try {
      this.redisService = new RedisService();
    } catch (error) {
      logger.warn('Redis not available, continuing without Redis features');
    }
    this.emailService = new EmailService(); // Now using default import
  }

  // ... rest of your methods remain the same ...
  async register(email: string, password: string, firstName?: string, lastName?: string): Promise<User> {
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Create new user
    const userData: any = {
      email,
      password,
      emailVerificationToken: this.generateVerificationToken(),
      status: UserStatus.PENDING
    };

    // Only add firstName and lastName if they are provided
    if (firstName) userData.firstName = firstName;
    if (lastName) userData.lastName = lastName;

    const user = new User(userData);

    // Hash password
    await user.hashPassword();

    // Save user
    const savedUser = await user.save();

    // Send verification email
    try {
      if (savedUser.emailVerificationToken) {
        await this.emailService.sendVerificationEmail(savedUser.email, savedUser.emailVerificationToken, savedUser.firstName);
        logger.info(`Verification email sent to ${savedUser.email}`);
      }
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      // Don't throw error, user is still created
    }

    return savedUser;
  }

  async login(email: string, password: string): Promise<AuthResult> {
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError('Account is not active. Please verify your email or contact support.', 401);
    }

    // Verify password
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Store refresh token in Redis (if available)
    if (this.redisService && user.id) {
      try {
        await this.storeRefreshToken(user.id, tokens.refreshToken);
      } catch (error) {
        logger.warn('Failed to store refresh token in Redis:', error);
      }
    }

    logger.info(`User ${user.email} logged in successfully`);

    return {
      user,
      tokens
    };
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    // Remove refresh token from Redis (if available)
    if (this.redisService && refreshToken) {
      try {
        await this.revokeRefreshToken(userId, refreshToken);
      } catch (error) {
        logger.warn('Failed to revoke refresh token:', error);
      }
    }

    logger.info(`User ${userId} logged out`);
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;

      // Check if refresh token exists in Redis (if available)
      if (this.redisService) {
        try {
          const storedToken = await this.redisService.get(`refresh_token:${payload.userId}:${refreshToken}`);
          if (!storedToken) {
            throw new AppError('Invalid refresh token', 401);
          }
        } catch (error) {
          logger.warn('Failed to check refresh token in Redis:', error);
        }
      }

      // Find user
      const user = await User.findById(payload.userId);
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new AppError('User not found or inactive', 401);
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Remove old refresh token and store new one (if Redis available)
      if (this.redisService) {
        try {
          await this.revokeRefreshToken(payload.userId, refreshToken);
          await this.storeRefreshToken(payload.userId, tokens.refreshToken);
        } catch (error) {
          logger.warn('Failed to update refresh tokens in Redis:', error);
        }
      }

      return tokens;
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async verifyEmail(token: string): Promise<User> {
    const user = await User.findByEmailVerificationToken(token);
    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    // Update user status
    user.status = UserStatus.ACTIVE;
    user.emailVerified = true;
    user.emailVerificationToken = null;

    const updatedUser = await user.save();

    logger.info(`Email verified for user ${updatedUser.email}`);

    return updatedUser;
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await User.findByEmail(email);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.emailVerified) {
      throw new AppError('Email is already verified', 400);
    }

    // Generate new verification token
    user.emailVerificationToken = this.generateVerificationToken();
    await user.save();

    // Send verification email
    if (user.emailVerificationToken) {
      await this.emailService.sendVerificationEmail(user.email, user.emailVerificationToken, user.firstName);
    }

    logger.info(`Verification email resent to ${user.email}`);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists for security
      return;
    }

    // Generate password reset token
    const resetToken = this.generateResetToken();
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send password reset email
    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetToken, user.firstName);
      logger.info(`Password reset email sent to ${user.email}`);
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw new AppError('Failed to send password reset email', 500);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await User.findByPasswordResetToken(token);
    if (!user) {
      throw new AppError('Invalid or expired password reset token', 400);
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.hashPassword();
    await user.save();

    // Revoke all refresh tokens for security (if Redis available)
    if (this.redisService && user.id) {
      try {
        await this.redisService.del(`refresh_tokens:${user.id}:*`);
      } catch (error) {
        logger.warn('Failed to revoke refresh tokens:', error);
      }
    }

    logger.info(`Password reset successful for user ${user.email}`);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Update password
    user.password = newPassword;
    await user.hashPassword();
    await user.save();

    // Revoke all refresh tokens for security (if Redis available)
    if (this.redisService) {
      try {
        await this.redisService.del(`refresh_tokens:${userId}:*`);
      } catch (error) {
        logger.warn('Failed to revoke refresh tokens:', error);
      }
    }

    logger.info(`Password changed for user ${user.email}`);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    if (!this.redisService) {
      return false; // If Redis not available, assume token is not blacklisted
    }

    try {
      const result = await this.redisService.get(`blacklisted_token:${token}`);
      return !!result;
    } catch (error) {
      logger.warn('Failed to check token blacklist:', error);
      return false;
    }
  }

  async blacklistToken(token: string): Promise<void> {
    if (!this.redisService) {
      return; // If Redis not available, skip blacklisting
    }

    try {
      // Set token to expire in 24 hours (same as access token)
      await this.redisService.set(`blacklisted_token:${token}`, 'true', 24 * 60 * 60);
    } catch (error) {
      logger.warn('Failed to blacklist token:', error);
    }
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: TokenPayload = {
      userId: user.id!,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    if (!this.redisService) return;

    const key = `refresh_token:${userId}:${refreshToken}`;
    const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
    await this.redisService.set(key, 'valid', expiresIn);
  }

  private async revokeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    if (!this.redisService) return;

    const key = `refresh_token:${userId}:${refreshToken}`;
    await this.redisService.del(key);
  }

  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async validateAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;
      
      // Optional: Check if user still exists and is active
      const user = await User.findById(payload.userId);
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new AppError('User not found or inactive', 401);
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid access token', 401);
      }
      throw error;
    }
  }
}