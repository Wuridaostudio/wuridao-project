#!/usr/bin/env node

/**
 * 測試生產端狀態
 * 準確檢查前端和後端的實際狀態
 */

const https = require('https');

// 配置
const config = {
  frontendUrl: 'https://wuridao-project.onrender.com',
  backendUrl: 'https://wuridao-backend.onrender.com'
};

console.log('🔍 測試生產端狀態');
console.log('=====================================');
console.log(`前端 URL: ${config.frontendUrl}`);
console.log(`後端 URL: ${config.backendUrl}`);
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

// 測試後端 API
async function testBackendAPI() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(config.backendUrl).hostname,
      port: 443,
      path: '/api/health',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
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
    is404Page: response.body.includes('404.html') || response.body.includes('重定向'),
    contentType: response.headers['content-type'] || '未設置',
    isSPA: response.body.includes('__NUXT__') || response.body.includes('nuxt'),
    bodyPreview: response.body.substring(0, 300)
  };

  return analysis;
}

// 主測試函數
async function runProductionTests() {
  console.log('1️⃣ 測試後端 API 狀態...');
  console.log('');
  
  try {
    const backendResult = await testBackendAPI();
    console.log('後端健康檢查結果:');
    console.log(`   狀態碼: ${backendResult.statusCode}`);
    console.log(`   內容類型: ${backendResult.headers['content-type'] || '未設置'}`);
    console.log(`   響應大小: ${backendResult.body.length} bytes`);
    
    if (backendResult.statusCode === 200) {
      console.log('   ✅ 後端 API 正常運行');
    } else {
      console.log('   ❌ 後端 API 有問題');
    }
  } catch (error) {
    console.log(`   ❌ 後端 API 測試失敗: ${error.message}`);
  }
  
  console.log('');
  console.log('2️⃣ 測試前端路由狀態...');
  console.log('');
  
  const routes = [
    { path: '/', name: '首頁' },
    { path: '/admin', name: '管理後台' },
    { path: '/admin/login', name: '登入頁面' },
    { path: '/about', name: '關於頁面' },
    { path: '/plan', name: '方案頁面' }
  ];

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
      }
      
      if (analysis.is404Page) {
        console.log(`   🔄 404 重定向頁面`);
      }
      
      // 顯示內容預覽
      if (analysis.bodyPreview.length > 0) {
        console.log(`   預覽: ${analysis.bodyPreview.replace(/\n/g, ' ').substring(0, 150)}...`);
      }
      
      // 判斷是否成功
      if (response.statusCode === 200 && analysis.hasHtml) {
        successCount++;
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`${route.name} (${route.path}): ❌ ${error.message}`);
      console.log('');
    }
  }

  console.log('3️⃣ 生產端狀態總結...');
  console.log('');
  console.log(`✅ 成功路由: ${successCount}/${totalCount}`);
  console.log(`❌ 失敗路由: ${totalCount - successCount}/${totalCount}`);
  console.log('');

  if (successCount === totalCount) {
    console.log('🎉 生產端狀態良好！所有功能正常。');
  } else if (successCount > 0) {
    console.log('⚠️  生產端部分正常，部分路由有問題。');
    console.log('💡 可能是 SPA 路由配置問題，但基本功能應該正常。');
  } else {
    console.log('❌ 生產端有嚴重問題，需要檢查部署。');
  }

  console.log('');
  console.log('💡 建議:');
  console.log('1. 清除瀏覽器緩存後重新測試');
  console.log('2. 檢查 Render 部署日誌');
  console.log('3. 確認 _redirects 文件是否生效');
  console.log('4. 測試實際登入功能');
}

// 執行測試
runProductionTests().then(() => {
  console.log('=====================================');
  console.log('🎯 生產端狀態測試完成');
});
