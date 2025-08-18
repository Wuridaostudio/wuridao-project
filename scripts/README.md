# WURIDAO 測試腳本使用說明

## 概述

這個目錄包含了用於測試和診斷 WURIDAO 項目登入功能的腳本。

## 腳本列表

### 1. `check-cookie-domain.js`
檢查 Cookie Domain 設置是否正確。

**使用方法：**
```bash
# 設置環境變數
export ADMIN_USERNAME=your-actual-username
export ADMIN_PASSWORD=your-actual-password

# 運行腳本
node scripts/check-cookie-domain.js
```

### 2. `test-real-admin.js`
測試實際管理員帳戶的登入功能。

**使用方法：**
```bash
# 設置環境變數
export ADMIN_USERNAME=your-actual-username
export ADMIN_PASSWORD=your-actual-password

# 運行腳本
node scripts/test-real-admin.js
```

### 3. `test-multi-domain-cookies.js`
測試多域名 Cookie 功能。

**使用方法：**
```bash
# 設置環境變數
export ADMIN_USERNAME=your-actual-username
export ADMIN_PASSWORD=your-actual-password

# 運行腳本
node scripts/test-multi-domain-cookies.js
```

### 4. `check-cookie-config.js`
檢查 CORS 和 Cookie 配置。

**使用方法：**
```bash
node scripts/check-cookie-config.js
```

## 環境變數設置

在運行測試腳本之前，請設置以下環境變數：

```bash
# 管理員帳戶資訊
export ADMIN_USERNAME=your-actual-username
export ADMIN_PASSWORD=your-actual-password

# 可選：後端 URL（預設為 https://wuridao-backend.onrender.com）
export BACKEND_URL=https://your-backend-url.com
```

## 安全注意事項

⚠️ **重要安全提醒：**

1. **不要將真實的帳戶資訊提交到 Git 倉庫**
2. **使用環境變數來存儲敏感資訊**
3. **定期更換密碼**
4. **不要在生產環境中運行測試腳本**

## 故障排除

### 常見問題：

1. **腳本無法運行**
   - 確保已安裝 Node.js
   - 檢查腳本權限：`chmod +x scripts/*.js`

2. **登入失敗**
   - 檢查環境變數是否正確設置
   - 確認後端服務是否正常運行
   - 檢查網路連接

3. **Cookie 問題**
   - 檢查 Cookie Domain 設置
   - 確認 CORS 配置
   - 檢查 HTTPS 設置

## 開發說明

這些腳本使用 Node.js 的 `fetch` API，需要 Node.js 18+ 版本。

如果需要修改腳本，請注意：
- 保持腳本的可重用性
- 不要硬編碼敏感資訊
- 添加適當的錯誤處理
- 更新文檔
