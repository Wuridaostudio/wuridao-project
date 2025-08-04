import { Controller, Get, Put, Body, UseGuards, Param, BadRequestException, Logger, Request } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SeoService } from './seo.service';
import { UpdateSeoSettingsDto } from './dto/update-seo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('SEO')
@Controller('seo')
@UseGuards(ThrottlerGuard)
export class SeoController {
  private readonly logger = new Logger(SeoController.name);

  constructor(private readonly seoService: SeoService) {}

  @Get()
  @ApiOperation({ summary: '取得 SEO 設定' })
  @ApiResponse({ status: 200, description: '成功取得 SEO 設定' })
  async getSeoSettings() {
    return await this.seoService.getSeoSettings();
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新 SEO 設定' })
  @ApiResponse({ status: 200, description: '成功更新 SEO 設定' })
  @ApiResponse({ status: 401, description: '未授權' })
  async updateSeoSettings(@Body() updateData: any, @Request() req) {
    // 安全日誌：記錄 SEO 設定更新操作
    this.logger.log(`[SECURITY] SEO settings update by authenticated user (User ID: ${req.user?.userId})`);
    return await this.seoService.updateSeoSettings(updateData);
  }

  @Get('structured-data/:type')
  @ApiOperation({ summary: '取得結構化資料' })
  @ApiResponse({ status: 200, description: '成功取得結構化資料' })
  @ApiResponse({ status: 400, description: '無效的類型參數' })
  async getStructuredData(@Param('type') type: string) {
    // 驗證類型參數
    const validTypes = ['organization', 'place', 'faq'];
    if (!validTypes.includes(type)) {
      this.logger.warn(`[SECURITY] Invalid structured data type requested: ${type}`);
      throw new BadRequestException('無效的結構化資料類型');
    }
    return await this.seoService.generateStructuredData(type);
  }
} 