import { describe, it, expect } from 'vitest'

describe('Basic Test', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle string operations', () => {
    const text = 'Hello World'
    expect(text.length).toBe(11)
    expect(text.toUpperCase()).toBe('HELLO WORLD')
  })

  it('should handle array operations', () => {
    const arr = [1, 2, 3, 4, 5]
    expect(arr.length).toBe(5)
    expect(arr.map(x => x * 2)).toEqual([2, 4, 6, 8, 10])
  })
})
