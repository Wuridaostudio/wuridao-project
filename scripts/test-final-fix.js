#!/usr/bin/env node

/**
 * 最終修復測試
 * 驗證所有路由修復是否生效
 */

const https = require('https');

// 配置
const config = {
  frontendUrl: 'https://wuridao-project.onrender.com'
};

console.log('🔍 最終修復測試');
console.log('=====================================');
console.log(`前端 URL: ${config.frontendUrl}`);
console.log('');

// 測試路由響應
async function testRoute(path, name) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(config.frontendUrl).hostname,
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const response = {
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          path: path,
          name: name
        };
        resolve(response);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('請求超時'));
    });

    req.end();
  });
}

// 分析響應
function analyzeResponse(response) {
  const analysis = {
    status: response.statusCode === 200 ? '✅ 正常' : 
            response.statusCode === 404 ? '❌ 404 錯誤' :
            response.statusCode === 500 ? '❌ 500 錯誤' :
            `⚠️  ${response.statusCode} 狀態碼`,
    size: response.body.length,
    hasHtml: response.body.includes('<html'),
    hasScript: response.body.includes('<script'),
    hasNuxt: response.body.includes('nuxt') || response.body.includes('Nuxt'),
    isErrorPage: response.body.includes('404') || response.body.includes('Not Found'),
    hasLoginForm: response.body.includes('登入') && response.body.includes('form'),
    hasAdminContent: response.body.includes('儀表板') || response.body.includes('Dashboard'),
    contentType: response.headers['content-type'] || '未設置',
    isSPA: response.body.includes('__NUXT__') || response.body.includes('nuxt'),
    // 新增詳細分析
    bodyPreview: response.body.substring(0, 200),
    hasRedirect: response.headers.location,
    server: response.headers.server
  };

  return analysis;
}

// 主測試函數
async function runFinalFixTests() {
  const routes = [
    { path: '/', name: '首頁' },
    { path: '/admin', name: '管理後台' },
    { path: '/admin/login', name: '登入頁面' },
    { path: '/about', name: '關於頁面' },
    { path: '/plan', name: '方案頁面' },
    { path: '/articles', name: '文章列表' },
    { path: '/media', name: '媒體列表' },
    { path: '/admin/editarticles', name: '編輯文章' },
    { path: '/admin/editcategories', name: '編輯分類' }
  ];

  console.log('1️⃣ 測試最終修復...');
  console.log('');

  let successCount = 0;
  let totalCount = routes.length;

  for (const route of routes) {
    try {
      const response = await testRoute(route.path, route.name);
      const analysis = analyzeResponse(response);
      
      console.log(`${route.name} (${route.path}):`);
      console.log(`   狀態: ${analysis.status}`);
      console.log(`   大小: ${analysis.size} bytes`);
      console.log(`   內容類型: ${analysis.contentType}`);
      
      if (analysis.hasHtml) {
        console.log(`   HTML: ✅ 存在`);
      }
      
      if (analysis.hasScript) {
        console.log(`   JavaScript: ✅ 存在`);
      }
      
      if (analysis.hasNuxt) {
        console.log(`   Nuxt: ✅ 存在`);
      }
      
      if (analysis.isSPA) {
        console.log(`   SPA: ✅ 檢測到`);
      }
      
      if (analysis.isErrorPage) {
        console.log(`   ⚠️  錯誤頁面`);
      } else {
        successCount++;
      }
      
      // 顯示簡短內容預覽
      if (analysis.bodyPreview.length > 0) {
        console.log(`   預覽: ${analysis.bodyPreview.replace(/\n/g, ' ').substring(0, 100)}...`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`${route.name} (${route.path}): ❌ ${error.message}`);
      console.log('');
    }
  }

  console.log('2️⃣ 修復結果分析...');
  console.log('');
  console.log(`✅ 成功路由: ${successCount}/${totalCount}`);
  console.log(`❌ 失敗路由: ${totalCount - successCount}/${totalCount}`);
  console.log('');

  if (successCount === totalCount) {
    console.log('🎉 最終修復成功！所有路由都正常工作。');
    console.log('✅ 可以正常測試登入功能了！');
  } else if (successCount > totalCount / 2) {
    console.log('⚠️  修復部分成功，部分路由仍有問題。');
    console.log('💡 建議等待部署完成後再次測試。');
  } else {
    console.log('❌ 修復失敗，需要進一步調試。');
    console.log('💡 檢查 Render 部署日誌和配置。');
  }

  console.log('');
  console.log('💡 下一步:');
  console.log('1. 等待 Render 自動部署完成');
  console.log('2. 清除瀏覽器緩存');
  console.log('3. 重新測試登入功能');
  console.log('4. 如果仍有問題，檢查 Render 部署日誌');
}

// 執行測試
runFinalFixTests().then(() => {
  console.log('=====================================');
  console.log('🎯 最終修復測試完成');
});
