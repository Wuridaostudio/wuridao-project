import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { StatisticsService } from '../statistics/statistics.service';

@ApiTags('系統健康檢查')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly statisticsService: StatisticsService,
  ) {}

  @Get()
  @ApiOperation({ summary: '基本健康檢查' })
  getHealth() {
    return this.healthService.getBasicHealth();
  }

  @Get('api')
  @ApiOperation({ summary: 'API 健康檢查' })
  getApiHealth() {
    return this.healthService.getBasicHealth();
  }

  @Get('api/detailed')
  @ApiOperation({ summary: '詳細健康檢查' })
  async getDetailedHealth() {
    return this.healthService.getDetailedHealth();
  }

  @Get('api/endpoints')
  @ApiOperation({ summary: '端點健康檢查' })
  async getEndpointHealth() {
    return this.healthService.getEndpointHealth();
  }

  @Get('api/statistics')
  @ApiOperation({ summary: '系統統計數據' })
  async getStatistics() {
    return this.statisticsService.getSystemStatistics();
  }

  @Get('api/statistics/detailed')
  @ApiOperation({ summary: '詳細統計數據' })
  async getDetailedStatistics() {
    return this.statisticsService.getDetailedStatistics();
  }
}
