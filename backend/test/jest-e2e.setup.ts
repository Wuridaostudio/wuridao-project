// backend/test/jest-e2e.setup.ts
import { config } from 'dotenv';

// 載入環境變數
config({ path: '.env.test' });

// 設定測試環境變數
process.env.NODE_ENV = 'test';
// 使用環境變數或預設測試值
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = process.env.TEST_JWT_SECRET || 'test-secret-key';
process.env.ADMIN_USERNAME = process.env.TEST_ADMIN_USERNAME || 'admin';
process.env.ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';
process.env.USE_SSL = process.env.TEST_USE_SSL || 'false';
process.env.AUTO_SEED_DATABASE = 'false'; // 測試環境不自動種子資料

// 全域測試設定
beforeAll(async () => {
  console.log('🧪 E2E Test Environment Setup');
  // 移除敏感資訊日誌
  console.log('🔒 SSL Enabled:', process.env.USE_SSL);
});

afterAll(async () => {
  console.log('🧹 E2E Test Environment Cleanup');
}); 