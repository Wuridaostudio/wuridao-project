const https = require('https');

console.log('🔍 檢查當前部署狀態');
console.log('================================');

async function testCurrentDeployment() {
  console.log('\n📡 測試前端部署狀態...');
  
  // 測試首頁
  const homeResult = await new Promise((resolve) => {
    const req = https.get('https://wuridao-project.onrender.com/', (res) => {
      console.log(`✅ 首頁狀態: ${res.statusCode}`);
      resolve({ statusCode: res.statusCode, headers: res.headers });
    });

    req.on('error', (err) => {
      console.log(`❌ 首頁錯誤: ${err.message}`);
      resolve({ error: err.message });
    });

    req.setTimeout(10000, () => {
      console.log('❌ 首頁超時');
      req.destroy();
      resolve({ error: 'timeout' });
    });
  });

  // 測試登入頁面
  const loginResult = await new Promise((resolve) => {
    const req = https.get('https://wuridao-project.onrender.com/admin/login', (res) => {
      console.log(`✅ 登入頁面狀態: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ 
          statusCode: res.statusCode, 
          headers: res.headers,
          data: data.substring(0, 200) + '...'
        });
      });
    });

    req.on('error', (err) => {
      console.log(`❌ 登入頁面錯誤: ${err.message}`);
      resolve({ error: err.message });
    });

    req.setTimeout(10000, () => {
      console.log('❌ 登入頁面超時');
      req.destroy();
      resolve({ error: 'timeout' });
    });
  });

  // 測試管理後台
  const adminResult = await new Promise((resolve) => {
    const req = https.get('https://wuridao-project.onrender.com/admin', (res) => {
      console.log(`✅ 管理後台狀態: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ 
          statusCode: res.statusCode, 
          headers: res.headers,
          data: data.substring(0, 200) + '...'
        });
      });
    });

    req.on('error', (err) => {
      console.log(`❌ 管理後台錯誤: ${err.message}`);
      resolve({ error: err.message });
    });

    req.setTimeout(10000, () => {
      console.log('❌ 管理後台超時');
      req.destroy();
      resolve({ error: 'timeout' });
    });
  });

  // 測試後端 API
  const apiResult = await new Promise((resolve) => {
    const req = https.get('https://wuridao-backend.onrender.com/api/auth/login', (res) => {
      console.log(`✅ 後端 API 狀態: ${res.statusCode}`);
      resolve({ statusCode: res.statusCode, headers: res.headers });
    });

    req.on('error', (err) => {
      console.log(`❌ 後端 API 錯誤: ${err.message}`);
      resolve({ error: err.message });
    });

    req.setTimeout(10000, () => {
      console.log('❌ 後端 API 超時');
      req.destroy();
      resolve({ error: 'timeout' });
    });
  });

  // 總結
  console.log('\n📊 部署狀態總結:');
  console.log('================================');
  console.log(`首頁: ${homeResult.statusCode === 200 ? '✅ 正常' : '❌ 異常'}`);
  console.log(`登入頁面: ${loginResult.statusCode === 200 ? '✅ 正常' : '❌ 異常'}`);
  console.log(`管理後台: ${adminResult.statusCode === 200 ? '✅ 正常' : '❌ 異常'}`);
  console.log(`後端 API: ${apiResult.statusCode === 405 ? '✅ 正常' : '❌ 異常'}`);

  if (loginResult.statusCode === 404) {
    console.log('\n⚠️  登入頁面返回 404，可能的原因：');
    console.log('1. Render 部署還在進行中');
    console.log('2. _redirects 文件沒有生效');
    console.log('3. 需要清除瀏覽器快取');
    console.log('\n💡 建議：');
    console.log('- 等待 5-10 分鐘讓部署完成');
    console.log('- 清除瀏覽器快取和 Cookie');
    console.log('- 使用無痕模式測試');
  }

  if (loginResult.statusCode === 200) {
    console.log('\n🎉 登入頁面正常！');
    console.log('💡 現在可以嘗試登入測試');
  }
}

// 執行測試
testCurrentDeployment().catch(console.error);
