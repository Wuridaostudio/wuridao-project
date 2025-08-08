# WURIDAO 智慧家 - 內容管理系統

一個現代化的前後端分離內容管理系統，專為智慧家庭相關內容設計。

## 🏗️ 技術架構

### 後端 (NestJS)
- **框架**: NestJS + TypeScript
- **資料庫**: PostgreSQL + TypeORM
- **認證**: JWT + Passport
- **檔案上傳**: Cloudinary
- **API 文檔**: Swagger
- **日誌**: Pino Logger
- **安全**: Helmet, CORS, Rate Limiting

### 前端 (Nuxt 3)
- **框架**: Nuxt 3 + Vue 3 + TypeScript
- **樣式**: Tailwind CSS
- **狀態管理**: Pinia
- **編輯器**: Tiptap
- **UI 組件**: 自定義組件庫
- **SEO**: 結構化資料、meta 標籤

## 🔒 安全性

### 已實作的安全措施
- ✅ JWT 認證授權
- ✅ 速率限制防護
- ✅ 輸入驗證和清理
- ✅ XSS 防護
- ✅ CORS 配置
- ✅ Helmet 安全標頭
- ✅ 檔案上傳安全驗證
- ✅ 環境變數管理

### 環境變數配置
請確保以下環境變數已正確設定：

#### 後端 (.env)
```bash
# 資料庫
DATABASE_URL=postgresql://username:password@localhost:5432/database
USE_SSL=false

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# 管理員帳號
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Unsplash
UNSPLASH_ACCESS_KEY=your-unsplash-access-key

# 前端 URL
FRONTEND_URL=https://your-domain.com
```

#### 前端 (.env)
```bash
# API 基礎 URL
NUXT_PUBLIC_API_BASE_URL=https://your-api-domain.com/api

# 網站 URL
NUXT_PUBLIC_SITE_URL=https://your-domain.com

# Cloudinary (公開)
NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# Unsplash (公開)
NUXT_PUBLIC_UNSPLASH_ACCESS_KEY=your-unsplash-access-key

# 網站資訊
NUXT_PUBLIC_SITE_NAME=WURIDAO 智慧家
NUXT_PUBLIC_SITE_DESCRIPTION=一起探索智慧家庭未來
```

## 🚀 部署指南

### 本地開發

1. **克隆專案**
```bash
git clone https://github.com/your-username/wuridao-project.git
cd wuridao-project
```

2. **後端設定**
```bash
cd backend
npm install
# 設定 .env 檔案
npm run start:dev
```

3. **前端設定**
```bash
cd frontend
npm install
# 設定 .env 檔案
npm run dev
```

### 生產環境部署

#### 後端部署
1. 選擇您偏好的雲端平台 (AWS, Google Cloud, Azure, DigitalOcean 等)
2. 設定 PostgreSQL 資料庫
3. 配置環境變數
4. 部署設定：
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`

#### 前端部署
1. 選擇您偏好的靜態網站託管平台 (Vercel, Netlify, GitHub Pages 等)
2. 連接 GitHub 倉庫
3. 設定環境變數
4. 部署設定：
   - Build Command: `npm run build`
   - Output Directory: `.output/public`

## 📁 專案結構

```
wuridao-project/
├── backend/                 # NestJS 後端
│   ├── src/
│   │   ├── articles/       # 文章管理
│   │   ├── auth/          # 認證授權
│   │   ├── cloudinary/    # 檔案上傳
│   │   ├── categories/    # 分類管理
│   │   ├── tags/          # 標籤管理
│   │   ├── seo/           # SEO 設定
│   │   └── analytics/     # 分析追蹤
│   └── test/              # 測試檔案
├── frontend/               # Nuxt 3 前端
│   ├── components/        # Vue 組件
│   ├── pages/            # 頁面路由
│   ├── stores/           # Pinia 狀態管理
│   └── composables/      # 組合式函數
└── docs/                  # 文檔
```

## 🔧 開發指南

### 程式碼規範
- 使用 TypeScript 進行型別檢查
- 遵循 ESLint 規範
- 使用 Prettier 格式化程式碼
- 撰寫清晰的註解和文檔

### 測試
- 單元測試: `npm run test`
- E2E 測試: `npm run test:e2e`
- 測試覆蓋率: `npm run test:cov`

### 資料庫遷移
```bash
# 生成遷移檔案
npm run migration:generate -- -n MigrationName

# 執行遷移
npm run migration:run

# 回滾遷移
npm run migration:revert
```

## 🛡️ 安全注意事項

### 重要提醒
1. **永遠不要將 .env 檔案上傳到版本控制**
2. **定期更新依賴套件**
3. **使用強密碼和安全的 JWT 密鑰**
4. **定期備份資料庫**
5. **監控系統日誌和錯誤**

### 已排除的檔案
以下檔案已被排除在版本控制之外：
- 所有 `.env` 檔案
- 測試腳本和報告
- 敏感憑證檔案
- 快取和臨時檔案
- 建置輸出檔案

## 📞 支援

如有問題或建議，請聯絡：
- Email: wuridaostudio@gmail.com
- GitHub Issues: [專案 Issues](https://github.com/your-username/wuridao-project/issues)

## 📄 授權

本專案採用 MIT 授權條款。詳見 [LICENSE](LICENSE) 檔案。

---

**⚠️ 安全提醒**: 部署前請確保所有環境變數已正確設定，並移除任何測試檔案和敏感資訊。
