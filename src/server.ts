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
import { authRoutes } from '@/auth/routes/authRoutes';
import { registrationRoutes } from '@/auth/routes/registrationRoutes';
import { healthRoutes } from '@/routes/healthRoutes';
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { logger } from '@/utils/logger';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        shopUrl: string;
        businessName: string;
      };
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
    this.app.use(helmet());
    this.app.use(cors({
      origin: config.cors.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'sessionToken']
    }));

    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: 'Too many requests from this IP, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    if (config.server.nodeEnv !== 'test') {
      this.app.use(morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) }
      }));
    }

    this.app.use((req, res, next) => {
      req.id = Math.random().toString(36).substr(2, 9);
      res.setHeader('X-Request-ID', req.id);
      next();
    });
  }

  private initializeRoutes(): void {
    const apiPrefix = `/api/${config.server.apiVersion}`;
    
    // Health check
    this.app.use('/health', healthRoutes);
    
    // Auth routes (new structure)
    this.app.use(`${apiPrefix}/auth`, authRoutes);
    this.app.use(`${apiPrefix}/auth/registration`, registrationRoutes);
    
    // API info
    this.app.get(`${apiPrefix}`, (req, res) => {
      res.json({
        name: 'Celm Backend API',
        version: config.server.apiVersion,
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          auth: `${apiPrefix}/auth`,
          registration: `${apiPrefix}/auth/registration`,
          users: `${apiPrefix}/users`,
          health: '/health',
        },
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async listen(): Promise<void> {
    await this.initializeDatabase();
    
    this.app.listen(this.port, () => {
      logger.info(`🚀 Server running on port ${this.port}`);
      logger.info(`📚 API: http://localhost:${this.port}/api/${config.server.apiVersion}`);
      logger.info(`🏥 Health: http://localhost:${this.port}/health`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

const server = new Server();

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

if (require.main === module) {
  server.listen().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default server.getApp();