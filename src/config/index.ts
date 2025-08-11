import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  pool: {
    min: number;
    max: number;
  };
}

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    email: string;
    name: string;
  };
}

interface ServerConfig {
  port: number;
  nodeEnv: string;
  apiVersion: string;
}

interface FileUploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  uploadPath: string;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface CorsConfig {
  allowedOrigins: string[];
}

// Add SecurityConfig interface
interface SecurityConfig {
  bcryptRounds: number;
}

interface Config {
  server: ServerConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: JWTConfig;
  email: EmailConfig;
  fileUpload: FileUploadConfig;
  rateLimit: RateLimitConfig;
  cors: CorsConfig;
  security: SecurityConfig; // Add this line
  // Remove the old bcryptRounds property
}

const requiredEnvVars = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
];

// Validate required environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1',
  },

  database: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    ssl: process.env.DB_SSL === 'true',
    pool: {
      min: 2,
      max: 10,
    },
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  email: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: {
      email: process.env.FROM_EMAIL || 'noreply@celm.com',
      name: process.env.FROM_NAME || 'Celm Platform',
    },
  },

  fileUpload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif').split(','),
    uploadPath: process.env.UPLOAD_PATH || 'uploads/',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10) * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  },
};

// Validate configuration
if (config.server.port < 1 || config.server.port > 65535) {
  throw new Error('Invalid port number');
}

if (config.security.bcryptRounds < 10 || config.security.bcryptRounds > 15) {
  throw new Error('bcryptRounds should be between 10 and 15');
}

export default config;