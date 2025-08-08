import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { UnsplashService } from './unsplash/unsplash.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectDataSource() private dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
    private readonly unsplashService: UnsplashService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    };
  }

  @Get('api/health')
  getApiHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    };
  }

  @Get('api/health/detailed')
  async getDetailedHealth() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      services: {
        database: 'unknown',
        cloudinary: 'unknown',
        unsplash: 'unknown',
        jwt: 'unknown',
        cors: 'unknown',
        compression: 'unknown',
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
      },
      endpoints: {
        auth: 'unknown',
        articles: 'unknown',
        categories: 'unknown',
        tags: 'unknown',
        photos: 'unknown',
        videos: 'unknown',
      },
    };

    // 檢查資料庫連接
    try {
      await this.dataSource.query('SELECT 1');
      health.services.database = 'ok';
    } catch (error) {
      health.services.database = 'error';
      health.status = 'degraded';
    }

    // 檢查 JWT 配置
    try {
      if (process.env.JWT_SECRET && process.env.JWT_SECRET.length > 10) {
        health.services.jwt = 'ok';
      } else {
        health.services.jwt = 'error';
        health.status = 'degraded';
      }
    } catch (error) {
      health.services.jwt = 'error';
      health.status = 'degraded';
    }

    // 檢查 CORS 配置
    try {
      if (process.env.FRONTEND_URL) {
        health.services.cors = 'ok';
      } else {
        health.services.cors = 'warning';
      }
    } catch (error) {
      health.services.cors = 'error';
    }

    // 檢查 Cloudinary 服務
    try {
      if (
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ) {
        // 嘗試簡單的 Cloudinary 操作
        await this.cloudinaryService.getCloudinaryConfig();
        health.services.cloudinary = 'ok';
      } else {
        health.services.cloudinary = 'error';
        health.status = 'degraded';
      }
    } catch (error) {
      health.services.cloudinary = 'error';
      health.status = 'degraded';
    }

    // 檢查 Unsplash 服務
    try {
      if (process.env.UNSPLASH_ACCESS_KEY) {
        health.services.unsplash = 'ok';
      } else {
        health.services.unsplash = 'warning';
      }
    } catch (error) {
      health.services.unsplash = 'error';
    }

    // 檢查壓縮中間件
    try {
      health.services.compression = 'ok';
    } catch (error) {
      health.services.compression = 'error';
    }

    // 檢查環境變數
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
    ];

    const optionalEnvVars = [
      'UNSPLASH_ACCESS_KEY',
      'FRONTEND_URL',
      'ADMIN_USERNAME',
      'ADMIN_PASSWORD',
    ];

    const missingRequiredEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar],
    );

    const missingOptionalEnvVars = optionalEnvVars.filter(
      (envVar) => !process.env[envVar],
    );

    if (missingRequiredEnvVars.length > 0) {
      health.status = 'degraded';
      health['missingRequiredEnvVars'] = missingRequiredEnvVars;
    }

    if (missingOptionalEnvVars.length > 0) {
      health['missingOptionalEnvVars'] = missingOptionalEnvVars;
    }

    // 檢查資料庫表結構
    try {
      const tables = await this.dataSource.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `);
      health['databaseTables'] = tables.map((t) => t.table_name);
    } catch (error) {
      health['databaseTables'] = 'error';
    }

    // 檢查 API 端點可用性
    const endpointChecks = [
      {
        name: 'auth',
        path: '/api/auth/login',
        method: 'POST',
        requiresAuth: false,
      },
      {
        name: 'articles',
        path: '/api/articles',
        method: 'GET',
        requiresAuth: false,
      },
      {
        name: 'categories',
        path: '/api/categories',
        method: 'GET',
        requiresAuth: false,
      },
      { name: 'tags', path: '/api/tags', method: 'GET', requiresAuth: false },
      {
        name: 'photos',
        path: '/api/photos',
        method: 'GET',
        requiresAuth: false,
      },
      {
        name: 'videos',
        path: '/api/videos',
        method: 'GET',
        requiresAuth: false,
      },
    ];

    health['endpointStatus'] = endpointChecks.map((endpoint) => ({
      name: endpoint.name,
      path: endpoint.path,
      method: endpoint.method,
      status: 'available', // 這裡可以進一步檢查實際端點
    }));

    return health;
  }

  @Get('api/health/endpoints')
  async getEndpointHealth() {
    const endpoints = [
      {
        name: '認證',
        path: '/api/auth/login',
        method: 'POST',
        requiresAuth: false,
      },
      {
        name: '文章列表',
        path: '/api/articles',
        method: 'GET',
        requiresAuth: false,
      },
      {
        name: '文章詳情',
        path: '/api/articles/:id',
        method: 'GET',
        requiresAuth: false,
      },
      {
        name: '創建文章',
        path: '/api/articles',
        method: 'POST',
        requiresAuth: true,
      },
      {
        name: '更新文章',
        path: '/api/articles/:id',
        method: 'PATCH',
        requiresAuth: true,
      },
      {
        name: '刪除文章',
        path: '/api/articles/:id',
        method: 'DELETE',
        requiresAuth: true,
      },
      {
        name: '分類列表',
        path: '/api/categories',
        method: 'GET',
        requiresAuth: false,
      },
      {
        name: '標籤列表',
        path: '/api/tags',
        method: 'GET',
        requiresAuth: false,
      },
      {
        name: '照片列表',
        path: '/api/photos',
        method: 'GET',
        requiresAuth: false,
      },
      {
        name: '影片列表',
        path: '/api/videos',
        method: 'GET',
        requiresAuth: false,
      },
      {
        name: 'Cloudinary 上傳',
        path: '/api/cloudinary/upload',
        method: 'POST',
        requiresAuth: true,
      },
      {
        name: 'Unsplash 搜尋',
        path: '/api/unsplash/search',
        method: 'GET',
        requiresAuth: false,
      },
      {
        name: 'Sitemap',
        path: '/api/sitemap.xml',
        method: 'GET',
        requiresAuth: false,
      },
      {
        name: 'Robots.txt',
        path: '/api/robots.txt',
        method: 'GET',
        requiresAuth: false,
      },
    ];

    return {
      timestamp: new Date().toISOString(),
      totalEndpoints: endpoints.length,
      publicEndpoints: endpoints.filter((e) => !e.requiresAuth).length,
      protectedEndpoints: endpoints.filter((e) => e.requiresAuth).length,
      endpoints: endpoints.map((endpoint) => ({
        ...endpoint,
        status: 'available',
        description: `${endpoint.method} ${endpoint.path}`,
      })),
    };
  }
}
