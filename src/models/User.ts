import bcrypt from 'bcryptjs';
import { getDatabase } from '@/database/connection';
import { config } from '@/config';
import { AppError } from '@/utils/AppError';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

interface UserConstructorData {
  id?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImage?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
  emailVerificationToken?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  lastLogin?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  public id?: string;
  public email: string;
  private _password: string;
  public firstName?: string;
  public lastName?: string;
  public phoneNumber?: string;
  public profileImage?: string;
  public role: UserRole;
  public status: UserStatus;
  public emailVerified: boolean;
  public emailVerificationToken?: string | null;
  public passwordResetToken?: string | null;
  public passwordResetExpires?: Date | null;
  public lastLogin?: Date | null;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(data: UserConstructorData = {}) {
    this.email = data.email ?? '';
    this._password = data.password ?? '';
    
    // Handle optional string properties
    if (data.firstName !== undefined) {
      this.firstName = data.firstName;
    }
    if (data.lastName !== undefined) {
      this.lastName = data.lastName;
    }
    if (data.phoneNumber !== undefined) {
      this.phoneNumber = data.phoneNumber;
    }
    if (data.profileImage !== undefined) {
      this.profileImage = data.profileImage;
    }
    
    this.role = data.role ?? UserRole.USER;
    this.status = data.status ?? UserStatus.PENDING;
    this.emailVerified = data.emailVerified ?? false;
    
    // Handle nullable properties explicitly
    this.emailVerificationToken = data.emailVerificationToken ?? null;
    this.passwordResetToken = data.passwordResetToken ?? null;
    this.passwordResetExpires = data.passwordResetExpires ?? null;
    this.lastLogin = data.lastLogin ?? null;
    
    // Handle optional Date properties
    if (data.createdAt !== undefined) {
      this.createdAt = data.createdAt;
    }
    if (data.updatedAt !== undefined) {
      this.updatedAt = data.updatedAt;
    }
    if (data.id !== undefined) {
      this.id = data.id;
    }
  }

  // Public getter and setter for password
  public get password(): string {
    return this._password;
  }

  public set password(value: string) {
    this._password = value;
  }

  public async hashPassword(): Promise<void> {
    if (this._password) {
      this._password = await bcrypt.hash(this._password, 12); // Use default 12 rounds
    }
  }

  public async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this._password);
  }

  public get fullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }

  public async save(): Promise<User> {
    const db = getDatabase();
    const now = new Date();

    try {
      if (this.id) {
        // Update existing user
        this.updatedAt = now;
        const userData = this.toDatabase();
        delete userData.id; // Remove id from update data
        
        await db('users').where('id', this.id).update(userData);
        
        const [updatedUser] = await db('users').where('id', this.id).select('*');
        return this.fromDatabase(updatedUser);
      } else {
        // Create new user
        this.createdAt = now;
        this.updatedAt = now;
        
        // Hash password before saving
        if (this._password) {
          await this.hashPassword();
        }
        
        const userData = this.toDatabase();
        const [newUser] = await db('users').insert(userData).returning('*');
        return this.fromDatabase(newUser);
      }
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new AppError('Email already exists', 400);
      }
      throw error;
    }
  }

  public async delete(): Promise<boolean> {
    if (!this.id) {
      throw new AppError('Cannot delete user without ID', 400);
    }

    const db = getDatabase();
    const deletedRows = await db('users').where('id', this.id).del();
    return deletedRows > 0;
  }

  public toJSON(): Record<string, any> {
    const result: Record<string, any> = {
      id: this.id,
      email: this.email,
      role: this.role,
      status: this.status,
      emailVerified: this.emailVerified,
    };

    // Only include optional properties if they exist
    if (this.firstName !== undefined) {
      result.firstName = this.firstName;
    }
    if (this.lastName !== undefined) {
      result.lastName = this.lastName;
    }
    if (this.phoneNumber !== undefined) {
      result.phoneNumber = this.phoneNumber;
    }
    if (this.profileImage !== undefined) {
      result.profileImage = this.profileImage;
    }
    if (this.lastLogin !== undefined) {
      result.lastLogin = this.lastLogin;
    }
    if (this.createdAt !== undefined) {
      result.createdAt = this.createdAt;
    }
    if (this.updatedAt !== undefined) {
      result.updatedAt = this.updatedAt;
    }

    return result;
  }

  private toDatabase(): Record<string, any> {
    return {
      id: this.id,
      email: this.email,
      password: this._password,
      first_name: this.firstName ?? null,
      last_name: this.lastName ?? null,
      phone_number: this.phoneNumber ?? null,
      profile_image: this.profileImage ?? null,
      role: this.role,
      status: this.status,
      email_verified: this.emailVerified,
      email_verification_token: this.emailVerificationToken,
      password_reset_token: this.passwordResetToken,
      password_reset_expires: this.passwordResetExpires,
      last_login: this.lastLogin,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  private fromDatabase(userData: any): User {
    const user = new User({
      id: userData.id,
      email: userData.email,
      password: userData.password,
      firstName: userData.first_name || undefined,
      lastName: userData.last_name || undefined,
      phoneNumber: userData.phone_number || undefined,
      profileImage: userData.profile_image || undefined,
      role: userData.role,
      status: userData.status,
      emailVerified: userData.email_verified,
      emailVerificationToken: userData.email_verification_token || null,
      passwordResetToken: userData.password_reset_token || null,
      passwordResetExpires: userData.password_reset_expires || null,
      lastLogin: userData.last_login || null,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
    });

    // Don't hash password again since it's already hashed from DB
    user._password = userData.password;
    
    return user;
  }

  // Static methods
  static async findById(id: string): Promise<User | null> {
    const db = getDatabase();
    const userData = await db('users').where('id', id).first();
    
    if (!userData) {
      return null;
    }

    const user = new User();
    return user.fromDatabase(userData);
  }

  static async findByEmail(email: string): Promise<User | null> {
    const db = getDatabase();
    const userData = await db('users').where('email', email).first();
    
    if (!userData) {
      return null;
    }

    const user = new User();
    return user.fromDatabase(userData);
  }

  static async findByEmailVerificationToken(token: string): Promise<User | null> {
    const db = getDatabase();
    const userData = await db('users').where('email_verification_token', token).first();
    
    if (!userData) {
      return null;
    }

    const user = new User();
    return user.fromDatabase(userData);
  }

  static async findByVerificationToken(token: string): Promise<User | null> {
    return this.findByEmailVerificationToken(token);
  }

  static async findByPasswordResetToken(token: string): Promise<User | null> {
    const db = getDatabase();
    const userData = await db('users')
      .where('password_reset_token', token)
      .where('password_reset_expires', '>', new Date())
      .first();
    
    if (!userData) {
      return null;
    }

    const user = new User();
    return user.fromDatabase(userData);
  }

  static async findAll(
    page: number = 1,
    limit: number = 10,
    filters: {
      role?: UserRole;
      status?: UserStatus;
      search?: string;
    } = {}
  ): Promise<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const db = getDatabase();
    const offset = (page - 1) * limit;

    let query = db('users').select('*');

    // Apply filters
    if (filters.role) {
      query = query.where('role', filters.role);
    }

    if (filters.status) {
      query = query.where('status', filters.status);
    }

    if (filters.search) {
      query = query.where(function() {
        this.where('first_name', 'ilike', `%${filters.search}%`)
          .orWhere('last_name', 'ilike', `%${filters.search}%`)
          .orWhere('email', 'ilike', `%${filters.search}%`);
      });
    }

    // Get total count for pagination
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count as string);

    // Get paginated results
    const results = await query
      .limit(limit)
      .offset(offset)
      .orderBy('created_at', 'desc');

    const users = results.map(userData => {
      const user = new User();
      return user.fromDatabase(userData);
    });

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}