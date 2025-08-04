// src/sitemap/sitemap.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../articles/entities/article.entity';

@Injectable()
export class SitemapService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) {}

  async generateSitemap(): Promise<string> {
    const baseUrl = process.env.FRONTEND_URL || 'https://wuridaostudio.com';
    const articles = await this.articleRepository.find({
      where: { isDraft: false },
      order: { updatedAt: 'DESC' },
    });

    const urls = [
      {
        loc: baseUrl,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '1.0',
      },
      {
        loc: `${baseUrl}/articles/news`,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '0.8',
      },
      ...articles.map((article) => ({
        loc: `${baseUrl}/articles/${article.id}`,
        lastmod: article.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: '0.6',
      })),
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

    return sitemap;
  }

  generateRobotsTxt(): string {
    const baseUrl = process.env.FRONTEND_URL || 'https://wuridaostudio.com';
    return `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${baseUrl}/sitemap.xml`;
  }
}
