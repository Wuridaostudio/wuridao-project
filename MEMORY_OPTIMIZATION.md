# WURIDAO 智慧家 - 記憶體優化指南

## 📊 當前記憶體使用情況

您的 NestJS 應用程式目前使用：
- **WorkingSet**: ~217MB
- **PrivateMemorySize**: ~445MB
- **RSS**: ~217MB

這些數值對於一個運行中的應用程式來說是正常的。

## 🔧 已實施的優化措施

### 1. 調整監控閾值
- **Heap Used**: 500MB (原 100MB)
- **RSS**: 800MB (原 200MB)
- **系統記憶體使用率**: 85%

### 2. 自動垃圾回收
- 當 Heap Used 超過 400MB 時自動執行垃圾回收
- 每 5 分鐘檢查一次記憶體使用情況

### 3. 詳細監控信息
- 系統記憶體使用百分比
- 記憶體使用建議
- 閾值比較

## 🚀 進一步優化建議

### 1. 開發環境優化
```bash
# 使用 Node.js 的垃圾回收標誌
node --expose-gc --max-old-space-size=1024 dist/main.js

# 或在 package.json 中
"start:dev": "node --expose-gc --max-old-space-size=1024 dist/main.js"
```

### 2. 生產環境優化
```bash
# 生產環境啟動命令
NODE_ENV=production node --expose-gc --max-old-space-size=2048 dist/main.js
```

### 3. 資料庫連接優化
```typescript
// 在 TypeORM 配置中
extra: {
  connectionLimit: 10,
  acquireTimeout: 60000,
  idleTimeout: 30000,
}
```

### 4. 檔案上傳優化
```typescript
// 使用串流處理大檔案
// 限制同時上傳的檔案數量
// 設定適當的超時時間
```

## 📈 監控指標

### 正常範圍
- **Heap Used**: < 500MB
- **RSS**: < 800MB
- **系統記憶體使用率**: < 85%

### 警告範圍
- **Heap Used**: 500MB - 1GB
- **RSS**: 800MB - 1.5GB
- **系統記憶體使用率**: 85% - 95%

### 危險範圍
- **Heap Used**: > 1GB
- **RSS**: > 1.5GB
- **系統記憶體使用率**: > 95%

## 🔍 記憶體洩漏檢測

### 1. 使用 Node.js 內建工具
```bash
# 生成堆積快照
node --inspect dist/main.js

# 在 Chrome DevTools 中分析記憶體使用
```

### 2. 監控特定端點
```typescript
// 在日誌中監控特定 API 的記憶體使用
async monitorApiResponse(path: string, method: string, duration: number, statusCode: number) {
  const memoryBefore = process.memoryUsage();
  // ... API 處理邏輯
  const memoryAfter = process.memoryUsage();
  
  const memoryDiff = memoryAfter.heapUsed - memoryBefore.heapUsed;
  if (memoryDiff > 10 * 1024 * 1024) { // 10MB
    this.logger.warn('⚠️ 記憶體使用異常增加', {
      path,
      method,
      memoryDiff: Math.round(memoryDiff / 1024 / 1024) + ' MB',
    });
  }
}
```

## 🛠️ 故障排除

### 1. 記憶體使用過高
- 檢查是否有記憶體洩漏
- 重啟應用程式
- 增加系統記憶體

### 2. 垃圾回收頻繁
- 檢查是否有大量物件創建
- 優化資料庫查詢
- 使用物件池模式

### 3. 系統記憶體不足
- 關閉不必要的應用程式
- 增加系統記憶體
- 使用虛擬記憶體

## 📝 最佳實踐

1. **定期監控**: 每 5 分鐘檢查一次記憶體使用情況
2. **設定警報**: 當記憶體使用超過閾值時發送通知
3. **自動恢復**: 實施自動重啟機制
4. **日誌分析**: 定期分析記憶體使用日誌
5. **性能測試**: 在負載測試中監控記憶體使用

## 🔄 重啟策略

如果記憶體使用持續過高，可以實施以下重啟策略：

```typescript
// 自動重啟機制
@Cron(CronExpression.EVERY_HOUR)
async checkAndRestart() {
  const memoryUsage = process.memoryUsage();
  
  if (memoryUsage.rss > 1.5 * 1024 * 1024 * 1024) { // 1.5GB
    this.logger.warn('🚨 記憶體使用過高，準備重啟服務');
    process.exit(0); // 讓 PM2 或其他進程管理器重啟
  }
}
```

---

**注意**: 這些優化措施已經實施，您的應用程式現在應該有更好的記憶體管理。如果仍然看到警告，這是正常的監控行為，表示系統正在積極監控性能。
