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
  ) {}

  async create(
    createArticleDto: CreateArticleDto,
    coverImage?: Express.Multer.File,
  ) {
    this.logger.log('🚀 [ArticlesService] ===== 文章創建服務開始 =====');
    this.logger.log('📋 [ArticlesService] 接收到的數據:', {
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
        coverImageUploadResult = await this.articleUploadService.uploadCoverImage(coverImage);
      } else if (createArticleDto.coverImageUrl && createArticleDto.coverImagePublicId) {
        coverImageUploadResult = await this.articleUploadService.checkExistingCoverImage(
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
        contentUploadResult = await this.articleUploadService.uploadContent(createArticleDto.content);
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
        coverImageUrl: coverImageUploadResult?.secure_url || createArticleDto.coverImageUrl,
        coverImagePublicId: coverImageUploadResult?.public_id || createArticleDto.coverImagePublicId,
        contentPublicId: contentUploadResult?.public_id,
        isDraft: createArticleDto.isDraft,
        categoryId: createArticleDto.categoryId,
        tags,
        ...seoData,
        ...aeoData,
        ...geoData,
      });

      const savedArticle = await this.articleRepository.save(article);
      
      this.logger.log('✅ [ArticlesService] 文章創建成功:', savedArticle.id);
      return savedArticle;

    } catch (error) {
      // 清理失敗的上傳
      if (coverImageUploadResult?.public_id) {
        await this.articleUploadService.cleanupFailedUpload(coverImageUploadResult.public_id, 'image');
      }
      if (contentUploadResult?.public_id) {
        await this.articleUploadService.cleanupFailedUpload(contentUploadResult.public_id, 'raw');
      }

      this.logger.error('❌ [ArticlesService] 文章創建失敗:', error);
      throw error;
    }
  }

  private async processTags(tagIds?: number[]): Promise<Tag[]> {
    if (!tagIds || tagIds.length === 0) {
      this.logger.log('ℹ️ [ArticlesService] 沒有標籤需要處理');
      return [];
    }

    this.logger.log('🏷️ [ArticlesService] 查找標籤 IDs:', tagIds);
    const tags = await this.tagRepository.findBy({ id: In(tagIds) });
    this.logger.log('✅ [ArticlesService] 找到標籤數量:', tags.length);
    return tags;
  }

  async findAll(
    isDraft?: boolean,
    page = 1,
    limit = 15,
  ): Promise<{ data: Article[]; total: number }> {
    this.logger.log('🔍 [ArticlesService][findAll] 開始查詢文章列表');
    this.logger.log('📋 [ArticlesService][findAll] 查詢參數:', {
      isDraft,
      page,
      limit,
    });

    this.logger.log(
      '🔍 [ArticlesService][findAll] 處理後的 isDraft:',
      isDraft,
    );

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
      this.logger.log(
        '🔍 [ArticlesService][findAll] 應用 isDraft 篩選:',
        isDraft,
      );
    } else {
      this.logger.log('🔍 [ArticlesService][findAll] 未應用 isDraft 篩選');
    }

    // 輸出 SQL 查詢語句
    const sql = query.getSql();
    this.logger.log('🔍 [ArticlesService][findAll] SQL 查詢:', sql);
    this.logger.log(
      '🔍 [ArticlesService][findAll] SQL 參數:',
      query.getParameters ? query.getParameters() : '無法獲取參數',
    );

    const [data, total] = await query.getManyAndCount();
    this.logger.log('📊 [ArticlesService][findAll] 查詢結果統計:', {
      total: total,
      returned: data.length,
      isDraft: isDraft,
      page: page,
      limit: limit,
      skip: skip,
    });

    // 新增：處理 Cloudinary 內容
    this.logger.log('🔍 [ArticlesService][findAll] 開始處理 Cloudinary 內容...');
    const normalizeDuplicatedFolder = (url: string): string => {
      // 將 public_id 內重複的 "articles/content" 折疊成一次
      // 例：articles/content/articles/content/foo.txt -> articles/content/foo.txt
      return url.replace(
        /(articles\/content\/)(?:articles\/content\/)+/g,
        '$1',
      );
    };

    for (const article of data) {
      if (
        article.content &&
        article.content.startsWith('https://res.cloudinary.com')
      ) {
        try {
          this.logger.log(
            `📥 [ArticlesService][findAll] 從 Cloudinary 獲取文章內容: ${article.id}`,
          );
          const originalUrl = article.content;
          let response = await fetch(originalUrl);
          if (response.ok) {
            const actualContent = await response.text();
            article.content = actualContent;
            this.logger.log(
              `✅ [ArticlesService][findAll] 文章 ${article.id} 內容已從 Cloudinary 獲取 (${actualContent.length} 字符)`,
            );
          } else {
            this.logger.error(
              `❌ [ArticlesService][findAll] 文章 ${article.id} 從 Cloudinary 獲取內容失敗: ${response.status}`,
            );
            const normalizedUrl = normalizeDuplicatedFolder(originalUrl);
            if (normalizedUrl !== originalUrl) {
              this.logger.log(
                `🔁 [ArticlesService][findAll] 嘗試修正重複資料夾後的 URL 重新抓取: ${normalizedUrl}`,
              );
              response = await fetch(normalizedUrl);
              if (response.ok) {
                const actualContent = await response.text();
                article.content = actualContent;
                this.logger.log(
                  `✅ [ArticlesService][findAll] 文章 ${article.id} 經修正 URL 後成功獲取內容 (${actualContent.length} 字符)`,
                );
              } else {
                this.logger.error(
                  `❌ [ArticlesService][findAll] 文章 ${article.id} 經修正 URL 仍失敗: ${response.status}`,
                );
              }
            }
          }
        } catch (error) {
          this.logger.error(
            `❌ [ArticlesService][findAll] 文章 ${article.id} 獲取 Cloudinary 內容時發生錯誤:`,
            error,
          );
        }
      }
    }

    // 額外查詢：檢查資料庫中所有文章（不考慮篩選）
    this.logger.log('🔍 [ArticlesService][findAll] 檢查資料庫中所有文章...');
    const allArticles = await this.articleRepository.find({
      relations: ['category', 'tags'],
    });
    this.logger.log(
      '📊 [ArticlesService][findAll] 資料庫中所有文章:',
      allArticles.map((a) => ({
        id: a.id,
        title: a.title,
        isDraft: a.isDraft,
        createdAt: a.createdAt,
      })),
    );

    this.logger.log('📋 [ArticlesService][findAll] 文章列表詳情:');
    data.forEach((article, index) => {
      this.logger.log(
        `  ${index + 1}. ID: ${article.id}, 標題: ${article.title}, isDraft: ${article.isDraft}, 創建時間: ${article.createdAt}, 內容長度: ${article.content?.length || 0}`,
      );
    });

    // 新增：檢查是否有文章被意外篩選掉
    if (isDraft !== undefined && data.length === 0 && allArticles.length > 0) {
      this.logger.warn(
        '⚠️ [ArticlesService][findAll] 警告：查詢結果為空，但資料庫中有文章',
      );
      this.logger.log('🔍 [ArticlesService][findAll] 檢查可能的原因：');
      allArticles.forEach((article) => {
        this.logger.log(
          `  - 文章 ID ${article.id}: isDraft=${article.isDraft}, 標題="${article.title}"`,
        );
      });
    }

    return { data, total };
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
      throw new NotFoundException('文章不存在');
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
      this.logger.log('[ArticleService][findOne] 查詢:', {
        id: article.id,
        coverImageUrl: article.coverImageUrl,
        contentLength: article.content?.length || 0,
      });
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

    Object.assign(article, updateArticleDto);

    try {
      // 根據規則 #1：儲存資料庫
      const updatedArticle = await this.articleRepository.save(article);
      this.logger.log('[ArticleService][update] DB 實際寫入:', {
        id: updatedArticle.id,
        coverImageUrl: updatedArticle.coverImageUrl,
        content: updatedArticle.content,
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

    return { message: '文章已刪除' };
  }
}
