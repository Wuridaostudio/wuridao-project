// src/photos/photos.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './entities/photo.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { Tag } from '../tags/entities/tag.entity';

@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(Photo)
    private photoRepository: Repository<Photo>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createPhotoDto: CreatePhotoDto,
    photoFile?: Express.Multer.File,
  ) {
    let uploadResult: any = null;

    if (photoFile) {
      // 如果有文件，先上傳到 Cloudinary
      uploadResult = await this.cloudinaryService.uploadImage(
        photoFile,
        'photos',
      );
    } else if (createPhotoDto.url && createPhotoDto.publicId) {
      // 新增：檢查 cloudinary 是否存在
      const exists = await this.cloudinaryService.checkResourceExists(
        createPhotoDto.publicId,
        'image',
      );
      if (!exists)
        throw new BadRequestException('Cloudinary resource not found');
      // 新增：檢查資料庫唯一性
      const duplicate = await this.photoRepository.findOne({
        where: { publicId: createPhotoDto.publicId },
      });
      if (duplicate) throw new ConflictException('publicId already exists');
      uploadResult = {
        public_id: createPhotoDto.publicId,
        secure_url: createPhotoDto.url,
      };
    } else if (createPhotoDto.url && !createPhotoDto.publicId) {
      // 後備方案：若前端未傳 publicId，嘗試自 URL 解析出 publicId
      // 期望格式：.../image/upload/v<version>/<folder...>/<filename>.<ext>
      const match = createPhotoDto.url.match(
        /\/upload\/v\d+\/([^.?]+)(?:\.[^/?#]+)?$/,
      );
      const derivedPublicId = match?.[1];
      if (!derivedPublicId) {
        throw new BadRequestException(
          'publicId is missing and could not be derived from URL.',
        );
      }
      const exists = await this.cloudinaryService.checkResourceExists(
        derivedPublicId,
        'image',
      );
      if (!exists)
        throw new BadRequestException('Cloudinary resource not found');
      const duplicate = await this.photoRepository.findOne({
        where: { publicId: derivedPublicId },
      });
      if (duplicate) throw new ConflictException('publicId already exists');
      uploadResult = {
        public_id: derivedPublicId,
        secure_url: createPhotoDto.url,
      };
    } else {
      throw new BadRequestException(
        'Either file or URL with publicId is required.',
      );
    }

    try {
      let tags: Tag[] = [];
      if (createPhotoDto.tagIds && createPhotoDto.tagIds.length > 0) {
        tags = await this.tagRepository.findByIds(createPhotoDto.tagIds);
      }

      // 儲存資料庫
      const photo = this.photoRepository.create({
        ...createPhotoDto,
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        tags,
      });
      return await this.photoRepository.save(photo);
    } catch (dbError) {
      // 統一清理
      if (uploadResult?.public_id) {
        await this.cloudinaryService.safelyDeleteResource(
          uploadResult.public_id,
          'image',
        );
      }
      throw new InternalServerErrorException('Failed to save photo record.', {
        cause: dbError,
      });
    }
  }

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{ data: Photo[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.photoRepository.findAndCount({
      relations: ['category', 'tags'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });
    return { data, total };
  }

  async findOne(id: number) {
    const photo = await this.photoRepository.findOne({
      where: { id },
      relations: ['category', 'tags'],
    });

    if (!photo) {
      throw new NotFoundException('照片不存在');
    }

    return photo;
  }

  // 依 publicId 精確查找（含關聯）
  async findByPublicIdExact(publicId: string) {
    return this.photoRepository.findOne({
      where: { publicId },
      relations: ['category', 'tags'],
    });
  }

  // 依 publicId 尾段查找（例如路由只帶尾段 id 時）
  async findByPublicIdSuffix(suffix: string) {
    const like = `%/${suffix}`;
    return this.photoRepository
      .createQueryBuilder('photo')
      .leftJoinAndSelect('photo.category', 'category')
      .leftJoinAndSelect('photo.tags', 'tags')
      .where('photo.publicId LIKE :like', { like })
      .getOne();
  }

  async update(
    id: number,
    updatePhotoDto: UpdatePhotoDto,
    photoFile?: Express.Multer.File,
  ) {
    const photo = await this.findOne(id);

    const oldPublicId = photo.publicId;
    let newUploadResult: any = null;

    if (photoFile) {
      // 根據規則 #1：先上傳新檔案
      newUploadResult = await this.cloudinaryService.uploadImage(
        photoFile,
        'photos',
      );
      updatePhotoDto.url = newUploadResult.secure_url;
      photo.publicId = newUploadResult.public_id;
    }

    let tags: Tag[] = photo.tags || [];
    if (updatePhotoDto.tagIds) {
      tags = await this.tagRepository.findByIds(updatePhotoDto.tagIds);
    }

    Object.assign(photo, updatePhotoDto);
    photo.tags = tags;

    try {
      // 根據規則 #1：儲存資料庫
      const updatedPhoto = await this.photoRepository.save(photo);

      // 根據規則 #1：如果資料庫儲存成功，才清理舊檔案
      if (newUploadResult && oldPublicId) {
        await this.cloudinaryService.safelyDeleteResource(oldPublicId, 'image');
      }

      return updatedPhoto;
    } catch (dbError) {
      // 根據規則 #1：如果資料庫儲存失敗，清理新上傳的檔案
      if (newUploadResult) {
        await this.cloudinaryService.safelyDeleteResource(
          newUploadResult.public_id,
          'image',
        );
      }

      // 處理樂觀鎖衝突
      if (dbError.name === 'OptimisticLockVersionMismatchError') {
        throw new ConflictException(
          'The record was modified by another user. Please refresh and try again.',
        );
      }

      throw new InternalServerErrorException('Failed to update photo record.', {
        cause: dbError,
      });
    }
  }

  async remove(id: number) {
    const photo = await this.findOne(id);

    // 根據規則 #1：先從資料庫刪除
    await this.photoRepository.remove(photo);

    // 根據規則 #1：然後再清理外部資源
    if (photo.publicId) {
      await this.cloudinaryService.safelyDeleteResource(
        photo.publicId,
        'image',
      );
    }

    return { message: '照片已刪除' };
  }
}
