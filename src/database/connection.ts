import knex, { Knex } from 'knex';
import { config } from '@/config';
import { logger } from '@/utils/logger';

let db: Knex;

const knexConfig: Knex.Config = {
  client: 'postgresql',
  connection: {
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,  // Fixed: was config.database.database
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: config.database.pool.min,  // Fixed: now exists in config
    max: config.database.pool.max,  // Fixed: now exists in config
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  },
  migrations: {
    directory: './src/database/migrations',
    tableName: 'knex_migrations',
    extension: 'ts',
  },
  seeds: {
    directory: './src/database/seeds',
    extension: 'ts',
  },
  debug: config.server.nodeEnv === 'development',
};

export const connectDatabase = async (): Promise<void> => {
  try {
    db = knex(knexConfig);
    
    // Test the connection
    await db.raw('SELECT 1');
    
    logger.info('Database connected successfully');
    
    // Run migrations in production
    if (config.server.nodeEnv === 'production') {
      await db.migrate.latest();
      logger.info('Database migrations completed');
    }
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export const getDatabase = (): Knex => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.destroy();
    logger.info('Database connection closed');
  }
};

export { db };

// Export knex config for migrations
export default knexConfig;