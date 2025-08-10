import { Router, Request, Response } from 'express';
import { getDatabase } from '@/database/connection';
import { getRedisClient } from '@/database/redis';
import { logger } from '@/utils/logger';

const router = Router();

// Application health check
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Celm API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Database health check
router.get('/db', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    await db.raw('SELECT 1');
    
    res.status(200).json({
      success: true,
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Database health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Redis health check
router.get('/redis', async (req: Request, res: Response) => {
  try {
    const redis = getRedisClient();
    await redis.ping();
    
    res.status(200).json({
      success: true,
      message: 'Redis connection is healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Redis health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Redis connection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Combined health check
router.get('/all', async (req: Request, res: Response) => {
  const checks = {
    database: false,
    redis: false,
  };
  
  let overallStatus = 200;

  try {
    const db = getDatabase();
    await db.raw('SELECT 1');
    checks.database = true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    overallStatus = 503;
  }

  try {
    const redis = getRedisClient();
    await redis.ping();
    checks.redis = true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    overallStatus = 503;
  }

  res.status(overallStatus).json({
    success: overallStatus === 200,
    message: overallStatus === 200 ? 'All services are healthy' : 'Some services are unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRoutes };
