#!/usr/bin/env node

/**
 * 測試認證修復
 * 驗證三個關鍵問題的修復：
 * 1. credentials: 'include' 配置
 * 2. CORS Origin 配置
 * 3. Route Middleware 時機問題
 */

const https = require('https');

// 配置
const config = {
  frontendUrl: 'https://wuridao-project.onrender.com',
  backendUrl: 'https://wuridao-backend.onrender.com'
};

console.log('🔍 測試認證修復');
console.log('=====================================');
console.log(`前端 URL: ${config.frontendUrl}`);
console.log(`後端 URL: ${config.backendUrl}`);
console.log('');

// 測試 CORS 預檢請求
async function testCORS() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(config.backendUrl).hostname,
      port: 443,
      path: '/api/auth/login',
      method: 'OPTIONS',
      headers: {
        'Origin': config.frontendUrl,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      const corsHeaders = {
        'Access-Control-Allow-Origin': res.headers['access-control-allow-origin'],
        'Access-Control-Allow-Credentials': res.headers['access-control-allow-credentials'],
        'Access-Control-Allow-Methods': res.headers['access-control-allow-methods'],
        'Access-Control-Allow-Headers': res.headers['access-control-allow-headers'],
        'Access-Control-Expose-Headers': res.headers['access-control-expose-headers']
      };
      
      resolve({
        statusCode: res.statusCode,
        headers: corsHeaders
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => req.destroy());
    req.end();
  });
}

// 測試登入 API（模擬瀏覽器請求）
async function testLoginAPI() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: 'mecenas0217@gmail.com',
      password: 'test123456'
    });

    const options = {
      hostname: new URL(config.backendUrl).hostname,
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Origin': config.frontendUrl,
        'Referer': config.frontendUrl,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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

    req.on('error', reject);
    req.setTimeout(5000, () => req.destroy());
    req.write(postData);
    req.end();
  });
}

// 測試前端路由
async function testFrontendRoute(path, name) {
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
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          path: path,
          name: name
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => req.destroy());
    req.end();
  });
}

// 主測試函數
async function runAuthFixTests() {
  console.log('1️⃣ 測試 CORS 配置...');
  console.log('');
  
  try {
    const corsResult = await testCORS();
    console.log('CORS 預檢請求結果:');
    console.log(`   狀態碼: ${corsResult.statusCode}`);
    console.log(`   Allow-Origin: ${corsResult.headers['Access-Control-Allow-Origin'] || '未設置'}`);
    console.log(`   Allow-Credentials: ${corsResult.headers['Access-Control-Allow-Credentials'] || '未設置'}`);
    console.log(`   Allow-Methods: ${corsResult.headers['Access-Control-Allow-Methods'] || '未設置'}`);
    console.log(`   Expose-Headers: ${corsResult.headers['Access-Control-Expose-Headers'] || '未設置'}`);
    
    if (corsResult.statusCode === 204 && corsResult.headers['Access-Control-Allow-Credentials'] === 'true') {
      console.log('   ✅ CORS 配置正確');
    } else {
      console.log('   ❌ CORS 配置有問題');
    }
  } catch (error) {
    console.log(`   ❌ CORS 測試失敗: ${error.message}`);
  }
  
  console.log('');
  console.log('2️⃣ 測試登入 API...');
  console.log('');
  
  try {
    const loginResult = await testLoginAPI();
    console.log('登入 API 測試結果:');
    console.log(`   狀態碼: ${loginResult.statusCode}`);
    console.log(`   Set-Cookie: ${loginResult.headers['set-cookie'] ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`   Content-Type: ${loginResult.headers['content-type'] || '未設置'}`);
    
    if (loginResult.headers['set-cookie']) {
      console.log('   ✅ Cookie 設置正常');
    } else {
      console.log('   ❌ Cookie 設置失敗');
    }
  } catch (error) {
    console.log(`   ❌ 登入 API 測試失敗: ${error.message}`);
  }
  
  console.log('');
  console.log('3️⃣ 測試前端路由...');
  console.log('');
  
  const routes = [
    { path: '/admin/login', name: '登入頁面' },
    { path: '/admin', name: '管理後台' }
  ];
  
  for (const route of routes) {
    try {
      const response = await testFrontendRoute(route.path, route.name);
      console.log(`${route.name} (${route.path}):`);
      console.log(`   狀態: ${response.statusCode === 200 ? '✅ 正常' : '❌ 錯誤'}`);
      console.log(`   大小: ${response.body.length} bytes`);
      console.log(`   內容類型: ${response.headers['content-type'] || '未設置'}`);
      
      if (response.body.includes('nuxt') || response.body.includes('Nuxt')) {
        console.log('   ✅ SPA 檢測到');
      } else {
        console.log('   ⚠️  SPA 未檢測到');
      }
      
      console.log('');
    } catch (error) {
      console.log(`${route.name} (${route.path}): ❌ ${error.message}`);
      console.log('');
    }
  }
  
  console.log('4️⃣ 修復建議...');
  console.log('');
  console.log('💡 如果 CORS 有問題:');
  console.log('   - 檢查後端 CORS 配置');
  console.log('   - 確認 origin 完全匹配');
  console.log('   - 確保 credentials: true');
  console.log('');
  console.log('💡 如果 Cookie 有問題:');
  console.log('   - 檢查前端 credentials: include');
  console.log('   - 確認後端 Set-Cookie 標頭');
  console.log('   - 檢查 Cookie Domain 設置');
  console.log('');
  console.log('💡 如果路由有問題:');
  console.log('   - 檢查 SPA 配置');
  console.log('   - 確認中間件時機');
  console.log('   - 測試客戶端路由');
}

// 執行測試
runAuthFixTests().then(() => {
  console.log('=====================================');
  console.log('🎯 認證修復測試完成');
});
