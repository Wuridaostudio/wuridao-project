import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhotosService } from './photos.service';
import { Photo } from './entities/photo.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Tag } from '../tags/entities/tag.entity';

describe('PhotosService', () => {
  let service: PhotosService;
  let photoRepository: Repository<Photo>;
  let cloudinaryService: CloudinaryService;

  const mockPhotoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
  };

  const mockCloudinaryService = {
    uploadImage: jest.fn(),
    checkResourceExists: jest.fn(),
    safelyDeleteResource: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotosService,
        {
          provide: getRepositoryToken(Photo),
          useValue: mockPhotoRepository,
        },
        {
          provide: getRepositoryToken(Tag),
          useValue: {}, // Add this to mock TagRepository dependency
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<PhotosService>(PhotosService);
    photoRepository = module.get<Repository<Photo>>(getRepositoryToken(Photo));
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a photo with file upload', async () => {
      const createPhotoDto: CreatePhotoDto = { description: 'desc' };
      const mockFile = {
        fieldname: 'photoFile',
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        encoding: '7bit',
        size: 1234,
        stream: {} as any,
        destination: '/tmp',
        filename: 'test.jpg',
        path: '/tmp/test.jpg',
      };
      const mockUploadResult = { public_id: 'pid', secure_url: 'url' };
      const mockPhoto = {
        id: 1,
        ...createPhotoDto,
        publicId: 'pid',
        url: 'url',
      };
      mockCloudinaryService.uploadImage.mockResolvedValue(mockUploadResult);
      mockPhotoRepository.create.mockReturnValue(mockPhoto);
      mockPhotoRepository.save.mockResolvedValue(mockPhoto);
      const result = await service.create(createPhotoDto, mockFile);
      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(
        mockFile,
        'photos',
      );
      expect(photoRepository.create).toHaveBeenCalledWith({
        ...createPhotoDto,
        publicId: 'pid',
        url: 'url',
        tags: [],
      });
      expect(photoRepository.save).toHaveBeenCalledWith(mockPhoto);
      expect(result).toEqual(mockPhoto);
    });
    it('should throw BadRequestException if neither file nor url/publicId is provided', async () => {
      await expect(
        service.create({ description: 'desc' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated photos', async () => {
      const mockPhotos = [{ id: 1 }, { id: 2 }];
      mockPhotoRepository.findAndCount.mockResolvedValue([mockPhotos, 2]);
      const result = await service.findAll(1, 2);
      expect(photoRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['category', 'tags'],
        order: { createdAt: 'DESC' },
        take: 2,
        skip: 0,
      });
      expect(result).toEqual({ data: mockPhotos, total: 2 });
    });
  });

  describe('findOne', () => {
    it('should return a photo by id', async () => {
      const mockPhoto = { id: 1 };
      mockPhotoRepository.findOne.mockResolvedValue(mockPhoto);
      const result = await service.findOne(1);
      expect(result).toEqual(mockPhoto);
    });
    it('should throw NotFoundException if not found', async () => {
      mockPhotoRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a photo and delete from Cloudinary', async () => {
      const mockPhoto = { id: 1, publicId: 'pid' };
      mockPhotoRepository.findOne.mockResolvedValue(mockPhoto);
      mockPhotoRepository.remove.mockResolvedValue(mockPhoto);
      mockCloudinaryService.safelyDeleteResource.mockResolvedValue(undefined);
      await service.remove(1);
      expect(photoRepository.remove).toHaveBeenCalledWith(mockPhoto);
      expect(cloudinaryService.safelyDeleteResource).toHaveBeenCalledWith(
        'pid',
        'image',
      );
    });
    it('should throw NotFoundException if not found', async () => {
      mockPhotoRepository.findOne.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
