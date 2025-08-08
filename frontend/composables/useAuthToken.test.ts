import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubGlobal('useCookie', (name: string, opts: any) => {
  const state = { value: null as string | null }
  return state
})

vi.stubGlobal('computed', (fn: any) => ({ get value() { return fn() } }))

describe('useAuthToken', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.stubGlobal('useCookie', (name: string, opts: any) => {
      const state = { value: null as string | null }
      return state
    })
    vi.stubGlobal('computed', (fn: any) => ({ get value() { return fn() } }))
  })

  it('initial state and setToken', async () => {
    const { useAuthToken } = await import('./useAuthToken')
    const { token, isAuthenticated, setToken } = useAuthToken()

    expect(token.value).toBe(null)
    expect(isAuthenticated.value).toBe(false)

    setToken('abc')
    expect(token.value).toBe('abc')
    expect(isAuthenticated.value).toBe(true)

    setToken(null)
    expect(token.value).toBe(null)
    expect(isAuthenticated.value).toBe(false)
  })
})
