#!/usr/bin/env node

/**
 * 調試 404 路由
 * 詳細分析為什麼某些路由返回 404
 */

const https = require('https');

// 配置
const config = {
  frontendUrl: 'https://wuridao-project.onrender.com'
};

console.log('🔍 調試 404 路由問題');
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

// 詳細分析響應
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
    bodyPreview: response.body.substring(0, 500),
    hasRedirect: response.headers.location,
    server: response.headers.server,
    poweredBy: response.headers['x-powered-by']
  };

  return analysis;
}

// 主測試函數
async function debug404Routes() {
  const routes = [
    { path: '/admin', name: '管理後台' },
    { path: '/admin/login', name: '登入頁面' },
    { path: '/about', name: '關於頁面' },
    { path: '/articles', name: '文章列表' },
    { path: '/media', name: '媒體列表' }
  ];

  console.log('1️⃣ 詳細分析 404 路由...');
  console.log('');

  for (const route of routes) {
    try {
      const response = await testRoute(route.path, route.name);
      const analysis = analyzeResponse(response);
      
      console.log(`${route.name} (${route.path}):`);
      console.log(`   狀態: ${analysis.status}`);
      console.log(`   大小: ${analysis.size} bytes`);
      console.log(`   內容類型: ${analysis.contentType}`);
      console.log(`   服務器: ${analysis.server || '未設置'}`);
      console.log(`   重定向: ${analysis.hasRedirect || '無'}`);
      
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
      
      // 顯示響應內容預覽
      console.log(`   內容預覽:`);
      console.log(`   ${analysis.bodyPreview.replace(/\n/g, '\n   ')}`);
      
      console.log('');
      console.log('   ---');
      console.log('');
      
    } catch (error) {
      console.log(`${route.name} (${route.path}): ❌ ${error.message}`);
      console.log('');
    }
  }

  console.log('2️⃣ 問題分析...');
  console.log('');
  console.log('💡 可能的原因:');
  console.log('1. Render 的靜態文件服務配置問題');
  console.log('2. _redirects 文件沒有生效');
  console.log('3. Nuxt 構建配置問題');
  console.log('4. 路由文件缺失');
}

// 執行測試
debug404Routes().then(() => {
  console.log('=====================================');
  console.log('�� 404 路由調試完成');
});
