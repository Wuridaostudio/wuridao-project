# WURIDAO 智慧家 - 資料庫優化指南

## 🔧 已實施的資料庫優化措施

### 1. **禁用自動同步 (synchronize: false)**

#### **問題**：
- `synchronize: process.env.NODE_ENV === 'development'` 在開發環境中可能導致數據丟失
- 生產環境與開發環境的資料庫結構不一致

#### **解決方案**：
```typescript
// 修復前
synchronize: process.env.NODE_ENV === 'development'

// 修復後
synchronize: false // 始終使用遷移來管理資料庫結構
```

#### **優點**：
- ✅ 避免意外數據丟失
- ✅ 確保開發與生產環境一致性
- ✅ 更好的版本控制
- ✅ 可回滾的資料庫變更

### 2. **集中化資料庫配置**

#### **新配置文件**：`src/config/database.config.ts`
```typescript
export const databaseConfig = {
  // 基本配置
  type: 'postgres' as const,
  url: process.env.DATABASE_URL,
  ssl: process.env.USE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  
  // 同步配置 - 始終使用遷移
  synchronize: false,
  
  // 連接池配置
  extra: {
    connectionLimit: process.env.NODE_ENV === 'production' ? 10 : 5,
    acquireTimeout: 60000,
    idleTimeout: 30000,
    
    // 免費服務環境優化
    ...(process.env.FREE_TIER === 'true' && {
      connectionLimit: 5,
      acquireTimeout: 30000,
      idleTimeout: 15000,
    }),
  },
};
```

### 3. **資料庫健康檢查服務**

#### **新服務**：`src/monitoring/database-health.service.ts`
- 每30秒檢查資料庫連接狀態
- 監控連接池使用情況
- 提供資料庫統計信息
- 自動檢測連接問題

#### **功能**：
```typescript
@Cron(CronExpression.EVERY_30_SECONDS)
async checkDatabaseHealth() {
  // 檢查資料庫連接
  // 監控連接池狀態
  // 記錄健康狀況
}
```

## 📊 連接池優化配置

### **生產環境配置**
```typescript
extra: {
  connectionLimit: 10,      // 最大連接數
  acquireTimeout: 60000,    // 60秒連接超時
  idleTimeout: 30000,       // 30秒閒置超時
}
```

### **開發環境配置**
```typescript
extra: {
  connectionLimit: 5,       // 減少連接數
  acquireTimeout: 60000,    // 60秒連接超時
  idleTimeout: 30000,       // 30秒閒置超時
}
```

### **免費服務環境配置**
```typescript
extra: {
  connectionLimit: 5,       // 最小連接數
  acquireTimeout: 30000,    // 30秒連接超時
  idleTimeout: 15000,       // 15秒閒置超時
}
```

## 🚀 遷移管理最佳實踐

### 1. **生成遷移**
```bash
# 生成新的遷移檔案
npm run migration:generate -- src/database/migrations/MigrationName
```

### 2. **運行遷移**
```bash
# 運行待執行的遷移
npm run migration:run
```

### 3. **回滾遷移**
```bash
# 回滾最後一個遷移
npm run migration:revert
```

### 4. **檢查遷移狀態**
```bash
# 查看遷移狀態
npm run typeorm -- migration:show -d src/database/data-source.ts
```

## 📈 性能監控指標

### **連接池監控**
- **總連接數**：pool.size
- **閒置連接數**：pool.idle
- **等待連接數**：pool.waiting
- **連接超時**：acquireTimeout
- **閒置超時**：idleTimeout

### **查詢性能監控**
- **最大查詢執行時間**：maxQueryExecutionTime (1000ms)
- **重試次數**：retryAttempts (3次)
- **重試延遲**：retryDelay (3000ms)

### **健康檢查指標**
- **連接狀態**：isConnected
- **響應時間**：查詢執行時間
- **錯誤率**：失敗查詢比例
- **連接池利用率**：active/total 連接比例

## 🛠️ 故障排除

### 1. **連接池耗盡**
```typescript
// 症狀：pool.waiting > 5
// 解決方案：增加連接數或優化查詢
extra: {
  connectionLimit: 15, // 增加連接數
}
```

### 2. **連接超時**
```typescript
// 症狀：acquireTimeout 錯誤
// 解決方案：增加超時時間或檢查網路
extra: {
  acquireTimeout: 120000, // 增加到120秒
}
```

### 3. **查詢執行時間過長**
```typescript
// 症狀：查詢超過 maxQueryExecutionTime
// 解決方案：優化查詢或增加索引
maxQueryExecutionTime: 2000, // 增加到2秒
```

## 🔍 監控和日誌

### **開發環境日誌**
```typescript
logging: ['query', 'error'] // 記錄所有查詢和錯誤
```

### **生產環境日誌**
```typescript
logging: ['error'] // 只記錄錯誤
```

### **健康檢查日誌**
- 每30秒記錄資料庫連接狀態
- 記錄連接池統計信息
- 記錄異常情況

## 📝 部署檢查清單

### **遷移檢查**
- [ ] 所有遷移已執行
- [ ] 遷移狀態正常
- [ ] 資料庫結構是最新的

### **連接配置檢查**
- [ ] 連接池大小適當
- [ ] 超時時間合理
- [ ] SSL 配置正確

### **性能檢查**
- [ ] 查詢執行時間正常
- [ ] 連接池利用率合理
- [ ] 錯誤率在可接受範圍

### **監控檢查**
- [ ] 健康檢查服務運行
- [ ] 日誌記錄正常
- [ ] 警報機制有效

## 💡 最佳實踐建議

1. **始終使用遷移**：避免使用 `synchronize: true`
2. **監控連接池**：定期檢查連接池狀態
3. **優化查詢**：使用適當的索引和查詢優化
4. **定期備份**：建立自動備份機制
5. **測試連接**：部署前測試資料庫連接
6. **環境隔離**：開發、測試、生產環境分離

---

**結論**：通過禁用自動同步、集中化配置、添加健康檢查，我們建立了一個更穩定、可監控的資料庫連接系統，確保了開發與生產環境的一致性。
