// utils/seo-optimizer.ts - SEO 優化工具
export interface SEOKeywords {
  primary: string[]
  secondary: string[]
  longTail: string[]
}

export interface SEOAnalysis {
  score: number
  issues: string[]
  suggestions: string[]
}

// 智慧家居相關關鍵詞
export const SMART_HOME_KEYWORDS: SEOKeywords = {
  primary: [
    '智慧家居',
    '智能家居',
    '智慧家庭',
    '智能家庭',
    'home automation',
    'smart home'
  ],
  secondary: [
    '智慧控制',
    '智能控制',
    '安全監控',
    '節能環保',
    '物聯網',
    'IoT',
    '自動化',
    '遠程控制'
  ],
  longTail: [
    '智慧家居規劃',
    '智能家居安裝',
    '智慧家庭系統',
    '智能家庭解決方案',
    '台中智慧家居',
    '智慧家居推薦',
    '智能家居品牌'
  ]
}

export class SEOOptimizer {
  // 分析頁面 SEO 狀況
  static analyzePage(content: string, title: string, description: string): SEOAnalysis {
    const issues: string[] = []
    const suggestions: string[] = []
    let score = 100

    // 檢查標題長度
    if (title.length < 30 || title.length > 60) {
      issues.push('標題長度不在最佳範圍內 (30-60 字符)')
      score -= 10
    }

    // 檢查描述長度
    if (description.length < 120 || description.length > 160) {
      issues.push('描述長度不在最佳範圍內 (120-160 字符)')
      score -= 10
    }

    // 檢查關鍵詞密度
    const keywordDensity = this.calculateKeywordDensity(content, SMART_HOME_KEYWORDS.primary)
    if (keywordDensity < 1 || keywordDensity > 3) {
      issues.push('主要關鍵詞密度不在最佳範圍內 (1-3%)')
      score -= 15
      suggestions.push('調整關鍵詞密度至 1-3%')
    }

    // 檢查標題關鍵詞
    const titleHasKeyword = SMART_HOME_KEYWORDS.primary.some(keyword => 
      title.toLowerCase().includes(keyword.toLowerCase())
    )
    if (!titleHasKeyword) {
      issues.push('標題缺少主要關鍵詞')
      score -= 20
      suggestions.push('在標題中加入主要關鍵詞')
    }

    // 檢查描述關鍵詞
    const descHasKeyword = SMART_HOME_KEYWORDS.primary.some(keyword => 
      description.toLowerCase().includes(keyword.toLowerCase())
    )
    if (!descHasKeyword) {
      issues.push('描述缺少主要關鍵詞')
      score -= 15
      suggestions.push('在描述中加入主要關鍵詞')
    }

    // 檢查內容結構
    const hasHeadings = /<h[1-6]>/i.test(content)
    if (!hasHeadings) {
      issues.push('內容缺少標題結構')
      score -= 10
      suggestions.push('添加適當的標題結構 (H1-H6)')
    }

    // 檢查圖片 alt 標籤
    const images = content.match(/<img[^>]*>/gi) || []
    const imagesWithoutAlt = images.filter(img => !/<img[^>]*alt\s*=/i.test(img))
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} 張圖片缺少 alt 標籤`)
      score -= 5
      suggestions.push('為所有圖片添加描述性的 alt 標籤')
    }

    // 檢查內部連結
    const internalLinks = content.match(/<a[^>]*href\s*=\s*["']\/[^"']*["'][^>]*>/gi) || []
    if (internalLinks.length < 2) {
      suggestions.push('添加更多內部連結以提升 SEO')
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions
    }
  }

  // 計算關鍵詞密度
  static calculateKeywordDensity(content: string, keywords: string[]): number {
    const cleanContent = content.replace(/<[^>]*>/g, '').toLowerCase()
    const totalWords = cleanContent.split(/\s+/).length
    
    let keywordCount = 0
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword.toLowerCase(), 'g')
      const matches = cleanContent.match(regex)
      if (matches) {
        keywordCount += matches.length
      }
    })

    return totalWords > 0 ? (keywordCount / totalWords) * 100 : 0
  }

  // 生成 SEO 友好的標題
  static generateSEOTitle(pageName: string, keywords: string[]): string {
    const primaryKeyword = keywords[0] || '智慧家居'
    return `${pageName} - ${primaryKeyword} | WURIDAO 智慧家`
  }

  // 生成 SEO 友好的描述
  static generateSEODescription(content: string, keywords: string[]): string {
    const cleanContent = content.replace(/<[^>]*>/g, '').substring(0, 150)
    const primaryKeyword = keywords[0] || '智慧家居'
    return `${cleanContent}... 了解更多 ${primaryKeyword} 相關資訊，歡迎聯繫 WURIDAO 智慧家。`
  }

  // 優化圖片 SEO
  static optimizeImageSEO(alt: string, filename: string): string {
    // 確保 alt 標籤包含關鍵詞
    const keywords = SMART_HOME_KEYWORDS.primary
    const hasKeyword = keywords.some(keyword => 
      alt.toLowerCase().includes(keyword.toLowerCase())
    )
    
    if (!hasKeyword && keywords.length > 0) {
      return `${alt} - ${keywords[0]}相關圖片`
    }
    
    return alt
  }

  // 生成結構化資料建議
  static generateStructuredDataSuggestions(pageType: string): string[] {
    const suggestions: string[] = []
    
    switch (pageType) {
      case 'homepage':
        suggestions.push('添加 Organization 結構化資料')
        suggestions.push('添加 Website 結構化資料')
        suggestions.push('添加 Service 結構化資料')
        break
      case 'article':
        suggestions.push('添加 Article 結構化資料')
        suggestions.push('添加 BreadcrumbList 結構化資料')
        suggestions.push('添加 Author 結構化資料')
        break
      case 'service':
        suggestions.push('添加 Service 結構化資料')
        suggestions.push('添加 LocalBusiness 結構化資料')
        suggestions.push('添加 PriceRange 結構化資料')
        break
    }
    
    return suggestions
  }

  // 檢查頁面速度優化
  static checkPageSpeedOptimization(): string[] {
    const suggestions: string[] = []
    
    suggestions.push('啟用圖片懶加載')
    suggestions.push('壓縮和優化圖片')
    suggestions.push('使用 WebP 格式')
    suggestions.push('啟用瀏覽器緩存')
    suggestions.push('最小化 CSS 和 JavaScript')
    suggestions.push('使用 CDN 加速')
    
    return suggestions
  }
}


