const https = require('https');

async function testCurrentStatus() {
  console.log('🔍 檢查生產端當前狀態...\n');
  
  // 測試登入頁面
  console.log('1️⃣ 測試 /admin/login...');
  const loginResult = await makeRequest('/admin/login');
  console.log(`   狀態碼: ${loginResult.statusCode}`);
  console.log(`   內容長度: ${loginResult.contentLength}`);
  console.log(`   包含重定向腳本: ${loginResult.hasRedirectScript}`);
  
  // 測試首頁
  console.log('\n2️⃣ 測試首頁...');
  const homeResult = await makeRequest('/');
  console.log(`   狀態碼: ${homeResult.statusCode}`);
  console.log(`   內容長度: ${homeResult.contentLength}`);
  console.log(`   包含 Nuxt 應用: ${homeResult.hasNuxtApp}`);
  
  // 測試直接訪問 index.html
  console.log('\n3️⃣ 測試 /index.html...');
  const indexResult = await makeRequest('/index.html');
  console.log(`   狀態碼: ${indexResult.statusCode}`);
  console.log(`   內容長度: ${indexResult.contentLength}`);
  
  // 檢查首頁內容
  if (homeResult.statusCode === 200) {
    console.log('\n4️⃣ 分析首頁內容...');
    console.log(`   包含 "admin": ${homeResult.content.includes('admin')}`);
    console.log(`   包含 "login": ${homeResult.content.includes('login')}`);
    console.log(`   包含 "管理員": ${homeResult.content.includes('管理員')}`);
    console.log(`   包含 "登入": ${homeResult.content.includes('登入')}`);
    
    // 檢查是否有路由配置
    if (homeResult.content.includes('_nuxt')) {
      console.log('   ✅ 首頁包含 Nuxt 應用');
    } else {
      console.log('   ❌ 首頁未包含 Nuxt 應用');
    }
  }
  
  console.log('\n📊 問題分析:');
  if (loginResult.statusCode === 404 && loginResult.hasRedirectScript) {
    console.log('   ✅ 404.html 重定向正常');
  } else {
    console.log('   ❌ 404.html 重定向異常');
  }
  
  if (homeResult.statusCode === 200 && homeResult.hasNuxtApp) {
    console.log('   ✅ 首頁 Nuxt 應用正常');
  } else {
    console.log('   ❌ 首頁 Nuxt 應用異常');
  }
}

async function makeRequest(path) {
  const options = {
    hostname: 'wuridao-project.onrender.com',
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          contentLength: data.length,
          content: data,
          hasRedirectScript: data.includes('window.location.href'),
          hasNuxtApp: data.includes('_nuxt') || data.includes('__NUXT__')
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

testCurrentStatus().catch(console.error);
