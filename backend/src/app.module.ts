// src/app.module.ts - 完整的應用模組
import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { LoggerModule } from 'nestjs-pino';
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
import { HealthModule } from './health/health.module';
import { StatisticsModule } from './statistics/statistics.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { LogsModule } from './logs/logs.module';
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

// 配置
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level:
          process.env.LOG_LEVEL ||
          (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  crlf: true,
                  errorLikeObjectKeys: ['err', 'error'],
                  ignore: 'pid,hostname',
                  translateTime: 'yyyy-mm-dd HH:MM:ss',
                  messageFormat: '{msg}',
                  // 修復中文亂碼問題
                  messageKey: 'msg',
                  // 確保 UTF-8 編碼
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname,req,res,responseTime',
                },
              }
            : undefined,
        // 修復中文亂碼問題
        messageKey: 'msg',
        timestamp: () => `,"time":"${new Date().toISOString()}"`,
        customLogLevel: (req, res, err) => {
          if (res.statusCode >= 400 && res.statusCode < 500) {
            return 'warn';
          }
          if (res.statusCode >= 500 || err) {
            return 'error';
          }
          return 'info';
        },
        // 確保 UTF-8 編碼
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
            headers: req.headers,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
      },
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    MulterModule.register({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB 最大限制（適用於影片）
      },
    }),
    // 數據庫配置 - 使用優化配置
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl:
        process.env.USE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      entities: [User, Article, Video, Photo, Category, Tag, SeoSettings],
      synchronize: false, // 始終使用遷移來管理資料庫結構，避免數據丟失
      logging:
        process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
      maxQueryExecutionTime: parseInt(process.env.DB_MAX_QUERY_TIME || '1000'),
      retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.DB_RETRY_DELAY || '3000'),
      autoLoadEntities: true,
      extra: {
        connectionLimit:
          process.env.NODE_ENV === 'production'
            ? parseInt(process.env.DB_POOL_SIZE_PROD || '10')
            : parseInt(process.env.DB_POOL_SIZE_DEV || '5'),
        acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'),
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),

        // 免費服務環境優化
        ...(process.env.FREE_TIER === 'true' && {
          connectionLimit: parseInt(process.env.DB_POOL_SIZE_FREE || '5'),
          acquireTimeout: parseInt(
            process.env.DB_ACQUIRE_TIMEOUT_FREE || '30000',
          ),
          idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT_FREE || '15000'),
        }),
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
    HealthModule,
    StatisticsModule,
    MonitoringModule,
    LogsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CreateAdminSeed,
    CreateCategoriesSeed,
    CreateTagsSeed,
    // Logger, // Logger is provided by LoggerModule
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name); // 實例化 Logger

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
                 this.logger.log('[AppModule] Seed data initialization completed');
       } catch (error) {
         this.logger.error({ err: error }, '[AppModule] Seed data initialization failed');
       }
    }
  }
}
