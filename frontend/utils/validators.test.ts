import { describe, it, expect } from 'vitest'
import { validateEmail, validatePassword, isValidFileName, sanitizeFileName, getFileExtension } from './validators'

describe('validators', () => {
  it('validates email', () => {
    expect(validateEmail('a@b.com')).toBe(true)
    expect(validateEmail('bad@bad')).toBe(false)
  })

  it('validates password rules', () => {
    expect(validatePassword('Short')).toEqual({ valid: false, message: '密碼至少需要 8 個字元' })
    expect(validatePassword('lowercase8')).toEqual({ valid: false, message: '密碼需要包含至少一個大寫字母' })
    expect(validatePassword('UPPERCASE8')).toEqual({ valid: false, message: '密碼需要包含至少一個小寫字母' })
    expect(validatePassword('NoNumberAA')).toEqual({ valid: false, message: '密碼需要包含至少一個數字' })
    expect(validatePassword('ValidPass9')).toEqual({ valid: true })
  })

  it('validates and sanitizes file name', () => {
    expect(isValidFileName('測試 檔案-1.png')).toBe(true)
    expect(isValidFileName('bad@name!.png')).toBe(false)

    expect(sanitizeFileName('測試@檔案!.jpg')).toMatch(/測試檔案/)
  })

  it('gets file extension', () => {
    expect(getFileExtension('a.jpg')).toBe('jpg')
    expect(getFileExtension('noext')).toBe('noext')
  })
})
