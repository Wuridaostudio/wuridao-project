import { Module } from '@nestjs/common';
import { PerformanceMonitorService } from './performance-monitor.service';
import { DatabaseHealthService } from './database-health.service';

@Module({
  providers: [PerformanceMonitorService, DatabaseHealthService],
  exports: [PerformanceMonitorService, DatabaseHealthService],
})
export class MonitoringModule {}
