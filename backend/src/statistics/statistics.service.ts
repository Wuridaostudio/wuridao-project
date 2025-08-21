import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getSystemStatistics() {
    try {
      this.logger.log('📊 [StatisticsService] Starting to get system statistics data');

      // 獲取文章數量
      const articlesCount = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM articles',
      );

      // 獲取照片數量
      const photosCount = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM photos',
      );

      // 獲取影片數量
      const videosCount = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM videos',
      );

      // 獲取用戶數量
      const usersCount = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM users',
      );

      // 獲取分類數量
      const categoriesCount = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM categories',
      );

      // 獲取標籤數量
      const tagsCount = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM tags',
      );

      const result = {
        articles: parseInt(articlesCount[0].count),
        photos: parseInt(photosCount[0].count),
        videos: parseInt(videosCount[0].count),
        users: parseInt(usersCount[0].count),
        categories: parseInt(categoriesCount[0].count),
        tags: parseInt(tagsCount[0].count),
        timestamp: new Date().toISOString(),
      };

      this.logger.log('✅ [StatisticsService] Statistics data retrieved successfully:', result);
      return result;
    } catch (error) {
      this.logger.error('❌ [StatisticsService] 獲取統計數據失敗:', error);
      return {
        articles: 0,
        photos: 0,
        videos: 0,
        users: 0,
        categories: 0,
        tags: 0,
        error: 'Failed to get statistics',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getDetailedStatistics() {
    try {
      this.logger.log('📊 [StatisticsService] Starting to get detailed statistics data');

      const basicStats = await this.getSystemStatistics();

      // 獲取最近7天的文章統計
      const recentArticles = await this.dataSource.query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM articles
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `);

      // 獲取分類統計
      const categoryStats = await this.dataSource.query(`
        SELECT c.name, COUNT(a.id) as article_count
        FROM categories c
        LEFT JOIN articles a ON c.id = a.category_id
        GROUP BY c.id, c.name
        ORDER BY article_count DESC
      `);

      // 獲取標籤統計
      const tagStats = await this.dataSource.query(`
        SELECT t.name, COUNT(DISTINCT a.id) as article_count
        FROM tags t
        LEFT JOIN articles_tags at ON t.id = at.tag_id
        LEFT JOIN articles a ON at.article_id = a.id
        GROUP BY t.id, t.name
        ORDER BY article_count DESC
        LIMIT 10
      `);

      const result = {
        ...basicStats,
        recentArticles,
        categoryStats,
        tagStats,
      };

      this.logger.log('✅ [StatisticsService] Detailed statistics data retrieved successfully');
      return result;
    } catch (error) {
      this.logger.error('❌ [StatisticsService] 獲取詳細統計數據失敗:', error);
      return {
        error: 'Failed to get detailed statistics',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
