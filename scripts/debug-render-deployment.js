const https = require('https');

console.log('🔍 Render 部署診斷');
console.log('================================');

// 測試各種路由和狀態
async function testRoute(url, description) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      console.log(`✅ ${description}: ${res.statusCode}`);
      
      // 檢查重定向
      if (res.statusCode >= 300 && res.statusCode < 400) {
        console.log(`   ↪️  重定向到: ${res.headers.location}`);
      }
      
      // 檢查內容類型
      const contentType = res.headers['content-type'];
      if (contentType) {
        console.log(`   📄 內容類型: ${contentType}`);
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (data.length > 0) {
          console.log(`   📏 內容長度: ${data.length} 字節`);
          
          // 檢查是否包含 HTML
          if (data.includes('<html')) {
            console.log(`   ✅ 包含 HTML 內容`);
          }
          
          // 檢查是否包含 JavaScript
          if (data.includes('script') || data.includes('_nuxt')) {
            console.log(`   ✅ 包含 JavaScript 引用`);
          }
        }
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${description}: ${err.message}`);
      resolve({ error: err.message });
    });

    req.setTimeout(10000, () => {
      console.log(`⏰ ${description}: 超時`);
      req.destroy();
      resolve({ timeout: true });
    });
  });
}

// 主測試函數
async function runDiagnostics() {
  console.log('🚀 開始 Render 部署診斷...\n');
  
  const baseUrl = 'https://wuridao-project.onrender.com';
  
  // 測試基本路由
  console.log('📋 基本路由測試:');
  console.log('================================');
  
  await testRoute(`${baseUrl}`, '首頁');
  await testRoute(`${baseUrl}/index.html`, 'index.html');
  
  console.log('\n📋 管理後台路由測試:');
  console.log('================================');
  
  await testRoute(`${baseUrl}/admin`, '管理後台根目錄');
  await testRoute(`${baseUrl}/admin/login`, '登入頁面');
  await testRoute(`${baseUrl}/admin/dashboard`, '儀表板');
  
  console.log('\n📋 其他路由測試:');
  console.log('================================');
  
  await testRoute(`${baseUrl}/about`, '關於頁面');
  await testRoute(`${baseUrl}/plan`, '方案頁面');
  await testRoute(`${baseUrl}/articles`, '文章列表');
  
  console.log('\n📋 靜態資源測試:');
  console.log('================================');
  
  await testRoute(`${baseUrl}/_redirects`, '_redirects 文件');
  await testRoute(`${baseUrl}/_headers`, '_headers 文件');
  await testRoute(`${baseUrl}/favicon.ico`, 'favicon.ico');
  
  console.log('\n📋 404 頁面測試:');
  console.log('================================');
  
  await testRoute(`${baseUrl}/404.html`, '404.html');
  await testRoute(`${baseUrl}/nonexistent-page`, '不存在的頁面');
  
  console.log('\n📋 分析結果:');
  console.log('================================');
  console.log('💡 如果所有路由都返回 404，可能的原因:');
  console.log('   1. Render 部署失敗');
  console.log('   2. _redirects 文件未生效');
  console.log('   3. 靜態文件服務配置錯誤');
  console.log('   4. 構建過程有問題');
  
  console.log('\n💡 如果只有管理後台路由返回 404:');
  console.log('   1. SPA 路由配置問題');
  console.log('   2. 前端路由守衛問題');
  console.log('   3. JavaScript 執行錯誤');
  
  console.log('\n💡 建議的解決方案:');
  console.log('   1. 檢查 Render 部署日誌');
  console.log('   2. 確認構建命令正確');
  console.log('   3. 檢查 _redirects 文件格式');
  console.log('   4. 重新部署前端服務');
}

// 執行診斷
runDiagnostics().catch(console.error);
