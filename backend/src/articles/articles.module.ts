// src/articles/articles.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { ArticleUploadService } from './services/article-upload.service';
import { ArticleSeoService } from './services/article-seo.service';
import { Article } from './entities/article.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Category } from '../categories/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, Tag, Category]),
    CloudinaryModule,
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService, ArticleUploadService, ArticleSeoService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
