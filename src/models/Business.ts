import { IsString, IsOptional, IsUUID, IsEnum, IsArray, IsUrl, IsObject, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { getDatabase } from '@/database/connection';

export enum BusinessStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  VERIFIED = 'verified'
}

export enum BusinessType {
  SERVICES = 'services',
  PRODUCTS = 'products',
  BOTH = 'both'
}

export class BusinessLocation {
  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  constructor(data?: Partial<BusinessLocation>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}

export class BusinessContact {
  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsArray()
  @IsOptional()
  socialMedia?: string[];

  constructor(data?: Partial<BusinessContact>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}

export class Business {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsUUID()
  ownerId!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(BusinessType)
  @IsOptional()
  type?: BusinessType = BusinessType.SERVICES;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  services?: string[] = [];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[] = [];

  @IsString()
  @IsOptional()
  logo?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[] = [];

  @IsUrl()
  @IsOptional()
  website?: string;

  @ValidateNested()
  @Type(() => BusinessLocation)
  @IsOptional()
  location?: BusinessLocation;

  @ValidateNested()
  @Type(() => BusinessContact)
  @IsOptional()
  contact?: BusinessContact;

  @IsEnum(BusinessStatus)
  @IsOptional()
  status?: BusinessStatus = BusinessStatus.DRAFT;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any> = {};

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any> = {};

  @Type(() => Date)
  @IsOptional()
  createdAt?: Date;

  @Type(() => Date)
  @IsOptional()
  updatedAt?: Date;

  constructor(data?: Partial<Business>) {
    if (data) {
      Object.assign(this, data);
      if (data.location) {
        this.location = new BusinessLocation(data.location);
      }
      if (data.contact) {
        this.contact = new BusinessContact(data.contact);
      }
    }
  }

  // Static methods for database operations
  static async findById(id: string): Promise<Business | null> {
    const db = getDatabase();
    const businessData = await db('businesses').where({ id }).first();
    if (!businessData) return null;

    // Parse JSON fields
    businessData.services = businessData.services ? JSON.parse(businessData.services) : [];
    businessData.categories = businessData.categories ? JSON.parse(businessData.categories) : [];
    businessData.images = businessData.images ? JSON.parse(businessData.images) : [];
    businessData.location = businessData.location ? JSON.parse(businessData.location) : {};
    businessData.contact = businessData.contact ? JSON.parse(businessData.contact) : {};
    businessData.settings = businessData.settings ? JSON.parse(businessData.settings) : {};
    businessData.metadata = businessData.metadata ? JSON.parse(businessData.metadata) : {};

    return new Business(businessData);
  }

  static async findByOwnerId(ownerId: string): Promise<Business[]> {
    const db = getDatabase();
    const businessesData = await db('businesses').where({ ownerId }).orderBy('createdAt', 'desc');
    
    return businessesData.map(businessData => {
      // Parse JSON fields
      businessData.services = businessData.services ? JSON.parse(businessData.services) : [];
      businessData.categories = businessData.categories ? JSON.parse(businessData.categories) : [];
      businessData.images = businessData.images ? JSON.parse(businessData.images) : [];
      businessData.location = businessData.location ? JSON.parse(businessData.location) : {};
      businessData.contact = businessData.contact ? JSON.parse(businessData.contact) : {};
      businessData.settings = businessData.settings ? JSON.parse(businessData.settings) : {};
      businessData.metadata = businessData.metadata ? JSON.parse(businessData.metadata) : {};

      return new Business(businessData);
    });
  }

  static async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      status?: BusinessStatus | BusinessStatus[];
      type?: BusinessType;
      category?: string;
      search?: string;
      city?: string;
      state?: string;
      country?: string;
    }
  ): Promise<{ businesses: Business[]; total: number; page: number; totalPages: number }> {
    const db = getDatabase();
    const offset = (page - 1) * limit;

    let query = db('businesses')
      .leftJoin('users', 'businesses.ownerId', 'users.id')
      .select(
        'businesses.*',
        'users.firstName as ownerFirstName',
        'users.lastName as ownerLastName',
        'users.email as ownerEmail'
      );

    if (filters) {
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.whereIn('businesses.status', filters.status);
        } else {
          query = query.where('businesses.status', filters.status);
        }
      }
      if (filters.type) {
        query = query.where('businesses.type', filters.type);
      }
      if (filters.search) {
        query = query.where(function() {
          this.whereILike('businesses.name', `%${filters.search}%`)
              .orWhereILike('businesses.description', `%${filters.search}%`);
        });
      }
      if (filters.category) {
        query = query.whereRaw("businesses.categories::jsonb ? ?", [filters.category]);
      }
      if (filters.city) {
        query = query.whereRaw("businesses.location->>'city' ILIKE ?", [`%${filters.city}%`]);
      }
      if (filters.state) {
        query = query.whereRaw("businesses.location->>'state' ILIKE ?", [`%${filters.state}%`]);
      }
      if (filters.country) {
        query = query.whereRaw("businesses.location->>'country' ILIKE ?", [`%${filters.country}%`]);
      }
    }

    const [businesses, totalResult] = await Promise.all([
      query.clone().offset(offset).limit(limit).orderBy('businesses.createdAt', 'desc'),
      query.clone().count('businesses.id as count').first()
    ]);

    const total = parseInt(totalResult?.count as string || '0', 10);
    const totalPages = Math.ceil(total / limit);

    const businessList = businesses.map(businessData => {
      const business = new Business(this.prototype.parseBusinessData(businessData));
      // Add owner information
      (business as any).owner = {
        firstName: businessData.ownerFirstName,
        lastName: businessData.ownerLastName,
        email: businessData.ownerEmail,
      };
      return business;
    });

    return {
      businesses: businessList,
      total,
      page,
      totalPages
    };
  }

  static async searchByName(name: string, limit: number = 10): Promise<Business[]> {
    const db = getDatabase();
    const businessesData = await db('businesses')
      .whereILike('name', `%${name}%`)
      .where('status', BusinessStatus.ACTIVE)
      .limit(limit)
      .orderBy('name');

    return businessesData.map(businessData => {
      // Parse JSON fields
      businessData.services = businessData.services ? JSON.parse(businessData.services) : [];
      businessData.categories = businessData.categories ? JSON.parse(businessData.categories) : [];
      businessData.images = businessData.images ? JSON.parse(businessData.images) : [];
      businessData.location = businessData.location ? JSON.parse(businessData.location) : {};
      businessData.contact = businessData.contact ? JSON.parse(businessData.contact) : {};
      businessData.settings = businessData.settings ? JSON.parse(businessData.settings) : {};
      businessData.metadata = businessData.metadata ? JSON.parse(businessData.metadata) : {};

      return new Business(businessData);
    });
  }

  async save(): Promise<Business> {
    const db = getDatabase();
    const now = new Date();

    if (this.id) {
      // Update existing business
      this.updatedAt = now;
      const [updatedBusiness] = await db('businesses')
        .where({ id: this.id })
        .update(this.toDatabase())
        .returning('*');
      return new Business(this.parseBusinessData(updatedBusiness));
    } else {
      // Create new business
      this.createdAt = now;
      this.updatedAt = now;
      const [newBusiness] = await db('businesses')
        .insert(this.toDatabase())
        .returning('*');
      return new Business(this.parseBusinessData(newBusiness));
    }
  }

  async delete(): Promise<boolean> {
    if (!this.id) return false;
    
    const db = getDatabase();
    const deleted = await db('businesses').where({ id: this.id }).del();
    return deleted > 0;
  }

  // Convert instance to database format
  private toDatabase(): Record<string, any> {
    return {
      id: this.id || undefined,
      ownerId: this.ownerId,
      name: this.name,
      description: this.description || null,
      type: this.type || BusinessType.SERVICES,
      services: JSON.stringify(this.services || []),
      categories: JSON.stringify(this.categories || []),
      logo: this.logo || null,
      images: JSON.stringify(this.images || []),
      website: this.website || null,
      location: JSON.stringify(this.location || {}),
      contact: JSON.stringify(this.contact || {}),
      status: this.status || BusinessStatus.DRAFT,
      settings: JSON.stringify(this.settings || {}),
      metadata: JSON.stringify(this.metadata || {}),
      createdAt: this.createdAt,
      updatedAt: new Date(),
    };
  }

  // Parse business data from database
  private parseBusinessData(businessData: any): any {
    return {
      ...businessData,
      services: businessData.services ? JSON.parse(businessData.services) : [],
      categories: businessData.categories ? JSON.parse(businessData.categories) : [],
      images: businessData.images ? JSON.parse(businessData.images) : [],
      location: businessData.location ? JSON.parse(businessData.location) : {},
      contact: businessData.contact ? JSON.parse(businessData.contact) : {},
      settings: businessData.settings ? JSON.parse(businessData.settings) : {},
      metadata: businessData.metadata ? JSON.parse(businessData.metadata) : {},
    };
  }

  // Instance methods
  isActive(): boolean {
    return this.status === BusinessStatus.ACTIVE || this.status === BusinessStatus.VERIFIED;
  }

  isDraft(): boolean {
    return this.status === BusinessStatus.DRAFT;
  }

  canBePublished(): boolean {
    return !!(
      this.name &&
      this.description &&
      this.type &&
      this.services &&
      this.services.length > 0 &&
      this.location &&
      this.contact
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      ownerId: this.ownerId,
      name: this.name,
      description: this.description,
      type: this.type,
      services: this.services,
      categories: this.categories,
      logo: this.logo,
      images: this.images,
      website: this.website,
      location: this.location,
      contact: this.contact,
      status: this.status,
      settings: this.settings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}