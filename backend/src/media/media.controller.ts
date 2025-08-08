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
    this.logger.log(`[MEDIA] 嘗試獲取媒體 ID: ${id}`);

    // 1) 先以尾段匹配 DB（例如 /media/<suffix>）
    const photoBySuffix = await this.photosService.findByPublicIdSuffix(id);
    if (photoBySuffix) return { ...photoBySuffix, type: 'photo' };

    const videoBySuffix = await this.videosService.findByPublicIdSuffix(id);
    if (videoBySuffix) return { ...videoBySuffix, type: 'video' };

    try {
      // 先嘗試獲取照片
      const photo = await this.photosService.findOne(+id);
      if (photo) {
        this.logger.log(`[MEDIA] 找到照片 ID: ${id}`);
        return { ...photo, type: 'photo' };
      }
    } catch (error) {
      this.logger.debug(`[MEDIA] 照片 ID ${id} 不存在，嘗試影片`);
    }

    try {
      // 再嘗試獲取影片
      const video = await this.videosService.findOne(+id);
      if (video) {
        this.logger.log(`[MEDIA] 找到影片 ID: ${id}`);
        return { ...video, type: 'video' };
      }
    } catch (error) {
      this.logger.debug(`[MEDIA] 影片 ID ${id} 不存在`);
    }

    // 2) 最後再嘗試完整 public_id 命中 Cloudinary 作為回退
    if (id.includes('/')) {
      this.logger.log(`[MEDIA] 檢測到 Cloudinary public_id: ${id}`);
      try {
        const exists = await this.cloudinaryService.checkResourceExists(id);
        if (exists) {
          const resourceType = id.includes('/videos/') ? 'video' : 'image';
          const cloudinaryResource = await this.cloudinaryService.getCloudinaryConfig();
          return {
            id,
            url: `https://res.cloudinary.com/${cloudinaryResource.cloudName}/image/upload/${id}`,
            publicId: id,
            description: '',
            type: resourceType,
            createdAt: new Date().toISOString(),
          };
        }
      } catch (error) {
        this.logger.debug(`[MEDIA] Cloudinary 資源 ${id} 不存在`);
      }
    }

    // 如果都找不到，拋出 404 錯誤
    this.logger.warn(`[MEDIA] 媒體 ID ${id} 不存在`);
    throw new NotFoundException(`找不到 ID 為 ${id} 的媒體項目`);
  }

  @ApiOperation({ summary: '獲取公開媒體列表（從 Cloudinary）' })
  @Get('public/list')
  async getPublicMedia() {
    this.logger.log(`[MEDIA] 獲取公開媒體列表`);

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
