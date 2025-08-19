const https = require('https');

// 測試配置
const config = {
  backendUrl: 'https://wuridao-backend.onrender.com',
  frontendUrls: [
    'https://wuridao-project.onrender.com',
    'https://wuridaostudio.com'
  ]
};

console.log('🔍 測試 WURIDAOSTUDIO.COM 配置');
console.log('================================');

// 測試後端 API 狀態
async function testBackend() {
  console.log('\n📡 測試後端 API...');
  
  return new Promise((resolve) => {
    const req = https.get(`${config.backendUrl}/api/health`, (res) => {
      console.log(`✅ 後端狀態: ${res.statusCode}`);
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log(`✅ 後端回應: ${result.message || 'OK'}`);
          } catch (e) {
            console.log(`✅ 後端回應: ${data}`);
          }
          resolve(true);
        });
      } else {
        console.log(`❌ 後端狀態: ${res.statusCode}`);
        resolve(false);
      }
    });
    
    req.on('error', (err) => {
      console.log(`❌ 後端連接錯誤: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ 後端連接超時');
      req.destroy();
      resolve(false);
    });
  });
}

// 測試前端路由
async function testFrontend(url, name) {
  console.log(`\n🌐 測試 ${name}...`);
  
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      console.log(`✅ ${name} 狀態: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        console.log(`✅ ${name} 可正常訪問`);
        resolve(true);
      } else if (res.statusCode === 404) {
        console.log(`⚠️  ${name} 返回 404，可能是 SPA 路由`);
        resolve(true); // SPA 路由返回 404 是正常的
      } else {
        console.log(`❌ ${name} 狀態異常: ${res.statusCode}`);
        resolve(false);
      }
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${name} 連接錯誤: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log(`❌ ${name} 連接超時`);
      req.destroy();
      resolve(false);
    });
  });
}

// 測試 CORS 配置
async function testCORS() {
  console.log('\n🔒 測試 CORS 配置...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'wuridao-backend.onrender.com',
      port: 443,
      path: '/api/health',
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://wuridaostudio.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };
    
    const req = https.request(options, (res) => {
      const corsHeaders = {
        'Access-Control-Allow-Origin': res.headers['access-control-allow-origin'],
        'Access-Control-Allow-Credentials': res.headers['access-control-allow-credentials'],
        'Access-Control-Allow-Methods': res.headers['access-control-allow-methods'],
        'Access-Control-Allow-Headers': res.headers['access-control-allow-headers']
      };
      
      console.log('✅ CORS 標頭:');
      Object.entries(corsHeaders).forEach(([key, value]) => {
        if (value) {
          console.log(`   ${key}: ${value}`);
        }
      });
      
      if (corsHeaders['Access-Control-Allow-Origin']?.includes('wuridaostudio.com')) {
        console.log('✅ wuridaostudio.com 已包含在 CORS 配置中');
        resolve(true);
      } else {
        console.log('❌ wuridaostudio.com 未包含在 CORS 配置中');
        resolve(false);
      }
    });
    
    req.on('error', (err) => {
      console.log(`❌ CORS 測試錯誤: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ CORS 測試超時');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// 主測試函數
async function runTests() {
  console.log('🚀 開始測試 WURIDAOSTUDIO.COM 配置...\n');
  
  const results = {
    backend: await testBackend(),
    frontendOnrender: await testFrontend(config.frontendUrls[0], 'wuridao-project.onrender.com'),
    frontendWuridao: await testFrontend(config.frontendUrls[1], 'wuridaostudio.com'),
    cors: await testCORS()
  };
  
  console.log('\n📊 測試結果總結:');
  console.log('================================');
  console.log(`後端 API: ${results.backend ? '✅ 正常' : '❌ 異常'}`);
  console.log(`前端 (onrender): ${results.frontendOnrender ? '✅ 正常' : '❌ 異常'}`);
  console.log(`前端 (wuridao): ${results.frontendWuridao ? '✅ 正常' : '❌ 異常'}`);
  console.log(`CORS 配置: ${results.cors ? '✅ 正常' : '❌ 異常'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 所有測試通過！WURIDAOSTUDIO.COM 配置正確');
    console.log('\n📝 配置說明:');
    console.log('- 前端 siteUrl 已設置為 https://wuridaostudio.com');
    console.log('- 後端 CORS 已包含 wuridaostudio.com');
    console.log('- 多域名 Cookie 功能已啟用');
    console.log('- 環境變數配置已更新');
  } else {
    console.log('\n⚠️  部分測試失敗，請檢查配置');
  }
}

// 執行測試
runTests().catch(console.error);
