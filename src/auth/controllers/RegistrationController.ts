import { Request, Response, NextFunction } from 'express';
import { RegistrationSession } from '../models/RegistrationSession';
import { User } from '../models/User';
import { AuthService } from '../services/AuthService';
import { EmailService } from '../services/EmailService';
import { OAuthProvider } from '../types/auth';
import { GoogleOAuthService } from '../services/GoogleOAuthService';
import { AppError, ValidationError, BadRequestError } from '@/utils/AppError';
import { logger } from '@/utils/logger';
import { getDatabase } from '@/database/connection';
import { 
  RegistrationStep, 
  BusinessTypeOption,
  EmailStepData,
  PersonalInfoStepData,
  BusinessTypeStepData,
  ShopDetailsStepData,
  LocationStepData
} from '../types/auth';
import Joi from 'joi';

// Validation schemas
const emailStepSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

const personalInfoStepSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).when('$isOAuth', {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const businessTypeStepSchema = Joi.object({
  businessType: Joi.string().valid(...Object.values(BusinessTypeOption)).required()
});

const shopDetailsStepSchema = Joi.object({
  businessName: Joi.string().min(2).max(100).required(),
  businessDescription: Joi.string().min(10).max(500).required()
});

const locationStepSchema = Joi.object({
  country: Joi.string().min(2).max(100).required(),
  state: Joi.string().min(2).max(100).required(),
  localGovernment: Joi.string().min(2).max(100).required(),
  address: Joi.string().min(5).max(255).required()
});

export class RegistrationController {
  private authService: AuthService;
  private emailService: EmailService;
  private googleOAuthService: GoogleOAuthService;

  constructor() {
    this.authService = new AuthService();
    this.emailService = new EmailService();
    this.googleOAuthService = new GoogleOAuthService();
  }

  // Step 1: Email input and session creation
  startRegistration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = emailStepSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      const { email } = value as EmailStepData;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new BadRequestError('User with this email already exists');
      }

      // Create registration session
      const session = await RegistrationSession.createSession(email);

      // Send verification email for manual registration
      if (!session.emailVerified) {
        await this.emailService.sendVerificationEmail(email, session.verificationToken!, session.sessionToken);
      }

      res.status(201).json({
        success: true,
        message: 'Registration started. Please check your email for verification.',
        data: {
          sessionToken: session.sessionToken,
          currentStep: session.currentStep,
          emailVerified: session.emailVerified
        }
      });

      logger.info(`Registration started for email: ${email}`);
    } catch (error) {
      next(error);
    }
  };

  // Verify email
  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params;
      const { sessionToken } = req.body;

      if (!token || !sessionToken) {
        throw new BadRequestError('Verification token and session token are required');
      }

      const session = await RegistrationSession.findByToken(sessionToken);
      if (!session) {
        throw new BadRequestError('Invalid or expired registration session');
      }

      if (session.verificationToken !== token) {
        throw new BadRequestError('Invalid verification token');
      }

      session.emailVerified = true;
      session.verificationToken = undefined;
      session.currentStep = RegistrationStep.PERSONAL_INFO;
      await session.save();

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        data: {
          sessionToken: session.sessionToken,
          currentStep: session.currentStep
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Google OAuth registration
  googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { googleToken } = req.body;

      if (!googleToken) {
        throw new BadRequestError('Google token is required');
      }

      const profile = await this.googleOAuthService.verifyToken(googleToken);

      // Check if user already exists
      const existingUser = await User.findByEmail(profile.email);
      if (existingUser) {
        throw new BadRequestError('User with this email already exists');
      }

      // Create OAuth session
      const session = await RegistrationSession.createOAuthSession(profile.email, OAuthProvider.GOOGLE, profile);

      res.status(201).json({
        success: true,
        message: 'Google authentication successful',
        data: {
          sessionToken: session.sessionToken,
          currentStep: session.currentStep,
          profile: {
            email: profile.email,
            firstName: profile.given_name,
            lastName: profile.family_name
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Step 2: Personal information
  submitPersonalInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionToken } = req.headers;
      const session = await this.validateSession(sessionToken as string, RegistrationStep.EMAIL_INPUT);

      const { error, value } = personalInfoStepSchema.validate(req.body, {
        context: { isOAuth: !!session.oauthProvider }
      });
      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      await session.updateStep(RegistrationStep.PERSONAL_INFO, value);
      await session.nextStep();

      res.status(200).json({
        success: true,
        message: 'Personal information saved',
        data: {
          sessionToken: session.sessionToken,
          currentStep: session.currentStep
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Step 3: Business type
  submitBusinessType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionToken } = req.headers;
      const session = await this.validateSession(sessionToken as string, RegistrationStep.PERSONAL_INFO);

      const { error, value } = businessTypeStepSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      await session.updateStep(RegistrationStep.BUSINESS_TYPE, value);
      await session.nextStep();

      res.status(200).json({
        success: true,
        message: 'Business type selected',
        data: {
          sessionToken: session.sessionToken,
          currentStep: session.currentStep
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Step 4: Shop details with auto-generated URL
  submitShopDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionToken } = req.headers;
      const session = await this.validateSession(sessionToken as string, RegistrationStep.BUSINESS_TYPE);

      const { error, value } = shopDetailsStepSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      const { businessName, businessDescription } = value;

      // Auto-generate shop URL
      const shopUrl = await this.generateUniqueShopUrl(businessName);

      const shopDetailsData = {
        businessName,
        businessDescription,
        shopUrl: `${shopUrl}.celm.com`
      };

      await session.updateStep(RegistrationStep.SHOP_DETAILS, shopDetailsData);
      await session.nextStep();

      res.status(200).json({
        success: true,
        message: 'Shop details saved',
        data: {
          sessionToken: session.sessionToken,
          currentStep: session.currentStep,
          generatedShopUrl: shopDetailsData.shopUrl
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Step 5: Location and complete registration
  submitLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionToken } = req.headers;
      const session = await this.validateSession(sessionToken as string, RegistrationStep.SHOP_DETAILS);

      const { error, value } = locationStepSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details.map(detail => detail.message).join(', '));
      }

      await session.updateStep(RegistrationStep.LOCATION, value);
      
      // Complete registration
      const result = await this.completeRegistration(session);

      res.status(201).json({
        success: true,
        message: 'Registration completed successfully! Welcome to Celm!',
        data: {
          user: result.user,
          tokens: result.tokens
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Helper: Generate unique shop URL
  private async generateUniqueShopUrl(businessName: string): Promise<string> {
    let baseUrl = businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);

    let shopUrl = baseUrl;
    let counter = 1;

    // Find available URL
    while (!(await RegistrationSession.isShopUrlAvailable(shopUrl))) {
      shopUrl = `${baseUrl}-${counter}`;
      counter++;
    }

    return shopUrl;
  }

  // Helper: Validate session
  private async validateSession(sessionToken: string, requiredStep: RegistrationStep): Promise<RegistrationSession> {
    if (!sessionToken) {
      throw new BadRequestError('Session token is required');
    }

    const session = await RegistrationSession.findByToken(sessionToken);
    if (!session) {
      throw new BadRequestError('Invalid or expired registration session');
    }

    if (session.currentStep < requiredStep) {
      throw new BadRequestError(`Please complete previous steps first`);
    }

    return session;
  }

  // Complete registration
  private async completeRegistration(session: RegistrationSession): Promise<any> {
    const db = getDatabase();
    
    return await db.transaction(async (trx) => {
      // Create user with business data embedded
      const userData = {
        email: session.email,
        firstName: session.stepData.step2!.firstName,
        lastName: session.stepData.step2!.lastName,
        password: session.stepData.step2!.password,
        shopUrl: session.stepData.step4!.shopUrl.replace('.celm.com', ''),
        businessName: session.stepData.step4!.businessName,
        businessDescription: session.stepData.step4!.businessDescription,
        businessType: session.stepData.step3!.businessType,
        location: session.stepData.step5!,
        oauthProvider: session.oauthProvider,
        oauthId: session.oauthId,
        isActive: true,
        emailVerified: true
      };

      const user = new User(userData);
      const savedUser = await user.saveWithTransaction(trx);

      // Generate tokens
      const tokens = await this.authService.generateTokens(savedUser);

      // Send welcome email
      await this.emailService.sendWelcomeEmail(savedUser.email, savedUser.firstName);

      // Clean up session
      await session.delete();

      return {
        user: savedUser.toSafeJSON(),
        tokens
      };
    });
  }
}