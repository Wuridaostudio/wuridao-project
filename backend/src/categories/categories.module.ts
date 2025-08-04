// src/categories/categories.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category } from './entities/category.entity';
import { Article } from '../articles/entities/article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Article])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
