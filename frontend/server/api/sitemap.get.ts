// server/api/sitemap.get.ts - 動態生成 sitemap.xml
import { generateSitemap } from '~/utils/sitemap'

export default defineEventHandler(async (event) => {
  // 設置正確的 Content-Type
  setHeader(event, 'Content-Type', 'application/xml')
  setHeader(event, 'Cache-Control', 'public, max-age=3600') // 緩存 1 小時
  
  try {
    // 根據環境動態設置 baseUrl
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://wuridaostudio.com' 
      : 'http://localhost:3001'
    
    // 生成 sitemap
    const sitemapXml = await generateSitemap({ baseUrl })
    
    return sitemapXml
  } catch (error) {
    console.error('生成 sitemap 時發生錯誤:', error)
    
    // 返回基本的 sitemap 作為備用
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/plan</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/articles/news</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`
    
    return fallbackSitemap
  }
})
