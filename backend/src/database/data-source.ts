import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.USE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: ['src/**/*.entity.ts', 'dist/**/*.entity.js'],
  migrations: process.env.NODE_ENV === 'production' 
    ? ['dist/database/migrations/*.js']
    : ['src/database/migrations/*.ts'],
  synchronize: false,
  logging:
    process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  maxQueryExecutionTime: 1000,
});
