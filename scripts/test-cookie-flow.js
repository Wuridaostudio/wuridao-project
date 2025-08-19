const https = require('https');

console.log('🔍 測試 Cookie 流程');
console.log('================================');

// 模擬瀏覽器的 Cookie 處理
class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  setCookie(cookieString) {
    const [nameValue] = cookieString.split(';');
    const [name, value] = nameValue.split('=');
    this.cookies.set(name.trim(), value.trim());
    console.log(`🍪 設置 Cookie: ${name.trim()} = ${value.trim()}`);
  }

  getCookie(name) {
    return this.cookies.get(name);
  }

  getAllCookies() {
    return Object.fromEntries(this.cookies);
  }
}

async function testLoginAndCookieFlow() {
  console.log('\n📡 測試登入和 Cookie 流程...');
  
  const cookieJar = new CookieJar();
  
  // 1. 執行登入
  const loginResult = await new Promise((resolve) => {
    const postData = JSON.stringify({
      username: 'mecenas0217@gmail.com',
      password: 'Roguery@099'
    });

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
      console.log(`✅ 登入狀態: ${res.statusCode}`);
      
      // 保存 Cookie
      const setCookieHeaders = res.headers['set-cookie'];
      if (setCookieHeaders) {
        setCookieHeaders.forEach(cookie => {
          cookieJar.setCookie(cookie);
        });
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ success: res.statusCode === 201, result, cookies: cookieJar.getAllCookies() });
        } catch (e) {
          resolve({ success: false, error: data });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    req.write(postData);
    req.end();
  });

  if (!loginResult.success) {
    console.log('❌ 登入失敗');
    return;
  }

  console.log('✅ 登入成功');
  console.log('🍪 收到的 Cookie:', loginResult.cookies);

  // 2. 測試訪問管理後台（帶上 Cookie）
  console.log('\n🔐 測試訪問管理後台...');
  
  const adminResult = await new Promise((resolve) => {
    const cookieHeader = Object.entries(loginResult.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');

    const options = {
      hostname: 'wuridao-project.onrender.com',
      port: 443,
      path: '/admin',
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`✅ 管理後台狀態: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ 
          statusCode: res.statusCode, 
          data: data.substring(0, 500) + '...',
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    req.end();
  });

  console.log('📊 管理後台回應:', adminResult);

  // 3. 測試 API 調用（帶上 Cookie）
  console.log('\n🔌 測試 API 調用...');
  
  const apiResult = await new Promise((resolve) => {
    const cookieHeader = Object.entries(loginResult.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');

    const options = {
      hostname: 'wuridao-backend.onrender.com',
      port: 443,
      path: '/api/auth/profile',
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Origin': 'https://wuridao-project.onrender.com'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`✅ API 狀態: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ success: res.statusCode === 200, result });
        } catch (e) {
          resolve({ success: false, data });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    req.end();
  });

  console.log('📊 API 回應:', apiResult);

  // 總結
  console.log('\n📊 測試結果總結:');
  console.log('================================');
  console.log(`登入: ${loginResult.success ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`Cookie 數量: ${Object.keys(loginResult.cookies).length}`);
  console.log(`管理後台: ${adminResult.statusCode === 200 ? '✅ 可訪問' : '❌ 無法訪問'}`);
  console.log(`API 調用: ${apiResult.success ? '✅ 成功' : '❌ 失敗'}`);

  if (loginResult.success && Object.keys(loginResult.cookies).length > 0) {
    console.log('\n🎉 Cookie 設置成功！');
    console.log('💡 問題可能在前端 JavaScript 的 Cookie 讀取邏輯');
  } else {
    console.log('\n❌ Cookie 設置失敗');
  }
}

// 執行測試
testLoginAndCookieFlow().catch(console.error);
