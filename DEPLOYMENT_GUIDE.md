# WURIDAO 部署指南

## 快速部署檢查清單

### 🔧 後端部署 (Render)

#### 1. 環境變數設置

在 Render 後端服務的環境變數中添加：

```bash
# 必要配置
NODE_ENV=production
AUTH_COOKIE_DOMAIN=.onrender.com
FRONTEND_URL=https://wuridao-project.onrender.com

# 資料庫配置
DATABASE_URL=your-postgresql-connection-string
USE_SSL=true

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# 管理員帳號
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# 其他服務配置
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
UNSPLASH_ACCESS_KEY=your-unsplash-key
```

#### 2. 構建命令

```bash
npm install
npm run build
npm run start:prod
```

#### 3. 啟動命令

```bash
npm run start:prod
```

### 🌐 前端部署 (Render)

#### 1. 環境變數設置

在 Render 前端服務的環境變數中添加：

```bash
# 必要配置
NODE_ENV=production
NUXT_PUBLIC_API_BASE_URL=https://wuridao-backend.onrender.com
NUXT_PUBLIC_SITE_URL=https://wuridao-project.onrender.com

# 網站資訊
NUXT_PUBLIC_SITE_NAME=WURIDAO 智慧家
NUXT_PUBLIC_SITE_DESCRIPTION=一起探索智慧家庭未來

# 第三方服務（公開資訊）
NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NUXT_PUBLIC_UNSPLASH_ACCESS_KEY=your-unsplash-key
```

#### 2. 構建命令

```bash
npm install
npm run build
```

#### 3. 啟動命令

```bash
npm run start
```

## 🔍 部署驗證

### 1. 運行配置檢查

```bash
node scripts/check-cookie-config.js
```

### 2. 手動測試流程

1. **訪問前端網站**
   - 確認 https://wuridao-project.onrender.com 可以正常訪問

2. **測試登入功能**
   - 訪問管理後台登入頁面
   - 使用管理員帳號登入
   - 確認登入成功且不會立即被登出

3. **檢查 Cookie 設置**
   - 打開瀏覽器開發者工具
   - 進入 Application > Cookies
   - 確認 `auth-token` cookie 存在且 Domain 為 `.onrender.com`

4. **測試 API 請求**
   - 在 Network 標籤中檢查 API 請求
   - 確認請求包含正確的 Authorization 標頭
   - 確認 CORS 預檢請求成功

## 🚨 常見問題解決

### 問題 1: 登入後立即被登出

**原因**: Cookie Domain 配置不正確

**解決方案**:
1. 確認後端環境變數 `AUTH_COOKIE_DOMAIN=.onrender.com`
2. 確認前端環境變數 `NODE_ENV=production`
3. 重新部署後端服務

### 問題 2: 跨域請求失敗

**原因**: CORS 配置不正確

**解決方案**:
1. 確認後端 CORS 配置包含正確的 origin
2. 確認前端請求包含 `credentials: 'include'`
3. 檢查瀏覽器 Console 中的錯誤訊息

### 問題 3: Cookie 沒有設置 Domain

**原因**: 環境變數未正確設置

**解決方案**:
1. 在 Render 後端服務中設置 `AUTH_COOKIE_DOMAIN=.onrender.com`
2. 重新部署後端服務
3. 清除瀏覽器 Cookie 後重新測試

### 問題 4: 前端無法連接到後端

**原因**: API URL 配置錯誤

**解決方案**:
1. 確認前端環境變數 `NUXT_PUBLIC_API_BASE_URL=https://wuridao-backend.onrender.com`
2. 重新部署前端服務
3. 檢查網路連接和防火牆設置

## 🔒 安全配置

### 1. HTTPS 強制

- 生產環境自動使用 HTTPS
- Cookie 設置 `Secure: true`
- 所有 API 請求使用 HTTPS

### 2. CORS 安全

- 只允許特定 origin
- 設置 `Access-Control-Allow-Credentials: true`
- 限制允許的 HTTP 方法

### 3. Cookie 安全

- 設置 `SameSite: lax` 防止 CSRF
- 設置適當的 `MaxAge`
- 使用環境變數管理敏感資訊

### 4. JWT 安全

- 使用強密碼作為 JWT_SECRET
- 設置適當的過期時間
- 在生產環境中定期更換密鑰

## 📊 監控和日誌

### 1. 後端日誌

- 記錄所有登入嘗試
- 記錄 API 錯誤
- 監控資料庫連接狀態

### 2. 前端監控

- 監控 API 請求成功率
- 記錄用戶行為錯誤
- 監控頁面載入效能

### 3. 健康檢查

- 定期檢查服務可用性
- 監控資料庫連接
- 檢查第三方服務狀態

## 🔄 更新部署

### 1. 後端更新

1. 推送代碼到 Git 倉庫
2. Render 自動觸發重新部署
3. 檢查部署日誌確認成功
4. 運行配置檢查腳本

### 2. 前端更新

1. 推送代碼到 Git 倉庫
2. Render 自動觸發重新部署
3. 檢查部署日誌確認成功
4. 手動測試關鍵功能

### 3. 資料庫遷移

1. 在本地測試遷移腳本
2. 備份生產資料庫
3. 執行遷移腳本
4. 驗證資料完整性

## 📞 支援

如果遇到部署問題：

1. **檢查日誌**: 查看 Render 部署日誌
2. **運行檢查腳本**: `node scripts/check-cookie-config.js`
3. **檢查環境變數**: 確認所有必要變數已設置
4. **清除快取**: 清除瀏覽器快取和 Cookie
5. **重新部署**: 觸發服務重新部署

## 📝 備註

- 所有敏感資訊都存儲在環境變數中
- 定期更新依賴套件以修復安全漏洞
- 監控服務使用量和效能
- 定期備份資料庫
- 保持開發和生產環境的一致性
