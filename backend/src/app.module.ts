// src/app.module.ts - 完整的應用模組
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { LoggerModule } from 'nestjs-pino';
import { Logger } from 'nestjs-pino';
import * as Sentry from '@sentry/node';

// 業務模組
import { AuthModule } from './auth/auth.module';
import { ArticlesModule } from './articles/articles.module';
import { VideosModule } from './videos/videos.module';
import { PhotosModule } from './photos/photos.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { UnsplashModule } from './unsplash/unsplash.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MediaModule } from './media/media.module';
import { SitemapModule } from './sitemap/sitemap.module';
import { SeoModule } from './seo/seo.module';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// 實體
import { User } from './auth/entities/user.entity';
import { Article } from './articles/entities/article.entity';
import { Video } from './videos/entities/video.entity';
import { Photo } from './photos/entities/photo.entity';
import { Category } from './categories/entities/category.entity';
import { Tag } from './tags/entities/tag.entity';
import { SeoSettings } from './seo/seo.entity';

// 種子服務
import { CreateAdminSeed } from './database/seeds/create-admin.seed';
import { CreateCategoriesSeed } from './database/seeds/create-categories.seed';
import { CreateTagsSeed } from './database/seeds/create-tags.seed';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport: process.env.NODE_ENV !== 'production' ? {
          target: 'pino-pretty',
          options: { colorize: true }
        } : undefined,
      },
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    MulterModule.register({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB 最大限制（適用於影片）
      },
    }),
    // 數據庫配置
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl:
        process.env.USE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      entities: [User, Article, Video, Photo, Category, Tag, SeoSettings],
      synchronize: process.env.NODE_ENV === 'development',
      logging:
        process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
      maxQueryExecutionTime: 1000,
      retryAttempts: 3,
      retryDelay: 3000,
      autoLoadEntities: true,
      extra: {
        connectionLimit: 10,
      },
    }),
    TypeOrmModule.forFeature([User, Category, Tag]),

    // 速率限制
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // 定時任務
    ScheduleModule.forRoot(),

    // 業務模組
    DatabaseModule,
    AuthModule,
    ArticlesModule,
    VideosModule,
    PhotosModule,
    CategoriesModule,
    TagsModule,
    UnsplashModule,
    AnalyticsModule,
    CloudinaryModule,
    MediaModule,
    SitemapModule,
    SeoModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CreateAdminSeed,
    CreateCategoriesSeed,
    CreateTagsSeed,
    Logger,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly createAdminSeed: CreateAdminSeed,
    private readonly createCategoriesSeed: CreateCategoriesSeed,
    private readonly createTagsSeed: CreateTagsSeed,
  ) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
      environment: process.env.NODE_ENV,
    });
  }

  async onModuleInit() {
    // 開發環境自動運行種子數據
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.AUTO_SEED_DATABASE === 'true'
    ) {
      try {
        await this.createAdminSeed.run();
        await this.createCategoriesSeed.run();
        await this.createTagsSeed.run();
        console.log('✅ 種子數據初始化完成');
      } catch (error) {
        console.error('❌ 種子數據初始化失敗:', error);
      }
    }
  }
}
