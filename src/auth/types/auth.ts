export enum RegistrationStep {
  EMAIL_INPUT = 1,
  PERSONAL_INFO = 2,
  BUSINESS_TYPE = 3,
  SHOP_DETAILS = 4,
  LOCATION = 5,
  COMPLETE = 6
}

export enum BusinessTypeOption {
  SERVICES = 'services',
  PRODUCTS = 'products',
  BOTH = 'both'
}

export enum OAuthProvider {
  GOOGLE = 'google'  // Make sure it's lowercase to match your usage
}

export interface RegistrationSession {
  id: string;
  email: string;
  sessionToken: string;
  stepData: RegistrationStepData;
  currentStep: RegistrationStep;
  totalSteps: number;
  emailVerified: boolean;
  verificationToken?: string;
  oauthProvider?: OAuthProvider;
  oauthId?: string;
  oauthData?: GoogleProfile;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegistrationStepData {
  step1?: EmailStepData;
  step2?: PersonalInfoStepData;
  step3?: BusinessTypeStepData;
  step4?: ShopDetailsStepData;
  step5?: LocationStepData;
}

export interface EmailStepData {
  email: string;
  isOAuth?: boolean;
  oauthProvider?: OAuthProvider;
}

export interface PersonalInfoStepData {
  firstName: string;
  lastName: string;
  password?: string;
}

export interface BusinessTypeStepData {
  businessType: BusinessTypeOption;
}

export interface ShopDetailsStepData {
  businessName: string;
  businessDescription: string;
  shopUrl: string;
}

export interface LocationStepData {
  country: string;
  state: string;
  localGovernment: string;
  address: string;
}

export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  verified_email?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  shopUrl: string;
  businessName: string;
  isActive: boolean;
}

export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  isRevoked: boolean;
}
