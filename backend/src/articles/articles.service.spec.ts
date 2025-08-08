import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticlesService } from './articles.service';
import { Article } from './entities/article.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { OptimisticLockVersionMismatchError } from 'typeorm';
import { Tag } from '../tags/entities/tag.entity';

// Mock Express.Multer.File
type MockFile = Express.Multer.File;

describe('ArticlesService', () => {
  let service: ArticlesService;
  let articleRepository: Repository<Article>;
  let cloudinaryService: CloudinaryService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getManyAndCount: jest.fn(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getSql: jest.fn().mockReturnValue('SELECT ...'),
  };

  const mockArticleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockCloudinaryService = {
    uploadImage: jest.fn(),
    deleteResource: jest.fn(),
    safelyDeleteResource: jest.fn(),
    checkResourceExists: jest.fn(),
    uploadBuffer: jest.fn(),
  };
  
  const mockTagRepository = {
    findBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: getRepositoryToken(Article),
          useValue: mockArticleRepository,
        },
        {
          provide: getRepositoryToken(Tag),
          useValue: mockTagRepository,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    articleRepository = module.get<Repository<Article>>(
      getRepositoryToken(Article),
    );
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an article with image upload', async () => {
      const createArticleDto: CreateArticleDto = {
        title: 'Test Article',
        content: 'Test content',
        categoryId: 1,
      };

      const mockFile: MockFile = {
        fieldname: 'coverImage',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 123,
        buffer: Buffer.from('test'),
        stream: null,
        destination: '',
        filename: '',
        path: '',
      };

      const mockUploadResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        public_id: 'test_public_id',
      };

      const mockArticle = {
        id: 1,
        ...createArticleDto,
        coverImageUrl: mockUploadResult.secure_url,
        coverImagePublicId: mockUploadResult.public_id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCloudinaryService.uploadImage.mockResolvedValue(mockUploadResult);
      mockCloudinaryService.uploadBuffer.mockResolvedValue(mockUploadResult);
      mockArticleRepository.create.mockReturnValue(mockArticle);
      mockArticleRepository.save.mockResolvedValue(mockArticle);
      mockArticleRepository.findOne.mockResolvedValue(mockArticle);

      const result = await service.create(createArticleDto, mockFile);

      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(mockFile, 'articles');
      expect(articleRepository.create).toHaveBeenCalledWith(expect.any(Object));
      expect(articleRepository.save).toHaveBeenCalledWith(mockArticle);
      expect(result).toEqual(mockArticle);
    });

    it('should create an article without image', async () => {
      const createArticleDto: CreateArticleDto = {
        title: 'Test Article',
        content: 'Test content',
      };

      const mockArticle = {
        id: 1,
        ...createArticleDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const mockUploadResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        public_id: 'test_public_id',
      };

      mockCloudinaryService.uploadBuffer.mockResolvedValue(mockUploadResult);
      mockArticleRepository.create.mockReturnValue(mockArticle);
      mockArticleRepository.save.mockResolvedValue(mockArticle);
      mockArticleRepository.findOne.mockResolvedValue(mockArticle);

      const result = await service.create(createArticleDto);

      expect(cloudinaryService.uploadImage).not.toHaveBeenCalled();
      expect(articleRepository.create).toHaveBeenCalledWith(expect.any(Object));
      expect(articleRepository.save).toHaveBeenCalledWith(mockArticle);
      expect(result).toEqual(mockArticle);
    });
  });

  describe('findAll', () => {
    it('should return all articles', async () => {
      const mockArticles = [
        { id: 1, title: 'Article 1', content: 'Content 1' },
        { id: 2, title: 'Article 2', content: 'Content 2' },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockArticles, mockArticles.length]);
      mockArticleRepository.find.mockResolvedValue(mockArticles);

      const result = await service.findAll();

      expect(articleRepository.createQueryBuilder).toHaveBeenCalledWith(
        'article',
      );
      expect(result.data).toEqual(mockArticles);
    });
  });

  describe('findOne', () => {
    it('should return an article by id', async () => {
      const mockArticle = {
        id: 1,
        title: 'Test Article',
        content: 'Test content',
      };

      mockArticleRepository.findOne.mockResolvedValue(mockArticle);

      const result = await service.findOne(1);

      expect(articleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['category', 'tags'],
      });
      expect(result).toEqual({ ...mockArticle, jsonLd: expect.any(Object) });
    });

    it('should throw NotFoundException when article not found', async () => {
      mockArticleRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an article successfully', async () => {
      const updateArticleDto: UpdateArticleDto = {
        title: 'Updated Article',
      };

      const existingArticle = {
        id: 1,
        title: 'Original Article',
        content: 'Original content',
        version: 1,
      };

      const updatedArticle = {
        ...existingArticle,
        ...updateArticleDto,
        version: 2,
      };

      mockArticleRepository.findOne.mockResolvedValue(existingArticle);
      mockArticleRepository.save.mockResolvedValue(updatedArticle);

      const result = await service.update(1, updateArticleDto);

      expect(articleRepository.save).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual(updatedArticle);
    });

    it('should throw NotFoundException when article not found', async () => {
      const updateArticleDto: UpdateArticleDto = {
        title: 'Updated Article',
      };

      mockArticleRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateArticleDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle optimistic lock version mismatch', async () => {
      const updateArticleDto: UpdateArticleDto = {
        title: 'Updated Article',
      };

      const existingArticle = {
        id: 1,
        title: 'Original Article',
        content: 'Original content',
        version: 1,
      };

      mockArticleRepository.findOne.mockResolvedValue(existingArticle);
      mockArticleRepository.save.mockRejectedValue(
        new OptimisticLockVersionMismatchError('test', 1, 2),
      );

      await expect(service.update(1, updateArticleDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should remove an article successfully', async () => {
      const mockArticle = {
        id: 1,
        title: 'Test Article',
        coverImagePublicId: 'test_public_id',
        contentPublicId: 'test_content_public_id',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Test Article',
          image: [],
          datePublished: '',
          dateModified: '',
          author: {
            '@type': 'Person',
            name: 'WURIDAO',
          },
          description: '',
          keywords: '',
        },
      };

      mockArticleRepository.findOne.mockResolvedValue(mockArticle);
      mockArticleRepository.remove.mockResolvedValue(mockArticle);
      mockCloudinaryService.checkResourceExists.mockResolvedValue(true);
      mockCloudinaryService.deleteResource.mockResolvedValue(undefined);

      await service.remove(1);

      expect(cloudinaryService.deleteResource).toHaveBeenCalledWith(
        'test_public_id',
        'image',
      );
      expect(cloudinaryService.deleteResource).toHaveBeenCalledWith(
        'test_content_public_id',
        'raw',
      );
      expect(articleRepository.remove).toHaveBeenCalledWith(mockArticle);
    });

    it('should throw NotFoundException when article not found', async () => {
      mockArticleRepository.findOne.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
