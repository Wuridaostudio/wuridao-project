import { describe, it, expect } from 'vitest'
import { useLoading } from './useLoading'

describe('useLoading', () => {
  it('toggles loading state and message', () => {
    const { startLoading, stopLoading, isLoading, loadingMessage } = useLoading()
    expect(isLoading.value).toBe(false)

    startLoading('k1', 'Loading...')
    expect(isLoading.value).toBe(true)
    expect(loadingMessage.value).toBe('Loading...')

    stopLoading('k1')
    expect(isLoading.value).toBe(false)
    expect(loadingMessage.value).toBe('')
  })
})





