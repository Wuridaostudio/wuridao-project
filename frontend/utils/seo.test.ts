import { describe, it, expect } from 'vitest'
import { 
  generateMetaTags, 
  generateFaqJsonLd, 
  generateGeoJsonLd, 
  generateArticleJsonLd, 
  calculateSeoScore 
} from './seo'

describe('seo utils', () => {
  describe('generateMetaTags', () => {
    it('should generate meta tags correctly', () => {
      const meta = {
        title: 'Test Article',
        description: 'This is a test article',
        keywords: ['test', 'article', 'seo'],
        image: 'https://example.com/image.jpg',
        url: 'https://example.com/article'
      }

      const result = generateMetaTags(meta)

      expect(result.title).toBe('Test Article')
      expect(result.meta).toHaveLength(11)
      
      // Check for specific meta tags
      const metaNames = result.meta.map(m => m.name || m.property)
      expect(metaNames).toContain('description')
      expect(metaNames).toContain('keywords')
      expect(metaNames).toContain('og:title')
      expect(metaNames).toContain('og:description')
      expect(metaNames).toContain('og:type')
      expect(metaNames).toContain('og:url')
      expect(metaNames).toContain('og:image')
      expect(metaNames).toContain('twitter:card')
      expect(metaNames).toContain('twitter:title')
      expect(metaNames).toContain('twitter:description')
      expect(metaNames).toContain('twitter:image')
    })

    it('should handle meta without optional fields', () => {
      const meta = {
        title: 'Test Article',
        description: 'This is a test article',
        keywords: ['test', 'article']
      }

      const result = generateMetaTags(meta)

      expect(result.title).toBe('Test Article')
      expect(result.meta).toHaveLength(11)
      
      // Check that optional fields are included but may be undefined
      const ogImage = result.meta.find(m => m.property === 'og:image')
      const ogUrl = result.meta.find(m => m.property === 'og:url')
      expect(ogImage).toBeDefined()
      expect(ogUrl).toBeDefined()
    })
  })

  describe('generateFaqJsonLd', () => {
    it('should generate FAQ structured data correctly', () => {
      const faqs = [
        { question: 'What is SEO?', answer: 'SEO stands for Search Engine Optimization' },
        { question: 'How does it work?', answer: 'It helps improve website visibility' }
      ]

      const result = generateFaqJsonLd(faqs)

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('FAQPage')
      expect(result.mainEntity).toHaveLength(2)
      expect(result.mainEntity[0]).toEqual({
        '@type': 'Question',
        'name': 'What is SEO?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'SEO stands for Search Engine Optimization'
        }
      })
      expect(result.mainEntity[1]).toEqual({
        '@type': 'Question',
        'name': 'How does it work?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'It helps improve website visibility'
        }
      })
    })

    it('should handle empty FAQ list', () => {
      const result = generateFaqJsonLd([])

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('FAQPage')
      expect(result.mainEntity).toHaveLength(0)
    })
  })

  describe('generateGeoJsonLd', () => {
    it('should generate geographic structured data correctly', () => {
      const geo = {
        name: 'WURIDAO Office',
        address: '123 Main Street',
        city: 'Taipei',
        postalCode: '10001',
        latitude: 25.0330,
        longitude: 121.5654
      }

      const result = generateGeoJsonLd(geo)

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('Place')
      expect(result.name).toBe('WURIDAO Office')
      expect(result.address).toEqual({
        '@type': 'PostalAddress',
        'streetAddress': '123 Main Street',
        'addressLocality': 'Taipei',
        'postalCode': '10001'
      })
      expect(result.geo).toEqual({
        '@type': 'GeoCoordinates',
        'latitude': 25.0330,
        'longitude': 121.5654
      })
    })
  })

  describe('generateArticleJsonLd', () => {
    it('should generate article structured data correctly', () => {
      const article = {
        title: 'Test Article',
        description: 'This is a test article',
        image: 'https://example.com/image.jpg',
        url: 'https://example.com/article',
        publishedAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z'
      }

      const result = generateArticleJsonLd(article)

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('Article')
      expect(result.headline).toBe('Test Article')
      expect(result.description).toBe('This is a test article')
      expect(result.image).toBe('https://example.com/image.jpg')
      expect(result.author).toEqual({
        '@type': 'Organization',
        'name': 'WURIDAO 智慧家'
      })
      expect(result.publisher).toEqual({
        '@type': 'Organization',
        'name': 'WURIDAO 智慧家',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://wuridao.com/logo.png'
        }
      })
      expect(result.datePublished).toBe('2023-01-01T00:00:00Z')
      expect(result.dateModified).toBe('2023-01-02T00:00:00Z')
      expect(result.mainEntityOfPage).toEqual({
        '@type': 'WebPage',
        '@id': 'https://example.com/article'
      })
    })

    it('should handle article without image', () => {
      const article = {
        title: 'Test Article',
        description: 'This is a test article',
        url: 'https://example.com/article',
        publishedAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z'
      }

      const result = generateArticleJsonLd(article)

      expect(result.image).toBeUndefined()
    })
  })

  describe('calculateSeoScore', () => {
    it('should calculate perfect SEO score', () => {
      const content = '<h1>Title</h1><p>This is a very long content with more than 1000 characters. '.repeat(50) + '<img src="image1.jpg"><img src="image2.jpg"><img src="image3.jpg">'
      const title = 'This is a perfect title with exactly 50 characters long'
      const description = 'This is a perfect description with exactly 150 characters long which is optimal for SEO purposes and search engine visibility'

      const score = calculateSeoScore(content, title, description)

      expect(score).toBe(100) // Perfect score
    })

    it('should calculate score for short content', () => {
      const content = '<p>Short content</p>'
      const title = 'Short Title'
      const description = 'Short description'

      const score = calculateSeoScore(content, title, description)

      expect(score).toBeLessThan(100)
      expect(score).toBeGreaterThan(0)
    })

    it('should calculate score without description', () => {
      const content = '<h1>Title</h1><p>Content with some length</p>'
      const title = 'Good Title'

      const score = calculateSeoScore(content, title)

      expect(score).toBeLessThan(100)
      expect(score).toBeGreaterThan(0)
    })

    it('should handle very short title', () => {
      const content = '<p>Content</p>'
      const title = 'Short'
      const description = 'Description'

      const score = calculateSeoScore(content, title, description)

      expect(score).toBeLessThan(50)
    })

    it('should handle content with multiple images', () => {
      const content = '<img src="1.jpg"><img src="2.jpg"><img src="3.jpg"><img src="4.jpg">'
      const title = 'Title with images'
      const description = 'Description'

      const score = calculateSeoScore(content, title, description)

      expect(score).toBeGreaterThanOrEqual(15) // At least image score
    })

    it('should handle content with multiple headings', () => {
      const content = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3><h4>Subsection</h4>'
      const title = 'Title with headings'
      const description = 'Description'

      const score = calculateSeoScore(content, title, description)

      expect(score).toBeGreaterThanOrEqual(15) // At least heading score
    })

    it('should cap score at 100', () => {
      const content = '<h1>Title</h1>'.repeat(100) + '<img src="image.jpg">'.repeat(100) + 'Content '.repeat(1000)
      const title = 'Very long title '.repeat(10)
      const description = 'Very long description '.repeat(20)

      const score = calculateSeoScore(content, title, description)

      expect(score).toBeLessThanOrEqual(100) // Capped at 100
    })
  })
})
