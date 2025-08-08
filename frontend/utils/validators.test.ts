import { describe, it, expect } from 'vitest'
import { validateEmail, validatePassword, isValidFileName, sanitizeFileName, getFileExtension } from './validators'

describe('validators', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('test+tag@example.org')).toBe(true)
      expect(validateEmail('123@456.com')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
      expect(validateEmail('test@example')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('StrongPass123')).toEqual({ valid: true })
      expect(validatePassword('MySecure1')).toEqual({ valid: true })
      expect(validatePassword('Complex@123')).toEqual({ valid: true })
    })

    it('should reject passwords that are too short', () => {
      expect(validatePassword('Short1')).toEqual({
        valid: false,
        message: '密碼至少需要 8 個字元'
      })
    })

    it('should reject passwords without uppercase letters', () => {
      expect(validatePassword('lowercase123')).toEqual({
        valid: false,
        message: '密碼需要包含至少一個大寫字母'
      })
    })

    it('should reject passwords without lowercase letters', () => {
      expect(validatePassword('UPPERCASE123')).toEqual({
        valid: false,
        message: '密碼需要包含至少一個小寫字母'
      })
    })

    it('should reject passwords without numbers', () => {
      expect(validatePassword('NoNumbers')).toEqual({
        valid: false,
        message: '密碼需要包含至少一個數字'
      })
    })

    it('should check multiple requirements in order', () => {
      expect(validatePassword('short')).toEqual({
        valid: false,
        message: '密碼至少需要 8 個字元'
      })
    })
  })

  describe('isValidFileName', () => {
    it('should accept valid file names', () => {
      expect(isValidFileName('test.jpg')).toBe(true)
      expect(isValidFileName('my-file.png')).toBe(true)
      expect(isValidFileName('中文檔案名.txt')).toBe(true)
      expect(isValidFileName('file123.pdf')).toBe(true)
      expect(isValidFileName('My File Name.doc')).toBe(true)
    })

    it('should reject invalid file names', () => {
      expect(isValidFileName('file<>.txt')).toBe(false)
      expect(isValidFileName('file|name.txt')).toBe(false)
      expect(isValidFileName('file:name.txt')).toBe(false)
      expect(isValidFileName('file"name.txt')).toBe(false)
      expect(isValidFileName('file/name.txt')).toBe(false)
      expect(isValidFileName('file\\name.txt')).toBe(false)
    })
  })

  describe('sanitizeFileName', () => {
    it('should sanitize file names correctly', () => {
      expect(sanitizeFileName('test.jpg')).toBe('test')
      expect(sanitizeFileName('my-file.png')).toBe('my-file')
      expect(sanitizeFileName('中文檔案名.txt')).toBe('中文檔案名')
      expect(sanitizeFileName('file with spaces.pdf')).toBe('file_with_spaces')
      expect(sanitizeFileName('file@#$%^&*().doc')).toBe('file')
    })

    it('should handle special characters', () => {
      expect(sanitizeFileName('file<>.txt')).toBe('file')
      expect(sanitizeFileName('file|name.txt')).toBe('filename')
      expect(sanitizeFileName('file:name.txt')).toBe('filename')
    })

    it('should limit length to 50 characters', () => {
      const longName = 'a'.repeat(60) + '.txt'
      expect(sanitizeFileName(longName).length).toBeLessThanOrEqual(50)
    })

    it('should handle empty string', () => {
      expect(sanitizeFileName('')).toBe('')
    })

    it('should handle file without extension', () => {
      expect(sanitizeFileName('filename')).toBe('filename')
    })
  })

  describe('getFileExtension', () => {
    it('should extract file extensions correctly', () => {
      expect(getFileExtension('test.jpg')).toBe('jpg')
      expect(getFileExtension('document.pdf')).toBe('pdf')
      expect(getFileExtension('image.png')).toBe('png')
      expect(getFileExtension('video.mp4')).toBe('mp4')
    })

    it('should handle files with multiple dots', () => {
      expect(getFileExtension('file.backup.txt')).toBe('txt')
      expect(getFileExtension('archive.tar.gz')).toBe('gz')
    })

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('')).toBe('')
    })

    it('should handle files starting with dot', () => {
      expect(getFileExtension('.hidden')).toBe('hidden')
    })
  })
})
