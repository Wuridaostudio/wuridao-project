// src/database/seeds/create-tags.seed.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../../tags/entities/tag.entity';

@Injectable()
export class CreateTagsSeed {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
  ) {}

  async run(): Promise<void> {
    const defaultTags = [
      '智慧家居',
      'IoT',
      '物聯網',
      '智能音箱',
      '智能燈光',
      '安全監控',
      '節能環保',
      '語音控制',
      '遠程控制',
      '自動化',
      '感應器',
      'WiFi',
      '藍牙',
      '5G',
      '人工智能',
    ];

    for (const tagName of defaultTags) {
      const exists = await this.tagRepository.findOne({
        where: { name: tagName },
      });

      if (!exists) {
        const tag = this.tagRepository.create({ name: tagName });
        await this.tagRepository.save(tag);
        console.log(`✅ Tag "${tagName}" created`);
      }
    }
  }
}
