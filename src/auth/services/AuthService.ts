import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '@/config';
import { User } from '../models/User';
import { AppError, UnauthorizedError, BadRequestError } from '@/utils/AppError';
import { logger } from '@/utils/logger';
import { getDatabase } from '@/database/connection';
import { AuthTokens } from '../types/auth';

export interface AuthenticatedUser {
  user: User;
  tokens: AuthTokens;
}

export interface JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export class AuthService {
  // Authenticate user with email and password
  async authenticate(email: string, password: string): Promise<AuthenticatedUser | null> {
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return null;
      }

      // Check if user is active
      if (!user.isActive) {
        throw new UnauthorizedError('Account is deactivated');
      }

      // Verify password
      const isValidPassword = await user.verifyPassword(password);
      if (!isValidPassword) {
        return null;
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      logger.info(`User authenticated successfully: ${email}`);
      return { user, tokens };
    } catch (error) {
      logger.error('Authentication error:', error);
      throw error;
    }
  }

  // Generate access and refresh tokens
  async generateTokens(user: User): Promise<AuthTokens> {
    try {
      const accessTokenPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        type: 'access'
      };

      const refreshTokenPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        type: 'refresh'
      };

      const accessToken = jwt.sign(accessTokenPayload, config.jwt.secret, {
        expiresIn: '24h',
        issuer: 'celm-api',
        audience: 'celm-app',
        subject: user.id
      });

      const refreshToken = jwt.sign(refreshTokenPayload, config.jwt.refreshSecret, {
        expiresIn: '24h',
        issuer: 'celm-api',
        audience: 'celm-app',
        subject: user.id
      });

      // Store refresh token in database
      await this.storeRefreshToken(user.id, refreshToken);

      // Calculate expiration time
      const expiresIn = this.getTokenExpirationTime(config.jwt.expiresIn);

      return {
        accessToken,
        refreshToken,
        expiresIn
      };
    } catch (error) {
      logger.error('Token generation error:', error);
      throw new AppError('Failed to generate tokens', 500);
    }
  }

  // Validate access token
  async validateAccessToken(token: string): Promise<JWTPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.secret, {
        issuer: 'celm-api',
        audience: 'celm-app'
      }) as JWTPayload;

      if (payload.type !== 'access') {
        throw new UnauthorizedError('Invalid token type');
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid access token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Access token expired');
      }
      throw error;
    }
  }

  // Refresh tokens
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      // Validate refresh token
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret, {
        issuer: 'celm-api',
        audience: 'celm-app'
      }) as JWTPayload;

      if (payload.type !== 'refresh') {
        throw new UnauthorizedError('Invalid token type');
      }

      // Check if refresh token exists in database
      const isValidRefreshToken = await this.validateRefreshToken(payload.userId, refreshToken);
      if (!isValidRefreshToken) {
        throw new UnauthorizedError('Refresh token not found or expired');
      }

      // Get user
      const user = await User.findById(payload.userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedError('User not found or inactive');
      }

      // Revoke old refresh token
      await this.revokeRefreshToken(refreshToken);

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      logger.info(`Tokens refreshed for user: ${user.email}`);
      return tokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token expired');
      }
      throw error;
    }
  }

  // Generate password reset token
  async generatePasswordResetToken(email: string): Promise<string> {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists
        logger.warn(`Password reset attempted for non-existent email: ${email}`);
        return crypto.randomBytes(32).toString('hex'); // Return dummy token
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store reset token
      await this.storePasswordResetToken(user.id, hashedToken, expiresAt);

      logger.info(`Password reset token generated for user: ${email}`);
      return resetToken;
    } catch (error) {
      logger.error('Password reset token generation error:', error);
      throw new AppError('Failed to generate password reset token', 500);
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find valid reset token
      const db = getDatabase();
      const resetRecord = await db('password_resets')
        .where('token', hashedToken)
        .where('expires_at', '>', new Date())
        .first();

      if (!resetRecord) {
        throw new BadRequestError('Invalid or expired reset token');
      }

      // Get user
      const user = await User.findById(resetRecord.user_id);
      if (!user) {
        throw new BadRequestError('User not found');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Delete used reset token
      await db('password_resets').where('token', hashedToken).del();

      // Revoke all user sessions for security
      await this.revokeAllUserTokens(user.id);

      logger.info(`Password reset completed for user: ${user.email}`);
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }

  // Store refresh token
  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    try {
      const db = getDatabase();
      const expiresAt = new Date(Date.now() + this.getTokenExpirationTime(config.jwt.refreshExpiresIn));
      const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

      await db('refresh_tokens').insert({
        user_id: userId,
        token: hashedToken,
        expires_at: expiresAt,
        created_at: new Date()
      });
    } catch (error) {
      logger.error('Store refresh token error:', error);
      throw new AppError('Failed to store refresh token', 500);
    }
  }

  // Validate refresh token
  private async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    try {
      const db = getDatabase();
      const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

      const token = await db('refresh_tokens')
        .where('user_id', userId)
        .where('token', hashedToken)
        .where('expires_at', '>', new Date())
        .first();

      return !!token;
    } catch (error) {
      logger.error('Validate refresh token error:', error);
      return false;
    }
  }

  // Revoke refresh token
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const db = getDatabase();
      const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

      await db('refresh_tokens').where('token', hashedToken).del();
    } catch (error) {
      logger.error('Revoke refresh token error:', error);
      // Don't throw error for revocation failures
    }
  }

  // Revoke all user tokens
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      const db = getDatabase();
      await db('refresh_tokens').where('user_id', userId).del();
      await db('password_resets').where('user_id', userId).del();

      logger.info(`All tokens revoked for user: ${userId}`);
    } catch (error) {
      logger.error('Revoke all tokens error:', error);
      // Don't throw error for revocation failures
    }
  }

  // Store password reset token
  private async storePasswordResetToken(userId: string, hashedToken: string, expiresAt: Date): Promise<void> {
    try {
      const db = getDatabase();

      // Delete any existing reset tokens for this user
      await db('password_resets').where('user_id', userId).del();

      // Store new reset token
      await db('password_resets').insert({
        user_id: userId,
        token: hashedToken,
        expires_at: expiresAt,
        created_at: new Date()
      });
    } catch (error) {
      logger.error('Store password reset token error:', error);
      throw new AppError('Failed to store password reset token', 500);
    }
  }

  // Convert expiration string to milliseconds
  private getTokenExpirationTime(expiresIn: string): number {
    const timeValue = parseInt(expiresIn.slice(0, -1));
    const timeUnit = expiresIn.slice(-1);

    switch (timeUnit) {
      case 's':
        return timeValue * 1000;
      case 'm':
        return timeValue * 60 * 1000;
      case 'h':
        return timeValue * 60 * 60 * 1000;
      case 'd':
        return timeValue * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000; // Default to 24 hours
    }
  }
}