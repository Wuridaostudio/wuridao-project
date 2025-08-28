// backend/src/analytics/analytics.controller.ts
import { Controller, Get, Post, Query, Request, UseGuards, Body } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

// Define the JWT user type
interface JwtUser {
  userId: number;
  username: string;
}

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // 公開 API - 記錄訪客
  @Get('track')
  async trackVisitor(
    @Request() request: ExpressRequest,
    @Query('page') page: string,
  ) {
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
