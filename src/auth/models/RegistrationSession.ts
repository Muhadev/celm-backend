import { IsEmail, IsString, IsBoolean, IsOptional, IsObject, IsUUID, IsEnum } from 'class-validator';
import { getDatabase } from '@/database/connection';
import { 
  RegistrationSession as IRegistrationSession, 
  RegistrationStep, 
  RegistrationStepData,
  OAuthProvider,
  GoogleProfile 
} from '../types/auth';
import crypto from 'crypto';

export class RegistrationSession implements IRegistrationSession {
  @IsUUID()
  id!: string;

  @IsEmail()
  email!: string;

  @IsString()
  sessionToken!: string;

  @IsObject()
  stepData: RegistrationStepData = {};

  @IsEnum(RegistrationStep)
  currentStep: RegistrationStep = RegistrationStep.EMAIL_INPUT;

  totalSteps: number = 5;

  @IsBoolean()
  emailVerified: boolean = false;

  @IsOptional()
  @IsString()
  verificationToken?: string;

  @IsOptional()
  @IsEnum(OAuthProvider)
  oauthProvider?: OAuthProvider;

  @IsOptional()
  @IsString()
  oauthId?: string;

  @IsOptional()
  @IsObject()
  oauthData?: GoogleProfile;

  expiresAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(data?: Partial<RegistrationSession>) {
    if (data) {
      Object.assign(this, data);
    }
    
    // Set default expiration (2 hours)
    if (!this.expiresAt) {
      this.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    }
  }

  // Generate session token
  static generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate verification token
  static generateVerificationToken(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  // Create new registration session
  static async createSession(email: string, isOAuth: boolean = false): Promise<RegistrationSession> {
    const db = getDatabase();
    
    // Check if email already has an active session
    await this.cleanupExpiredSessions();
    const existingSession = await this.findByEmail(email);
    if (existingSession && existingSession.expiresAt > new Date()) {
      return existingSession;
    }

    const sessionData = {
      email,
      session_token: this.generateSessionToken(),
      verification_token: this.generateVerificationToken(),
      step_data: JSON.stringify({
        step1: { email, isOAuth }
      }),
      current_step: isOAuth ? RegistrationStep.PERSONAL_INFO : RegistrationStep.EMAIL_INPUT,
      email_verified: isOAuth, // OAuth emails are pre-verified
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      created_at: new Date(),
      updated_at: new Date()
    };

    const [session] = await db('registration_sessions')
      .insert(sessionData)
      .returning('*');

    return new RegistrationSession(RegistrationSession.parseSessionData(session));
  }

  // Create OAuth session
  static async createOAuthSession(email: string, provider: OAuthProvider, profile: GoogleProfile): Promise<RegistrationSession> {
    const session = await this.createSession(email, true);
    
    session.oauthProvider = provider;
    session.oauthId = profile.id;
    session.oauthData = profile;
    session.emailVerified = true;
    
    // Pre-fill personal info from OAuth
    session.stepData.step2 = {
      firstName: profile.given_name || profile.name.split(' ')[0] || '',
      lastName: profile.family_name || profile.name.split(' ').slice(1).join(' ') || ''
    };

    await session.save();
    return session;
  }

  // Find session by token
  static async findByToken(sessionToken: string): Promise<RegistrationSession | null> {
    const db = getDatabase();
    const session = await db('registration_sessions')
      .where('session_token', sessionToken)
      .first();

    if (!session) return null;
    
    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      await this.deleteExpiredSession(session.id);
      return null;
    }

    return new RegistrationSession(RegistrationSession.parseSessionData(session));
  }

  // Find session by email
  static async findByEmail(email: string): Promise<RegistrationSession | null> {
    const db = getDatabase();
    const session = await db('registration_sessions')
      .where('email', email)
      .orderBy('created_at', 'desc')
      .first();

    if (!session) return null;
    return new RegistrationSession(RegistrationSession.parseSessionData(session));
  }

  // Update step data
  async updateStep(step: RegistrationStep, data: any): Promise<void> {
    this.stepData[`step${step}` as keyof RegistrationStepData] = data;
    this.currentStep = step;
    this.updatedAt = new Date();
    await this.save();
  }

  // Move to next step
  async nextStep(): Promise<void> {
    if (this.currentStep < this.totalSteps) {
      this.currentStep = (this.currentStep + 1) as RegistrationStep;
      this.updatedAt = new Date();
      await this.save();
    }
  }

  // Generate shop URL from business name
  // static generateShopUrl(businessName: string): string {
  //   const baseUrl = businessName
  //     .toLowerCase()
  //     .replace(/[^a-z0-9\s]/g, '')
  //     .replace(/\s+/g, '')
  //     .substring(0, 20);
    
  //   return `${baseUrl}.celm.com`;
  // }

  // Validate custom shop URL format
  static validateShopUrlFormat(shopUrl: string): boolean {
    const regex = /^[a-z0-9-]+\.celm\.com$/;
    
    if (!regex.test(shopUrl)) {
      return false;
    }
    
    const subdomain = shopUrl.replace('.celm.com', '');
    
    return subdomain.length >= 3 && 
          subdomain.length <= 30 && 
          !subdomain.startsWith('-') && 
          !subdomain.endsWith('-') &&
          !subdomain.includes('--');
  }

  // Generate unique shop URL with counter
  static async generateUniqueShopUrl(businessName: string): Promise<string> {
    const baseUrl = this.generateBaseShopUrl(businessName);
    
    if (await this.isShopUrlAvailable(`${baseUrl}.celm.com`)) {
      return `${baseUrl}.celm.com`;
    }
    
    const db = getDatabase();
    let counter = 2;
    
    while (counter <= 999) {
      const candidateUrl = `${baseUrl}${counter}.celm.com`;
      
      const existing = await db('users')
        .where('shop_url', candidateUrl)
        .first();
        
      if (!existing) {
        return candidateUrl;
      }
      
      counter++;
    }
    
    const randomSuffix = Math.floor(Math.random() * 10000);
    return `${baseUrl}${randomSuffix}.celm.com`;
  }

  // Generate base shop URL from business name
  static generateBaseShopUrl(businessName: string): string {
    return businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .substring(0, 20);
  }

  // Get suggested alternatives for a shop URL
  static async getShopUrlSuggestions(businessName: string, count: number = 5): Promise<string[]> {
    const baseUrl = this.generateBaseShopUrl(businessName);
    const suggestions: string[] = [];
    const db = getDatabase();
    
    const originalUrl = `${baseUrl}.celm.com`;
    if (await this.isShopUrlAvailable(originalUrl)) {
      suggestions.push(originalUrl);
    }
    
    for (let i = 2; suggestions.length < count && i <= 20; i++) {
      const candidate = `${baseUrl}${i}.celm.com`;
      if (await this.isShopUrlAvailable(candidate)) {
        suggestions.push(candidate);
      }
    }
    
    const variations = [
      `${baseUrl}shop.celm.com`,
      `${baseUrl}store.celm.com`,
      `${baseUrl}biz.celm.com`,
      `my${baseUrl}.celm.com`,
      `the${baseUrl}.celm.com`
    ];
    
    for (const variation of variations) {
      if (suggestions.length >= count) break;
      if (await this.isShopUrlAvailable(variation)) {
        suggestions.push(variation);
      }
    }
    
    return suggestions.slice(0, count);
  }

  // Check if shop URL is available
  static async isShopUrlAvailable(shopUrl: string): Promise<boolean> {
    const db = getDatabase();
    const existing = await db('users')
      .where('shop_url', shopUrl)
      .first();
    return !existing;
  }

  // Save session
  async save(): Promise<RegistrationSession> {
    const db = getDatabase();
    
    const sessionData = {
      email: this.email,
      session_token: this.sessionToken,
      step_data: JSON.stringify(this.stepData),
      current_step: this.currentStep,
      total_steps: this.totalSteps,
      email_verified: this.emailVerified,
      verification_token: this.verificationToken,
      oauth_provider: this.oauthProvider,
      oauth_id: this.oauthId,
      oauth_data: this.oauthData ? JSON.stringify(this.oauthData) : null,
      expires_at: this.expiresAt,
      updated_at: new Date()
    };

    if (this.id) {
      const [updated] = await db('registration_sessions')
        .where('id', this.id)
        .update(sessionData)
        .returning('*');
      return new RegistrationSession(RegistrationSession.parseSessionData(updated));
    } else {
      const [created] = await db('registration_sessions')
        .insert({ ...sessionData, created_at: new Date() })
        .returning('*');
      return new RegistrationSession(RegistrationSession.parseSessionData(created));
    }
  }

  // Delete session
  async delete(): Promise<void> {
    const db = getDatabase();
    await db('registration_sessions').where('id', this.id).del();
  }

  // Cleanup expired sessions
  static async cleanupExpiredSessions(): Promise<void> {
    const db = getDatabase();
    await db('registration_sessions')
      .where('expires_at', '<', new Date())
      .del();
  }

  // Delete specific expired session
  static async deleteExpiredSession(id: string): Promise<void> {
    const db = getDatabase();
    await db('registration_sessions').where('id', id).del();
  }

  // Parse database session data
  private static parseSessionData(session: any): any {
    return {
      id: session.id,
      email: session.email,
      sessionToken: session.session_token,
      stepData: session.step_data ? JSON.parse(session.step_data) : {},
      currentStep: session.current_step,
      totalSteps: session.total_steps,
      emailVerified: session.email_verified,
      verificationToken: session.verification_token,
      oauthProvider: session.oauth_provider,
      oauthId: session.oauth_id,
      oauthData: session.oauth_data ? JSON.parse(session.oauth_data) : null,
      expiresAt: new Date(session.expires_at),
      createdAt: new Date(session.created_at),
      updatedAt: new Date(session.updated_at)
    };
  }

  // Validate step data
  isStepValid(step: RegistrationStep): boolean {
    const data = this.stepData[`step${step}` as keyof RegistrationStepData];
    if (!data) return false;

    switch (step) {
      case RegistrationStep.EMAIL_INPUT:
        return !!(data as any).email;
      case RegistrationStep.PERSONAL_INFO:
        const personalData = data as any;
        return !!(personalData.firstName && personalData.lastName && 
                 (personalData.password || this.oauthProvider));
      case RegistrationStep.BUSINESS_TYPE:
        return !!(data as any).businessType;
      case RegistrationStep.SHOP_DETAILS:
        const shopData = data as any;
        return !!(shopData.businessName && shopData.businessDescription && shopData.shopUrl);
      case RegistrationStep.LOCATION:
        const locationData = data as any;
        return !!(locationData.country && locationData.state && 
                 locationData.localGovernment && locationData.address);
      default:
        return false;
    }
  }

  // Check if all steps are complete
  isComplete(): boolean {
    for (let step = 1; step <= this.totalSteps; step++) {
      if (!this.isStepValid(step as RegistrationStep)) {
        return false;
      }
    }
    return true;
  }
}