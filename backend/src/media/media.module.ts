// src/media/media.module.ts
import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { PhotosModule } from '../photos/photos.module';
import { VideosModule } from '../videos/videos.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [PhotosModule, VideosModule, CloudinaryModule],
  controllers: [MediaController],
})
export class MediaModule {}
