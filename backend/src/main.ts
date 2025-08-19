// src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
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

  // 安全修復：生產環境移除調試資訊
  if (process.env.NODE_ENV === 'production') {
    console.log = () => {};
    console.error = () => {};
  }

  // 加入 JSON body parser 中間件，設定 UTF-8 編碼
  app.use(express.json({ limit: '10mb' }));

  // 設定回應的 charset
  app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
  });

  // 修正 multipart/form-data 中文亂碼問題
  app.use((req, res, next) => {
    if (
      req.headers['content-type']?.includes('multipart/form-data') &&
      !req.headers['content-type']?.includes('charset')
    ) {
      req.headers['content-type'] += '; charset=utf-8';
    }
    next();
  });

  // 全局異常過濾器
  app.useGlobalFilters(new HttpExceptionFilter(app.get(Logger)));

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

  // CORS 配置 - 修復跨域問題
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'https://wuridao-project.onrender.com',
      'http://localhost:3001', // 開發環境
      'https://wuridao-project.onrender.com', // 生產環境前端
      'https://wuridaostudio.com', // 主要域名
      'https://wuridao-project.onrender.com', // 確保完全匹配
    ],
    credentials: true, // ✅ 允許攜帶 Cookie
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'], // ✅ 暴露 Set-Cookie 標頭
    preflightContinue: false,
    optionsSuccessStatus: 204,
    ],
    credentials: true, // ✅ 重要：允許跨域請求攜帶 credentials
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'], // 允許 Cookie 標頭
    exposedHeaders: ['Set-Cookie'], // 允許前端讀取 Set-Cookie 標頭
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

  // Swagger 配置 - 只在開發環境啟用
  if (process.env.NODE_ENV !== 'production') {
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
      .addBearerAuth()
      .addServer('http://localhost:3000', '本地開發環境')
      .addServer('https://wuridao-api.onrender.com', '生產環境')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
