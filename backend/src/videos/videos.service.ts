// src/videos/videos.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from './entities/video.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { Tag } from '../tags/entities/tag.entity';
import { Logger } from 'nestjs-pino';

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    private cloudinaryService: CloudinaryService,
    private readonly logger: Logger,
  ) {}

  async create(createVideoDto: CreateVideoDto) {
    let tags: Tag[] = [];
    if (createVideoDto.tagIds && createVideoDto.tagIds.length > 0) {
      tags = await this.tagRepository.findByIds(createVideoDto.tagIds);
    }

    const video = this.videoRepository.create({
      ...createVideoDto,
      tags,
    });

    return this.videoRepository.save(video);
  }

  async findAll() {
    return this.videoRepository.find({
      relations: ['category', 'tags'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const video = await this.videoRepository.findOne({
      where: { id },
      relations: ['category', 'tags'],
    });

    if (!video) {
      throw new NotFoundException('影片不存在');
    }

    return video;
  }

  // 依 publicId 精確查找（含關聯）
  async findByPublicIdExact(publicId: string) {
    return this.videoRepository.findOne({
      where: { publicId },
      relations: ['category', 'tags'],
    });
  }

  // 依 publicId 尾段查找（例如路由只帶尾段 id 時）
  async findByPublicIdSuffix(suffix: string) {
    const like = `%/${suffix}`;
    return this.videoRepository
      .createQueryBuilder('video')
      .leftJoinAndSelect('video.category', 'category')
      .leftJoinAndSelect('video.tags', 'tags')
      .where('video.publicId LIKE :like', { like })
      .getOne();
  }

  async update(
    id: number,
    updateVideoDto: UpdateVideoDto,
    videoFile?: Express.Multer.File,
  ) {
    const video = await this.videoRepository.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException(`影片 ID ${id} 不存在`);
    }

    // 如果有新檔案，刪除舊的 Cloudinary 資源
    if (videoFile && video.publicId) {
      try {
        const exists = await this.cloudinaryService.checkResourceExists(
          video.publicId,
          'video',
        );
        if (exists) {
          await this.cloudinaryService.deleteResource(video.publicId, 'video');
          this.logger.log(
            `[VideosService] Old Cloudinary resource deleted: ${video.publicId ? 'yes' : 'no'}`,
          );
        } else {
          this.logger.log(
            `[VideosService] Old Cloudinary resource not found: ${video.publicId ? 'yes' : 'no'}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `[VideosService] Error deleting old Cloudinary resource: ${video.publicId}`,
          error,
        );
      }
    }

    // 更新影片資訊
    Object.assign(video, updateVideoDto);

    // 如果有新檔案，上傳到 Cloudinary
    if (videoFile) {
      const uploadResult: any = await this.cloudinaryService.uploadVideo(
        videoFile,
        'videos',
      );
      video.url = uploadResult.secure_url;
      video.publicId = uploadResult.public_id;
      video.thumbnailUrl = this.cloudinaryService.generateThumbnail(
        uploadResult.public_id,
      );
    }

    let tags: Tag[] = video.tags || [];
    if (updateVideoDto.tagIds) {
      tags = await this.tagRepository.findByIds(updateVideoDto.tagIds);
    }

    video.tags = tags;
    return this.videoRepository.save(video);
  }

  async remove(id: number) {
    const video = await this.videoRepository.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException(`影片 ID ${id} 不存在`);
    }

    // 刪除 Cloudinary 資源
    if (video.publicId) {
      try {
        // 檢查資源是否存在
        const exists = await this.cloudinaryService.checkResourceExists(
          video.publicId,
          'video',
        );
        if (exists) {
          await this.cloudinaryService.deleteResource(video.publicId, 'video');
          this.logger.log(
            `[VideosService] Cloudinary resource deleted: ${video.publicId ? 'yes' : 'no'}`,
          );
        } else {
          this.logger.log(
            `[VideosService] Cloudinary resource not found: ${video.publicId ? 'yes' : 'no'}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `[VideosService] Error deleting Cloudinary resource: ${video.publicId}`,
          error,
        );
        // 即使 Cloudinary 刪除失敗，也要刪除資料庫記錄
      }
    }

    await this.videoRepository.remove(video);
    return { message: '影片已刪除' };
  }
}
