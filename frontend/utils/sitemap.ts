// utils/sitemap.ts - 動態 Sitemap 生成工具

export interface SitemapUrl {
  loc: string
  lastmod: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}

export interface SitemapConfig {
  baseUrl: string
  defaultPriority: number
  defaultChangeFreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
}

// 預設配置
const defaultConfig: SitemapConfig = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://wuridaostudio.com' 
    : 'http://localhost:3001',
  defaultPriority: 0.8,
  defaultChangeFreq: 'weekly'
}

// 靜態頁面配置
const staticPages = [
  {
    path: '/',
    priority: 1.0,
    changefreq: 'daily' as const,
    lastmod: new Date().toISOString()
  },
  {
    path: '/about',
    priority: 0.9,
    changefreq: 'monthly' as const,
    lastmod: new Date().toISOString()
  },
  {
    path: '/plan',
    priority: 0.9,
    changefreq: 'weekly' as const,
    lastmod: new Date().toISOString()
  },
  {
    path: '/articles/news',
    priority: 0.8,
    changefreq: 'daily' as const,
    lastmod: new Date().toISOString()
  }
]

// 從 API 獲取動態內容
async function fetchDynamicContent(baseUrl: string) {
  const dynamicUrls: SitemapUrl[] = []
  
  try {
    // 獲取文章列表
    const articlesResponse = await $fetch(`${baseUrl}/api/articles/public`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (articlesResponse?.data) {
      articlesResponse.data.forEach((article: any) => {
        dynamicUrls.push({
          loc: `${baseUrl}/articles/${article.id}`,
          lastmod: new Date(article.updatedAt || article.createdAt).toISOString(),
          changefreq: 'weekly',
          priority: 0.7
        })
      })
    }
  } catch (error) {
    console.warn('無法獲取文章列表:', error)
  }

  try {
    // 獲取分類列表
    const categoriesResponse = await $fetch(`${baseUrl}/api/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (categoriesResponse?.data) {
      categoriesResponse.data.forEach((category: any) => {
        dynamicUrls.push({
          loc: `${baseUrl}/articles/category/${category.slug}`,
          lastmod: new Date(category.updatedAt || category.createdAt).toISOString(),
          changefreq: 'weekly',
          priority: 0.6
        })
      })
    }
  } catch (error) {
    console.warn('無法獲取分類列表:', error)
  }

  try {
    // 獲取標籤列表
    const tagsResponse = await $fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (tagsResponse?.data) {
      tagsResponse.data.forEach((tag: any) => {
        dynamicUrls.push({
          loc: `${baseUrl}/articles/tag/${tag.slug}`,
          lastmod: new Date(tag.updatedAt || tag.createdAt).toISOString(),
          changefreq: 'monthly',
          priority: 0.5
        })
      })
    }
  } catch (error) {
    console.warn('無法獲取標籤列表:', error)
  }

  return dynamicUrls
}

// 生成 sitemap XML
export function generateSitemapXml(urls: SitemapUrl[]): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  const urlsetClose = '</urlset>'
  
  const urlEntries = urls.map(url => {
    return `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  }).join('\n')
  
  return `${xmlHeader}
${urlsetOpen}
${urlEntries}
${urlsetClose}`
}

// 生成完整的 sitemap
export async function generateSitemap(config: Partial<SitemapConfig> = {}): Promise<string> {
  const finalConfig = { ...defaultConfig, ...config }
  const allUrls: SitemapUrl[] = []
  
  // 添加靜態頁面
  staticPages.forEach(page => {
    allUrls.push({
      loc: `${finalConfig.baseUrl}${page.path}`,
      lastmod: page.lastmod,
      changefreq: page.changefreq,
      priority: page.priority
    })
  })
  
  // 添加動態內容
  try {
    const dynamicUrls = await fetchDynamicContent(finalConfig.baseUrl)
    allUrls.push(...dynamicUrls)
  } catch (error) {
    console.warn('獲取動態內容時發生錯誤:', error)
  }
  
  return generateSitemapXml(allUrls)
}

// 生成 robots.txt
export function generateRobotsTxt(config: Partial<SitemapConfig> = {}): string {
  const finalConfig = { ...defaultConfig, ...config }
  
  return `User-agent: *
Allow: /

# 禁止爬取管理後台
Disallow: /admin/

# 禁止爬取 API 端點
Disallow: /api/

# Sitemap 位置
Sitemap: ${finalConfig.baseUrl}/sitemap.xml

# 爬取延遲（可選）
Crawl-delay: 1`
}

// 生成 sitemap 索引（用於大型網站）
export function generateSitemapIndex(sitemaps: Array<{
  loc: string
  lastmod: string
}>): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
  const sitemapindexOpen = '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  const sitemapindexClose = '</sitemapindex>'
  
  const sitemapEntries = sitemaps.map(sitemap => {
    return `  <sitemap>
    <loc>${sitemap.loc}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`
  }).join('\n')
  
  return `${xmlHeader}
${sitemapindexOpen}
${sitemapEntries}
${sitemapindexClose}`
}

// 驗證 URL 格式
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// 清理和格式化 URL
export function cleanUrl(url: string, baseUrl: string): string {
  // 移除重複的斜線
  let cleaned = url.replace(/\/+/g, '/')
  
  // 確保以 / 開頭
  if (!cleaned.startsWith('/')) {
    cleaned = '/' + cleaned
  }
  
  // 移除末尾的斜線（除了根路徑）
  if (cleaned !== '/' && cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1)
  }
  
  return `${baseUrl}${cleaned}`
}

// 獲取頁面最後修改時間
export function getLastModified(date: string | Date): string {
  const lastmod = new Date(date)
  return lastmod.toISOString()
}

// 根據內容類型決定優先級
export function getPriorityByType(type: 'home' | 'page' | 'article' | 'category' | 'tag'): number {
  const priorities = {
    home: 1.0,
    page: 0.9,
    article: 0.7,
    category: 0.6,
    tag: 0.5
  }
  return priorities[type] || 0.5
}

// 根據內容類型決定更新頻率
export function getChangeFreqByType(type: 'home' | 'page' | 'article' | 'category' | 'tag'): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
  const frequencies = {
    home: 'daily' as const,
    page: 'monthly' as const,
    article: 'weekly' as const,
    category: 'weekly' as const,
    tag: 'monthly' as const
  }
  return frequencies[type] || 'monthly'
}

