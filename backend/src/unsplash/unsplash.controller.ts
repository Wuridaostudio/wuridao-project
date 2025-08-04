// src/unsplash/unsplash.controller.ts
import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UnsplashService } from './unsplash.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Unsplash')
@Controller('unsplash')
export class UnsplashController {
  constructor(private readonly unsplashService: UnsplashService) {}

  @ApiOperation({ summary: '搜尋 Unsplash 圖片' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiQuery({ name: 'query', description: '搜尋關鍵字' })
  @ApiQuery({ name: 'page', description: '頁數', required: false })
  @ApiQuery({ name: 'per_page', description: '每頁數量', required: false })
  async searchPhotos(
    @Query('query') query: string,
    @Query('page') page: string = '1',
    @Query('per_page') perPage: string = '20',
  ) {
    return this.unsplashService.searchPhotos(
      query,
      parseInt(page),
      parseInt(perPage),
    );
  }

  @ApiOperation({ summary: '下載 Unsplash 圖片' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('download/:photoId')
  async downloadPhoto(@Param('photoId') photoId: string) {
    return this.unsplashService.downloadPhoto(photoId);
  }
}
