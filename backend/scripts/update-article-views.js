#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 載入環境變數
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// 顏色日誌函數
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function updateArticleViews() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.USE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    log('🔌 連接到資料庫...', 'blue');
    await client.connect();
    log('✅ 資料庫連接成功', 'green');

    // 先查詢當前的文章瀏覽次數
    log('📊 查詢當前文章瀏覽次數...', 'blue');
    const currentResult = await client.query(`
      SELECT id, title, views 
      FROM articles 
      ORDER BY id
    `);

    log(`📋 找到 ${currentResult.rows.length} 篇文章`, 'cyan');
    
    // 顯示更新前的數據
    log('\n📈 更新前的瀏覽次數:', 'yellow');
    currentResult.rows.forEach(article => {
      log(`  ID ${article.id}: "${article.title}" - ${article.views} 次瀏覽`, 'cyan');
    });

    // 更新所有文章的瀏覽次數，加上 1000
    log('\n🔄 開始更新瀏覽次數...', 'blue');
    const updateResult = await client.query(`
      UPDATE articles 
      SET views = views + 1000, 
          "updatedAt" = NOW()
      WHERE views IS NOT NULL
    `);

    log(`✅ 成功更新 ${updateResult.rowCount} 篇文章`, 'green');

    // 查詢更新後的數據
    log('\n📊 查詢更新後的瀏覽次數...', 'blue');
    const updatedResult = await client.query(`
      SELECT id, title, views 
      FROM articles 
      ORDER BY id
    `);

    // 顯示更新後的數據
    log('\n📈 更新後的瀏覽次數:', 'green');
    updatedResult.rows.forEach(article => {
      log(`  ID ${article.id}: "${article.title}" - ${article.views} 次瀏覽`, 'green');
    });

    log('\n🎉 所有文章瀏覽次數已成功加上 1000！', 'green');

  } catch (error) {
    log(`❌ 錯誤: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    log('🔌 資料庫連接已關閉', 'blue');
  }
}

// 執行腳本
updateArticleViews().catch(console.error);
