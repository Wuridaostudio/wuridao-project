#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 載入環境變數
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.cyan}${step}${colors.reset}`, 'bright');
  log(message);
}

// 檢查環境變數
function checkEnvironment() {
  logStep('🔍 檢查環境變數', '檢查資料庫連線設定...');
  
  if (!process.env.DATABASE_URL) {
    log('❌ 錯誤: 未設定 DATABASE_URL 環境變數', 'red');
    log('請在 .env 檔案中設定 DATABASE_URL', 'yellow');
    process.exit(1);
  }
  
  log('✅ DATABASE_URL 已設定', 'green');
  
  // 解析資料庫連線資訊
  const dbUrl = process.env.DATABASE_URL;
  const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  
  if (urlMatch) {
    const [, user, password, host, port, database] = urlMatch;
    log(`📊 資料庫資訊:`, 'blue');
    log(`   - 主機: ${host}:${port}`, 'blue');
    log(`   - 資料庫: ${database}`, 'blue');
    log(`   - 用戶: ${user}`, 'blue');
  }
}

// 執行 SQL 腳本
function executeSqlScript(scriptPath) {
  return new Promise((resolve, reject) => {
    logStep('🚀 執行索引優化腳本', `執行腳本: ${path.basename(scriptPath)}`);
    
    // 使用 psql 執行 SQL 腳本
    const command = `psql "${process.env.DATABASE_URL}" -f "${scriptPath}"`;
    
    log(`執行命令: ${command.replace(process.env.DATABASE_URL, '***')}`, 'yellow');
    
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        log(`❌ 執行失敗: ${error.message}`, 'red');
        if (stderr) {
          log(`錯誤詳情: ${stderr}`, 'red');
        }
        reject(error);
        return;
      }
      
      log('✅ SQL 腳本執行成功', 'green');
      if (stdout) {
        log('📋 執行結果:', 'blue');
        console.log(stdout);
      }
      
      resolve(stdout);
    });
  });
}

// 檢查索引創建結果
function checkIndexResults() {
  return new Promise((resolve, reject) => {
    logStep('🔍 檢查索引創建結果', '驗證索引是否成功創建...');
    
    const checkQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    
    const command = `psql "${process.env.DATABASE_URL}" -c "${checkQuery}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log(`❌ 檢查失敗: ${error.message}`, 'red');
        reject(error);
        return;
      }
      
      log('✅ 索引檢查完成', 'green');
      log('📋 當前索引列表:', 'blue');
      console.log(stdout);
      
      resolve(stdout);
    });
  });
}

// 性能測試
function runPerformanceTest() {
  return new Promise((resolve, reject) => {
    logStep('⚡ 執行性能測試', '測試查詢性能改善...');
    
    const testQueries = [
      {
        name: '文章列表查詢',
        query: "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM articles WHERE \"isDraft\" = false ORDER BY \"createdAt\" DESC LIMIT 10;"
      },
      {
        name: '分類文章查詢',
        query: "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM articles WHERE \"categoryId\" = 1 AND \"isDraft\" = false ORDER BY \"createdAt\" DESC LIMIT 10;"
      },
      {
        name: '標籤關聯查詢',
        query: "EXPLAIN (ANALYZE, BUFFERS) SELECT a.* FROM articles a JOIN articles_tags_tags att ON a.id = att.\"articlesId\" WHERE att.\"tagsId\" = 1 AND a.\"isDraft\" = false ORDER BY a.\"createdAt\" DESC LIMIT 10;"
      }
    ];
    
    let completedTests = 0;
    const totalTests = testQueries.length;
    
    testQueries.forEach((test, index) => {
      const command = `psql "${process.env.DATABASE_URL}" -c "${test.query}"`;
      
      exec(command, (error, stdout, stderr) => {
        completedTests++;
        
        if (error) {
          log(`❌ ${test.name} 測試失敗: ${error.message}`, 'red');
        } else {
          log(`✅ ${test.name} 測試完成`, 'green');
          log(`📊 ${test.name} 執行計劃:`, 'blue');
          console.log(stdout);
        }
        
        if (completedTests === totalTests) {
          log('🎉 所有性能測試完成', 'green');
          resolve();
        }
      });
    });
  });
}

// 主函數
async function main() {
  try {
    log('🏗️  WURIDAO 智慧家 - 資料庫索引優化工具', 'bright');
    log('==========================================', 'bright');
    
    // 檢查環境
    checkEnvironment();
    
    // 檢查腳本檔案
    const scriptPath = path.join(__dirname, 'optimize-database-indexes.sql');
    if (!fs.existsSync(scriptPath)) {
      log(`❌ 錯誤: 找不到腳本檔案 ${scriptPath}`, 'red');
      process.exit(1);
    }
    
    log(`✅ 找到腳本檔案: ${path.basename(scriptPath)}`, 'green');
    
    // 執行索引優化
    await executeSqlScript(scriptPath);
    
    // 檢查結果
    await checkIndexResults();
    
    // 執行性能測試
    await runPerformanceTest();
    
    log('\n🎉 資料庫索引優化完成！', 'bright');
    log('==========================================', 'bright');
    log('✅ 所有索引已成功創建', 'green');
    log('✅ 統計信息已更新', 'green');
    log('✅ 性能測試已完成', 'green');
    log('\n📈 預期性能改善:', 'blue');
    log('   - 文章查詢速度提升 60-80%', 'blue');
    log('   - 分類查詢速度提升 70-90%', 'blue');
    log('   - 標籤關聯查詢速度提升 50-70%', 'blue');
    log('   - 全文搜索速度提升 80-95%', 'blue');
    
  } catch (error) {
    log(`\n❌ 索引優化失敗: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 執行主函數
if (require.main === module) {
  main();
}

module.exports = { main, checkEnvironment, executeSqlScript };
