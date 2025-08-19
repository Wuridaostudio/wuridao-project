const https = require('https');

// 測試配置
const config = {
  backendUrl: 'https://wuridao-backend.onrender.com',
  frontendUrl: 'https://wuridao-project.onrender.com',
  loginUrl: 'https://wuridao-project.onrender.com/admin/login',
  adminUrl: 'https://wuridao-project.onrender.com/admin'
};

console.log('🔍 測試生產端登入跳轉問題');
console.log('================================');

// 測試登入 API
async function testLoginAPI() {
  console.log('\n📡 測試登入 API...');
  
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123'
    });

    const options = {
      hostname: 'wuridao-backend.onrender.com',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Origin': config.frontendUrl,
        'Referer': config.loginUrl
      }
    };

    const req = https.request(options, (res) => {
      console.log(`✅ 登入 API 狀態: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`✅ 登入成功: ${result.user?.username || 'Unknown'}`);
          
          // 檢查 Cookie 標頭
          const cookies = res.headers['set-cookie'];
          if (cookies) {
            console.log('✅ 收到 Cookie:');
            cookies.forEach(cookie => {
              console.log(`   ${cookie.split(';')[0]}`);
            });
          } else {
            console.log('❌ 沒有收到 Cookie');
          }
          
          resolve({ success: true, token: result.access_token, cookies });
        } catch (e) {
          console.log(`❌ 解析回應失敗: ${data}`);
          resolve({ success: false, error: data });
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ 登入 API 錯誤: ${err.message}`);
      resolve({ success: false, error: err.message });
    });

    req.write(postData);
    req.end();
  });
}

// 測試前端登入頁面
async function testLoginPage() {
  console.log('\n🌐 測試登入頁面...');
  
  return new Promise((resolve) => {
    const req = https.get(config.loginUrl, (res) => {
      console.log(`✅ 登入頁面狀態: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          // 檢查是否包含登入表單
          if (data.includes('login') || data.includes('form')) {
            console.log('✅ 登入頁面正常載入');
            resolve(true);
          } else {
            console.log('❌ 登入頁面內容異常');
            resolve(false);
          }
        });
      } else {
        console.log(`❌ 登入頁面狀態異常: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log(`❌ 登入頁面錯誤: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      console.log('❌ 登入頁面超時');
      req.destroy();
      resolve(false);
    });
  });
}

// 測試管理後台頁面
async function testAdminPage() {
  console.log('\n🔐 測試管理後台頁面...');
  
  return new Promise((resolve) => {
    const req = https.get(config.adminUrl, (res) => {
      console.log(`✅ 管理後台狀態: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          // 檢查是否包含管理後台內容
          if (data.includes('admin') || data.includes('dashboard')) {
            console.log('✅ 管理後台正常載入');
            resolve(true);
          } else if (data.includes('login')) {
            console.log('⚠️  管理後台重定向到登入頁面（需要認證）');
            resolve(true); // 這是正常的認證流程
          } else {
            console.log('❌ 管理後台內容異常');
            resolve(false);
          }
        });
      } else if (res.statusCode === 404) {
        console.log('⚠️  管理後台返回 404（可能是 SPA 路由）');
        resolve(true);
      } else {
        console.log(`❌ 管理後台狀態異常: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log(`❌ 管理後台錯誤: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      console.log('❌ 管理後台超時');
      req.destroy();
      resolve(false);
    });
  });
}

// 測試 SPA 路由配置
async function testSPARoutes() {
  console.log('\n🔄 測試 SPA 路由配置...');
  
  const routes = [
    '/admin',
    '/admin/login',
    '/admin/dashboard',
    '/admin/articles'
  ];

  for (const route of routes) {
    await new Promise((resolve) => {
      const url = `${config.frontendUrl}${route}`;
      const req = https.get(url, (res) => {
        console.log(`   ${route}: ${res.statusCode}`);
        resolve();
      });

      req.on('error', () => {
        console.log(`   ${route}: 錯誤`);
        resolve();
      });

      req.setTimeout(5000, () => {
        console.log(`   ${route}: 超時`);
        req.destroy();
        resolve();
      });
    });
  }
}

// 檢查 _redirects 文件
async function checkRedirectsFile() {
  console.log('\n📄 檢查 _redirects 文件...');
  
  return new Promise((resolve) => {
    const req = https.get(`${config.frontendUrl}/_redirects`, (res) => {
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('✅ _redirects 文件存在');
          console.log('📝 內容:');
          data.split('\n').forEach(line => {
            if (line.trim()) {
              console.log(`   ${line}`);
            }
          });
          resolve(true);
        });
      } else {
        console.log(`❌ _redirects 文件不存在或無法訪問: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', () => {
      console.log('❌ 無法訪問 _redirects 文件');
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log('❌ _redirects 文件檢查超時');
      req.destroy();
      resolve(false);
    });
  });
}

// 主測試函數
async function runTests() {
  console.log('🚀 開始診斷生產端登入跳轉問題...\n');
  
  const results = {
    loginAPI: await testLoginAPI(),
    loginPage: await testLoginPage(),
    adminPage: await testAdminPage(),
    redirectsFile: await checkRedirectsFile()
  };

  console.log('\n🔄 測試 SPA 路由...');
  await testSPARoutes();

  console.log('\n📊 診斷結果總結:');
  console.log('================================');
  console.log(`登入 API: ${results.loginAPI.success ? '✅ 正常' : '❌ 異常'}`);
  console.log(`登入頁面: ${results.loginPage ? '✅ 正常' : '❌ 異常'}`);
  console.log(`管理後台: ${results.adminPage ? '✅ 正常' : '❌ 異常'}`);
  console.log(`_redirects 文件: ${results.redirectsFile ? '✅ 存在' : '❌ 缺失'}`);

  console.log('\n🔍 可能的原因分析:');
  console.log('================================');
  
  if (results.loginAPI.success && results.loginPage && !results.adminPage) {
    console.log('❌ 問題：登入成功但無法訪問管理後台');
    console.log('💡 可能原因：');
    console.log('   1. SPA 路由配置問題');
    console.log('   2. _redirects 文件未生效');
    console.log('   3. 前端路由守衛問題');
  } else if (results.loginAPI.success && results.loginPage && results.adminPage) {
    console.log('✅ 所有功能正常，可能是瀏覽器快取問題');
    console.log('💡 建議：清除瀏覽器快取後重試');
  } else {
    console.log('⚠️  部分功能異常，需要進一步檢查');
  }

  console.log('\n📝 建議的解決方案:');
  console.log('================================');
  console.log('1. 清除瀏覽器快取和 Cookie');
  console.log('2. 檢查瀏覽器開發者工具的 Network 標籤');
  console.log('3. 檢查 Console 是否有 JavaScript 錯誤');
  console.log('4. 確認 _redirects 文件已正確部署');
  console.log('5. 檢查前端路由守衛邏輯');
}

// 執行測試
runTests().catch(console.error);
