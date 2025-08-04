// src/tags/tags.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
  ) {}

  async create(createTagDto: CreateTagDto) {
    // 新增唯一性檢查
    const existingTag = await this.tagRepository.findOne({ where: { name: createTagDto.name } });
    if (existingTag) {
      throw new ConflictException(`標籤「${createTagDto.name}」已經存在。`);
    }
    const tag = this.tagRepository.create(createTagDto);
    return this.tagRepository.save(tag);
  }

  async findAll() {
    return this.tagRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException('標籤不存在');
    }
    return tag;
  }

  async remove(id: number): Promise<void> {
    // 1. 取得 tag
    const tag = await this.tagRepository.findOneBy({ id });
    if (!tag) {
      throw new NotFoundException(`無法找到 ID 為 ${id} 的標籤。`);
    }
    // 2. 用 QueryBuilder 查詢被幾篇文章/照片使用
    const usageQuery = await this.tagRepository.createQueryBuilder("tag")
      .leftJoin("tag.articles", "article")
      .leftJoin("tag.photos", "photo")
      .where("tag.id = :id", { id })
      .select("COUNT(DISTINCT article.id)", "articleCount")
      .addSelect("COUNT(DISTINCT photo.id)", "photoCount")
      .getRawOne();
    const articleCount = usageQuery ? parseInt(usageQuery.articleCount, 10) : 0;
    const photoCount = usageQuery ? parseInt(usageQuery.photoCount, 10) : 0;
    if (articleCount > 0 || photoCount > 0) {
      throw new BadRequestException(
        `無法刪除標籤「${tag.name}」，該標籤仍被 ${articleCount} 篇文章和 ${photoCount} 張照片使用。`
      );
    }
    // 3. 安全刪除
    await this.tagRepository.remove(tag);
  }
}
