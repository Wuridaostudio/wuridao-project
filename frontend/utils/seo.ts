// utils/seo.ts

export interface SeoMeta {
  title: string
  description: string
  keywords: string[]
  image?: string
  url?: string
}

export interface AeoJsonLd {
  '@context': 'https://schema.org'
  '@type': 'FAQPage'
  'mainEntity': Array<{
    '@type': 'Question'
    'name': string
    'acceptedAnswer': {
      '@type': 'Answer'
      'text': string
    }
  }>
}

export interface GeoJsonLd {
  '@context': 'https://schema.org'
  '@type': 'Place'
  'name': string
  'address': {
    '@type': 'PostalAddress'
    'streetAddress': string
    'addressLocality': string
    'postalCode': string
  }
  'geo': {
    '@type': 'GeoCoordinates'
    'latitude': number
    'longitude': number
  }
}

export interface ArticleJsonLd {
  '@context': 'https://schema.org'
  '@type': 'Article'
  'headline': string
  'description': string
  'image'?: string
  'author': {
    '@type': 'Organization'
    'name': string
  }
  'publisher': {
    '@type': 'Organization'
    'name': string
    'logo': {
      '@type': 'ImageObject'
      'url': string
    }
  }
  'datePublished': string
  'dateModified': string
  'mainEntityOfPage': {
    '@type': 'WebPage'
    '@id': string
  }
}

// 生成 meta 標籤
export function generateMetaTags(meta: SeoMeta): Record<string, any> {
  return {
    title: meta.title,
    meta: [
      { name: 'description', content: meta.description },
      { name: 'keywords', content: meta.keywords.join(', ') },
      { property: 'og:title', content: meta.title },
      { property: 'og:description', content: meta.description },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: meta.url },
      { property: 'og:image', content: meta.image },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: meta.title },
      { name: 'twitter:description', content: meta.description },
      { name: 'twitter:image', content: meta.image },
    ],
  }
}

// 生成 FAQ 結構化資料
export function generateFaqJsonLd(faqs: Array<{ question: string, answer: string }>): AeoJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer,
      },
    })),
  }
}

// 生成地理結構化資料
export function generateGeoJsonLd(geo: {
  name: string
  address: string
  city: string
  postalCode: string
  latitude: number
  longitude: number
}): GeoJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    'name': geo.name,
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': geo.address,
      'addressLocality': geo.city,
      'postalCode': geo.postalCode,
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': geo.latitude,
      'longitude': geo.longitude,
    },
  }
}

// 生成文章結構化資料
export function generateArticleJsonLd(article: {
  title: string
  description: string
  image?: string
  url: string
  publishedAt: string
  updatedAt: string
}): ArticleJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': article.title,
    'description': article.description,
    'image': article.image,
    'author': {
      '@type': 'Organization',
      'name': 'WURIDAO 智慧家',
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'WURIDAO 智慧家',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://wuridao.com/logo.png',
      },
    },
    'datePublished': article.publishedAt,
    'dateModified': article.updatedAt,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': article.url,
    },
  }
}

// 新增結構化資料類型

// 組織結構化資料
export interface OrganizationJsonLd {
  '@context': 'https://schema.org'
  '@type': 'Organization'
  'name': string
  'url': string
  'logo': string
  'description': string
  'address': {
    '@type': 'PostalAddress'
    'streetAddress': string
    'addressLocality': string
    'postalCode': string
    'addressCountry': string
  }
  'contactPoint': {
    '@type': 'ContactPoint'
    'telephone': string
    'contactType': string
    'email': string
  }
  'sameAs': string[]
}

// 網站結構化資料
export interface WebsiteJsonLd {
  '@context': 'https://schema.org'
  '@type': 'WebSite'
  'name': string
  'url': string
  'description': string
  'potentialAction': {
    '@type': 'SearchAction'
    'target': string
    'query-input': string
  }
}

// 產品/服務結構化資料
export interface ServiceJsonLd {
  '@context': 'https://schema.org'
  '@type': 'Service'
  'name': string
  'description': string
  'provider': {
    '@type': 'Organization'
    'name': string
  }
  'areaServed': string
  'serviceType': string
  'offers': {
    '@type': 'Offer'
    'description': string
  }
}

// 麵包屑結構化資料
export interface BreadcrumbJsonLd {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  'itemListElement': Array<{
    '@type': 'ListItem'
    'position': number
    'name': string
    'item': string
  }>
}

// 生成組織結構化資料
export function generateOrganizationJsonLd(org: {
  name: string
  url: string
  logo: string
  description: string
  address: string
  city: string
  postalCode: string
  country: string
  phone: string
  email: string
  socialMedia: string[]
}): OrganizationJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': org.name,
    'url': org.url,
    'logo': org.logo,
    'description': org.description,
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': org.address,
      'addressLocality': org.city,
      'postalCode': org.postalCode,
      'addressCountry': org.country,
    },
    'contactPoint': {
      '@type': 'ContactPoint',
      'telephone': org.phone,
      'contactType': 'customer service',
      'email': org.email,
    },
    'sameAs': org.socialMedia,
  }
}

// 生成網站結構化資料
export function generateWebsiteJsonLd(site: {
  name: string
  url: string
  description: string
  searchUrl: string
}): WebsiteJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': site.name,
    'url': site.url,
    'description': site.description,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': site.searchUrl,
      'query-input': 'required name=search_term_string',
    },
  }
}

// 生成服務結構化資料
export function generateServiceJsonLd(service: {
  name: string
  description: string
  provider: string
  areaServed: string
  serviceType: string
  offerDescription: string
}): ServiceJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'name': service.name,
    'description': service.description,
    'provider': {
      '@type': 'Organization',
      'name': service.provider,
    },
    'areaServed': service.areaServed,
    'serviceType': service.serviceType,
    'offers': {
      '@type': 'Offer',
      'description': service.offerDescription,
    },
  }
}

// 生成麵包屑結構化資料
export function generateBreadcrumbJsonLd(breadcrumbs: Array<{
  name: string
  url: string
}>): BreadcrumbJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url,
    })),
  }
}

// SEO 分數計算
export function calculateSeoScore(content: string, title: string, description?: string): number {
  let score = 0

  // 標題長度 (0-20分)
  if (title.length >= 30 && title.length <= 60)
    score += 20
  else if (title.length >= 20 && title.length <= 70)
    score += 15
  else if (title.length >= 10)
    score += 10

  // 內容長度 (0-30分)
  const wordCount = content.replace(/<[^>]*>/g, '').length
  if (wordCount >= 1000)
    score += 30
  else if (wordCount >= 500)
    score += 20
  else if (wordCount >= 200)
    score += 10

  // 描述長度 (0-20分)
  if (description) {
    if (description.length >= 120 && description.length <= 160)
      score += 20
    else if (description.length >= 100 && description.length <= 180)
      score += 15
    else if (description.length >= 50)
      score += 10
  }

  // 圖片數量 (0-15分)
  const imageCount = (content.match(/<img/g) || []).length
  if (imageCount >= 3)
    score += 15
  else if (imageCount >= 1)
    score += 10

  // 標題層級 (0-15分)
  const headingCount = (content.match(/<h[1-6]/g) || []).length
  if (headingCount >= 3)
    score += 15
  else if (headingCount >= 1)
    score += 10

  return Math.min(score, 100)
}
