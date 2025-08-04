// src/sitemap/sitemap.controller.ts
import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SitemapService } from './sitemap.service';

@ApiTags('SEO')
@Controller()
export class SitemapController {
  constructor(private readonly sitemapService: SitemapService) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  @ApiOperation({ summary: '生成網站地圖' })
  async getSitemap() {
    return this.sitemapService.generateSitemap();
  }

  @Get('robots.txt')
  @Header('Content-Type', 'text/plain')
  @ApiOperation({ summary: '生成 robots.txt' })
  getRobots() {
    return this.sitemapService.generateRobotsTxt();
  }
}
