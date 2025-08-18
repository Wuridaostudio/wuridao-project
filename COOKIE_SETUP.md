# WURIDAO Cookie 跨域配置指南

## 概述

本指南說明如何正確配置 WURIDAO 專案的前後端 Cookie Domain，以確保在 Render 部署環境中的安全跨域登入。

## 部署架構

- **前端**: https://wuridao-project.onrender.com
- **後端**: https://wuridao-backend.onrender.com

## 配置步驟

### 1. 後端環境變數配置

在後端的 `.env` 文件中添加以下配置：

```bash
# Cookie Domain 配置（用於跨域登入）
AUTH_COOKIE_DOMAIN=.onrender.com

# 前端 URL 配置（用於 CORS）
FRONTEND_URL=https://wuridao-project.onrender.com

# 環境配置
NODE_ENV=production
```

### 2. 前端環境變數配置

在前端的 `.env` 文件中添加以下配置：

```bash
# 環境配置
NODE_ENV=production

# API 配置
NUXT_PUBLIC_API_BASE_URL=https://wuridao-backend.onrender.com

# 網站 URL 配置
NUXT_PUBLIC_SITE_URL=https://wuridao-project.onrender.com
```

### 3. Render 環境變數設置

#### 後端服務環境變數

在 Render 後端服務的環境變數中設置：

```
AUTH_COOKIE_DOMAIN=.onrender.com
FRONTEND_URL=https://wuridao-project.onrender.com
NODE_ENV=production
```

#### 前端服務環境變數

在 Render 前端服務的環境變數中設置：

```
NODE_ENV=production
NUXT_PUBLIC_API_BASE_URL=https://wuridao-backend.onrender.com
NUXT_PUBLIC_SITE_URL=https://wuridao-project.onrender.com
```

## 技術細節

### Cookie Domain 設置

- **生產環境**: 設置為 `.onrender.com`，支援所有 onrender.com 子域名
- **開發環境**: 不設置 domain，使用預設的 host-only cookie

### CORS 配置

後端已配置支援以下 origin：
- `https://wuridao-project.onrender.com`
- `https://wuridaostudio.com`
- `http://localhost:3001` (開發環境)

### 安全設置

- **Secure**: 生產環境強制 HTTPS
- **SameSite**: 設置為 `lax` 防止 CSRF 攻擊
- **HttpOnly**: 設置為 `false` 允許前端 JavaScript 讀取

## 驗證配置

### 使用檢查腳本

運行配置檢查腳本：

```bash
node scripts/check-cookie-config.js
```

### 手動測試

1. 訪問前端網站
2. 嘗試登入管理後台
3. 檢查瀏覽器開發者工具的 Network 和 Application 標籤
4. 確認 Cookie 正確設置且包含正確的 Domain

## 常見問題

### Q: 登入後立即被登出？

**A**: 檢查以下配置：
- 確保 `AUTH_COOKIE_DOMAIN=.onrender.com` 已設置
- 確保 `NODE_ENV=production` 已設置
- 確保 CORS 配置正確

### Q: Cookie 沒有設置 Domain？

**A**: 檢查後端環境變數 `AUTH_COOKIE_DOMAIN` 是否正確設置為 `.onrender.com`

### Q: 跨域請求失敗？

**A**: 檢查以下配置：
- 確保前端請求包含 `credentials: 'include'`
- 確保後端 CORS 配置包含正確的 origin
- 確保 `Access-Control-Allow-Credentials: true`

### Q: 開發環境無法登入？

**A**: 開發環境使用預設的 host-only cookie，確保：
- 前端和後端使用相同的 localhost 端口
- 或者設置正確的開發環境 domain

## 部署檢查清單

- [ ] 後端環境變數 `AUTH_COOKIE_DOMAIN=.onrender.com` 已設置
- [ ] 後端環境變數 `FRONTEND_URL` 已設置
- [ ] 前端環境變數 `NODE_ENV=production` 已設置
- [ ] 前端環境變數 `NUXT_PUBLIC_API_BASE_URL` 已設置
- [ ] CORS 配置正確
- [ ] 所有請求都包含 `credentials: 'include'`
- [ ] 運行配置檢查腳本確認設置正確

## 安全注意事項

1. **HTTPS 強制**: 生產環境必須使用 HTTPS
2. **SameSite 設置**: 使用 `lax` 防止 CSRF 攻擊
3. **Domain 限制**: 只設置必要的 domain 範圍
4. **環境變數**: 敏感資訊只存儲在環境變數中
5. **日誌記錄**: 記錄登入嘗試和錯誤

## 支援

如果遇到問題，請檢查：
1. 瀏覽器開發者工具的 Console 和 Network 標籤
2. 後端服務日誌
3. 運行配置檢查腳本
4. 確認所有環境變數已正確設置
