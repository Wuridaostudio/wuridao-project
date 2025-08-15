-- 數據庫性能優化腳本
-- 為文章查詢添加必要的索引

-- 1. 為文章表的常用查詢字段添加索引
CREATE INDEX IF NOT EXISTS idx_articles_is_draft ON articles("isDraft");
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles("categoryId");

-- 2. 複合索引：isDraft + createdAt (用於文章列表查詢)
CREATE INDEX IF NOT EXISTS idx_articles_is_draft_created_at ON articles("isDraft", "createdAt" DESC);

-- 3. 為標籤關聯表添加索引
CREATE INDEX IF NOT EXISTS idx_articles_tags_article_id ON articles_tags_tags("articlesId");
CREATE INDEX IF NOT EXISTS idx_articles_tags_tag_id ON articles_tags_tags("tagsId");

-- 4. 為分類表添加索引
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories("type");

-- 5. 檢查索引是否創建成功
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('articles', 'categories', 'articles_tags_tags')
ORDER BY tablename, indexname;

-- 6. 分析表統計信息以優化查詢計劃
ANALYZE articles;
ANALYZE categories;
ANALYZE articles_tags_tags;
