#!/usr/bin/env node

/**
 * 測試生產端登入跳轉問題
 * 專門針對生產環境的跳轉邏輯進行測試
 */

const https = require('https');

// 配置
const config = {
  backendUrl: 'https://wuridao-backend.onrender.com',
  frontendUrl: 'https://wuridao-project.onrender.com',
  adminUsername: process.env.ADMIN_USERNAME || 'your-admin-username',
  adminPassword: process.env.ADMIN_PASSWORD || 'your-admin-password'
};

console.log('🔍 測試生產端登入跳轉問題');
console.log('=====================================');
console.log(`後端 URL: ${config.backendUrl}`);
console.log(`前端 URL: ${config.frontendUrl}`);
console.log(`管理員帳號: ${config.adminUsername}`);
console.log('');

// 模擬瀏覽器登入流程
async function simulateBrowserLogin() {
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
        'Referer': `${config.frontendUrl}/admin/login`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site'
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

// 測試前端頁面響應
async function testFrontendPage(path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(config.frontendUrl).hostname,
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
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
          description: description
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
async function runProductionTests() {
  try {
    console.log('1️⃣ 測試後端登入 API...');
    const loginResponse = await simulateBrowserLogin();
    
    console.log(`   狀態碼: ${loginResponse.statusCode}`);
    console.log(`   Set-Cookie 標頭: ${loginResponse.headers['set-cookie'] ? '✅ 存在' : '❌ 不存在'}`);
    
    if (loginResponse.statusCode === 201) {
      console.log('   ✅ 登入 API 正常');
      
      // 檢查 Set-Cookie 標頭
      if (loginResponse.headers['set-cookie']) {
        console.log('   📋 Cookie 詳情:');
        loginResponse.headers['set-cookie'].forEach((cookie, index) => {
          console.log(`      ${index + 1}. ${cookie}`);
          
          // 檢查 Cookie Domain 設置
          if (cookie.includes('Domain=')) {
            const domainMatch = cookie.match(/Domain=([^;]+)/);
            if (domainMatch) {
              console.log(`         Domain: ${domainMatch[1]}`);
            }
          }
        });
      }
      
      // 解析響應內容
      try {
        const responseData = JSON.parse(loginResponse.body);
        console.log('   📄 響應內容:');
        console.log(`      access_token: ${responseData.access_token ? '✅ 存在' : '❌ 不存在'}`);
        console.log(`      user: ${responseData.user ? '✅ 存在' : '❌ 不存在'}`);
      } catch (e) {
        console.log('   ⚠️  無法解析響應內容');
      }
    } else {
      console.log('   ❌ 登入 API 失敗');
      console.log(`   響應內容: ${loginResponse.body}`);
    }
    
    console.log('');

    console.log('2️⃣ 測試前端頁面響應...');
    
    // 測試登入頁面
    const loginPageResponse = await testFrontendPage('/admin/login', '登入頁面');
    console.log(`   登入頁面狀態碼: ${loginPageResponse.statusCode}`);
    console.log(`   頁面大小: ${loginPageResponse.body.length} bytes`);
    
    if (loginPageResponse.statusCode === 200) {
      console.log('   ✅ 登入頁面可訪問');
      
      // 檢查是否包含登入表單
      if (loginPageResponse.body.includes('登入') && loginPageResponse.body.includes('form')) {
        console.log('   ✅ 包含登入表單');
      } else {
        console.log('   ⚠️  可能缺少登入表單');
      }
      
      // 檢查是否包含必要的 JavaScript
      if (loginPageResponse.body.includes('script')) {
        console.log('   ✅ 包含 JavaScript');
      } else {
        console.log('   ⚠️  可能缺少 JavaScript');
      }
    } else {
      console.log('   ❌ 登入頁面無法訪問');
    }
    
    console.log('');

    // 測試管理後台頁面
    const dashboardResponse = await testFrontendPage('/admin', '管理後台');
    console.log(`   管理後台狀態碼: ${dashboardResponse.statusCode}`);
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

    console.log('');

    console.log('3️⃣ 檢查 CORS 配置...');
    console.log(`   Access-Control-Allow-Origin: ${loginResponse.headers['access-control-allow-origin'] || '❌ 未設置'}`);
    console.log(`   Access-Control-Allow-Credentials: ${loginResponse.headers['access-control-allow-credentials'] || '❌ 未設置'}`);
    console.log(`   Access-Control-Expose-Headers: ${loginResponse.headers['access-control-expose-headers'] || '❌ 未設置'}`);

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
  }
}

// 執行測試
runProductionTests().then(() => {
  console.log('');
  console.log('=====================================');
  console.log('🎯 生產端測試完成');
  console.log('');
  console.log('💡 生產端跳轉問題可能的原因:');
  console.log('1. Cookie Domain 設置不正確');
  console.log('2. CORS 配置問題');
  console.log('3. 前端路由配置問題');
  console.log('4. 客戶端渲染 (SSR: false) 導致的跳轉問題');
  console.log('5. 瀏覽器緩存問題');
  console.log('');
  console.log('🔧 建議解決方案:');
  console.log('1. 清除瀏覽器緩存和 Cookie');
  console.log('2. 檢查 Render 環境變數設置');
  console.log('3. 確認前端部署是否成功');
  console.log('4. 檢查瀏覽器開發者工具的 Network 標籤');
});
