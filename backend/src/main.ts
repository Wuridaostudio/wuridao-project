// src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import helmet from 'helmet';
import compression from 'compression';

import * as express from 'express';
import { Logger } from 'nestjs-pino';
import { ValidationError } from 'class-validator';

// 遞迴展開所有 constraints
function getAllConstraints(errors: ValidationError[]): string[] {
  let constraints: string[] = [];
  for (const error of errors) {
    if (error.constraints) {
      constraints = constraints.concat(Object.values(error.constraints));
    }
    if (error.children && error.children.length > 0) {
      constraints = constraints.concat(getAllConstraints(error.children));
    }
  }
  return constraints;
}

async function bootstrap() {
  // 使用 NestExpressApplication 以支援 app.set()
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useLogger(app.get(Logger));

  // 加入 JSON body parser 中間件，設定 UTF-8 編碼
  app.use(express.json({ limit: '10mb' }));

  // 設定回應的 charset
  app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
  });

  // 配置 Multer 檔案上傳編碼
  app.use((req, res, next) => {
    // 確保檔案名稱編碼正確
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      res.setHeader('Content-Type', 'multipart/form-data; charset=utf-8');
    }
    next();
  });

  // 全域異常過濾器 - 使用新的全域錯誤處理
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 全局攔截器
  app.useGlobalInterceptors(new LoggingInterceptor());

  // 安全中間件
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          imgSrc: [
            "'self'",
            'data:',
            'https://res.cloudinary.com',
            'https://images.unsplash.com',
          ],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          // 允許結構化資料的 JSON-LD
          scriptSrcAttr: ["'unsafe-inline'"],
        },
      },
    }),
  );

  // 壓縮中間件
  app.use(compression());

  // 信任代理（Render 部署需要）
  app.set('trust proxy', 1);

  // CORS 配置
  app.enableCors({
    origin: [process.env.FRONTEND_URL || 'https://wuridaostudio.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 設定全域 API 前綴
  app.setGlobalPrefix('api');

  // 全局驗證管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自動移除沒有裝飾器的屬性
      forbidNonWhitelisted: true, // 如果提供非白名單屬性則拋出錯誤
      transform: true, // 自動轉換 payload 為 DTO 類型
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const messages = getAllConstraints(errors);
        console.log('❌ [ValidationPipe] DTO 驗證失敗:', {
          errors: errors,
          messages: messages,
        });
        return new BadRequestException({
          statusCode: 400,
          message: messages.join(', '), // 將陣列轉換為字串
          error: 'Bad Request',
          details: messages, // 保留詳細信息
        });
      },
    }),
  );

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('WURIDAO 智慧家 API')
    .setDescription('WURIDAO 智慧家內容管理系統 API 文檔')
    .setVersion('1.0')
    .addTag('認證', '用戶認證相關接口')
    .addTag('文章', '文章管理接口')
    .addTag('影片', '影片管理接口')
    .addTag('照片', '照片管理接口')
    .addTag('分類', '分類管理接口')
    .addTag('標籤', '標籤管理接口')
    .addTag('Unsplash', 'Unsplash 圖片搜尋接口')
    .addTag('數據分析', '網站數據分析接口')
    .addTag('SEO', 'SEO 相關接口')
    .addTag('系統健康檢查', '系統健康檢查接口')
    .addBearerAuth()
    .addServer('http://localhost:3000', '本地開發環境')
    .addServer('https://wuridao-api.onrender.com', '生產環境')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
