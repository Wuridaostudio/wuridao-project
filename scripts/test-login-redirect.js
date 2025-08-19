#!/usr/bin/env node

/**
 * 測試登入跳轉問題
 * 檢查登入成功後的跳轉邏輯
 */

const https = require('https');
const http = require('http');

// 配置
const config = {
  backendUrl: process.env.BACKEND_URL || 'https://wuridao-backend.onrender.com',
  frontendUrl: process.env.FRONTEND_URL || 'https://wuridao-project.onrender.com',
  adminUsername: process.env.ADMIN_USERNAME || 'your-admin-username',
  adminPassword: process.env.ADMIN_PASSWORD || 'your-admin-password'
};

console.log('🔍 測試登入跳轉問題');
console.log('=====================================');
console.log(`後端 URL: ${config.backendUrl}`);
console.log(`前端 URL: ${config.frontendUrl}`);
console.log(`管理員帳號: ${config.adminUsername}`);
console.log('');

// 測試登入 API
async function testLogin() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      username: config.adminUsername,
      password: config.adminPassword
    });

    const options = {
      hostname: new URL(config.backendUrl).hostname,
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData),
        'Origin': config.frontendUrl,
        'Referer': `${config.frontendUrl}/admin/login`
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
          body: data
        };
        resolve(response);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(loginData);
    req.end();
  });
}

// 測試前端登入頁面
async function testFrontendLoginPage() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(config.frontendUrl).hostname,
      port: 443,
      path: '/admin/login',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
          body: data
        };
        resolve(response);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// 測試管理後台頁面
async function testAdminDashboard() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(config.frontendUrl).hostname,
      port: 443,
      path: '/admin',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
          body: data
        };
        resolve(response);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// 主測試函數
async function runTests() {
  try {
    console.log('1️⃣ 測試後端登入 API...');
    const loginResponse = await testLogin();
    
    console.log(`   狀態碼: ${loginResponse.statusCode}`);
    console.log(`   Set-Cookie 標頭: ${loginResponse.headers['set-cookie'] ? '✅ 存在' : '❌ 不存在'}`);
    
    if (loginResponse.statusCode === 201) {
      console.log('   ✅ 登入 API 正常');
      
      // 檢查 Set-Cookie 標頭
      if (loginResponse.headers['set-cookie']) {
        console.log('   📋 Cookie 詳情:');
        loginResponse.headers['set-cookie'].forEach((cookie, index) => {
          console.log(`      ${index + 1}. ${cookie}`);
        });
      }
    } else {
      console.log('   ❌ 登入 API 失敗');
      console.log(`   響應內容: ${loginResponse.body}`);
    }
    
    console.log('');

    console.log('2️⃣ 測試前端登入頁面...');
    const loginPageResponse = await testFrontendLoginPage();
    
    console.log(`   狀態碼: ${loginPageResponse.statusCode}`);
    console.log(`   頁面大小: ${loginPageResponse.body.length} bytes`);
    
    if (loginPageResponse.statusCode === 200) {
      console.log('   ✅ 登入頁面可訪問');
      
      // 檢查是否包含登入表單
      if (loginPageResponse.body.includes('登入') && loginPageResponse.body.includes('form')) {
        console.log('   ✅ 包含登入表單');
      } else {
        console.log('   ⚠️  可能缺少登入表單');
      }
    } else {
      console.log('   ❌ 登入頁面無法訪問');
    }
    
    console.log('');

    console.log('3️⃣ 測試管理後台頁面...');
    const dashboardResponse = await testAdminDashboard();
    
    console.log(`   狀態碼: ${dashboardResponse.statusCode}`);
    console.log(`   頁面大小: ${dashboardResponse.body.length} bytes`);
    
    if (dashboardResponse.statusCode === 200) {
      console.log('   ✅ 管理後台頁面可訪問');
      
      // 檢查是否包含管理後台內容
      if (dashboardResponse.body.includes('儀表板') || dashboardResponse.body.includes('Dashboard')) {
        console.log('   ✅ 包含管理後台內容');
      } else {
        console.log('   ⚠️  可能缺少管理後台內容');
      }
    } else if (dashboardResponse.statusCode === 302 || dashboardResponse.statusCode === 301) {
      console.log('   🔄 重定向到登入頁面（正常行為）');
      console.log(`   重定向位置: ${dashboardResponse.headers.location}`);
    } else {
      console.log('   ❌ 管理後台頁面異常');
    }

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
  }
}

// 執行測試
runTests().then(() => {
  console.log('');
  console.log('=====================================');
  console.log('🎯 測試完成');
  console.log('');
  console.log('💡 建議檢查項目:');
  console.log('1. 確認環境變數 ADMIN_USERNAME 和 ADMIN_PASSWORD 已設置');
  console.log('2. 檢查前端路由配置是否正確');
  console.log('3. 檢查中間件 auth.ts 的執行邏輯');
  console.log('4. 檢查 Cookie 設置和讀取是否同步');
  console.log('5. 檢查是否有重複的跳轉邏輯');
});
