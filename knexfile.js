const path = require('path');
require('dotenv').config();

// Use ts-node for TypeScript files
require('ts-node').register({
  project: path.resolve(__dirname, 'tsconfig.json'),
  compilerOptions: {
    module: 'commonjs'
  }
});

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'celm_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    },
    migrations: {
      directory: path.join(__dirname, 'src/database/migrations'),
      extension: 'ts',
      loadExtensions: ['.ts'],
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: path.join(__dirname, 'src/database/seeds'),
      extension: 'ts',
      loadExtensions: ['.ts']
    },
  },
  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    migrations: {
      directory: path.join(__dirname, 'src/database/migrations'),
      extension: 'ts',
      loadExtensions: ['.ts'],
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: path.join(__dirname, 'src/database/seeds'),
      extension: 'ts',
      loadExtensions: ['.ts']
    },
  },
};