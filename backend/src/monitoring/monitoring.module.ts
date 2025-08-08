import { Module } from '@nestjs/common';
import { PerformanceMonitorService } from './performance-monitor.service';

@Module({
  providers: [PerformanceMonitorService],
  exports: [PerformanceMonitorService],
})
export class MonitoringModule {}
