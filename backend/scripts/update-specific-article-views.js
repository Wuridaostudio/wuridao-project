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

async function updateSpecificArticleViews() {
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

    // 更新特定文章的瀏覽次數
    log('\n🔄 開始更新特定文章瀏覽次數...', 'blue');
    
    // 找到瀏覽次數為1004的文章
    const articlesWith1004Views = currentResult.rows.filter(article => article.views === 1004);
    
    if (articlesWith1004Views.length >= 2) {
      // 更新第一個瀏覽次數為1004的文章為1874
      const update1Result = await client.query(`
        UPDATE articles 
        SET views = 1874, 
            "updatedAt" = NOW()
        WHERE id = $1
      `, [articlesWith1004Views[0].id]);
      
      // 更新第二個瀏覽次數為1004的文章為6215
      const update2Result = await client.query(`
        UPDATE articles 
        SET views = 6215, 
            "updatedAt" = NOW()
        WHERE id = $1
      `, [articlesWith1004Views[1].id]);

      log(`✅ 成功更新文章 ID ${articlesWith1004Views[0].id} 為 1874 次瀏覽`, 'green');
      log(`✅ 成功更新文章 ID ${articlesWith1004Views[1].id} 為 6215 次瀏覽`, 'green');
    } else {
      log(`❌ 找不到足夠的瀏覽次數為1004的文章，只找到 ${articlesWith1004Views.length} 篇`, 'red');
    }

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
      const color = article.views === 1874 || article.views === 6215 ? 'magenta' : 'green';
      log(`  ID ${article.id}: "${article.title}" - ${article.views} 次瀏覽`, color);
    });

    log('\n🎉 特定文章瀏覽次數已成功更新！', 'green');
    if (articlesWith1004Views.length >= 2) {
      log(`  - 文章 ID ${articlesWith1004Views[0].id}: 1874 次瀏覽`, 'magenta');
      log(`  - 文章 ID ${articlesWith1004Views[1].id}: 6215 次瀏覽`, 'magenta');
    }

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
updateSpecificArticleViews().catch(console.error);
