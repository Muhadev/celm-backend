import { OAuth2Client } from 'google-auth-library';
import { config } from '@/config';
import { GoogleProfile } from '../types/auth';
import { AppError } from '@/utils/AppError';
import { logger } from '@/utils/logger';

export class GoogleOAuthService {
  private client: OAuth2Client;

  constructor() {
    if (!config.google.clientId) {
      logger.warn('Google OAuth not configured - GOOGLE_CLIENT_ID missing');
    }
    this.client = new OAuth2Client(config.google.clientId);
  }

  async verifyToken(token: string): Promise<GoogleProfile> {
    try {
      if (!config.google.clientId) {
        throw new AppError('Google OAuth not configured', 500);
      }

      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: config.google.clientId
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new AppError('Invalid Google token payload', 400);
      }

      const profile: GoogleProfile = {
        id: payload.sub,
        email: payload.email!,
        name: payload.name!,
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture,
        verified_email: payload.email_verified
      };

      if (!profile.verified_email) {
        throw new AppError('Google email is not verified', 400);
      }

      logger.info(`Google OAuth verification successful for: ${profile.email}`);
      return profile;

    } catch (error) {
      logger.error('Google OAuth verification failed:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to verify Google token', 400);
    }
  }

  // Check if Google OAuth is configured
  isConfigured(): boolean {
    return !!config.google.clientId && !!config.google.clientSecret;
  }
}