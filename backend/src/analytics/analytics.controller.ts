// backend/src/analytics/analytics.controller.ts
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // 公開 API - 記錄訪客
  @Get('track')
  async trackVisitor(@Req() request: Request, @Query('page') page: string) {
    await this.analyticsService.logVisitor(request, page || '/');
    return { success: true };
  }

  // 需要認證的 API
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('visitors')
  async getVisitorStats(@Query('timeRange') timeRange: string = '30d') {
    return this.analyticsService.getVisitorStats(timeRange);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('realtime')
  async getRealtimeVisitors() {
    const count = await this.analyticsService.getRealtimeVisitors();
    return { online: count };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('pageviews')
  async getPageViews(@Query('days') days: string = '7') {
    return this.analyticsService.getPageViews(parseInt(days));
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('trends')
  async getVisitorTrends(@Query('days') days: string = '7') {
    return this.analyticsService.getVisitorTrends(parseInt(days));
  }
}
