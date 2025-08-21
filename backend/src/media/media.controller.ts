// src/media/media.controller.ts
import {
  Controller,
  Get,
  Param,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PhotosService } from '../photos/photos.service';
import { VideosService } from '../videos/videos.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('媒體')
@Controller('media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(
    private readonly photosService: PhotosService,
    private readonly videosService: VideosService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @ApiOperation({ summary: '獲取媒體項目（照片或影片）' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`[MEDIA] Attempting to get media ID: ${id}`);

    // 1) 先以尾段匹配 DB（例如 /media/<suffix>）
    const photoBySuffix = await this.photosService.findByPublicIdSuffix(id);
    if (photoBySuffix) return { ...photoBySuffix, type: 'photo' };

    const videoBySuffix = await this.videosService.findByPublicIdSuffix(id);
    if (videoBySuffix) return { ...videoBySuffix, type: 'video' };

    try {
      // 先嘗試獲取照片
      const photo = await this.photosService.findOne(+id);
      if (photo) {
        this.logger.log(`[MEDIA] Found photo ID: ${id}`);
        return { ...photo, type: 'photo' };
      }

      // 如果照片不存在，嘗試影片
      this.logger.log(`[MEDIA] Photo ID ${id} not found, trying video`);
      const video = await this.videosService.findOne(+id);
      if (video) {
        return video;
      }

      this.logger.log(`[MEDIA] Video ID ${id} not found`);

      // 嘗試從 Cloudinary 獲取
      try {
        const cloudinaryResource = await this.cloudinaryService.getResource(id);
        if (cloudinaryResource) {
          return cloudinaryResource;
        }
      } catch (cloudinaryError) {
        this.logger.log(`[MEDIA] Cloudinary resource ${id} not found`);
      }

      throw new NotFoundException(`Media with ID ${id} not found`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`[MEDIA] 獲取媒體時發生錯誤: ${error.message}`);
      throw new NotFoundException(`Media with ID ${id} not found`);
    }
  }

  @ApiOperation({ summary: '獲取公開媒體列表（從 Cloudinary）' })
  @Get('public/list')
  async getPublicMedia() {
    this.logger.log(`[MEDIA] Getting public media list`);

    try {
      // 獲取公開的照片和影片
      const [photos, videos] = await Promise.all([
        this.cloudinaryService.getPublicResources('image'),
        this.cloudinaryService.getPublicResources('video'),
      ]);

      return {
        photos: photos.resources || [],
        videos: videos.resources || [],
        total:
          (photos.resources?.length || 0) + (videos.resources?.length || 0),
      };
    } catch (error) {
      this.logger.error(`[MEDIA] 獲取公開媒體失敗: ${error.message}`);
      throw new NotFoundException('無法獲取公開媒體列表');
    }
  }
}
