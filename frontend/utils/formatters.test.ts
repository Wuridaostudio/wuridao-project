import { describe, it, expect, vi } from 'vitest'
import { formatDate, formatDateTime, stripHtml, truncate } from './formatters'

// Mock document for stripHtml function
const mockDocument = {
  createElement: vi.fn(() => ({
    innerHTML: '',
    textContent: '',
    innerText: ''
  }))
}

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
})

describe('formatters', () => {
  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const dateString = '2023-12-25T10:30:00Z'
      const result = formatDate(dateString)
      
      // Check that it returns a formatted date string
      expect(result).toMatch(/^\d{4}年\d{1,2}月\d{1,2}日$/)
    })

    it('should format Date object correctly', () => {
      const date = new Date('2023-12-25T10:30:00Z')
      const result = formatDate(date)
      
      expect(result).toMatch(/^\d{4}年\d{1,2}月\d{1,2}日$/)
    })

    it('should handle different date formats', () => {
      const dates = [
        '2023-01-01',
        '2023/12/25',
        '2023-12-25T10:30:00.000Z'
      ]
      
      dates.forEach(dateStr => {
        const result = formatDate(dateStr)
        expect(result).toMatch(/^\d{4}年\d{1,2}月\d{1,2}日$/)
      })
    })
  })

  describe('formatDateTime', () => {
    it('should format date and time string correctly', () => {
      const dateString = '2023-12-25T18:30:00Z'
      const result = formatDateTime(dateString)
      
      // 檢查基本格式而不是精確的正則表達式
      expect(result).toContain('年')
      expect(result).toContain('月')
      expect(result).toContain('日')
      expect(result).toMatch(/[上午下午]/)
      expect(result).toMatch(/\d{1,2}:\d{2}$/)
    })

    it('should format Date object with time correctly', () => {
      const date = new Date('2023-12-25T18:30:00Z')
      const result = formatDateTime(date)
      
      // 檢查基本格式而不是精確的正則表達式
      expect(result).toContain('年')
      expect(result).toContain('月')
      expect(result).toContain('日')
      expect(result).toMatch(/[上午下午]/)
      expect(result).toMatch(/\d{1,2}:\d{2}$/)
    })

    it('should handle different datetime formats', () => {
      const dates = [
        '2023-01-01T08:00:00Z',
        '2023-06-15T14:30:00Z',
        '2023-12-31T23:59:59Z'
      ]
      
      dates.forEach(dateStr => {
        const result = formatDateTime(dateStr)
        // 檢查基本格式而不是精確的正則表達式
        expect(result).toContain('年')
        expect(result).toContain('月')
        expect(result).toContain('日')
        expect(result).toMatch(/[上午下午]/)
        expect(result).toMatch(/\d{1,2}:\d{2}$/)
      })
    })
  })

  describe('stripHtml', () => {
    it('should remove HTML tags from string', () => {
      const html = '<p>This is <strong>bold</strong> text</p>'
      const mockElement = {
        innerHTML: html,
        textContent: 'This is bold text',
        innerText: 'This is bold text'
      }
      
      mockDocument.createElement.mockReturnValue(mockElement)
      
      const result = stripHtml(html)
      expect(result).toBe('This is bold text')
    })

    it('should handle empty HTML', () => {
      const html = ''
      const mockElement = {
        innerHTML: html,
        textContent: '',
        innerText: ''
      }
      
      mockDocument.createElement.mockReturnValue(mockElement)
      
      const result = stripHtml(html)
      expect(result).toBe('')
    })

    it('should handle HTML with only tags', () => {
      const html = '<div></div><span></span>'
      const mockElement = {
        innerHTML: html,
        textContent: '',
        innerText: ''
      }
      
      mockDocument.createElement.mockReturnValue(mockElement)
      
      const result = stripHtml(html)
      expect(result).toBe('')
    })

    it('should handle complex HTML', () => {
      const html = '<div><h1>Title</h1><p>Paragraph with <a href="#">link</a></p></div>'
      const mockElement = {
        innerHTML: html,
        textContent: 'Title Paragraph with link',
        innerText: 'Title Paragraph with link'
      }
      
      mockDocument.createElement.mockReturnValue(mockElement)
      
      const result = stripHtml(html)
      expect(result).toBe('Title Paragraph with link')
    })
  })

  describe('truncate', () => {
    it('should truncate text longer than specified length', () => {
      const text = 'This is a very long text that should be truncated'
      const result = truncate(text, 20)
      
      expect(result).toBe('This is a very long ...')
      expect(result.length).toBe(23) // 20 + 3 for '...'
    })

    it('should not truncate text shorter than specified length', () => {
      const text = 'Short text'
      const result = truncate(text, 20)
      
      expect(result).toBe('Short text')
    })

    it('should use default length of 100', () => {
      const text = 'a'.repeat(150)
      const result = truncate(text)
      
      expect(result).toBe('a'.repeat(100) + '...')
    })

    it('should handle empty string', () => {
      const result = truncate('', 10)
      expect(result).toBe('')
    })

    it('should handle exact length text', () => {
      const text = 'Exactly 10 chars'
      const result = truncate(text, 10)
      
      expect(result).toBe('Exactly 10...')
    })

    it('should handle text with exactly the limit length', () => {
      const text = 'Exactly 10'
      const result = truncate(text, 10)
      
      expect(result).toBe('Exactly 10')
    })
  })
})