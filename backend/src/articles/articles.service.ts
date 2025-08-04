// src/articles/articles.service.ts
import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, OptimisticLockVersionMismatchError } from 'typeorm';
import { Article } from './entities/article.entity';
import { Tag } from '../tags/entities/tag.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createArticleDto: CreateArticleDto,
    coverImage?: Express.Multer.File,
  ) {
    let uploadResult: any = null;

    if (coverImage) {
      // 根據規則 #1：先上傳檔案
      uploadResult = await this.cloudinaryService.uploadImage(coverImage, 'articles');
    }

    try {
      // 處理標籤
      let tags = [];
      if (createArticleDto.tagIds && createArticleDto.tagIds.length > 0) {
        tags = await this.tagRepository.findBy({
          id: In(createArticleDto.tagIds),
        });
      }

      // 處理 SEO 欄位
      const seoData = {
        seoTitle: createArticleDto.seoTitle,
        seoDescription: createArticleDto.seoDescription,
        seoKeywords: createArticleDto.seoKeywords,
      };

      // 處理 AEO 欄位
      const aeoData = {
        aeoFaq: createArticleDto.aeoFaq || [],
        aeoFeaturedSnippet: createArticleDto.aeoFeaturedSnippet || '',
      };

      // 處理 GEO 欄位
      const geoData = {
        geoLatitude: createArticleDto.geoLatitude,
        geoLongitude: createArticleDto.geoLongitude,
        geoAddress: createArticleDto.geoAddress,
        geoCity: createArticleDto.geoCity,
        geoPostalCode: createArticleDto.geoPostalCode,
      };

      // 根據規則 #1：儲存資料庫
      const article = this.articleRepository.create({
        ...createArticleDto,
        ...seoData,
        ...aeoData,
        ...geoData,
        coverImageUrl: uploadResult?.secure_url,
        coverImagePublicId: uploadResult?.public_id,
        tags,
      });

      return await this.articleRepository.save(article);
    } catch (dbError) {
      // 根據規則 #1：如果資料庫儲存失敗，清理上傳的檔案
      if (uploadResult) {
        await this.cloudinaryService.safelyDeleteResource(uploadResult.public_id, 'image');
      }
      
      // 處理樂觀鎖衝突
      if (dbError instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException('The record was modified by another user. Please refresh and try again.');
      }
      
      throw new InternalServerErrorException('Failed to save article record.', { cause: dbError });
    }
  }

  async findAll(
    isDraft?: boolean,
    page = 1,
    limit = 15,
  ): Promise<{ data: Article[]; total: number }> {
    const skip = (page - 1) * limit;
    const query = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.tags', 'tags')
      .orderBy('article.createdAt', 'DESC')
      .take(limit)
      .skip(skip);

    if (isDraft !== undefined) {
      query.where('article.isDraft = :isDraft', { isDraft });
    }

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  generateJsonLdForArticle(article: Article): any {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.seoTitle || article.title,
      "image": article.coverImageUrl ? [article.coverImageUrl] : [],
      "datePublished": article.createdAt?.toISOString?.() || '',
      "dateModified": article.updatedAt?.toISOString?.() || '',
      "author": {
        "@type": "Person",
        "name": 'WURIDAO'
      },
      "description": article.seoDescription || '',
      "keywords": article.seoKeywords || '',
      ...(article.aeoFaq && Array.isArray(article.aeoFaq) && article.aeoFaq.length > 0
        ? {
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://wuridaostudio.com/articles/${article.id}`
            },
            "faq": article.aeoFaq.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          }
        : {})
    };
  }

  async findOne(id: number) {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['category', 'tags'],
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    // 新增：產生 JSON-LD 結構化資料
    const jsonLd = this.generateJsonLdForArticle(article);

    return { ...article, jsonLd };
  }

  async update(
    id: number,
    updateArticleDto: UpdateArticleDto,
    coverImage?: Express.Multer.File,
  ) {
    const article = await this.findOne(id);

    const oldPublicId = article.coverImagePublicId;
    let newUploadResult: any = null;

    if (coverImage) {
      // 根據規則 #1：先上傳新圖片
      newUploadResult = await this.cloudinaryService.uploadImage(
        coverImage,
        'articles',
      );
      updateArticleDto.coverImageUrl = newUploadResult.secure_url;
      article.coverImagePublicId = newUploadResult.public_id;
    }

    // 處理標籤
    if (updateArticleDto.tagIds) {
      const tags = await this.tagRepository.findBy({
        id: In(updateArticleDto.tagIds),
      });
      article.tags = tags;
    }

    // 處理 SEO 欄位
    if (updateArticleDto.seoTitle) article.seoTitle = updateArticleDto.seoTitle;
    if (updateArticleDto.seoDescription) article.seoDescription = updateArticleDto.seoDescription;
    if (updateArticleDto.seoKeywords) article.seoKeywords = updateArticleDto.seoKeywords;

    // 處理 AEO 欄位
    if (updateArticleDto.aeoFaq) {
      const validFaqs = updateArticleDto.aeoFaq.filter(faq => 
        faq.question && faq.answer && 
        faq.question.trim() !== '' && 
        faq.answer.trim() !== ''
      );
      article.aeoFaq = validFaqs;
      article.aeoFeaturedSnippet = validFaqs[0]?.answer || '';
    }

    // 處理 GEO 欄位
    if (updateArticleDto.geoLatitude !== undefined) article.geoLatitude = updateArticleDto.geoLatitude;
    if (updateArticleDto.geoLongitude !== undefined) article.geoLongitude = updateArticleDto.geoLongitude;
    if (updateArticleDto.geoAddress) article.geoAddress = updateArticleDto.geoAddress;
    if (updateArticleDto.geoCity) article.geoCity = updateArticleDto.geoCity;
    if (updateArticleDto.geoPostalCode) article.geoPostalCode = updateArticleDto.geoPostalCode;

    Object.assign(article, updateArticleDto);

    try {
      // 根據規則 #1：儲存資料庫
      const updatedArticle = await this.articleRepository.save(article);
      
      // 根據規則 #1：如果資料庫儲存成功，才清理舊檔案
      if (newUploadResult && oldPublicId) {
        await this.cloudinaryService.safelyDeleteResource(oldPublicId, 'image');
      }
      
      return updatedArticle;
    } catch (dbError) {
      // 根據規則 #1：如果資料庫儲存失敗，清理新上傳的檔案
      if (newUploadResult) {
        await this.cloudinaryService.safelyDeleteResource(newUploadResult.public_id, 'image');
      }
      
      // 處理樂觀鎖衝突
      if (dbError instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException('The record was modified by another user. Please refresh and try again.');
      }
      
      throw new InternalServerErrorException('Failed to update article record.', { cause: dbError });
    }
  }

  async remove(id: number) {
    const article = await this.findOne(id);

    // 根據規則 #1：先從資料庫刪除
    await this.articleRepository.remove(article);

    // 根據規則 #1：然後再清理外部資源
    if (article.coverImagePublicId) {
      await this.cloudinaryService.safelyDeleteResource(
        article.coverImagePublicId,
        'image',
      );
    }

    return { message: '文章已刪除' };
  }
}
