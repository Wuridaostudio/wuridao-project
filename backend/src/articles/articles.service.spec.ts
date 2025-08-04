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

describe('ArticlesService', () => {
  let service: ArticlesService;
  let articleRepository: Repository<Article>;
  let cloudinaryService: CloudinaryService;

  const mockArticleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    })),
  };

  const mockCloudinaryService = {
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
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
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    articleRepository = module.get<Repository<Article>>(getRepositoryToken(Article));
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

      const mockFile = {
        fieldname: 'coverImage',
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
      };

      const mockUploadResult = {
        url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        public_id: 'test_public_id',
      };

      const mockArticle = {
        id: 1,
        ...createArticleDto,
        coverImageUrl: mockUploadResult.url,
        coverImagePublicId: mockUploadResult.public_id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCloudinaryService.uploadImage.mockResolvedValue(mockUploadResult);
      mockArticleRepository.create.mockReturnValue(mockArticle);
      mockArticleRepository.save.mockResolvedValue(mockArticle);

      const result = await service.create(createArticleDto, mockFile);

      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(mockFile);
      expect(articleRepository.create).toHaveBeenCalledWith({
        ...createArticleDto,
        coverImageUrl: mockUploadResult.url,
        coverImagePublicId: mockUploadResult.public_id,
      });
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

      mockArticleRepository.create.mockReturnValue(mockArticle);
      mockArticleRepository.save.mockResolvedValue(mockArticle);

      const result = await service.create(createArticleDto);

      expect(cloudinaryService.uploadImage).not.toHaveBeenCalled();
      expect(articleRepository.create).toHaveBeenCalledWith(createArticleDto);
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

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockArticles),
      };

      mockArticleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll();

      expect(articleRepository.createQueryBuilder).toHaveBeenCalledWith('article');
      expect(result).toEqual(mockArticles);
    });
  });

  describe('findOne', () => {
    it('should return an article by id', async () => {
      const mockArticle = {
        id: 1,
        title: 'Test Article',
        content: 'Test content',
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockArticle),
      };

      mockArticleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findOne(1);

      expect(articleRepository.createQueryBuilder).toHaveBeenCalledWith('article');
      expect(result).toEqual(mockArticle);
    });

    it('should throw NotFoundException when article not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockArticleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

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

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingArticle),
      };

      mockArticleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockArticleRepository.save.mockResolvedValue(updatedArticle);

      const result = await service.update(1, updateArticleDto);

      expect(articleRepository.save).toHaveBeenCalledWith(updatedArticle);
      expect(result).toEqual(updatedArticle);
    });

    it('should throw NotFoundException when article not found', async () => {
      const updateArticleDto: UpdateArticleDto = {
        title: 'Updated Article',
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockArticleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.update(999, updateArticleDto)).rejects.toThrow(NotFoundException);
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

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingArticle),
      };

      mockArticleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockArticleRepository.save.mockRejectedValue(new OptimisticLockVersionMismatchError('', '', ''));

      await expect(service.update(1, updateArticleDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove an article successfully', async () => {
      const mockArticle = {
        id: 1,
        title: 'Test Article',
        coverImagePublicId: 'test_public_id',
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockArticle),
      };

      mockArticleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockArticleRepository.remove.mockResolvedValue(mockArticle);
      mockCloudinaryService.deleteImage.mockResolvedValue(undefined);

      await service.remove(1);

      expect(cloudinaryService.deleteImage).toHaveBeenCalledWith('test_public_id');
      expect(articleRepository.remove).toHaveBeenCalledWith(mockArticle);
    });

    it('should throw NotFoundException when article not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockArticleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
}); 