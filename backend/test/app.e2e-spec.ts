// backend/test/app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // 確保測試環境變數已設定
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      process.env.ADMIN_USERNAME = process.env.TEST_ADMIN_USERNAME || 'admin';
      process.env.ADMIN_PASSWORD =
        process.env.TEST_ADMIN_PASSWORD || 'test-password';
    }

    // 設定測試資料庫連線
    process.env.DATABASE_URL =
      process.env.TEST_DATABASE_URL ||
      'postgresql://test:test@localhost:5432/test_db';
    process.env.USE_SSL = process.env.TEST_USE_SSL || 'false';
  }, 30000);

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  }, 10000);

  describe('Health Check', () => {
    it('/ (GET) - health check', async () => {
      await request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('WURIDAO API is running!');
    }, 15000);

    it('/health (GET) - health check endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'WURIDAO API');
    }, 15000);

    it('/sitemap.xml (GET) - sitemap generation', async () => {
      const response = await request(app.getHttpServer())
        .get('/sitemap.xml')
        .expect(200);

      expect(response.header['content-type']).toMatch(/xml/);
      expect(response.text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    }, 15000);

    it('/robots.txt (GET) - robots.txt generation', async () => {
      const response = await request(app.getHttpServer())
        .get('/robots.txt')
        .expect(200);

      expect(response.header['content-type']).toMatch(/text\/plain/);
      expect(response.text).toContain('User-agent: *');
    }, 15000);
  });

  describe('API Documentation', () => {
    it('/api-docs (GET) - Swagger documentation', async () => {
      const response = await request(app.getHttpServer())
        .get('/api-docs')
        .expect(200);

      expect(response.text).toContain('swagger');
    }, 15000);
  });

  // 暫時跳過需要資料庫的測試
  describe.skip('Authentication', () => {
    it('/auth/login (POST) - success', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: process.env.ADMIN_USERNAME || 'admin',
          password:
            process.env.ADMIN_PASSWORD ||
            process.env.TEST_ADMIN_PASSWORD ||
            'test-password',
        })
        .expect(201);

      expect(response.body.access_token).toBeDefined();
    }, 15000);

    it('/auth/login (POST) - invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'wrong@email.com',
          password: 'wrongpassword',
        })
        .expect(401);
    }, 15000);
  });

  describe.skip('Articles', () => {
    it('/articles (GET) - get all articles', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/articles')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    }, 15000);
  });
});
