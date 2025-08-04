// src/sitemap/sitemap.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SitemapService } from './sitemap.service';
import { SitemapController } from './sitemap.controller';
import { Article } from '../articles/entities/article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Article])],
  controllers: [SitemapController],
  providers: [SitemapService],
})
export class SitemapModule {}
