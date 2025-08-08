import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Refactoring Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check Endpoints', () => {
    it('should return basic health check', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
        });
    });

    it('should return detailed health check', () => {
      return request(app.getHttpServer())
        .get('/health/api/detailed')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('services');
          expect(res.body).toHaveProperty('memory');
          expect(res.body).toHaveProperty('system');
        });
    });

    it('should return endpoint health check', () => {
      return request(app.getHttpServer())
        .get('/health/api/endpoints')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalEndpoints');
          expect(res.body).toHaveProperty('publicEndpoints');
          expect(res.body).toHaveProperty('protectedEndpoints');
          expect(res.body).toHaveProperty('endpoints');
        });
    });
  });

  describe('Statistics Endpoints', () => {
    it('should return system statistics', () => {
      return request(app.getHttpServer())
        .get('/api/statistics')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('articles');
          expect(res.body).toHaveProperty('photos');
          expect(res.body).toHaveProperty('videos');
          expect(res.body).toHaveProperty('users');
          expect(res.body).toHaveProperty('categories');
          expect(res.body).toHaveProperty('tags');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', () => {
      return request(app.getHttpServer())
        .get('/nonexistent-endpoint')
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 404);
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('errorId');
          expect(res.body).toHaveProperty('timestamp');
        });
    });

    it('should handle validation errors', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 400);
          expect(res.body).toHaveProperty('message');
        });
    });
  });

  describe('App Controller', () => {
    it('should return hello message', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          expect(typeof res.text).toBe('string');
        });
    });
  });
});
