// server/api/robots.txt.get.ts - 動態生成 robots.txt
import { generateRobotsTxt } from '~/utils/sitemap'

export default defineEventHandler(async (event) => {
  // 設置正確的 Content-Type
  setHeader(event, 'Content-Type', 'text/plain')
  setHeader(event, 'Cache-Control', 'public, max-age=86400') // 緩存 24 小時
  
  try {
    // 根據環境動態設置 baseUrl
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://wuridaostudio.com' 
      : 'http://localhost:3001'
    
    // 生成 robots.txt
    const robotsTxt = generateRobotsTxt({ baseUrl })
    
    return robotsTxt
  } catch (error) {
    console.error('生成 robots.txt 時發生錯誤:', error)
    
    // 返回基本的 robots.txt 作為備用
    const fallbackRobots = `User-agent: *
Allow: /

# 禁止爬取管理後台
Disallow: /admin/

# 禁止爬取 API 端點
Disallow: /api/

# Sitemap 位置
Sitemap: ${baseUrl}/sitemap.xml`
    
    return fallbackRobots
  }
})

