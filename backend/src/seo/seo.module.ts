import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';
import { SeoSettings } from './seo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SeoSettings])],
  controllers: [SeoController],
  providers: [SeoService],
  exports: [SeoService],
})
export class SeoModule {} 