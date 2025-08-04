import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeoSettings } from './seo.entity';
import { UpdateSeoSettingsDto } from './dto/update-seo.dto';

// 簡單的 HTML 清理函數
function sanitizeHtml(input: string): string {
  if (!input) return input;
  
  // 移除危險標籤和屬性
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

@Injectable()
export class SeoService {
  constructor(
    @InjectRepository(SeoSettings)
    private seoSettingsRepository: Repository<SeoSettings>,
  ) {}

  async getSettings(): Promise<SeoSettings> {
    let settings = await this.seoSettingsRepository.findOne({
      where: { id: 1 },
    });

    if (!settings) {
      // 創建預設設定
      settings = this.seoSettingsRepository.create({
        id: 1,
        siteTitle: 'WURIDAO 智慧家',
        siteDescription: 'WURIDAO 智慧家提供完整的智能家居解決方案，包括智能控制、安全守護、節能環保等功能',
        siteKeywords: '智慧家居,智能家居,智慧家,WURIDAO,物聯網,IoT,家庭自動化',
        featuredSnippet: '',
        faqs: [],
        latitude: 24.1477358,
        longitude: 120.6736482,
        address: '台中市南屯區大墩七街112號',
        city: '台中市',
        postalCode: '408',
        facebookUrl: '',
        instagramUrl: '',
        youtubeUrl: '',
      });
      await this.seoSettingsRepository.save(settings);
    }

    return settings;
  }

  async updateSettings(updateDto: UpdateSeoSettingsDto): Promise<SeoSettings> {
    let settings = await this.seoSettingsRepository.findOne({
      where: { id: 1 },
    });

    // 清理輸入資料
    if (updateDto.siteTitle) updateDto.siteTitle = sanitizeHtml(updateDto.siteTitle);
    if (updateDto.siteDescription) updateDto.siteDescription = sanitizeHtml(updateDto.siteDescription);
    if (updateDto.siteKeywords) updateDto.siteKeywords = sanitizeHtml(updateDto.siteKeywords);
    if (updateDto.featuredSnippet) updateDto.featuredSnippet = sanitizeHtml(updateDto.featuredSnippet);
    if (updateDto.address) updateDto.address = sanitizeHtml(updateDto.address);
    if (updateDto.city) updateDto.city = sanitizeHtml(updateDto.city);
    if (updateDto.postalCode) updateDto.postalCode = sanitizeHtml(updateDto.postalCode);

    // 清理 FAQ 內容
    if (updateDto.faqs) {
      updateDto.faqs = updateDto.faqs.map(faq => ({
        question: sanitizeHtml(faq.question),
        answer: sanitizeHtml(faq.answer),
      }));
    }

    if (!settings) {
      settings = this.seoSettingsRepository.create({
        id: 1,
        ...updateDto,
      });
    } else {
      // 只更新提供的欄位
      Object.assign(settings, updateDto);
    }

    return await this.seoSettingsRepository.save(settings);
  }

  async getSeoSettings(): Promise<any> {
    const settings = await this.getSettings();
    return {
      seo: {
        title: settings.siteTitle,
        description: settings.siteDescription,
        keywords: settings.siteKeywords,
      },
      aeo: {
        featuredSnippet: settings.featuredSnippet,
        faqs: settings.faqs || [],
      },
      geo: {
        latitude: settings.latitude,
        longitude: settings.longitude,
        address: settings.address,
        city: settings.city,
        postalCode: settings.postalCode,
      },
      social: {
        facebook: settings.facebookUrl,
        instagram: settings.instagramUrl,
        youtube: settings.youtubeUrl,
      },
    };
  }

  async updateSeoSettings(updateData: any): Promise<any> {
    const updateDto: UpdateSeoSettingsDto = {};

    if (updateData.seo) {
      updateDto.siteTitle = updateData.seo.title;
      updateDto.siteDescription = updateData.seo.description;
      updateDto.siteKeywords = updateData.seo.keywords;
    }

    if (updateData.aeo) {
      updateDto.featuredSnippet = updateData.aeo.featuredSnippet;
      updateDto.faqs = updateData.aeo.faqs;
    }

    if (updateData.geo) {
      updateDto.latitude = updateData.geo.latitude;
      updateDto.longitude = updateData.geo.longitude;
      updateDto.address = updateData.geo.address;
      updateDto.city = updateData.geo.city;
      updateDto.postalCode = updateData.geo.postalCode;
    }

    if (updateData.social) {
      updateDto.facebookUrl = updateData.social.facebook;
      updateDto.instagramUrl = updateData.social.instagram;
      updateDto.youtubeUrl = updateData.social.youtube;
    }

    await this.updateSettings(updateDto);
    return this.getSeoSettings();
  }

  async generateStructuredData(type: string): Promise<any> {
    const settings = await this.getSettings();
    
    switch (type) {
      case 'organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": settings.siteTitle || "WURIDAO 智慧家",
          "description": settings.siteDescription,
          "url": "https://wuridao.com",
          "logo": "https://wuridao.com/logo.png",
          "sameAs": [
            settings.facebookUrl,
            settings.instagramUrl,
            settings.youtubeUrl,
          ].filter(Boolean),
        };
      
      case 'place':
        return {
          "@context": "https://schema.org",
          "@type": "Place",
          "name": settings.siteTitle || "WURIDAO 智慧家",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": settings.address,
            "addressLocality": settings.city,
            "postalCode": settings.postalCode,
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": settings.latitude,
            "longitude": settings.longitude,
          },
        };
      
      case 'faq':
        if (settings.faqs && settings.faqs.length > 0) {
          return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": settings.faqs.map((faq: any) => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer,
              },
            })),
          };
        }
        return null;
      
      default:
        throw new Error('不支援的結構化資料類型');
    }
  }
} 