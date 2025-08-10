import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { memoryConfig } from '../config/memory.config';

@Injectable()
export class PerformanceMonitorService {
  private readonly logger = new Logger(PerformanceMonitorService.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  async monitorSystemHealth() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // 計算記憶體使用百分比
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory * 100).toFixed(1);
    
    this.logger.log('📊 [PerformanceMonitor] 系統效能監控', {
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB',
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        systemUsage: memoryUsagePercent + '%',
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000) + ' ms',
        system: Math.round(cpuUsage.system / 1000) + ' ms',
      },
      uptime: Math.round(process.uptime()) + ' seconds',
      nodeVersion: process.version,
      platform: process.platform,
    });

    // 檢查記憶體使用量
    if (memoryUsage.heapUsed > memoryConfig.thresholds.heapUsed) {
      this.logger.warn('⚠️ [PerformanceMonitor] 記憶體使用量過高', {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        threshold: Math.round(memoryConfig.thresholds.heapUsed / 1024 / 1024) + ' MB',
        suggestion: '考慮重啟服務或檢查記憶體洩漏',
      });
      
      // 如果超過強制垃圾回收閾值，執行垃圾回收
      if (memoryUsage.heapUsed > memoryConfig.gc.forceGCThreshold) {
        this.logger.log('🔄 [PerformanceMonitor] 執行強制垃圾回收');
        if (global.gc) {
          global.gc();
        }
      }
    }

    // 檢查 RSS 記憶體
    if (memoryUsage.rss > memoryConfig.thresholds.rss) {
      this.logger.warn('⚠️ [PerformanceMonitor] RSS 記憶體使用量過高', {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        threshold: Math.round(memoryConfig.thresholds.rss / 1024 / 1024) + ' MB',
        suggestion: '檢查是否有記憶體洩漏或考慮增加系統記憶體',
      });
    }

    // 檢查系統記憶體使用率
    if (parseFloat(memoryUsagePercent) > memoryConfig.thresholds.systemUsage) {
      this.logger.warn('⚠️ [PerformanceMonitor] 系統記憶體使用率過高', {
        usage: memoryUsagePercent + '%',
        threshold: memoryConfig.thresholds.systemUsage + '%',
        suggestion: '考慮關閉不必要的應用程式或增加系統記憶體',
      });
    }
  }

  async monitorDatabaseQuery(query: string, duration: number) {
    if (duration > 1000) {
      this.logger.warn('🐌 [PerformanceMonitor] 慢查詢檢測', {
        query: query.substring(0, 100) + '...',
        duration: duration + 'ms',
      });
    }

    if (duration > 5000) {
      this.logger.error('🚨 [PerformanceMonitor] 極慢查詢警告', {
        query: query.substring(0, 200) + '...',
        duration: duration + 'ms',
      });
    }
  }

  async monitorApiResponse(path: string, method: string, duration: number, statusCode: number) {
    if (duration > 2000) {
      this.logger.warn('🐌 [PerformanceMonitor] API 響應時間過長', {
        path,
        method,
        duration: duration + 'ms',
        statusCode,
      });
    }

    if (statusCode >= 500) {
      this.logger.error('🚨 [PerformanceMonitor] 伺服器錯誤', {
        path,
        method,
        duration: duration + 'ms',
        statusCode,
      });
    }
  }

  async monitorFileUpload(fileSize: number, fileType: string, duration: number) {
    this.logger.log('📁 [PerformanceMonitor] 檔案上傳監控', {
      fileSize: Math.round(fileSize / 1024 / 1024 * 100) / 100 + ' MB',
      fileType,
      duration: duration + 'ms',
      speed: Math.round((fileSize / 1024 / 1024) / (duration / 1000) * 100) / 100 + ' MB/s',
    });

    if (duration > 10000) {
      this.logger.warn('⚠️ [PerformanceMonitor] 檔案上傳時間過長', {
        fileSize: Math.round(fileSize / 1024 / 1024 * 100) / 100 + ' MB',
        duration: duration + 'ms',
      });
    }
  }

  getSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000),
        system: Math.round(cpuUsage.system / 1000),
      },
      uptime: Math.round(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString(),
    };
  }
}
