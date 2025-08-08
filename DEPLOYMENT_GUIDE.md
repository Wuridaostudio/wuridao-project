# 多服務器部署指南

## 架構概述

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端服務器     │    │   後端服務器     │    │   資料庫服務器   │
│   (Nuxt 3)      │◄──►│   (NestJS)      │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ - 靜態檔案      │    │ - API 服務      │    │ - 資料存儲      │
│ - SSR 渲染      │    │ - 認證服務      │    │ - 事務處理      │
│ - CDN 加速      │    │ - 檔案上傳      │    │ - 備份恢復      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 1. 環境變數配置

### 後端環境變數 (.env)

```bash
# 基本配置
NODE_ENV=production
PORT=3000

# 資料庫配置
DATABASE_URL=postgresql://username:password@your-db-server.com:5432/wuridao_db
USE_SSL=true

# 前端配置 (CORS)
FRONTEND_URL=https://your-frontend-domain.com

# JWT 認證
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# 其他服務
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
SENTRY_DSN=your-sentry-dsn
```

### 前端環境變數 (.env)

```bash
# API 配置
NUXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com/api
NUXT_PUBLIC_SITE_URL=https://your-frontend-domain.com

# Cloudinary
NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# 其他
NUXT_PUBLIC_SITE_NAME=WURIDAO 智慧家
NUXT_PUBLIC_SITE_DESCRIPTION=一起探索智慧家庭未來
```

## 2. 服務器配置

### 前端服務器 (Nuxt 3)

```bash
# 安裝依賴
npm install

# 建置生產版本
npm run build

# 啟動服務器
npm run start
```

**推薦部署平台：**
- Vercel
- Netlify
- AWS S3 + CloudFront
- Google Cloud Storage + CDN

### 後端服務器 (NestJS)

```bash
# 安裝依賴
npm install

# 建置
npm run build

# 啟動
npm run start:prod
```

**推薦部署平台：**
- AWS EC2
- Google Cloud Compute Engine
- Azure Virtual Machines
- DigitalOcean Droplets
- Heroku

### 資料庫服務器 (PostgreSQL)

**推薦選項：**
- AWS RDS
- Google Cloud SQL
- Azure Database for PostgreSQL
- DigitalOcean Managed Databases
- 自建 PostgreSQL 服務器

## 3. 網路配置

### CORS 配置

後端已經配置了 CORS：

```typescript
app.enableCors({
  origin: [process.env.FRONTEND_URL || 'https://wuridaostudio.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### SSL/TLS 配置

1. **前端**：使用 HTTPS
2. **後端**：使用 HTTPS
3. **資料庫**：使用 SSL 連接

### 防火牆配置

```bash
# 前端服務器
- 開放端口：80, 443 (HTTP/HTTPS)

# 後端服務器
- 開放端口：3000 (API)
- 限制來源：只允許前端服務器 IP

# 資料庫服務器
- 開放端口：5432 (PostgreSQL)
- 限制來源：只允許後端服務器 IP
```

## 4. 安全性配置

### 環境變數安全

```bash
# 使用環境變數管理工具
- AWS Systems Manager Parameter Store
- Google Cloud Secret Manager
- Azure Key Vault
- HashiCorp Vault
```

### 資料庫安全

```sql
-- 創建專用用戶
CREATE USER wuridao_user WITH PASSWORD 'strong_password';

-- 限制權限
GRANT CONNECT ON DATABASE wuridao_db TO wuridao_user;
GRANT USAGE ON SCHEMA public TO wuridao_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO wuridao_user;
```

### API 安全

```typescript
// 速率限制
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 1000,
    limit: 10,
  },
  {
    name: 'medium',
    ttl: 10000,
    limit: 20,
  },
  {
    name: 'long',
    ttl: 60000,
    limit: 100,
  },
])
```

## 5. 監控和日誌

### 應用監控

```typescript
// 健康檢查端點
@Get('api/health')
async healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
```

### 日誌配置

```typescript
// 使用 Pino 日誌
LoggerModule.forRoot({
  pinoHttp: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV !== 'production' ? {
      target: 'pino-pretty',
      options: { colorize: true },
    } : undefined,
  },
})
```

## 6. 備份策略

### 資料庫備份

```bash
# 自動備份腳本
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 檔案備份

```bash
# 備份上傳的檔案
aws s3 sync /uploads s3://your-backup-bucket/uploads
```

## 7. 部署檢查清單

### 前端部署

- [ ] 環境變數配置正確
- [ ] API 基礎 URL 指向正確的後端
- [ ] HTTPS 證書配置
- [ ] CDN 配置（可選）
- [ ] 錯誤監控配置

### 後端部署

- [ ] 環境變數配置正確
- [ ] 資料庫連接正常
- [ ] CORS 配置正確
- [ ] SSL 證書配置
- [ ] 防火牆規則配置
- [ ] 日誌配置正確

### 資料庫部署

- [ ] PostgreSQL 安裝和配置
- [ ] 資料庫用戶和權限配置
- [ ] SSL 連接配置
- [ ] 備份策略配置
- [ ] 監控配置

## 8. 故障排除

### 常見問題

1. **CORS 錯誤**
   - 檢查 `FRONTEND_URL` 配置
   - 確認後端 CORS 配置正確

2. **資料庫連接失敗**
   - 檢查 `DATABASE_URL` 格式
   - 確認網路連接和防火牆規則

3. **API 請求失敗**
   - 檢查 API 基礎 URL 配置
   - 確認後端服務器運行狀態

4. **檔案上傳失敗**
   - 檢查 Cloudinary 配置
   - 確認檔案大小限制

## 9. 性能優化

### 前端優化

- 使用 CDN 加速靜態資源
- 啟用 Gzip 壓縮
- 配置適當的快取策略

### 後端優化

- 使用 Redis 快取（可選）
- 配置資料庫連接池
- 啟用 API 響應壓縮

### 資料庫優化

- 配置適當的索引
- 定期清理舊數據
- 監控查詢性能

## 10. 擴展性考慮

### 水平擴展

- 使用負載均衡器
- 配置多個後端實例
- 使用資料庫讀取副本

### 垂直擴展

- 增加服務器資源
- 優化應用程式代碼
- 使用更高效的資料庫查詢
