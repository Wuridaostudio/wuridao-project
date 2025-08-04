import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { UnsplashService } from './unsplash/unsplash.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const mockDataSource = {
      query: jest.fn(),
    };

    const mockCloudinaryService = {
      getCloudinaryConfig: jest.fn(),
    };

    const mockUnsplashService = {};

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHello: jest.fn().mockReturnValue('WURIDAO API is running!'),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
        {
          provide: UnsplashService,
          useValue: mockUnsplashService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return health status', () => {
      expect(appController.getHello()).toBe('WURIDAO API is running!');
    });

    it('should return health check object', () => {
      const result = appController.getHealth();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(result.environment).toBeDefined();
    });

    it('should return API health check object', () => {
      const result = appController.getApiHealth();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(result.environment).toBeDefined();
    });
  });
});
