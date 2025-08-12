import { describe, it, expect } from 'vitest'
import { parseApiError, useApiError } from './useApiError'

describe('useApiError', () => {
  it('parses various error shapes', () => {
    expect(parseApiError({ data: { message: ['a', 'b'] } })).toEqual(['a', 'b'])
    expect(parseApiError({ message: ['x'] })).toEqual(['x'])
    expect(parseApiError({ data: { message: 'msg' } })).toEqual(['msg'])
    expect(parseApiError({ message: 'm' })).toEqual(['m'])
    expect(parseApiError(null)).toEqual(['發生未知錯誤'])
  })

  it('sets and clears apiError', () => {
    const { apiError, setError, clearError } = useApiError()
    setError('oops')
    expect(apiError.value).toEqual(['oops'])
    setError(['a', 'b'])
    expect(apiError.value).toEqual(['a', 'b'])
    clearError()
    expect(apiError.value).toEqual([])
  })
})


