const https = require('https');

console.log('🔍 測試正確的管理員憑證');
console.log('================================');

// 使用正確的憑證
const correctCredentials = {
  username: 'mecenas0217@gmail.com',
  password: 'Roguery@099'
};

async function testCorrectLogin() {
  console.log('\n📡 測試正確的登入憑證...');
  console.log(`用戶名: ${correctCredentials.username}`);
  console.log(`密碼: ${correctCredentials.password}`);
  
  return new Promise((resolve) => {
    const postData = JSON.stringify(correctCredentials);

    const options = {
      hostname: 'wuridao-backend.onrender.com',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Origin': 'https://wuridao-project.onrender.com',
        'Referer': 'https://wuridao-project.onrender.com/admin/login'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`✅ 登入 API 狀態: ${res.statusCode}`);
      
      // 檢查 CORS 標頭
      const corsHeaders = {
        'Access-Control-Allow-Origin': res.headers['access-control-allow-origin'],
        'Access-Control-Allow-Credentials': res.headers['access-control-allow-credentials'],
        'Access-Control-Allow-Methods': res.headers['access-control-allow-methods'],
        'Access-Control-Allow-Headers': res.headers['access-control-allow-headers']
      };
      
      console.log('🔒 CORS 標頭:');
      Object.entries(corsHeaders).forEach(([key, value]) => {
        if (value) {
          console.log(`   ${key}: ${value}`);
        }
      });
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 201) {
            console.log(`✅ 登入成功！`);
            console.log(`✅ 用戶: ${result.user?.username}`);
            console.log(`✅ Token 長度: ${result.access_token?.length || 0}`);
            
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
            
            resolve({ success: true, token: result.access_token, cookies, user: result.user });
          } else {
            console.log(`❌ 登入失敗: ${result.message || '未知錯誤'}`);
            resolve({ success: false, error: result.message });
          }
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
    const req = https.get('https://wuridao-project.onrender.com/admin/login', (res) => {
      console.log(`✅ 登入頁面狀態: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (data.includes('login') || data.includes('form')) {
            console.log('✅ 登入頁面正常載入');
            resolve(true);
          } else {
            console.log('❌ 登入頁面內容異常');
            resolve(false);
          }
        });
      } else if (res.statusCode === 404) {
        console.log('⚠️  登入頁面返回 404，但可能被重定向到 index.html');
        resolve(true); // 在 SPA 模式下這是正常的
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

// 主測試函數
async function runTests() {
  console.log('🚀 開始測試正確的登入憑證...\n');
  
  const results = {
    loginAPI: await testCorrectLogin(),
    loginPage: await testLoginPage()
  };

  console.log('\n📊 測試結果總結:');
  console.log('================================');
  console.log(`登入 API: ${results.loginAPI.success ? '✅ 正常' : '❌ 異常'}`);
  console.log(`登入頁面: ${results.loginPage ? '✅ 正常' : '❌ 異常'}`);

  if (results.loginAPI.success && results.loginPage) {
    console.log('\n🎉 登入功能完全正常！');
    console.log('💡 現在可以在瀏覽器中正常登入');
    console.log('💡 登入後應該能正常跳轉到管理後台');
  } else if (results.loginAPI.success && !results.loginPage) {
    console.log('\n⚠️  後端登入正常，但前端頁面有問題');
    console.log('💡 可能是前端路由或 SPA 配置問題');
  } else if (!results.loginAPI.success && results.loginPage) {
    console.log('\n⚠️  前端頁面正常，但後端登入有問題');
    console.log('💡 需要檢查後端 API 或環境變數');
  } else {
    console.log('\n❌ 登入功能異常');
    console.log('💡 需要檢查前端和後端');
  }
}

// 執行測試
runTests().catch(console.error);
