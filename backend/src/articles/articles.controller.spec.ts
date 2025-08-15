import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { NotFoundException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

describe('ArticlesController', () => {
  let controller: ArticlesController;
  let service: ArticlesService;

  const mockArticlesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [
        {
          provide: ArticlesService,
          useValue: mockArticlesService,
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ArticlesController>(ArticlesController);
    service = module.get<ArticlesService>(ArticlesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an article', async () => {
      const createArticleDto: CreateArticleDto = {
        title: 'Test Article',
        content: 'Test content',
      };

      const mockArticle = { id: 1, ...createArticleDto };
      mockArticlesService.create.mockResolvedValue(mockArticle);

      const result = await controller.create(
        { user: { userId: 1, username: 'admin' } } as any,
        createArticleDto,
      );

      expect(result).toEqual(mockArticle);
      expect(service.create).toHaveBeenCalledWith(createArticleDto, undefined);
    });

    it('should create an article with cover image', async () => {
      const createArticleDto: CreateArticleDto = {
        title: 'Test Article',
        content: 'Test content',
      };

      const mockFile = {
        fieldname: 'coverImage',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 123,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const mockArticle = { id: 1, ...createArticleDto };
      mockArticlesService.create.mockResolvedValue(mockArticle);

      const result = await controller.create(
        { user: { userId: 1, username: 'admin' } } as any,
        createArticleDto,
        mockFile,
      );

      expect(result).toEqual(mockArticle);
      expect(service.create).toHaveBeenCalledWith(createArticleDto, mockFile);
    });
  });

  describe('findAll', () => {
    it('should return articles list', async () => {
      const mockArticles = [
        { id: 1, title: 'Article 1' },
        { id: 2, title: 'Article 2' },
      ];

      mockArticlesService.findAll.mockResolvedValue({
        data: mockArticles,
        total: 2,
      });

      const result = await controller.findAll(1, 15);

      expect(result).toEqual({
        data: mockArticles,
        total: 2,
      });
      expect(service.findAll).toHaveBeenCalledWith(undefined, 1, 15);
    });

    it('should return filtered articles when draft parameter is provided', async () => {
      const mockArticles = [{ id: 1, title: 'Draft Article', isDraft: true }];

      mockArticlesService.findAll.mockResolvedValue({
        data: mockArticles,
        total: 1,
      });

      const result = await controller.findAll(1, 15, 'true');

      expect(result).toEqual({
        data: mockArticles,
        total: 1,
      });
      expect(service.findAll).toHaveBeenCalledWith(true, 1, 15);
    });
  });

  describe('findOne', () => {
    it('should return a single article', async () => {
      const mockArticle = { id: 1, title: 'Test Article' };
      mockArticlesService.findOne.mockResolvedValue(mockArticle);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockArticle);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update an article', async () => {
      const updateArticleDto: UpdateArticleDto = {
        title: 'Updated Article',
      };

      const mockArticle = { id: 1, title: 'Updated Article' };
      mockArticlesService.update.mockResolvedValue(mockArticle);

      const result = await controller.update(
        '1',
        { user: { userId: 1, username: 'admin' } } as any,
        updateArticleDto,
      );

      expect(result).toEqual(mockArticle);
      expect(service.update).toHaveBeenCalledWith(
        1,
        updateArticleDto,
        undefined,
      );
    });

    it('should update an article with cover image', async () => {
      const updateArticleDto: UpdateArticleDto = {
        title: 'Updated Article',
      };

      const mockFile = {
        fieldname: 'coverImage',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 123,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const mockArticle = { id: 1, title: 'Updated Article' };
      mockArticlesService.update.mockResolvedValue(mockArticle);

      const result = await controller.update(
        '1',
        { user: { userId: 1, username: 'admin' } } as any,
        updateArticleDto,
        mockFile,
      );

      expect(result).toEqual(mockArticle);
      expect(service.update).toHaveBeenCalledWith(
        1,
        updateArticleDto,
        mockFile,
      );
    });
  });

  describe('remove', () => {
    it('should remove an article', async () => {
      const mockResult = { message: '文章已刪除' };
      mockArticlesService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('1', {
        user: { userId: 1, username: 'admin' },
      } as any);

      expect(result).toEqual(mockResult);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
