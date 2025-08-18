# WURIDAO 環境變數檢查清單

## 後端環境變數 (Render Backend Service)

### 必需變數：
```
DATABASE_URL=postgresql://username:password@host:port/database
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here
NODE_ENV=production
```

### 可選變數：
```
FRONTEND_URL=https://wuridao-project.onrender.com
AUTH_COOKIE_DOMAIN=.onrender.com
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
```

## 前端環境變數 (Render Frontend Service)

### 必需變數：
```
NODE_ENV=production
NUXT_PUBLIC_API_BASE_URL=https://wuridao-backend.onrender.com
```

### 可選變數：
```
NUXT_PUBLIC_SITE_URL=https://wuridao-project.onrender.com
```

## 檢查步驟：

1. **登入 Render Dashboard**
2. **選擇後端服務**
3. **進入 Environment 標籤**
4. **檢查以下變數是否存在且正確：**
   - `DATABASE_URL` - 必須是有效的 PostgreSQL 連接字串
   - `ADMIN_USERNAME` - 建議使用 "admin"
   - `ADMIN_PASSWORD` - 至少6個字元，建議使用強密碼
   - `NODE_ENV` - 必須是 "production"

5. **如果缺少任何變數，請添加並重新部署**

## 常見問題：

### 1. DATABASE_URL 格式錯誤
正確格式：`postgresql://username:password@host:port/database`

### 2. ADMIN_PASSWORD 太短
密碼必須至少6個字元

### 3. 環境變數設置後沒有生效
必須重新部署服務才能生效

## 測試步驟：

1. 設置環境變數後重新部署後端
2. 運行診斷腳本：`node scripts/debug-login.js`
3. 如果仍然失敗，檢查 Render 日誌中的錯誤信息
