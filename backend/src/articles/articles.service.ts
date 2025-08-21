// src/articles/articles.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, OptimisticLockVersionMismatchError } from 'typeorm';
import { Article } from './entities/article.entity';
import { Tag } from '../tags/entities/tag.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleUploadService } from './services/article-upload.service';
import { ArticleSeoService } from './services/article-seo.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class ArticlesService {
  private readonly logger = new Logger(ArticlesService.name);

  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    private cloudinaryService: CloudinaryService,
    private articleUploadService: ArticleUploadService,
    private articleSeoService: ArticleSeoService,
  ) {
    // 設定日誌編碼為 UTF-8
    process.env.LANG = 'zh_TW.UTF-8';
    process.env.LC_ALL = 'zh_TW.UTF-8';
  }

  async create(
    createArticleDto: CreateArticleDto,
    coverImage?: Express.Multer.File,
  ) {
    this.logger.log('🚀 [ArticlesService] ===== Article creation service started =====');
    this.logger.log('📋 [ArticlesService] Received data:', {
      title: createArticleDto.title,
      contentLength: createArticleDto.content?.length || 0,
      coverImageUrl: createArticleDto.coverImageUrl,
      coverImagePublicId: createArticleDto.coverImagePublicId,
      isDraft: createArticleDto.isDraft,
      categoryId: createArticleDto.categoryId,
      tagIds: createArticleDto.tagIds,
      hasCoverImage: !!coverImage,
    });

    let coverImageUploadResult: any = null;
    let contentUploadResult: any = null;

    try {
      // 處理封面圖片上傳
      if (coverImage) {
        coverImageUploadResult =
          await this.articleUploadService.uploadCoverImage(coverImage);
      } else if (
        createArticleDto.coverImageUrl &&
        createArticleDto.coverImagePublicId
      ) {
        coverImageUploadResult =
          await this.articleUploadService.checkExistingCoverImage(
            createArticleDto.coverImageUrl,
            createArticleDto.coverImagePublicId,
          );

        if (!coverImageUploadResult) {
          throw new BadRequestException('Cloudinary resource not found');
        }

        // 檢查資料庫唯一性
        const duplicate = await this.articleRepository.findOne({
          where: { coverImagePublicId: createArticleDto.coverImagePublicId },
        });

        if (duplicate) {
          throw new ConflictException('coverImagePublicId already exists');
        }
      }

      // 處理內容上傳
      if (createArticleDto.content) {
        contentUploadResult = await this.articleUploadService.uploadContent(
          createArticleDto.content,
        );
      }

      // 處理標籤
      const tags = await this.processTags(createArticleDto.tagIds);

      // 處理 SEO 數據
      const seoData = this.articleSeoService.processSeoData(createArticleDto);
      const aeoData = this.articleSeoService.processAeoData(createArticleDto);
      const geoData = this.articleSeoService.processGeoData(createArticleDto);

      // 儲存到資料庫
      const article = this.articleRepository.create({
        title: createArticleDto.title,
        content: createArticleDto.content,
        coverImageUrl:
          coverImageUploadResult?.secure_url || createArticleDto.coverImageUrl,
        coverImagePublicId:
          coverImageUploadResult?.public_id ||
          createArticleDto.coverImagePublicId,
        contentPublicId: contentUploadResult?.public_id,
        isDraft: createArticleDto.isDraft,
        categoryId: createArticleDto.categoryId,
        tags,
        ...seoData,
        ...aeoData,
        ...geoData,
      });

      const savedArticle = await this.articleRepository.save(article);

      this.logger.log('✅ [ArticlesService] Article created successfully:', savedArticle.id);
      return savedArticle;
    } catch (error) {
      // 清理失敗的上傳
      if (coverImageUploadResult?.public_id) {
        await this.articleUploadService.cleanupFailedUpload(
          coverImageUploadResult.public_id,
          'image',
        );
      }
      if (contentUploadResult?.public_id) {
        await this.articleUploadService.cleanupFailedUpload(
          contentUploadResult.public_id,
          'raw',
        );
      }

      this.logger.error('❌ [ArticlesService] Article creation failed:', error);
      throw error;
    }
  }

  private async processTags(tagIds?: number[]): Promise<Tag[]> {
    if (!tagIds || tagIds.length === 0) {
      this.logger.log('ℹ️ [ArticlesService] No tags to process');
      return [];
    }

    this.logger.log('🏷️ [ArticlesService] Looking up tag IDs:', tagIds);
    const tags = await this.tagRepository.findBy({ id: In(tagIds) });
    this.logger.log('✅ [ArticlesService] Found tags count:', tags.length);
    return tags;
  }

  async findAll(query: any = {}, request?: any) {
    this.logger.log('🔍 [ArticlesService] Starting articles list query');
    this.logger.log('🔍 [ArticlesService] Query parameters:', query);

    // 定義常量，避免硬編碼
    const PUBLISHED_STATUS = false;
    const DRAFT_STATUS = true;

    try {
      const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.tags', 'tags')
        .orderBy('article.createdAt', 'DESC');

      // 檢查是否有 Authorization 標頭（表示可能是管理員請求）
      const hasAuthHeader = request?.headers?.authorization && 
                           request.headers.authorization.startsWith('Bearer ');
      this.logger.log('🔍 [ArticlesService] Auth header check:', { 
        hasAuthHeader, 
        authHeader: hasAuthHeader ? 'Bearer ***' : 'None'
      });

      // 處理草稿狀態篩選
      if (query.isDraft !== undefined) {
        const isDraft = query.isDraft === 'true' || query.isDraft === true;
        queryBuilder.andWhere('article.isDraft = :isDraft', { isDraft });
        this.logger.log('🔍 [ArticlesService] Using specified isDraft parameter:', isDraft);
      } else {
        // 根據是否有認證標頭決定是否顯示草稿文章
        if (hasAuthHeader) {
          // 有認證標頭的請求（可能是管理員）可以看到所有文章
          this.logger.log('🔍 [ArticlesService] Auth header detected, returning all articles (including drafts)');
    } else {
          // 沒有認證標頭的請求（公開訪問）只能看到已發布的文章
          queryBuilder.andWhere('article.isDraft = :isDraft', { isDraft: PUBLISHED_STATUS });
          this.logger.log('🔍 [ArticlesService] Public access, returning only published articles');
        }
      }

      // 處理分頁
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const offset = (page - 1) * limit;

      queryBuilder.skip(offset).take(limit);

      // 處理分類篩選
      if (query.categoryId) {
        queryBuilder.andWhere('category.id = :categoryId', {
          categoryId: query.categoryId,
        });
      }

      // 處理標籤篩選
      if (query.tagIds) {
        const tagIds = Array.isArray(query.tagIds)
          ? query.tagIds
          : query.tagIds.split(',').map((id: string) => parseInt(id.trim()));
        queryBuilder.andWhere('tags.id IN (:...tagIds)', { tagIds });
      }

      // 處理搜尋
      if (query.search) {
        queryBuilder.andWhere(
          '(article.title ILIKE :search OR article.content ILIKE :search)',
          { search: `%${query.search}%` },
        );
      }

      const [data, total] = await queryBuilder.getManyAndCount();

      // 驗證並處理封面圖片
      const processedData = await Promise.all(
        data.map(async (article) => {
          if (article.coverImageUrl) {
            const validation = await this.cloudinaryService.validateImageUrl(
              article.coverImageUrl,
              article.category?.name
            );
            
            if (!validation.isValid && validation.fallbackUrl) {
              this.logger.warn('[ArticlesService] Using fallback image', {
                articleId: article.id,
                originalUrl: article.coverImageUrl,
                fallbackUrl: validation.fallbackUrl
              });
              article.coverImageUrl = validation.fallbackUrl;
            }
          }
          return article;
        })
      );

      this.logger.log('✅ [ArticlesService] Articles list query successful');
      this.logger.log('📊 [ArticlesService] Query result statistics:', {
        total,
        page,
        limit,
        returnedCount: processedData.length,
        hasAuthHeader,
      });

      // 記錄每篇文章的詳細信息
      processedData.forEach((article, index) => {
        this.logger.log(
          `  ${index + 1}. ID: ${article.id}, Title: ${article.title}, isDraft: ${article.isDraft}, Created: ${article.createdAt}, Content Length: ${article.content?.length || 0}, Cover Image: ${article.coverImageUrl || 'None'}, coverImagePublicId: ${article.coverImagePublicId || 'None'}`,
        );
      });

      return {
        data: processedData,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('❌ [ArticlesService] Articles list query failed:', error);
      throw error;
    }
  }

  generateJsonLdForArticle(article: Article): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.seoTitle || article.title,
      image: article.coverImageUrl ? [article.coverImageUrl] : [],
      datePublished: article.createdAt?.toISOString?.() || '',
      dateModified: article.updatedAt?.toISOString?.() || '',
      author: {
        '@type': 'Person',
        name: 'WURIDAO',
      },
      description: article.seoDescription || '',
      keywords: article.seoKeywords || '',
      ...(article.aeoFaq &&
      Array.isArray(article.aeoFaq) &&
      article.aeoFaq.length > 0
        ? {
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://wuridaostudio.com/articles/${article.id}`,
            },
            faq: article.aeoFaq.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }
        : {}),
    };
  }

  async findOne(id: number) {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['category', 'tags'],
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // 如果內容是 Cloudinary URL，需要從 Cloudinary 獲取實際內容
    if (
      article.content &&
      article.content.startsWith('https://res.cloudinary.com')
    ) {
      try {
        // 從 Cloudinary 獲取文章內容
        const normalizeDuplicatedFolder = (url: string): string =>
          url.replace(/(articles\/content\/)(?:articles\/content\/)+/g, '$1');

        const originalUrl = article.content;
        let response = await fetch(originalUrl);
        if (response.ok) {
          article.content = await response.text();
          this.logger.log(
            '[ArticleService][findOne] Content fetched from Cloudinary:',
            article.content.substring(0, 100) + '...',
          );
        } else {
          this.logger.error(
            '[ArticleService][findOne] Failed to fetch content from Cloudinary:',
            originalUrl,
          );
          const normalizedUrl = normalizeDuplicatedFolder(originalUrl);
          if (normalizedUrl !== originalUrl) {
            this.logger.log(
              '[ArticleService][findOne] Retrying with normalized URL:',
              normalizedUrl,
            );
            response = await fetch(normalizedUrl);
            if (response.ok) {
              article.content = await response.text();
              this.logger.log(
                '[ArticleService][findOne] Content fetched after URL normalization:',
                article.content.substring(0, 100) + '...',
              );
            }
          }
        }
      } catch (error) {
        this.logger.error(
          '[ArticleService][findOne] Error fetching content from Cloudinary:',
          error,
        );
      }
    }

    if (article) {
      this.logger.log('[ArticleService][findOne] Query:', {
        id: article.id,
        coverImageUrl: article.coverImageUrl,
        contentLength: article.content?.length || 0,
      });
    }

    // 新增：產生 JSON-LD 結構化資料
    const jsonLd = this.generateJsonLdForArticle(article);

    return { ...article, jsonLd };
  }

  // 異步載入文章內容（用於單篇文章詳情頁面）
  async loadArticleContent(articleId: number): Promise<string | null> {
    try {
      const article = await this.articleRepository.findOne({
        where: { id: articleId },
        select: ['id', 'content'],
      });

      if (!article || !article.content) {
        return null;
      }

      // 如果內容是 Cloudinary URL，則異步載入
      if (article.content.startsWith('https://res.cloudinary.com')) {
        this.logger.log(
          `📥 [ArticlesService][loadArticleContent] 異步載入文章 ${articleId} 的 Cloudinary 內容`,
        );

        const normalizeDuplicatedFolder = (url: string): string => {
          return url.replace(
            /(articles\/content\/)(?:articles\/content\/)+/g,
            '$1',
          );
        };

        try {
          const originalUrl = article.content;
          let response = await fetch(originalUrl);

          if (response.ok) {
            const actualContent = await response.text();
            this.logger.log(
              `✅ [ArticlesService][loadArticleContent] 文章 ${articleId} 內容載入成功 (${actualContent.length} 字符)`,
            );
            return actualContent;
          } else {
            // 嘗試修正重複資料夾
            const normalizedUrl = normalizeDuplicatedFolder(originalUrl);
            if (normalizedUrl !== originalUrl) {
              response = await fetch(normalizedUrl);
              if (response.ok) {
                const actualContent = await response.text();
                this.logger.log(
                  `✅ [ArticlesService][loadArticleContent] 文章 ${articleId} 經修正 URL 後內容載入成功 (${actualContent.length} 字符)`,
                );
                return actualContent;
              }
            }

            this.logger.error(
              `❌ [ArticlesService][loadArticleContent] 文章 ${articleId} 內容載入失敗: ${response.status}`,
            );
            return null;
          }
        } catch (error) {
          this.logger.error(
            `❌ [ArticlesService][loadArticleContent] 文章 ${articleId} 內容載入時發生錯誤:`,
            error,
          );
          return null;
        }
      }

      // 如果內容不是 Cloudinary URL，直接返回
      return article.content;
    } catch (error) {
      this.logger.error(
        `❌ [ArticlesService][loadArticleContent] 載入文章 ${articleId} 內容時發生錯誤:`,
        error,
      );
      return null;
    }
  }

  async update(
    id: number,
    updateArticleDto: UpdateArticleDto,
    coverImage?: Express.Multer.File,
  ) {
    this.logger.log('🔄 [ArticlesService] ===== Article update service started =====');
    this.logger.log('📋 [ArticlesService] Update parameters:', {
      id,
      isDraft: updateArticleDto.isDraft,
      title: updateArticleDto.title,
      contentLength: updateArticleDto.content?.length || 0,
      dtoKeys: Object.keys(updateArticleDto),
    });

    const article = await this.findOne(id);
    
    this.logger.log('📋 [ArticlesService] Original article state:', {
      id: article.id,
      title: article.title,
      isDraft: article.isDraft,
    });

    const oldCoverImagePublicId = article.coverImagePublicId;
    const oldContentPublicId = article.contentPublicId;
    let newCoverImageUploadResult: any = null;
    let newContentUploadResult: any = null;

    // 處理封面圖片更新
    if (coverImage) {
      // 根據規則 #1：先上傳新圖片
      newCoverImageUploadResult = await this.cloudinaryService.uploadImage(
        coverImage,
        'articles',
      );
      updateArticleDto.coverImageUrl = newCoverImageUploadResult.secure_url;
      article.coverImagePublicId = newCoverImageUploadResult.public_id;
      this.logger.log(
        '[ArticleService][update] 上傳新封面:',
        newCoverImageUploadResult.secure_url,
      );
    }

    // 處理文章內容更新
    if (
      updateArticleDto.content &&
      updateArticleDto.content !== article.content
    ) {
      // 將文章內容轉換為 Buffer
      const contentBuffer = Buffer.from(updateArticleDto.content, 'utf-8');

      newContentUploadResult = await this.cloudinaryService.uploadBuffer(
        contentBuffer,
        `article_content_${Date.now()}.txt`,
        'text/plain',
        'articles/content',
        'raw',
      );
      this.logger.log(
        '[ArticleService][update] Content uploaded to Cloudinary:',
        newContentUploadResult.secure_url,
      );

      // 更新內容 URL 和 public_id
      updateArticleDto.content = newContentUploadResult.secure_url;
      article.contentPublicId = newContentUploadResult.public_id;
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
    if (updateArticleDto.seoDescription)
      article.seoDescription = updateArticleDto.seoDescription;
    if (updateArticleDto.seoKeywords)
      article.seoKeywords = updateArticleDto.seoKeywords;

    // 處理 AEO 欄位
    if (updateArticleDto.aeoFaq) {
      const validFaqs = updateArticleDto.aeoFaq.filter(
        (faq) =>
          faq.question &&
          faq.answer &&
          faq.question.trim() !== '' &&
          faq.answer.trim() !== '',
      );
      article.aeoFaq = validFaqs;
      article.aeoFeaturedSnippet = validFaqs[0]?.answer || '';
    }

    // 處理 GEO 欄位
    if (updateArticleDto.geoLatitude !== undefined)
      article.geoLatitude = updateArticleDto.geoLatitude;
    if (updateArticleDto.geoLongitude !== undefined)
      article.geoLongitude = updateArticleDto.geoLongitude;
    if (updateArticleDto.geoAddress)
      article.geoAddress = updateArticleDto.geoAddress;
    if (updateArticleDto.geoCity) article.geoCity = updateArticleDto.geoCity;
    if (updateArticleDto.geoPostalCode)
      article.geoPostalCode = updateArticleDto.geoPostalCode;

    // 處理 isDraft 欄位 - 確保不會被 Object.assign 覆蓋
    if (updateArticleDto.isDraft !== undefined) {
      article.isDraft = updateArticleDto.isDraft;
      this.logger.log('[ArticleService][update] Setting isDraft:', updateArticleDto.isDraft);
    }

    // 創建一個不包含已處理欄位的 DTO 副本，避免 Object.assign 覆蓋
    const { 
      seoTitle, seoDescription, seoKeywords, 
      aeoFaq, 
      geoLatitude, geoLongitude, geoAddress, geoCity, geoPostalCode,
      isDraft,
      ...remainingDto 
    } = updateArticleDto;

    Object.assign(article, remainingDto);

    try {
      // 根據規則 #1：儲存資料庫
      const updatedArticle = await this.articleRepository.save(article);
      this.logger.log('[ArticleService][update] DB actual write:', {
        id: updatedArticle.id,
        coverImageUrl: updatedArticle.coverImageUrl,
        content: updatedArticle.content,
        isDraft: updatedArticle.isDraft,
      });
      
      this.logger.log('✅ [ArticlesService] ===== Article update service completed =====');
      this.logger.log('📋 [ArticlesService] Updated article state:', {
        id: updatedArticle.id,
        title: updatedArticle.title,
        isDraft: updatedArticle.isDraft,
      });

      // 根據規則 #1：如果資料庫儲存成功，才清理舊檔案
      if (newCoverImageUploadResult && oldCoverImagePublicId) {
        await this.cloudinaryService.safelyDeleteResource(
          oldCoverImagePublicId,
          'image',
        );
      }
      if (newContentUploadResult && oldContentPublicId) {
        await this.cloudinaryService.safelyDeleteResource(
          oldContentPublicId,
          'raw',
        );
      }

      return updatedArticle;
    } catch (dbError) {
      // 根據規則 #1：如果資料庫儲存失敗，清理新上傳的檔案
      if (newCoverImageUploadResult) {
        await this.cloudinaryService.safelyDeleteResource(
          newCoverImageUploadResult.public_id,
          'image',
        );
      }
      if (newContentUploadResult) {
        await this.cloudinaryService.safelyDeleteResource(
          newContentUploadResult.public_id,
          'raw',
        );
      }

      // 處理樂觀鎖衝突
      if (dbError instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException(
          'The record was modified by another user. Please refresh and try again.',
        );
      }

      throw new InternalServerErrorException(
        'Failed to update article record.',
        { cause: dbError },
      );
    }
  }

  async remove(id: number) {
    const article = await this.findOne(id);

    // 根據規則 #1：先檢查並刪除 Cloudinary 資源
    if (article.coverImagePublicId) {
      try {
        // 檢查資源是否存在
        const exists = await this.cloudinaryService.checkResourceExists(
          article.coverImagePublicId,
          'image',
        );
        if (exists) {
          await this.cloudinaryService.deleteResource(
            article.coverImagePublicId,
            'image',
          );
          this.logger.log(
            '[ArticleService][remove] Cover image deleted:',
            article.coverImagePublicId,
          );
        } else {
          this.logger.log(
            '[ArticleService][remove] Cover image not found:',
            article.coverImagePublicId,
          );
        }
      } catch (error) {
        this.logger.error(
          '[ArticleService][remove] Error deleting cover image:',
          article.coverImagePublicId,
          error,
        );
        // 即使 Cloudinary 刪除失敗，也要刪除資料庫記錄
      }
    }

    if (article.contentPublicId) {
      try {
        // 檢查資源是否存在
        const exists = await this.cloudinaryService.checkResourceExists(
          article.contentPublicId,
          'raw',
        );
        if (exists) {
          await this.cloudinaryService.deleteResource(
            article.contentPublicId,
            'raw',
          );
          this.logger.log(
            '[ArticleService][remove] Content deleted:',
            article.contentPublicId,
          );
        } else {
          this.logger.log(
            '[ArticleService][remove] Content not found:',
            article.contentPublicId,
          );
        }
      } catch (error) {
        this.logger.error(
          '[ArticleService][remove] Error deleting content:',
          article.contentPublicId,
          error,
        );
        // 即使 Cloudinary 刪除失敗，也要刪除資料庫記錄
      }
    }

    // 根據規則 #1：然後再刪除資料庫記錄
    await this.articleRepository.remove(article);

    return { message: 'Article deleted' };
  }
}
