import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test-setup.ts'],
    include: ['**/*.{test,spec}.ts'], // 更寬泛的匹配模式
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './'),
      '@': resolve(__dirname, './'),
      '#imports': resolve(__dirname, './test-stubs/nuxt-imports.ts'),
    },
  },
  define: {
    'process.env.NODE_ENV': '"test"',
  },
})
