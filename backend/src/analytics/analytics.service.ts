// backend/src/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Request } from 'express';
import { VisitorLog } from './entities/visitor-log.entity';
import * as geoip from 'geoip-lite';
import UAParser from 'ua-parser-js';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(VisitorLog)
    private visitorLogRepository: Repository<VisitorLog>,
  ) {}

  // 記錄訪客
  async logVisitor(request: Request, page: string) {
    // 排除管理頁面的訪問
    if (page.startsWith('/admin')) {
      return null;
    }
    
    const ip = this.getClientIp(request);
    const geo = geoip.lookup(ip);
    const ua = new UAParser(request.headers['user-agent']);

    const referrerHeader = request.headers.referer || request.headers.referrer;
    const referrer = Array.isArray(referrerHeader)
      ? referrerHeader.join(',')
      : referrerHeader;

    // 檢查是否有同IP的最近訪問記錄，用於計算停留時間
    const recentVisit = await this.visitorLogRepository.findOne({
      where: { ip },
      order: { timestamp: 'DESC' },
    });

    let duration = 0;
    if (recentVisit) {
      const timeDiff = Date.now() - recentVisit.timestamp.getTime();
      // 如果時間差小於30分鐘，認為是同一次訪問
      if (timeDiff < 30 * 60 * 1000) {
        duration = Math.floor(timeDiff / 1000); // 轉換為秒
        // 更新前一條記錄的停留時間
        await this.visitorLogRepository.update(
          { id: recentVisit.id },
          { duration }
        );
      }
    }

    const visitorLog = this.visitorLogRepository.create({
      ip,
      page,
      userAgent: request.headers['user-agent'],
      browser: ua.getBrowser().name || 'Unknown',
      os: ua.getOS().name || 'Unknown',
      device: ua.getDevice().type || 'desktop',
      country: geo?.country || 'Unknown',
      city: geo?.city || 'Unknown',
      region: geo?.region || 'Unknown',
      latitude: geo?.ll?.[0] || 0,
      longitude: geo?.ll?.[1] || 0,
      referrer,
      duration: 0, // 新記錄的停留時間設為0
      timestamp: new Date(),
    });

    return this.visitorLogRepository.save(visitorLog);
  }



  // 獲取訪客統計
  async getVisitorStats(timeRange: string) {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const visitors = await this.visitorLogRepository.find({
      where: {
        timestamp: Between(startDate, now),
      },
    });

    // 按國家統計
    const countryStats = this.groupByCountry(visitors);

    // 計算總體統計
    const totalVisitors = visitors.length;
    const uniqueVisitors = new Set(visitors.map((v) => v.ip)).size;
    const avgDuration = this.calculateAvgDuration(visitors);
    const bounceRate = this.calculateBounceRate(visitors);

    return {
      totalVisitors,
      uniqueVisitors,
      avgDuration,
      bounceRate,
      countries: countryStats,
      timeRange,
    };
  }

  // 獲取即時訪客數
  async getRealtimeVisitors() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const realtimeVisitors = await this.visitorLogRepository.count({
      where: {
        timestamp: Between(fiveMinutesAgo, new Date()),
      },
    });

    return realtimeVisitors;
  }

  // 獲取頁面瀏覽統計
  async getPageViews(days: number = 7) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const pageViews = await this.visitorLogRepository
      .createQueryBuilder('visitor')
      .select('visitor.page', 'page')
      .addSelect('COUNT(*)', 'views')
      .where('visitor.timestamp > :startDate', { startDate })
      .groupBy('visitor.page')
      .orderBy('views', 'DESC')
      .limit(10)
      .getRawMany();

    return pageViews;
  }

  // 獲取訪客趨勢
  async getVisitorTrends(days: number = 7) {
    const trends = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await this.visitorLogRepository.count({
        where: {
          timestamp: Between(date, nextDate),
        },
      });

      trends.push({
        date: date.toISOString().split('T')[0],
        visitors: count,
      });
    }

    return trends;
  }

  // 工具方法
  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string) ||
      (request.headers['x-real-ip'] as string) ||
      request.connection.remoteAddress ||
      ''
    )
      .split(',')[0]
      .trim();
  }

  private groupByCountry(visitors: VisitorLog[]) {
    const countryMap = new Map<string, number>();

    visitors.forEach((visitor) => {
      const count = countryMap.get(visitor.country) || 0;
      countryMap.set(visitor.country, count + 1);
    });

    return Array.from(countryMap.entries())
      .map(([country, visitors]) => ({
        country,
        code: country,
        visitors,
      }))
      .sort((a, b) => b.visitors - a.visitors);
  }

  private calculateAvgDuration(visitors: VisitorLog[]): number {
    if (visitors.length === 0) return 0;
    
    // 基於訪問頻率計算模擬停留時間
    const visitorSessions = new Map<string, number[]>();
    
    visitors.forEach(visitor => {
      if (!visitorSessions.has(visitor.ip)) {
        visitorSessions.set(visitor.ip, []);
      }
      visitorSessions.get(visitor.ip)?.push(visitor.timestamp.getTime());
    });
    
    let totalDuration = 0;
    let sessionCount = 0;
    
    visitorSessions.forEach(timestamps => {
      if (timestamps.length > 1) {
        // 計算會話內的時間差
        for (let i = 1; i < timestamps.length; i++) {
          const timeDiff = (timestamps[i] - timestamps[i - 1]) / 1000; // 轉換為秒
          if (timeDiff < 1800) { // 小於30分鐘的間隔
            totalDuration += timeDiff;
            sessionCount++;
          }
        }
      }
    });
    
    // 如果沒有有效的會話數據，返回預設值
    if (sessionCount === 0) {
      return 180; // 預設3分鐘
    }
    
    return Math.round(totalDuration / sessionCount);
  }

  private calculateBounceRate(visitors: VisitorLog[]): number {
    if (visitors.length === 0) return 0;
    
    // 計算跳出率（只訪問一個頁面的訪客比例）
    const visitorSessions = new Map<string, Set<string>>();
    
    visitors.forEach(visitor => {
      if (!visitorSessions.has(visitor.ip)) {
        visitorSessions.set(visitor.ip, new Set());
      }
      visitorSessions.get(visitor.ip)?.add(visitor.page);
    });
    
    const singlePageVisitors = Array.from(visitorSessions.values())
      .filter(pages => pages.size === 1).length;
    
    return Math.round((singlePageVisitors / visitorSessions.size) * 100);
  }
}
