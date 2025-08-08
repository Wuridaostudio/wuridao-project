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
    console.log('🚀 [ArticlesService] ===== 文章創建服務開始 =====');
    console.log('📋 [ArticlesService] 接收到的數據:', {
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

    // 處理封面圖片上傳
    if (coverImage) {
      console.log('📁 [ArticlesService] 開始上傳封面圖片...');
      console.log('📁 [ArticlesService] 檔案信息:', {
        name: coverImage.originalname,
        size: coverImage.size,
        mimetype: coverImage.mimetype,
      });

      // 根據規則 #1：先上傳封面圖片
      coverImageUploadResult = await this.cloudinaryService.uploadImage(
        coverImage,
        'articles',
      );
      console.log(
        '✅ [ArticlesService] 封面圖片上傳成功:',
        coverImageUploadResult.secure_url,
      );
    } else if (
      createArticleDto.coverImageUrl &&
      createArticleDto.coverImagePublicId
    ) {
      console.log('🔍 [ArticlesService] 檢查現有封面圖片...');
      console.log('🔍 [ArticlesService] 檢查信息:', {
        coverImageUrl: createArticleDto.coverImageUrl,
        coverImagePublicId: createArticleDto.coverImagePublicId,
      });

      // 檢查 cloudinary 是否存在
      const exists = await this.cloudinaryService.checkResourceExists(
        createArticleDto.coverImagePublicId,
        'image',
      );
      console.log('🔍 [ArticlesService] Cloudinary 資源存在檢查結果:', exists);

      if (!exists) {
        console.error('❌ [ArticlesService] Cloudinary 資源不存在');
        throw new BadRequestException('Cloudinary resource not found');
      }

      // 檢查資料庫唯一性
      const duplicate = await this.articleRepository.findOne({
        where: { coverImagePublicId: createArticleDto.coverImagePublicId },
      });
      console.log('🔍 [ArticlesService] 資料庫重複檢查結果:', !!duplicate);

      if (duplicate) {
        console.error('❌ [ArticlesService] coverImagePublicId 已存在');
        throw new ConflictException('coverImagePublicId already exists');
      }

      coverImageUploadResult = {
        public_id: createArticleDto.coverImagePublicId,
        secure_url: createArticleDto.coverImageUrl,
      };
      console.log(
        '✅ [ArticlesService] 使用現有封面圖片:',
        coverImageUploadResult,
      );
    } else {
      console.log('ℹ️ [ArticlesService] 沒有封面圖片需要處理');
    }

    // 處理文章內容上傳到 Cloudinary 作為 RAW 檔案
    if (createArticleDto.content) {
      console.log('📝 [ArticlesService] 開始處理文章內容...');
      console.log(
        '📝 [ArticlesService] 內容長度:',
        createArticleDto.content.length,
      );

      // 將文章內容轉換為 Buffer
      const contentBuffer = Buffer.from(createArticleDto.content, 'utf-8');

      console.log('📤 [ArticlesService] 上傳內容到 Cloudinary...');
      contentUploadResult = await this.cloudinaryService.uploadBuffer(
        contentBuffer,
        `article_content_${Date.now()}.txt`,
        'text/plain',
        'articles/content',
        'raw',
      );
      console.log(
        '✅ [ArticlesService] 內容上傳成功:',
        contentUploadResult.secure_url,
      );
    } else {
      console.log('ℹ️ [ArticlesService] 沒有內容需要上傳');
    }

    try {
      console.log('🗂️ [ArticlesService] 開始處理標籤...');
      // 處理標籤
      let tags = [];
      if (createArticleDto.tagIds && createArticleDto.tagIds.length > 0) {
        console.log(
          '🏷️ [ArticlesService] 查找標籤 IDs:',
          createArticleDto.tagIds,
        );
        tags = await this.tagRepository.findBy({
          id: In(createArticleDto.tagIds),
        });
        console.log('✅ [ArticlesService] 找到標籤數量:', tags.length);
      } else {
        console.log('ℹ️ [ArticlesService] 沒有標籤需要處理');
      }

      console.log('🔍 [ArticlesService] 處理 SEO 欄位...');
      // 處理 SEO 欄位
      const seoData = {
        seoTitle: createArticleDto.seoTitle,
        seoDescription: createArticleDto.seoDescription,
        seoKeywords: createArticleDto.seoKeywords,
      };
      console.log('📊 [ArticlesService] SEO 數據:', seoData);

      console.log('🔍 [ArticlesService] 處理 AEO 欄位...');
      // 處理 AEO 欄位
      const aeoData = {
        aeoFaq: createArticleDto.aeoFaq || [],
        aeoFeaturedSnippet: createArticleDto.aeoFeaturedSnippet || '',
      };
      console.log('📊 [ArticlesService] AEO 數據:', aeoData);

      console.log('🔍 [ArticlesService] 處理 GEO 欄位...');
      // 處理 GEO 欄位
      const geoData = {
        geoLatitude: createArticleDto.geoLatitude,
        geoLongitude: createArticleDto.geoLongitude,
        geoAddress: createArticleDto.geoAddress,
        geoCity: createArticleDto.geoCity,
        geoPostalCode: createArticleDto.geoPostalCode,
      };
      console.log('📊 [ArticlesService] GEO 數據:', geoData);

      console.log('💾 [ArticlesService] 準備儲存到資料庫...');
      console.log('📋 [ArticlesService] 文章數據:', {
        title: createArticleDto.title,
        contentLength: createArticleDto.content?.length || 0,
        contentUrl: contentUploadResult?.secure_url,
        contentPublicId: contentUploadResult?.public_id,
        isDraft: createArticleDto.isDraft,
        categoryId: createArticleDto.categoryId,
        coverImageUrl:
          coverImageUploadResult?.secure_url || createArticleDto.coverImageUrl,
        coverImagePublicId: coverImageUploadResult?.public_id,
        tagsCount: tags.length,
      });

      // 根據規則 #1：儲存資料庫（內容存 Cloudinary URL）
      const article = this.articleRepository.create({
        title: createArticleDto.title,
        content: contentUploadResult?.secure_url || createArticleDto.content, // 存 Cloudinary URL
        contentPublicId: contentUploadResult?.public_id, // 存 Cloudinary public_id
        isDraft: createArticleDto.isDraft,
        categoryId: createArticleDto.categoryId,
        ...seoData,
        ...aeoData,
        ...geoData,
        coverImageUrl:
          coverImageUploadResult?.secure_url || createArticleDto.coverImageUrl,
        coverImagePublicId: coverImageUploadResult?.public_id,
        tags,
      });

      console.log(
        '[ArticleService][create] Final coverImageUrl:',
        coverImageUploadResult?.secure_url,
      );
      console.log(
        '[ArticleService][create] Final contentUrl:',
        contentUploadResult?.secure_url,
      );
      console.log('💾 [ArticlesService] 開始儲存到資料庫...');
      console.log(
        '[ArticleService][create] Final contentPublicId:',
        contentUploadResult?.public_id,
      );

      const result = await this.articleRepository.save(article);
      console.log('✅ [ArticlesService] 資料庫儲存成功！');
      console.log('[ArticleService][create] DB 實際寫入:', {
        id: result.id,
        title: result.title,
        isDraft: result.isDraft,
        coverImageUrl: result.coverImageUrl,
        coverImagePublicId: result.coverImagePublicId,
        content: result.content,
        contentPublicId: result.contentPublicId,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      });

      // 立即查詢確認文章是否真的被保存
      console.log('🔍 [ArticlesService] 立即查詢確認文章是否保存...');
      const savedArticle = await this.articleRepository.findOne({
        where: { id: result.id },
        relations: ['category', 'tags'],
      });

      if (savedArticle) {
        console.log('✅ [ArticlesService] 文章確認存在於資料庫:', {
          id: savedArticle.id,
          title: savedArticle.title,
          isDraft: savedArticle.isDraft,
          createdAt: savedArticle.createdAt,
        });
      } else {
        console.error('❌ [ArticlesService] 文章未找到於資料庫中！');
      }

      console.log('🏁 [ArticlesService] ===== 文章創建服務成功結束 =====');
      return result;
    } catch (dbError) {
      console.error('❌ [ArticlesService] 資料庫儲存失敗:', dbError);
      console.error('❌ [ArticlesService] 錯誤詳情:', {
        message: dbError.message,
        name: dbError.name,
        stack: dbError.stack?.substring(0, 500),
      });

      // 根據規則 #1：如果資料庫儲存失敗，清理上傳的檔案
      console.log('🧹 [ArticlesService] 開始清理已上傳的檔案...');
      if (coverImageUploadResult?.public_id) {
        console.log(
          '🗑️ [ArticlesService] 清理封面圖片:',
          coverImageUploadResult.public_id,
        );
        await this.cloudinaryService.safelyDeleteResource(
          coverImageUploadResult.public_id,
          'image',
        );
      }
      if (contentUploadResult?.public_id) {
        console.log(
          '🗑️ [ArticlesService] 清理內容檔案:',
          contentUploadResult.public_id,
        );
        await this.cloudinaryService.safelyDeleteResource(
          contentUploadResult.public_id,
          'raw',
        );
      }

      // 處理樂觀鎖衝突
      if (dbError instanceof OptimisticLockVersionMismatchError) {
        console.error('❌ [ArticlesService] 樂觀鎖衝突');
        throw new ConflictException(
          'The record was modified by another user. Please refresh and try again.',
        );
      }

      console.error('❌ [ArticlesService] 拋出內部服務器錯誤');
      throw new InternalServerErrorException('Failed to save article record.', {
        cause: dbError,
      });
    }
  }

  async findAll(
    isDraft?: string,
    page = 1,
    limit = 15,
  ): Promise<{ data: Article[]; total: number }> {
    console.log('🔍 [ArticlesService][findAll] 開始查詢文章列表');
    console.log('📋 [ArticlesService][findAll] 查詢參數:', {
      isDraft,
      page,
      limit,
    });

    // 處理 isDraft 參數
    let isDraftBoolean: boolean | undefined;
    if (isDraft === 'true') {
      isDraftBoolean = true;
    } else if (isDraft === 'false') {
      isDraftBoolean = false;
    } else if (isDraft === '' || isDraft === undefined) {
      isDraftBoolean = undefined; // 不應用篩選
    } else {
      console.log('⚠️ [ArticlesService][findAll] 未知的 isDraft 值:', isDraft);
      isDraftBoolean = undefined;
    }

    console.log(
      '🔍 [ArticlesService][findAll] 處理後的 isDraft:',
      isDraftBoolean,
    );

    const skip = (page - 1) * limit;
    const query = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.tags', 'tags')
      .orderBy('article.createdAt', 'DESC')
      .take(limit)
      .skip(skip);

    if (isDraftBoolean !== undefined) {
      query.where('article.isDraft = :isDraft', { isDraft: isDraftBoolean });
      console.log(
        '🔍 [ArticlesService][findAll] 應用 isDraft 篩選:',
        isDraftBoolean,
      );
    } else {
      console.log('🔍 [ArticlesService][findAll] 未應用 isDraft 篩選');
    }

    // 輸出 SQL 查詢語句
    const sql = query.getSql();
    console.log('🔍 [ArticlesService][findAll] SQL 查詢:', sql);
    console.log(
      '🔍 [ArticlesService][findAll] SQL 參數:',
      query.getParameters ? query.getParameters() : '無法獲取參數',
    );

    const [data, total] = await query.getManyAndCount();
    console.log('📊 [ArticlesService][findAll] 查詢結果統計:', {
      total: total,
      returned: data.length,
      isDraft: isDraft,
      page: page,
      limit: limit,
      skip: skip,
    });

    // 新增：處理 Cloudinary 內容
    console.log('🔍 [ArticlesService][findAll] 開始處理 Cloudinary 內容...');
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
          console.log(
            `📥 [ArticlesService][findAll] 從 Cloudinary 獲取文章內容: ${article.id}`,
          );
          const originalUrl = article.content;
          let response = await fetch(originalUrl);
          if (response.ok) {
            const actualContent = await response.text();
            article.content = actualContent;
            console.log(
              `✅ [ArticlesService][findAll] 文章 ${article.id} 內容已從 Cloudinary 獲取 (${actualContent.length} 字符)`,
            );
          } else {
            console.error(
              `❌ [ArticlesService][findAll] 文章 ${article.id} 從 Cloudinary 獲取內容失敗: ${response.status}`,
            );
            const normalizedUrl = normalizeDuplicatedFolder(originalUrl);
            if (normalizedUrl !== originalUrl) {
              console.log(
                `🔁 [ArticlesService][findAll] 嘗試修正重複資料夾後的 URL 重新抓取: ${normalizedUrl}`,
              );
              response = await fetch(normalizedUrl);
              if (response.ok) {
                const actualContent = await response.text();
                article.content = actualContent;
                console.log(
                  `✅ [ArticlesService][findAll] 文章 ${article.id} 經修正 URL 後成功獲取內容 (${actualContent.length} 字符)`,
                );
              } else {
                console.error(
                  `❌ [ArticlesService][findAll] 文章 ${article.id} 經修正 URL 仍失敗: ${response.status}`,
                );
              }
            }
          }
        } catch (error) {
          console.error(
            `❌ [ArticlesService][findAll] 文章 ${article.id} 獲取 Cloudinary 內容時發生錯誤:`,
            error,
          );
        }
      }
    }

    // 額外查詢：檢查資料庫中所有文章（不考慮篩選）
    console.log('🔍 [ArticlesService][findAll] 檢查資料庫中所有文章...');
    const allArticles = await this.articleRepository.find({
      relations: ['category', 'tags'],
    });
    console.log(
      '📊 [ArticlesService][findAll] 資料庫中所有文章:',
      allArticles.map((a) => ({
        id: a.id,
        title: a.title,
        isDraft: a.isDraft,
        createdAt: a.createdAt,
      })),
    );

    console.log('📋 [ArticlesService][findAll] 文章列表詳情:');
    data.forEach((article, index) => {
      console.log(
        `  ${index + 1}. ID: ${article.id}, 標題: ${article.title}, isDraft: ${article.isDraft}, 創建時間: ${article.createdAt}, 內容長度: ${article.content?.length || 0}`,
      );
    });

    // 新增：檢查是否有文章被意外篩選掉
    if (isDraft !== undefined && data.length === 0 && allArticles.length > 0) {
      console.log(
        '⚠️ [ArticlesService][findAll] 警告：查詢結果為空，但資料庫中有文章',
      );
      console.log('🔍 [ArticlesService][findAll] 檢查可能的原因：');
      allArticles.forEach((article) => {
        console.log(
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
          console.log(
            '[ArticleService][findOne] Content fetched from Cloudinary:',
            article.content.substring(0, 100) + '...',
          );
        } else {
          console.error(
            '[ArticleService][findOne] Failed to fetch content from Cloudinary:',
            originalUrl,
          );
          const normalizedUrl = normalizeDuplicatedFolder(originalUrl);
          if (normalizedUrl !== originalUrl) {
            console.log(
              '[ArticleService][findOne] Retrying with normalized URL:',
              normalizedUrl,
            );
            response = await fetch(normalizedUrl);
            if (response.ok) {
              article.content = await response.text();
              console.log(
                '[ArticleService][findOne] Content fetched after URL normalization:',
                article.content.substring(0, 100) + '...',
              );
            }
          }
        }
      } catch (error) {
        console.error(
          '[ArticleService][findOne] Error fetching content from Cloudinary:',
          error,
        );
      }
    }

    if (article) {
      console.log('[ArticleService][findOne] 查詢:', {
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
      console.log(
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
      console.log(
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
      console.log('[ArticleService][update] DB 實際寫入:', {
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
          console.log(
            '[ArticleService][remove] Cover image deleted:',
            article.coverImagePublicId,
          );
        } else {
          console.log(
            '[ArticleService][remove] Cover image not found:',
            article.coverImagePublicId,
          );
        }
      } catch (error) {
        console.error(
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
          console.log(
            '[ArticleService][remove] Content deleted:',
            article.contentPublicId,
          );
        } else {
          console.log(
            '[ArticleService][remove] Content not found:',
            article.contentPublicId,
          );
        }
      } catch (error) {
        console.error(
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
