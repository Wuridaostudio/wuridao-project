import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.USE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: ['src/**/*.entity.ts', 'dist/**/*.entity.js'],
  migrations:
    process.env.NODE_ENV === 'production'
      ? ['dist/database/migrations/*.js']
      : ['src/database/migrations/*.ts'],
  synchronize: false,
  logging:
    process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  maxQueryExecutionTime: parseInt(process.env.DB_MAX_QUERY_TIME || '1000'),
  extra: {
    connectionLimit:
      process.env.NODE_ENV === 'production'
        ? parseInt(process.env.DB_POOL_SIZE_PROD || '10')
        : parseInt(process.env.DB_POOL_SIZE_DEV || '5'),
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),

    // 免費服務環境優化
    ...(process.env.FREE_TIER === 'true' && {
      connectionLimit: parseInt(process.env.DB_POOL_SIZE_FREE || '5'),
      acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT_FREE || '30000'),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT_FREE || '15000'),
    }),
  },
});
