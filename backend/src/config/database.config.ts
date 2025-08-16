// src/config/database.config.ts
export const databaseConfig = {
  // 基本配置
  type: 'postgres' as const,
  url: process.env.DATABASE_URL,
  ssl: process.env.USE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  
  // 編碼配置
  charset: 'utf8',
  collation: 'utf8_unicode_ci',

  // 同步配置 - 始終使用遷移
  synchronize: false,

  // 日誌配置 - 修復類型問題
  logging:
    process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],

  // 性能配置
  maxQueryExecutionTime: parseInt(process.env.DB_MAX_QUERY_TIME || '1000'),
  retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(process.env.DB_RETRY_DELAY || '3000'),
  autoLoadEntities: true,

  // 連接池配置
  extra: {
    // 根據環境調整連接數
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
};
