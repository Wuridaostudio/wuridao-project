// src/categories/categories.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, CategoryType } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Article } from '../articles/entities/article.entity'; // Import Article entity

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    // Inject the Article repository
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async findAll(type?: CategoryType) {
    const query = this.categoryRepository.createQueryBuilder('category')
      .loadRelationCountAndMap('category.articleCount', 'category.articles')
      .loadRelationCountAndMap('category.photoCount', 'category.photos')
      .loadRelationCountAndMap('category.videoCount', 'category.videos');

    if (type) {
      query.where('category.type = :type', { type });
    }

    return query.getMany();
  }

  async findOne(id: number) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('分類不存在');
    }
    return category;
  }

  // [THIS IS THE CORRECTED METHOD]
  async remove(id: number): Promise<void> {
    // First, find the category to get its name for a better error message
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if any articles are associated with this category
    const articleCount = await this.articleRepository.count({
      where: { categoryId: id },
    });

    // If articles exist, throw a clear, client-facing error instead of crashing
    if (articleCount > 0) {
      throw new BadRequestException(
        `無法刪除分類「${category.name}」，該分類下還有 ${articleCount} 篇文章`,
      );
    }

    // If no articles are associated, proceed with deletion
    await this.categoryRepository.remove(category);
  }
}
