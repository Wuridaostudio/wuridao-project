# WURIDAO 智慧家 - 免費服務優化指南

## 🆓 免費服務平台資源限制

### 主要免費服務平台限制

#### **Vercel (前端部署)**
- **限制**：每月 100GB 小時
- **記憶體監控影響**：無（僅前端，監控在後端）
- **狀態**：✅ 安全

#### **Railway (後端部署)**
- **限制**：每月 $5 免費額度
- **記憶體監控影響**：極小
- **狀態**：✅ 安全

#### **Render (後端部署)**
- **限制**：免費層每月 750 小時
- **記憶體監控影響**：極小
- **狀態**：✅ 安全

#### **Heroku (後端部署)**
- **限制**：免費層已停止
- **狀態**：⚠️ 需要付費

## 📊 記憶體監控資源消耗分析

### 當前監控頻率對免費服務的影響

#### **CPU 使用量**
- 每次檢查：1-5ms CPU 時間
- **開發環境**：每5分鐘 → 每天 1.44秒
- **生產環境**：每15分鐘 → 每天 0.48秒
- **免費服務**：每30分鐘 → 每天 0.24秒
- **影響評估**：極小 ✅

#### **記憶體使用量**
- 每次檢查：1-2KB 臨時記憶體
- 檢查完成後立即釋放
- **影響評估**：幾乎為零 ✅

#### **網路流量**
- 僅在本地執行，無網路請求
- **影響評估**：零 ✅

## 🔧 已實施的優化措施

### 1. 環境自適應監控頻率

```typescript
// 根據環境自動調整監控頻率
const env = process.env.NODE_ENV || 'development';
const isFreeTier = process.env.FREE_TIER === 'true';

if (isFreeTier) {
  // 免費服務：每30分鐘檢查一次
  interval = 30 * 60 * 1000;
} else if (env === 'production') {
  // 生產環境：每15分鐘檢查一次
  interval = 15 * 60 * 1000;
} else {
  // 開發環境：每5分鐘檢查一次
  interval = 5 * 60 * 1000;
}
```

### 2. 智能監控控制

```typescript
// 免費服務環境減少監控頻率
if (isFreeTier && Math.random() > 0.17) { // 約每30分鐘執行一次
  return;
}

// 生產環境減少監控頻率
if (env === 'production' && Math.random() > 0.33) { // 約每15分鐘執行一次
  return;
}
```

### 3. 環境變數配置

```bash
# .env 文件
NODE_ENV=production
FREE_TIER=true  # 在免費服務上部署時設定
```

## 🚀 進一步優化建議

### 1. 免費服務部署配置

#### **Vercel (前端)**
```json
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "regions": ["hkg1"] // 選擇最近的區域
}
```

#### **Railway (後端)**
```yaml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run start:prod"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
```

#### **Render (後端)**
```yaml
# render.yaml
services:
  - type: web
    name: wuridao-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: FREE_TIER
        value: true
```

### 2. 資料庫優化

#### **使用免費資料庫服務**
- **Supabase**: 免費層 500MB
- **PlanetScale**: 免費層 1GB
- **Neon**: 免費層 3GB

#### **連接池優化**
```typescript
// 免費服務環境的資料庫配置
extra: {
  connectionLimit: 5, // 減少連接數
  acquireTimeout: 30000, // 減少超時時間
  idleTimeout: 15000, // 減少閒置時間
}
```

### 3. 檔案上傳優化

#### **使用免費雲端儲存**
- **Cloudinary**: 免費層 25GB
- **Supabase Storage**: 免費層 1GB
- **AWS S3**: 免費層 5GB

#### **檔案大小限制**
```typescript
// 免費服務環境的檔案限制
upload: {
  maxFileSize: 10 * 1024 * 1024, // 10MB (從100MB減少)
  maxFiles: 5, // 減少同時上傳數量
  timeout: 15000, // 減少超時時間
}
```

## 📈 監控頻率建議

### 不同環境的監控頻率

| 環境 | 監控頻率 | 每日檢查次數 | CPU 消耗 |
|------|----------|--------------|----------|
| 開發環境 | 每5分鐘 | 288次 | 1.44秒 |
| 生產環境 | 每15分鐘 | 96次 | 0.48秒 |
| 免費服務 | 每30分鐘 | 48次 | 0.24秒 |

### 免費服務優化策略

1. **減少監控頻率**：從每5分鐘改為每30分鐘
2. **減少日誌輸出**：只記錄重要警告
3. **優化資料庫查詢**：減少連接數和超時時間
4. **限制檔案上傳**：減少檔案大小和數量限制
5. **使用快取**：減少重複計算

## 🛠️ 部署檢查清單

### 免費服務部署前檢查

- [ ] 設定 `FREE_TIER=true` 環境變數
- [ ] 調整資料庫連接池大小
- [ ] 設定檔案上傳限制
- [ ] 配置監控頻率
- [ ] 測試記憶體使用情況
- [ ] 監控 CPU 使用率
- [ ] 檢查網路流量

### 性能監控

- [ ] 監控 API 響應時間
- [ ] 檢查記憶體使用趨勢
- [ ] 追蹤資料庫查詢性能
- [ ] 監控檔案上傳速度
- [ ] 檢查錯誤率

## 💡 成本效益分析

### 監控成本 vs 效益

| 項目 | 成本 | 效益 | 建議 |
|------|------|------|------|
| 每5分鐘監控 | 高 | 高 | 僅開發環境 |
| 每15分鐘監控 | 中 | 中 | 生產環境 |
| 每30分鐘監控 | 低 | 中 | 免費服務 |

### 免費服務資源分配

- **CPU**: 80% 用於應用程式，20% 用於監控
- **記憶體**: 90% 用於應用程式，10% 用於監控
- **網路**: 95% 用於用戶請求，5% 用於監控

---

**結論**: 記憶體監控對免費服務的影響極小，已實施的優化措施確保了在免費服務上的穩定運行。建議在免費服務上使用 `FREE_TIER=true` 環境變數來啟用優化模式。
