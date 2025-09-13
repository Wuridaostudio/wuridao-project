// server/plugins/sitemap.ts - 動態處理 sitemap 和 robots.txt
import { generateSitemap, generateRobotsTxt } from '~/utils/sitemap'

export default defineNitroPlugin((nitroApp) => {
  // 處理 /robots.txt 請求
  nitroApp.hooks.hook('render:route', async (url, result) => {
    if (url === '/robots.txt') {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://wuridaostudio.com' 
        : 'http://localhost:3001'
      
      result.body = generateRobotsTxt({ baseUrl })
      result.headers = {
        ...result.headers,
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400'
      }
    }
    
    if (url === '/sitemap.xml') {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://wuridaostudio.com' 
        : 'http://localhost:3001'
      
      try {
        result.body = await generateSitemap({ baseUrl })
        result.headers = {
          ...result.headers,
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600'
        }
      } catch (error) {
        console.error('生成 sitemap 時發生錯誤:', error)
        // 使用靜態 sitemap 作為備用
        result.body = `<?xml version="1.0" encoding="UTF-8"?>
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
        result.headers = {
          ...result.headers,
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600'
        }
      }
    }
  })
})
