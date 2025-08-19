#!/usr/bin/env node

/**
 * 測試 SPA 路由修復
 * 驗證管理後台路由是否正常工作
 */

const https = require('https');

// 配置
const config = {
  frontendUrl: 'https://wuridao-project.onrender.com'
};

console.log('🔍 測試 SPA 路由修復');
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
    contentType: response.headers['content-type'] || '未設置'
  };

  return analysis;
}

// 主測試函數
async function runSPATests() {
  const routes = [
    { path: '/', name: '首頁' },
    { path: '/admin', name: '管理後台' },
    { path: '/admin/login', name: '登入頁面' },
    { path: '/admin/editarticles', name: '編輯文章' },
    { path: '/admin/editcategories', name: '編輯分類' },
    { path: '/admin/editphotos', name: '編輯照片' },
    { path: '/admin/editvideos', name: '編輯影片' },
    { path: '/admin/edittags', name: '編輯標籤' },
    { path: '/admin/seo', name: 'SEO 管理' },
    { path: '/admin/change-password', name: '修改密碼' }
  ];

  console.log('1️⃣ 測試管理後台路由...');
  console.log('');

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
      
      if (analysis.isErrorPage) {
        console.log(`   ⚠️  錯誤頁面`);
      }
      
      if (route.name === '登入頁面' && analysis.hasLoginForm) {
        console.log(`   ✅ 包含登入表單`);
      }
      
      if (route.name === '管理後台' && analysis.hasAdminContent) {
        console.log(`   ✅ 包含管理後台內容`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`${route.name} (${route.path}): ❌ ${error.message}`);
      console.log('');
    }
  }

  console.log('2️⃣ 總結分析...');
  console.log('');
  console.log('💡 SPA 路由修復建議:');
  console.log('');
  console.log('如果管理後台路由仍然返回 404:');
  console.log('1. 重新部署前端服務');
  console.log('2. 檢查 Nuxt 構建配置');
  console.log('3. 確認 routeRules 設置正確');
  console.log('4. 檢查 Render 的靜態文件服務配置');
  console.log('');
  console.log('如果路由返回 200 但內容不正確:');
  console.log('1. 檢查客戶端路由配置');
  console.log('2. 確認中間件設置');
  console.log('3. 檢查認證邏輯');
  console.log('');
  console.log('如果所有路由都正常:');
  console.log('✅ SPA 路由修復成功！');
}

// 執行測試
runSPATests().then(() => {
  console.log('=====================================');
  console.log('�� SPA 路由測試完成');
});
