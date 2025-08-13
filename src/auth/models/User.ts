import { IsEmail, IsString, IsBoolean, IsOptional, IsEnum, IsUUID } from 'class-validator';
import bcrypt from 'bcryptjs';
import { getDatabase } from '@/database/connection';
import { config } from '@/config';
import { BusinessTypeOption } from '../types/auth';
import { AppError } from '@/utils/AppError';
import { logger } from '@/utils/logger';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export class User {
  @IsUUID()
  id!: string;

  @IsEmail()
  email!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  shopUrl?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  businessDescription?: string;

  @IsOptional()
  @IsEnum(BusinessTypeOption)
  businessType?: BusinessTypeOption;

  @IsOptional()
  location?: {
    country: string;
    state: string;
    localGovernment: string;
    address: string;
  };

  @IsOptional()
  @IsString()
  oauthProvider?: string;

  @IsOptional()
  @IsString()
  oauthId?: string;

  @IsOptional()
  oauthProfile?: any;

  @IsBoolean()
  isActive: boolean = true;

  @IsBoolean()
  emailVerified: boolean = false;

  @IsBoolean()
  onboardingCompleted: boolean = false;

  // Password reset fields
  @IsOptional()
  @IsString()
  passwordResetToken?: string;

  @IsOptional()
  passwordResetExpires?: Date;

  createdAt!: Date;
  updatedAt!: Date;

  constructor(data?: Partial<User>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  // Hash password before saving
  async hashPassword(): Promise<void> {
    if (this.password && !this.password.startsWith('$2a$')) {
      this.password = await bcrypt.hash(this.password, config.security.bcryptRounds);
    }
  }

  // Verify password
  async verifyPassword(plainPassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(plainPassword, this.password);
  }

  // Find user by ID
  static async findById(id: string): Promise<User | null> {
    const db = getDatabase();
    
    try {
      const userData = await db('users').where('id', id).first();
      if (!userData) return null;
      
      return new User(this.parseUserData(userData));
    } catch (error) {
      logger.error('Failed to find user by ID:', error);
      return null;
    }
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    const db = getDatabase();
    
    try {
      const userData = await db('users').where('email', email).first();
      if (!userData) return null;
      
      return new User(this.parseUserData(userData));
    } catch (error) {
      logger.error('Failed to find user by email:', error);
      return null;
    }
  }

  // Find user by shop URL
  static async findByShopUrl(shopUrl: string): Promise<User | null> {
    const db = getDatabase();
    
    try {
      const userData = await db('users').where('shop_url', shopUrl).first();
      if (!userData) return null;
      
      return new User(this.parseUserData(userData));
    } catch (error) {
      logger.error('Failed to find user by shop URL:', error);
      return null;
    }
  }

  // Find user by password reset token
  static async findByPasswordResetToken(hashedToken: string): Promise<User | null> {
    const db = getDatabase();
    
    try {
      const userData = await db('users')
        .where('password_reset_token', hashedToken)
        .where('password_reset_expires', '>', new Date())
        .first();
      
      if (!userData) return null;
      
      return new User(this.parseUserData(userData));
    } catch (error) {
      logger.error('Failed to find user by password reset token:', error);
      return null;
    }
  }

  // Save user
  async save(): Promise<User> {
    const db = getDatabase();
    
    try {
      if (this.password && !this.password.startsWith('$2a$')) {
        await this.hashPassword();
      }

      const userData = {
        email: this.email,
        first_name: this.firstName,
        last_name: this.lastName,
        password: this.password,
        shop_url: this.shopUrl,
        business_name: this.businessName,
        business_description: this.businessDescription,
        business_type: this.businessType,
        location: this.location ? JSON.stringify(this.location) : null,
        oauth_provider: this.oauthProvider,
        oauth_id: this.oauthId,
        oauth_profile: this.oauthProfile ? JSON.stringify(this.oauthProfile) : null,
        is_active: this.isActive,
        email_verified: this.emailVerified,
        onboarding_completed: this.onboardingCompleted,
        password_reset_token: this.passwordResetToken,
        password_reset_expires: this.passwordResetExpires,
        updated_at: new Date()
      };

      if (this.id) {
        const [updated] = await db('users')
          .where('id', this.id)
          .update(userData)
          .returning('*');
        this.updatedAt = new Date(updated.updated_at);
      } else {
        const [created] = await db('users')
          .insert({ ...userData, created_at: new Date() })
          .returning('*');
        this.id = created.id;
        this.createdAt = new Date(created.created_at);
        this.updatedAt = new Date(created.updated_at);
      }

      return this;
    } catch (error) {
      logger.error('Failed to save user:', error);
      throw new AppError('Failed to save user', 500);
    }
  }

  // Save with transaction
  async saveWithTransaction(trx: any): Promise<User> {
    try {
      if (this.password && !this.password.startsWith('$2a$')) {
        await this.hashPassword();
      }

      const userData = {
        email: this.email,
        first_name: this.firstName,
        last_name: this.lastName,
        password: this.password,
        shop_url: this.shopUrl,
        business_name: this.businessName,
        business_description: this.businessDescription,
        business_type: this.businessType,
        location: this.location ? JSON.stringify(this.location) : null,
        oauth_provider: this.oauthProvider,
        oauth_id: this.oauthId,
        oauth_profile: this.oauthProfile ? JSON.stringify(this.oauthProfile) : null,
        is_active: this.isActive,
        email_verified: this.emailVerified,
        onboarding_completed: this.onboardingCompleted,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [created] = await trx('users').insert(userData).returning('*');
      this.id = created.id;
      this.createdAt = new Date(created.created_at);
      this.updatedAt = new Date(created.updated_at);

      return this;
    } catch (error) {
      logger.error('Failed to save user with transaction:', error);
      throw new AppError('Failed to save user', 500);
    }
  }

  // Update password reset token
  async updatePasswordResetToken(hashedToken: string, expiresAt: Date): Promise<void> {
    const db = getDatabase();
    
    try {
      await db('users')
        .where('id', this.id)
        .update({
          password_reset_token: hashedToken,
          password_reset_expires: expiresAt,
          updated_at: new Date()
        });

      this.passwordResetToken = hashedToken;
      this.passwordResetExpires = expiresAt;
    } catch (error) {
      logger.error('Failed to update password reset token:', error);
      throw new AppError('Failed to update password reset token', 500);
    }
  }

  // Clear password reset token
  async clearPasswordResetToken(): Promise<void> {
    const db = getDatabase();
    
    try {
      await db('users')
        .where('id', this.id)
        .update({
          password_reset_token: null,
          password_reset_expires: null,
          updated_at: new Date()
        });

      this.passwordResetToken = undefined;
      this.passwordResetExpires = undefined;
    } catch (error) {
      logger.error('Failed to clear password reset token:', error);
      throw new AppError('Failed to clear password reset token', 500);
    }
  }

  // Parse database user data
  private static parseUserData(userData: any): any {
    return {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      password: userData.password,
      shopUrl: userData.shop_url,
      businessName: userData.business_name,
      businessDescription: userData.business_description,
      businessType: userData.business_type,
      location: userData.location ? JSON.parse(userData.location) : null,
      oauthProvider: userData.oauth_provider,
      oauthId: userData.oauth_id,
      oauthProfile: userData.oauth_profile ? JSON.parse(userData.oauth_profile) : null,
      isActive: userData.is_active,
      emailVerified: userData.email_verified,
      onboardingCompleted: userData.onboarding_completed,
      passwordResetToken: userData.password_reset_token,
      passwordResetExpires: userData.password_reset_expires ? new Date(userData.password_reset_expires) : null,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at)
    };
  }

  // Convert to safe JSON (without sensitive data)
  toSafeJSON(): any {
    const { password, passwordResetToken, passwordResetExpires, oauthProfile, ...safeUser } = this;
    return safeUser;
  }

  // Get full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  // Check if user has completed onboarding
  hasCompletedOnboarding(): boolean {
    return !!(this.shopUrl && this.businessName && this.businessType && this.location && this.onboardingCompleted);
  }
}