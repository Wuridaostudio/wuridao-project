// src/database/seeds/create-categories.seed.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Category,
  CategoryType,
} from '../../categories/entities/category.entity';

@Injectable()
export class CreateCategoriesSeed {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async run(): Promise<void> {
    const defaultCategories = [
      { name: '智能家電', type: CategoryType.ARTICLE },
      { name: 'IoT 設備', type: CategoryType.ARTICLE },
      { name: '家庭自動化', type: CategoryType.ARTICLE },
      { name: '產品評測', type: CategoryType.VIDEO },
      { name: '安裝教學', type: CategoryType.VIDEO },
      { name: '智能家居', type: CategoryType.PHOTO },
      { name: '設備展示', type: CategoryType.PHOTO },
    ];

    for (const categoryData of defaultCategories) {
      const exists = await this.categoryRepository.findOne({
        where: { name: categoryData.name, type: categoryData.type },
      });

      if (!exists) {
        const category = this.categoryRepository.create(categoryData);
        await this.categoryRepository.save(category);
        console.log(`✅ Category "${categoryData.name}" created`);
      }
    }
  }
}
