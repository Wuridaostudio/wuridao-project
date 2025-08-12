import { Injectable, Logger } from '@nestjs/common';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';

@Injectable()
export class ArticleSeoService {
  private readonly logger = new Logger(ArticleSeoService.name);

  processSeoData(createArticleDto: CreateArticleDto | UpdateArticleDto) {
    this.logger.log('🔍 [ArticleSeoService] 處理 SEO 欄位...');
    
    const seoData = {
      seoTitle: createArticleDto.seoTitle,
      seoDescription: createArticleDto.seoDescription,
      seoKeywords: createArticleDto.seoKeywords,
    };
    
    this.logger.log('📊 [ArticleSeoService] SEO 數據:', seoData);
    return seoData;
  }

  processAeoData(createArticleDto: CreateArticleDto | UpdateArticleDto) {
    this.logger.log('🔍 [ArticleSeoService] 處理 AEO 欄位...');
    
    const aeoData = {
      aeoFaq: createArticleDto.aeoFaq || [],
      aeoFeaturedSnippet: createArticleDto.aeoFeaturedSnippet || '',
    };
    
    this.logger.log('📊 [ArticleSeoService] AEO 數據:', aeoData);
    return aeoData;
  }

  processGeoData(createArticleDto: CreateArticleDto | UpdateArticleDto) {
    this.logger.log('🔍 [ArticleSeoService] 處理 GEO 欄位...');
    
    const geoData = {
      geoLatitude: createArticleDto.geoLatitude,
      geoLongitude: createArticleDto.geoLongitude,
      geoAddress: createArticleDto.geoAddress,
      geoCity: createArticleDto.geoCity,
      geoPostalCode: createArticleDto.geoPostalCode,
    };
    
    this.logger.log('📊 [ArticleSeoService] GEO 數據:', geoData);
    return geoData;
  }

  validateSeoData(seoData: any) {
    const errors = [];

    if (seoData.seoTitle && seoData.seoTitle.length > 60) {
      errors.push('SEO 標題不能超過 60 個字符');
    }

    if (seoData.seoDescription && seoData.seoDescription.length > 160) {
      errors.push('SEO 描述不能超過 160 個字符');
    }

    if (seoData.seoKeywords && seoData.seoKeywords.length > 500) {
      errors.push('SEO 關鍵字不能超過 500 個字符');
    }

    return errors;
  }

  generateSeoTitle(title: string, customSeoTitle?: string): string {
    if (customSeoTitle) return customSeoTitle;
    return title.length > 60 ? title.substring(0, 57) + '...' : title;
  }

  generateSeoDescription(content: string, customSeoDescription?: string): string {
    if (customSeoDescription) return customSeoDescription;
    
    // 移除 HTML 標籤並截取前 160 個字符
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 160 ? plainText.substring(0, 157) + '...' : plainText;
  }
}

