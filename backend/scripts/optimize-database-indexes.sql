-- WURIDAO 智慧家 - 資料庫索引優化腳本
-- 執行日期: $(date)
-- 說明: 為所有主要表添加性能優化索引

-- ========================================
-- 1. 文章表 (articles) 索引優化
-- ========================================

-- 基本查詢索引
CREATE INDEX IF NOT EXISTS idx_articles_is_draft ON articles("isDraft");
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_articles_updated_at ON articles("updatedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles("categoryId");

-- 複合索引：用於文章列表查詢
CREATE INDEX IF NOT EXISTS idx_articles_is_draft_created_at ON articles("isDraft", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category_created_at ON articles("categoryId", "createdAt" DESC);

-- 全文搜索索引（如果支援）
CREATE INDEX IF NOT EXISTS idx_articles_title_gin ON articles USING gin(to_tsvector('chinese', title));
CREATE INDEX IF NOT EXISTS idx_articles_content_gin ON articles USING gin(to_tsvector('chinese', content));

-- SEO 相關索引
CREATE INDEX IF NOT EXISTS idx_articles_seo_title ON articles("seoTitle") WHERE "seoTitle" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_geo_lat_lng ON articles("geoLatitude", "geoLongitude") WHERE "geoLatitude" IS NOT NULL;

-- ========================================
-- 2. 分類表 (categories) 索引優化
-- ========================================

CREATE INDEX IF NOT EXISTS idx_categories_type ON categories("type");
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories("name");
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories("slug") WHERE "slug" IS NOT NULL;

-- ========================================
-- 3. 標籤表 (tags) 索引優化
-- ========================================

CREATE INDEX IF NOT EXISTS idx_tags_name ON tags("name");

-- ========================================
-- 4. 用戶表 (users) 索引優化
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_username ON users("username");
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users("createdAt" DESC);

-- ========================================
-- 5. 照片表 (photos) 索引優化
-- ========================================

CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_photos_category_id ON photos("categoryId");
CREATE INDEX IF NOT EXISTS idx_photos_public_id ON photos("publicId") WHERE "publicId" IS NOT NULL;

-- 複合索引
CREATE INDEX IF NOT EXISTS idx_photos_category_created_at ON photos("categoryId", "createdAt" DESC);

-- ========================================
-- 6. 影片表 (videos) 索引優化
-- ========================================

CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_videos_category_id ON videos("categoryId");
CREATE INDEX IF NOT EXISTS idx_videos_public_id ON videos("publicId") WHERE "publicId" IS NOT NULL;

-- 複合索引
CREATE INDEX IF NOT EXISTS idx_videos_category_created_at ON videos("categoryId", "createdAt" DESC);

-- ========================================
-- 7. 關聯表索引優化
-- ========================================

-- 文章-標籤關聯表
CREATE INDEX IF NOT EXISTS idx_articles_tags_article_id ON articles_tags_tags("articlesId");
CREATE INDEX IF NOT EXISTS idx_articles_tags_tag_id ON articles_tags_tags("tagsId");
CREATE INDEX IF NOT EXISTS idx_articles_tags_composite ON articles_tags_tags("articlesId", "tagsId");

-- 照片-標籤關聯表
CREATE INDEX IF NOT EXISTS idx_photos_tags_photo_id ON photos_tags_tags("photosId");
CREATE INDEX IF NOT EXISTS idx_photos_tags_tag_id ON photos_tags_tags("tagsId");
CREATE INDEX IF NOT EXISTS idx_photos_tags_composite ON photos_tags_tags("photosId", "tagsId");

-- 影片-標籤關聯表
CREATE INDEX IF NOT EXISTS idx_videos_tags_video_id ON videos_tags_tags("videosId");
CREATE INDEX IF NOT EXISTS idx_videos_tags_tag_id ON videos_tags_tags("tagsId");
CREATE INDEX IF NOT EXISTS idx_videos_tags_composite ON videos_tags_tags("videosId", "tagsId");

-- ========================================
-- 8. 分析表 (visitor_log) 索引優化
-- ========================================

CREATE INDEX IF NOT EXISTS idx_visitor_log_timestamp ON visitor_log("timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_log_ip ON visitor_log("ip");
CREATE INDEX IF NOT EXISTS idx_visitor_log_page ON visitor_log("page");
CREATE INDEX IF NOT EXISTS idx_visitor_log_country ON visitor_log("country") WHERE "country" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visitor_log_session_id ON visitor_log("sessionId") WHERE "sessionId" IS NOT NULL;

-- 複合索引
CREATE INDEX IF NOT EXISTS idx_visitor_log_ip_timestamp ON visitor_log("ip", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_log_page_timestamp ON visitor_log("page", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_log_country_timestamp ON visitor_log("country", "timestamp" DESC);

-- ========================================
-- 9. SEO 設定表索引優化
-- ========================================

CREATE INDEX IF NOT EXISTS idx_seo_settings_created_at ON seo_settings("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_seo_settings_updated_at ON seo_settings("updatedAt" DESC);

-- ========================================
-- 10. 性能優化設定
-- ========================================

-- 設定統計信息收集
ALTER TABLE articles SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE articles SET (autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE visitor_log SET (autovacuum_vacuum_scale_factor = 0.2);
ALTER TABLE visitor_log SET (autovacuum_analyze_scale_factor = 0.1);

-- ========================================
-- 11. 分析表統計信息
-- ========================================

-- 更新統計信息以優化查詢計劃
ANALYZE articles;
ANALYZE categories;
ANALYZE tags;
ANALYZE users;
ANALYZE photos;
ANALYZE videos;
ANALYZE visitor_log;
ANALYZE seo_settings;
ANALYZE articles_tags_tags;
ANALYZE photos_tags_tags;
ANALYZE videos_tags_tags;

-- ========================================
-- 12. 索引使用情況檢查
-- ========================================

-- 檢查所有索引
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 檢查索引大小
SELECT 
    t.tablename,
    indexname,
    c.reltuples AS num_rows,
    pg_size_pretty(pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.indexname)::regclass)) AS index_size
FROM pg_tables t
LEFT OUTER JOIN pg_class c ON c.relname=t.tablename
LEFT OUTER JOIN (
    SELECT c.relname AS ctablename, ipg.relname AS indexname, x.indnatts AS number_of_columns, idx_scan, idx_tup_read, idx_tup_fetch, indexrelname, indisunique FROM pg_index x
    JOIN pg_class c ON c.oid = x.indrelid
    JOIN pg_class ipg ON ipg.oid = x.indexrelid
    JOIN pg_stat_all_indexes psai ON x.indexrelid = psai.indexrelid
) AS foo
ON t.tablename = foo.ctablename
WHERE t.schemaname='public'
ORDER BY 1,2;

-- ========================================
-- 13. 查詢性能檢查
-- ========================================

-- 檢查慢查詢
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 10;

-- 完成提示
SELECT '資料庫索引優化完成！' AS status;
