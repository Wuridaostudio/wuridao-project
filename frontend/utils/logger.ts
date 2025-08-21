// frontend/utils/logger.ts

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  data?: any
  timestamp: string
  component: string
  environment: string
  userAgent?: string
  url?: string
}

class FrontendLogger {
  private isProduction = process.env.NODE_ENV === 'production'
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isServer = process.server
  private isClient = process.client
  private logQueue: LogEntry[] = []
  private maxQueueSize = 100

  constructor() {
    // 只在客戶端添加頁面卸載事件監聽器
    if (this.isClient) {
      window.addEventListener('beforeunload', () => {
        this.flushLogs()
      })
    }
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    data?: any,
    component: string = 'Frontend'
  ): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      component,
      environment: process.env.NODE_ENV || 'unknown',
      userAgent: this.isClient ? navigator.userAgent : undefined,
      url: this.isClient ? window.location.href : undefined,
    }
  }

  private async sendLogToBackend(logEntry: LogEntry) {
    // 只在客戶端發送日誌到後端
    if (!this.isClient) return

    try {
      const config = useRuntimeConfig()
      
      // 在生產環境中，增加重試機制
      const maxRetries = this.isProduction ? 3 : 1
      let lastError = null
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await $fetch('/logs/frontend', {
            method: 'POST',
            baseURL: config.public.apiBaseUrl,
            body: logEntry,
            credentials: 'include',
            timeout: 5000, // 5秒超時
            // 增加重試和錯誤處理
            retry: 1,
            retryDelay: 1000,
          })
          
          // 成功發送，跳出重試循環
          if (this.isProduction) {
            console.log(`✅ [FrontendLogger] 日誌已發送到後端 (嘗試 ${attempt}/${maxRetries})`)
          }
          return
          
        } catch (error) {
          lastError = error
          
          if (this.isProduction) {
            console.warn(`⚠️ [FrontendLogger] 發送日誌失敗 (嘗試 ${attempt}/${maxRetries}):`, {
              error: error.message,
              status: error.status,
              statusCode: error.statusCode,
              url: `${config.public.apiBaseUrl}/logs/frontend`,
              logEntry: {
                level: logEntry.level,
                message: logEntry.message,
                component: logEntry.component,
                timestamp: logEntry.timestamp
              }
            })
          }
          
          // 如果不是最後一次嘗試，等待一下再重試
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          }
        }
      }
      
      // 所有重試都失敗了
      if (this.isProduction) {
        console.error('❌ [FrontendLogger] 所有重試都失敗，無法發送日誌到後端:', {
          error: lastError?.message,
          status: lastError?.status,
          statusCode: lastError?.statusCode,
          logEntry: {
            level: logEntry.level,
            message: logEntry.message,
            component: logEntry.component,
            timestamp: logEntry.timestamp
          }
        })
      }
      
    } catch (error) {
      // 如果發送失敗，只在開發環境顯示錯誤
      if (this.isDevelopment) {
        console.error('Failed to send log to backend:', error)
      }
    }
  }

  private async flushLogs() {
    // 只在客戶端執行
    if (!this.isClient || this.logQueue.length === 0) return

    try {
      const config = useRuntimeConfig()
      await $fetch('/logs/frontend/batch', {
        method: 'POST',
        baseURL: config.public.apiBaseUrl,
        body: { logs: this.logQueue },
        credentials: 'include',
        timeout: 10000, // 10秒超時
        retry: 1,
        retryDelay: 1000,
      })
      this.logQueue = []
    } catch (error) {
      if (this.isDevelopment) {
        console.error('Failed to flush logs to backend:', error)
      }
    }
  }

  private addToQueue(logEntry: LogEntry) {
    // 只在客戶端添加到隊列
    if (this.isClient) {
      this.logQueue.push(logEntry)
      
      // 如果隊列太長，移除最舊的日誌
      if (this.logQueue.length > this.maxQueueSize) {
        this.logQueue.shift()
      }

      // 在生產環境中，只發送重要日誌（warn 和 error）
      if (this.isProduction && (logEntry.level === 'warn' || logEntry.level === 'error')) {
        this.sendLogToBackend(logEntry)
      }
    }
  }

  debug(message: string, data?: any, component?: string) {
    const logEntry = this.createLogEntry('debug', message, data, component)
    
    // 開發環境顯示詳細日誌
    if (this.isDevelopment) {
      console.log(`🔍 [${component || 'Frontend'}] ${message}`, data || '')
    }
    
    this.addToQueue(logEntry)
  }

  log(message: string, data?: any, component?: string) {
    // log 方法作為 info 的別名
    this.info(message, data, component)
  }

  info(message: string, data?: any, component?: string) {
    const logEntry = this.createLogEntry('info', message, data, component)
    
    // 開發環境顯示信息日誌
    if (this.isDevelopment) {
      console.log(`ℹ️ [${component || 'Frontend'}] ${message}`, data || '')
    }
    
    this.addToQueue(logEntry)
  }

  warn(message: string, data?: any, component?: string) {
    const logEntry = this.createLogEntry('warn', message, data, component)
    
    // 開發環境顯示警告日誌
    if (this.isDevelopment) {
      console.warn(`⚠️ [${component || 'Frontend'}] ${message}`, data || '')
    }
    
    this.addToQueue(logEntry)
  }

  error(message: string, data?: any, component?: string) {
    const logEntry = this.createLogEntry('error', message, data, component)
    
    // 開發環境顯示錯誤日誌
    if (this.isDevelopment) {
      console.error(`❌ [${component || 'Frontend'}] ${message}`, data || '')
    }
    
    this.addToQueue(logEntry)
  }

  // 專門用於認證相關的日誌
  auth(message: string, data?: any) {
    this.info(message, data, 'Auth')
  }

  // 專門用於 API 請求的日誌
  api(message: string, data?: any) {
    this.info(message, data, 'API')
  }

  // 專門用於 Cookie 相關的日誌
  cookie(message: string, data?: any) {
    this.info(message, data, 'Cookie')
  }

  // 專門用於路由相關的日誌
  route(message: string, data?: any) {
    this.info(message, data, 'Route')
  }

  // 強制發送所有日誌到後端
  async flush() {
    await this.flushLogs()
  }
}

// 創建全局日誌實例
export const logger = new FrontendLogger()

// 導出類型
export type { LogEntry }
