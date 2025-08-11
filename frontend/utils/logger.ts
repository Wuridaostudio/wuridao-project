// frontend/utils/logger.ts

interface LogLevel {
  DEBUG: 0
  INFO: 1
  WARN: 2
  ERROR: 3
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
}

class Logger {
  private isDevelopment: boolean
  private currentLevel: number

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.currentLevel = this.isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR
  }

  private shouldLog(level: number): boolean {
    return this.isDevelopment && level >= this.currentLevel
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level}]`
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`
    }
    return `${prefix} ${message}`
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(`🔍 ${this.formatMessage('DEBUG', message, data)}`)
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.info(`ℹ️ ${this.formatMessage('INFO', message, data)}`)
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(`⚠️ ${this.formatMessage('WARN', message, data)}`)
    }
  }

  error(message: string, error?: any): void {
    // 錯誤日誌在生產環境中也會輸出
    const shouldLog = this.isDevelopment || process.env.NODE_ENV === 'production'
    if (shouldLog) {
      console.error(`❌ ${this.formatMessage('ERROR', message, error)}`)
    }
  }

  // API 專用的日誌方法
  api(operation: string, data?: any): void {
    this.debug(`[API] ${operation}`, data)
  }

  // 表單處理專用的日誌方法
  form(operation: string, data?: any): void {
    this.debug(`[FORM] ${operation}`, data)
  }

  // 文件上傳專用的日誌方法
  upload(operation: string, data?: any): void {
    this.debug(`[UPLOAD] ${operation}`, data)
  }
}

// 創建單例實例
export const logger = new Logger()

// 導出便捷方法
export const log = {
  debug: (message: string, data?: any) => logger.debug(message, data),
  info: (message: string, data?: any) => logger.info(message, data),
  warn: (message: string, data?: any) => logger.warn(message, data),
  error: (message: string, error?: any) => logger.error(message, error),
  api: (operation: string, data?: any) => logger.api(operation, data),
  form: (operation: string, data?: any) => logger.form(operation, data),
  upload: (operation: string, data?: any) => logger.upload(operation, data),
}
