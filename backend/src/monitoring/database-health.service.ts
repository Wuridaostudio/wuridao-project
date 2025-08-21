import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DatabaseHealthService {
  private readonly logger = new Logger(DatabaseHealthService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkDatabaseHealth() {
    try {
      // 檢查資料庫連接
      const isConnected = this.dataSource.isInitialized;

      if (!isConnected) {
        this.logger.error('❌ [DatabaseHealth] Database connection failed');
        return;
      }

      // 執行簡單查詢檢查資料庫響應
      const result = await this.dataSource.query('SELECT 1 as health_check');

      if (result && result[0]?.health_check === 1) {
        this.logger.log('✅ [DatabaseHealth] Database connection normal');
      } else {
        this.logger.warn('⚠️ [DatabaseHealth] Database response abnormal');
      }

      // 檢查連接池狀態
      const pool = (this.dataSource.driver as any).pool;
      if (pool) {
        const poolStats = {
          total: pool.size,
          idle: pool.idle,
          waiting: pool.waiting,
        };

        this.logger.log('📊 [DatabaseHealth] Connection pool status', poolStats);

        // 檢查連接池健康狀況
        if (pool.waiting > 5) {
          this.logger.warn('⚠️ [DatabaseHealth] Too many connections waiting in pool', poolStats);
        }
      }
    } catch (error) {
      this.logger.error(
        '🚨 [DatabaseHealth] Database health check failed',
        error.message,
      );
    }
  }

  async getDatabaseStats() {
    try {
      const stats = {
        isConnected: this.dataSource.isInitialized,
        database: (this.dataSource.options as any).database || 'unknown',
        host: (this.dataSource.options as any).host || 'unknown',
        port: (this.dataSource.options as any).port || 'unknown',
        entities: this.dataSource.entityMetadatas.length,
        migrations: this.dataSource.migrations.length,
        timestamp: new Date().toISOString(),
      };

      // 獲取連接池統計
      const pool = (this.dataSource.driver as any).pool;
      if (pool) {
        stats['pool'] = {
          total: pool.size,
          idle: pool.idle,
          waiting: pool.waiting,
        };
      }

      return stats;
    } catch (error) {
      this.logger.error('獲取資料庫統計失敗', error.message);
      return {
        isConnected: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async testConnection() {
    try {
      await this.dataSource.query('SELECT 1');
      this.logger.log('✅ [DatabaseHealth] Database connection normal');
      return { status: 'healthy', message: 'Database connection is healthy' };
    } catch (error) {
      this.logger.error('❌ [DatabaseHealth] Database connection failed:', error);
      return {
        status: 'unhealthy',
        message: 'Database connection failed',
        error: error.message,
      };
    }
  }

  async getConnectionPoolStats() {
    try {
      const poolStats = await this.dataSource.query(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);

      this.logger.log('📊 [DatabaseHealth] Connection pool status', poolStats);
      return poolStats[0];
    } catch (error) {
      this.logger.error('❌ [DatabaseHealth] Failed to get connection pool status:', error);
      return null;
    }
  }
}
