# 前端日誌系統

## 概述

WURIDAO 項目實現了一個統一的前端日誌系統，支持將前端日誌發送到後端進行統一管理和查看。這個系統特別適用於生產環境中的問題診斷和用戶行為分析。

## 功能特點

### 🔍 統一日誌管理
- 統一的前端日誌工具 (`frontend/utils/logger.ts`)
- 支持不同級別的日誌：`debug`、`info`、`warn`、`error`
- 自動添加時間戳、環境信息、用戶代理等元數據

### 📱 後端日誌接收
- 後端提供專門的日誌接收端點
- 支持單條日誌和批量日誌發送
- 日誌在後端統一顯示，便於問題診斷

### 🚀 智能日誌發送
- 開發環境：日誌僅在瀏覽器控制台顯示
- 生產環境：重要日誌（warn、error）自動發送到後端
- 頁面卸載前自動發送所有緩存的日誌

### 🎯 專門的日誌方法
- `logger.auth()` - 認證相關日誌
- `logger.api()` - API 請求相關日誌
- `logger.cookie()` - Cookie 操作相關日誌
- `logger.route()` - 路由相關日誌

## 使用方法

### 基本用法

```typescript
import { logger } from '~/utils/logger'

// 不同級別的日誌
logger.debug('調試信息', { data: 'debug data' })
logger.info('一般信息', { data: 'info data' })
logger.warn('警告信息', { data: 'warning data' })
logger.error('錯誤信息', { data: 'error data' })

// 專門的日誌方法
logger.auth('用戶登入', { username: 'admin' })
logger.api('API 請求', { url: '/api/users' })
logger.cookie('Cookie 設置', { name: 'auth-token' })
logger.route('路由跳轉', { from: '/login', to: '/admin' })
```

### 在組件中使用

```vue
<script setup>
import { logger } from '~/utils/logger'

// 頁面加載時記錄
onMounted(() => {
  logger.route('頁面加載', {
    url: window.location.href,
    userAgent: navigator.userAgent,
  })
})

// 用戶操作記錄
const handleClick = () => {
  logger.info('用戶點擊按鈕', {
    buttonId: 'submit',
    timestamp: new Date().toISOString(),
  })
}
</script>
```

### 在 Store 中使用

```typescript
// stores/auth.ts
import { logger } from '~/utils/logger'

export const useAuthStore = defineStore('auth', {
  actions: {
    async login(credentials) {
      logger.auth('開始登入流程', {
        username: credentials.username,
        environment: process.env.NODE_ENV,
      })
      
      try {
        // 登入邏輯...
        logger.auth('登入成功', { userId: user.id })
      } catch (error) {
        logger.error('登入失敗', { error: error.message })
      }
    }
  }
})
```

## 後端日誌端點

### 單條日誌端點
```
POST /api/logs/frontend
```

請求體：
```json
{
  "level": "info",
  "message": "日誌消息",
  "data": { "key": "value" },
  "timestamp": "2025-08-19T11:52:09.206Z",
  "component": "Auth",
  "environment": "production",
  "userAgent": "Mozilla/5.0...",
  "url": "https://example.com"
}
```

### 批量日誌端點
```
POST /api/logs/frontend/batch
```

請求體：
```json
{
  "logs": [
    {
      "level": "info",
      "message": "日誌 1",
      "data": { "key": "value" },
      "timestamp": "2025-08-19T11:52:09.206Z",
      "component": "Auth",
      "environment": "production"
    },
    {
      "level": "error",
      "message": "日誌 2",
      "data": { "error": "details" },
      "timestamp": "2025-08-19T11:52:10.206Z",
      "component": "API",
      "environment": "production"
    }
  ]
}
```

## 日誌格式

### 日誌條目結構
```typescript
interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  data?: any
  timestamp: string
  component: string
  environment: string
  userAgent?: string
  url?: string
}
```

### 後端日誌輸出格式
```
📱 [前端日誌] [Auth] [INFO] 用戶登入 { username: 'admin', environment: 'production' }
📱 [前端日誌] [API] [ERROR] API 請求失敗 { status: 401, url: '/api/auth/login' }
```

## 配置選項

### 日誌隊列大小
```typescript
// frontend/utils/logger.ts
private maxQueueSize = 100 // 最大緩存日誌數量
```

### 自動發送條件
```typescript
// 生產環境中，warn 和 error 級別的日誌會立即發送
if (this.isProduction && (logEntry.level === 'error' || logEntry.level === 'warn')) {
  this.sendLogToBackend(logEntry)
}
```

## 測試

### 運行日誌系統測試
```bash
node scripts/test-frontend-logging.js
```

### 測試內容
- 後端日誌端點可用性
- 單條日誌發送
- 批量日誌發送
- 前端日誌整合測試

## 最佳實踐

### 1. 日誌級別使用
- `debug`: 詳細的調試信息，僅開發環境
- `info`: 一般信息，用戶操作記錄
- `warn`: 警告信息，潛在問題
- `error`: 錯誤信息，需要關注的問題

### 2. 日誌內容
- 包含足夠的上下文信息
- 避免記錄敏感信息（密碼、token 等）
- 使用結構化數據而不是純文本

### 3. 性能考慮
- 避免在高頻操作中記錄過多日誌
- 使用批量發送減少網絡請求
- 在頁面卸載前自動發送緩存日誌

### 4. 錯誤處理
- 日誌發送失敗不應影響主要功能
- 在開發環境中顯示發送錯誤
- 生產環境中靜默處理發送失敗

## 故障排除

### 日誌沒有發送到後端
1. 檢查後端日誌端點是否正常運行
2. 檢查 CORS 配置
3. 檢查網絡連接
4. 查看瀏覽器控制台錯誤

### 日誌格式錯誤
1. 確保日誌條目符合 `LogEntry` 接口
2. 檢查時間戳格式
3. 確保必填字段都已提供

### 性能問題
1. 減少日誌頻率
2. 調整日誌隊列大小
3. 使用批量發送
4. 過濾不必要的日誌

## 相關文件

- `frontend/utils/logger.ts` - 前端日誌工具
- `backend/src/logs/` - 後端日誌接收模組
- `scripts/test-frontend-logging.js` - 日誌系統測試腳本
- `frontend/composables/useAuthToken.ts` - 認證 Token 日誌示例
- `frontend/stores/auth.ts` - 認證 Store 日誌示例
- `frontend/pages/admin/login.vue` - 登入頁面日誌示例
