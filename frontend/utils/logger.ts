// frontend/utils/logger.ts

/**
 * 一個僅在開發環境中運行的中央日誌工具。
 * 在生產環境中，所有日誌方法都會被替換為空函數，
 * Vite/Nuxt 在打包時會利用 tree-shaking 將其完全移除。
 */

const isDevelopment = process.env.NODE_ENV === 'development';

// 為日誌添加一個統一的前綴，方便在控制台中過濾
const LOG_PREFIX = '[WURIDAO]';

const noOp = () => {}; // 一個什麼都不做的空函數

export const logger = {
  log: isDevelopment ? console.log.bind(console, LOG_PREFIX) : noOp,
  warn: isDevelopment ? console.warn.bind(console, LOG_PREFIX) : noOp,
  error: isDevelopment ? console.error.bind(console, LOG_PREFIX) : noOp,
  info: isDevelopment ? console.info.bind(console, LOG_PREFIX) : noOp,
  debug: isDevelopment ? console.debug.bind(console, LOG_PREFIX) : noOp,
};
