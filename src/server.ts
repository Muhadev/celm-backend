import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import { config } from '@/config';
import { connectDatabase } from '@/database/connection';
import { connectRedis } from '@/database/redis';
import { authRoutes } from '@/routes/authRoutes';
import { businessRoutes } from '@/routes/businessRoutes';
import { userRoutes } from '@/routes/userRoutes';
import { healthRoutes } from '@/routes/healthRoutes';
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { logger } from '@/utils/logger';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

class Server {
  public app: express.Application;
  private readonly port: number;

  constructor() {
    this.app = express();
    this.port = config.server.port;
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await connectDatabase();
      logger.info('Database connection established successfully');
      
      // Try to connect to Redis, but don't fail if it's not available
      try {
        await connectRedis();
        logger.info('Redis connection established successfully');
      } catch (redisError) {
        logger.warn('Redis connection failed - continuing without Redis:', redisError);
      }
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      process.exit(1);
    }
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: 'Too many requests from this IP, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // General middleware
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    if (config.server.nodeEnv !== 'test') {
      this.app.use(morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) }
      }));
    }

    // Request ID middleware for tracing
    this.app.use((req, res, next) => {
      req.id = Math.random().toString(36).substr(2, 9);
      res.setHeader('X-Request-ID', req.id);
      next();
    });
  }

  private initializeRoutes(): void {
    const apiPrefix = `/api/${config.server.apiVersion}`;
    
    // Health check routes
    this.app.use('/health', healthRoutes);
    
    // API routes
    this.app.use(`${apiPrefix}/auth`, authRoutes);
    this.app.use(`${apiPrefix}/users`, userRoutes);
    this.app.use(`${apiPrefix}/business`, businessRoutes);
    
    // API documentation route
    this.app.get(`${apiPrefix}`, (req, res) => {
      res.json({
        name: 'Celm Backend API',
        version: config.server.apiVersion,
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          auth: `${apiPrefix}/auth`,
          users: `${apiPrefix}/users`,
          business: `${apiPrefix}/business`,
          health: '/health',
        },
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  public async listen(): Promise<void> {
    // Initialize database connections first
    await this.initializeDatabase();
    
    this.app.listen(this.port, () => {
      logger.info(`🚀 Server running on port ${this.port}`);
      logger.info(`📚 API documentation: http://localhost:${this.port}/api/${config.server.apiVersion}`);
      logger.info(`🏥 Health check: http://localhost:${this.port}/health`);
      
      if (config.server.nodeEnv === 'development') {
        logger.info(`📧 MailHog: http://localhost:8025`);
      }
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

const server = new Server();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
if (require.main === module) {
  server.listen().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default server.getApp();