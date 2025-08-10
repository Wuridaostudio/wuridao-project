// src/config/memory.config.ts
export const memoryConfig = {
  // 記憶體監控閾值
  thresholds: {
    heapUsed: 500 * 1024 * 1024, // 500MB
    rss: 800 * 1024 * 1024, // 800MB
    systemUsage: 85, // 85%
  },

  // 垃圾回收配置
  gc: {
    // 啟用強制垃圾回收的記憶體閾值
    forceGCThreshold: 400 * 1024 * 1024, // 400MB
    // 垃圾回收間隔（毫秒）
    interval: 5 * 60 * 1000, // 5分鐘
  },

  // 資料庫連接池配置
  database: {
    maxConnections: 10,
    minConnections: 2,
    acquireTimeout: 60000, // 60秒
    idleTimeout: 30000, // 30秒
  },

  // 檔案上傳配置
  upload: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 10,
    // 檔案處理超時
    timeout: 30000, // 30秒
  },

  // 快取配置
  cache: {
    // 快取大小限制
    maxSize: 100 * 1024 * 1024, // 100MB
    // 快取過期時間
    ttl: 3600, // 1小時
  },
};
