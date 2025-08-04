import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagsService } from './tags.service';
import { Tag } from './entities/tag.entity';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';

// Mock the Repository
const mockTagsRepository = {
  findOneBy: jest.fn(),
  findOne: jest.fn(), // Add this line
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  })),
  remove: jest.fn(),
};

describe('TagsService', () => {
  let service: TagsService;
  let repository: Repository<Tag>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: getRepositoryToken(Tag),
          useValue: mockTagsRepository,
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
    repository = module.get<Repository<Tag>>(getRepositoryToken(Tag));
    jest.clearAllMocks();
    // Make findOne mirror findOneBy for compatibility
    mockTagsRepository.findOne.mockImplementation((...args) =>
      mockTagsRepository.findOneBy(...args)
    );
  });

  describe('create', () => {
    it('should create a new tag successfully', async () => {
      const createTagDto = { name: 'New Tag' };
      mockTagsRepository.findOneBy.mockResolvedValue(null);
      mockTagsRepository.create.mockReturnValue(createTagDto);
      mockTagsRepository.save.mockResolvedValue({ id: 1, ...createTagDto });

      const result = await service.create(createTagDto);

      expect(result.name).toEqual('New Tag');
      expect(mockTagsRepository.findOne).toHaveBeenCalledWith({ where: { name: 'New Tag' } });
    });

    it('should throw a ConflictException if tag name already exists', async () => {
      const createTagDto = { name: 'Existing Tag' };
      mockTagsRepository.findOneBy.mockResolvedValue({ id: 1, name: 'Existing Tag' });
      await expect(service.create(createTagDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should throw a BadRequestException if the tag is still in use', async () => {
      const mockTag = { id: 1, name: 'In-Use Tag' };
      mockTagsRepository.findOneBy.mockResolvedValue(mockTag);
      (repository.createQueryBuilder as jest.Mock).mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ articleCount: '1', photoCount: '0' }),
      });
      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if tag does not exist', async () => {
      mockTagsRepository.findOneBy.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should remove tag if not in use', async () => {
      const mockTag = { id: 2, name: 'Unused Tag' };
      mockTagsRepository.findOneBy.mockResolvedValue(mockTag);
      (repository.createQueryBuilder as jest.Mock).mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ articleCount: '0', photoCount: '0' }),
      });
      mockTagsRepository.remove.mockResolvedValue(undefined);
      await expect(service.remove(2)).resolves.toBeUndefined();
      expect(mockTagsRepository.remove).toHaveBeenCalledWith(mockTag);
    });
  });
}); 