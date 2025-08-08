// test/setup.ts
import 'reflect-metadata';

// 設置測試環境變數
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.TEST_JWT_SECRET || 'test-secret';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://test:test@localhost:5432/test_db';
