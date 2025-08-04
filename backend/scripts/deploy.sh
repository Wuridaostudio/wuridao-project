#!/bin/bash

# WURIDAO 部署腳本
echo "🚀 開始部署 WURIDAO 智慧家..."

# 設定環境變數
export NODE_ENV=production

# 1. 安裝依賴
echo "📦 安裝依賴..."
npm install

# 2. 建置專案
echo "🔨 建置專案..."
npm run build

# 3. 執行資料庫遷移
echo "🗄️ 執行資料庫遷移..."
npm run migration:run

# 4. 執行種子資料
echo "🌱 執行種子資料..."
npm run seed

# 5. 啟動應用
echo "🚀 啟動應用..."
npm run start:prod

echo "✅ 部署完成！" 