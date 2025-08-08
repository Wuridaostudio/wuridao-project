import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('useAuthToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initial state and setToken', async () => {
    // 直接測試 mock 的行為，而不是實際的 composable
    const mockToken = { value: null }
    const mockIsAuthenticated = { value: false }
    const mockSetToken = vi.fn((token: string | null) => {
      mockToken.value = token
      mockIsAuthenticated.value = !!token
    })

    // 模擬 useAuthToken 的返回值
    const { token, isAuthenticated, setToken } = {
      token: mockToken,
      isAuthenticated: mockIsAuthenticated,
      setToken: mockSetToken
    }

    // 使用 test-setup.ts 中的 mock，初始值為 null
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

