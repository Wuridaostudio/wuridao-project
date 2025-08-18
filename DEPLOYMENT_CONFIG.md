# WURIDAO 部署配置指南

## 環境配置方案

### 方案一：當前 Render 部署（推薦用於開發/測試）

**前端：** `https://wuridao-project.onrender.com`
**後端：** `https://wuridao-backend.onrender.com`

#### 後端環境變數設置：
```env
NODE_ENV=production
FRONTEND_URL=https://wuridao-project.onrender.com
AUTH_COOKIE_DOMAIN=.onrender.com
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-admin-password
DATABASE_URL=your-database-url
```

#### 前端環境變數設置：
```env
NODE_ENV=production
NUXT_PUBLIC_API_BASE_URL=https://wuridao-backend.onrender.com
NUXT_PUBLIC_SITE_URL=https://wuridao-project.onrender.com
```

### 方案二：未來 wuridaostudio.com 正式部署

**前端：** `https://wuridaostudio.com`
**後端：** `https://api.wuridaostudio.com` 或 `https://backend.wuridaostudio.com`

#### 後端環境變數設置：
```env
NODE_ENV=production
FRONTEND_URL=https://wuridaostudio.com
AUTH_COOKIE_DOMAIN=.wuridaostudio.com
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-admin-password
DATABASE_URL=your-database-url
```

#### 前端環境變數設置：
```env
NODE_ENV=production
NUXT_PUBLIC_API_BASE_URL=https://api.wuridaostudio.com
NUXT_PUBLIC_SITE_URL=https://wuridaostudio.com
```

### 方案三：多域名 Cookie 支援（推薦用於過渡期）

**同時支援：**
- `https://wuridao-project.onrender.com`
- `https://wuridaostudio.com`

#### 後端環境變數設置：
```env
NODE_ENV=production
FRONTEND_URL=https://wuridao-project.onrender.com
AUTH_COOKIE_DOMAIN=.onrender.com
ENABLE_MULTI_DOMAIN_COOKIES=true
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-admin-password
DATABASE_URL=your-database-url
```

#### 前端環境變數設置：
```env
NODE_ENV=production
NUXT_PUBLIC_API_BASE_URL=https://wuridao-backend.onrender.com
NUXT_PUBLIC_SITE_URL=https://wuridao-project.onrender.com
```

## 多域名 Cookie 功能

### 工作原理

當啟用 `ENABLE_MULTI_DOMAIN_COOKIES=true` 時：

1. **後端會同時設置兩個 Cookie：**
   - `auth-token` (主要 Cookie) - Domain: `.onrender.com`
   - `auth-token-backup` (備用 Cookie) - Domain: `.wuridaostudio.com`

2. **前端智能選擇：**
   - 優先使用主要 Cookie (`auth-token`)
   - 如果主要 Cookie 不存在，自動使用備用 Cookie (`auth-token-backup`)

3. **無縫切換：**
   - 用戶可以在兩個域名間自由切換
   - 登入狀態會自動保持

### 優勢

- ✅ **無縫遷移**：從 Render 遷移到正式域名時無需重新登入
- ✅ **雙重保障**：即使一個域名有問題，另一個仍可正常使用
- ✅ **用戶友好**：用戶體驗不受影響
- ✅ **靈活配置**：可以隨時啟用或禁用

## 自動配置邏輯

後端會根據 `FRONTEND_URL` 環境變數自動選擇正確的 Cookie Domain：

- 如果 `FRONTEND_URL` 包含 `wuridaostudio.com` → Cookie Domain = `.wuridaostudio.com`
- 否則 → Cookie Domain = `.onrender.com`

## 遷移步驟

### 從 Render 遷移到 wuridaostudio.com

1. **設置域名解析**
   - 將 `wuridaostudio.com` 指向您的主機服務
   - 將 `api.wuridaostudio.com` 指向後端服務

2. **更新環境變數**
   - 後端：設置 `FRONTEND_URL=https://wuridaostudio.com`
   - 前端：設置 `NUXT_PUBLIC_API_BASE_URL=https://api.wuridaostudio.com`

3. **重新部署**
   - 部署後端服務
   - 部署前端服務

4. **測試登入功能**
   - 確認 Cookie Domain 正確設置為 `.wuridaostudio.com`
   - 測試跨域登入是否正常

## 當前問題解決

如果您現在要繼續使用 Render 部署，請：

1. **在 Render 後端服務中設置：**
   ```env
   AUTH_COOKIE_DOMAIN=.onrender.com
   FRONTEND_URL=https://wuridao-project.onrender.com
   ENABLE_MULTI_DOMAIN_COOKIES=true  # 啟用多域名支援
   ```

2. **重新部署後端服務**

3. **測試登入功能**

## 驗證腳本

使用以下腳本驗證配置：

```bash
# 檢查當前配置
node scripts/check-cookie-domain.js

# 測試多域名 Cookie 功能
node scripts/test-multi-domain-cookies.js

# 測試登入功能
node scripts/test-real-admin.js
```

## 注意事項

1. **Cookie Domain 必須與實際域名匹配**
2. **HTTPS 是必需的**（生產環境）
3. **CORS 配置必須包含正確的 origin**
4. **環境變數更改後必須重新部署**
5. **多域名 Cookie 功能是可選的**，可以根據需要啟用

## 故障排除

### 常見問題：

1. **Cookie 無法跨域共享**
   - 檢查 Cookie Domain 設置
   - 確認域名匹配

2. **登入後立即登出**
   - 檢查前端 credentials 設置
   - 確認 CORS 配置

3. **環境變數不生效**
   - 重新部署服務
   - 檢查變數名稱拼寫

4. **多域名 Cookie 不工作**
   - 確認 `ENABLE_MULTI_DOMAIN_COOKIES=true`
   - 檢查前端是否正確讀取備用 Cookie
