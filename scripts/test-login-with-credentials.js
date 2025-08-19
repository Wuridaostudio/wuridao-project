const https = require('https');

console.log('🔍 測試不同認證憑據');
console.log('================================');

// 測試不同的認證憑據
const credentials = [
  { username: 'mecenas0217@gmail.com', password: 'admin123' },
  { username: 'admin', password: 'admin123' },
  { username: 'mecenas0217@gmail.com', password: 'password' },
  { username: 'admin', password: 'password' }
];

async function testLogin(credential, index) {
  console.log(`\n📡 測試認證 ${index + 1}: ${credential.username}`);
  
  return new Promise((resolve) => {
    const postData = JSON.stringify(credential);

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
      console.log(`   ✅ 狀態: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 201) {
            console.log(`   ✅ 登入成功: ${result.user?.username}`);
            console.log(`   ✅ Token 長度: ${result.access_token?.length || 0}`);
            
            // 檢查 Cookie
            const cookies = res.headers['set-cookie'];
            if (cookies) {
              console.log(`   ✅ 收到 ${cookies.length} 個 Cookie`);
            }
            
            resolve({ success: true, credential, result });
          } else {
            console.log(`   ❌ 登入失敗: ${result.message || '未知錯誤'}`);
            resolve({ success: false, credential, error: result.message });
          }
        } catch (e) {
          console.log(`   ❌ 解析失敗: ${data}`);
          resolve({ success: false, credential, error: data });
        }
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ 錯誤: ${err.message}`);
      resolve({ success: false, credential, error: err.message });
    });

    req.write(postData);
    req.end();
  });
}

// 測試後端健康狀態
async function testBackendHealth() {
  console.log('\n🏥 測試後端健康狀態...');
  
  return new Promise((resolve) => {
    const req = https.get('https://wuridao-backend.onrender.com/api/health', (res) => {
      console.log(`✅ 後端狀態: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`✅ 後端回應: ${result.message || 'OK'}`);
          resolve(true);
        } catch (e) {
          console.log(`✅ 後端回應: ${data}`);
          resolve(true);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ 後端錯誤: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      console.log('❌ 後端超時');
      req.destroy();
      resolve(false);
    });
  });
}

// 主測試函數
async function runTests() {
  console.log('🚀 開始認證測試...\n');
  
  // 先測試後端健康狀態
  const backendHealthy = await testBackendHealth();
  
  if (!backendHealthy) {
    console.log('\n❌ 後端不健康，跳過認證測試');
    return;
  }
  
  console.log('\n🔐 測試不同認證憑據:');
  console.log('================================');
  
  const results = [];
  for (let i = 0; i < credentials.length; i++) {
    const result = await testLogin(credentials[i], i);
    results.push(result);
  }

  console.log('\n📊 測試結果總結:');
  console.log('================================');
  
  const successfulLogins = results.filter(r => r.success);
  const failedLogins = results.filter(r => !r.success);
  
  console.log(`✅ 成功登入: ${successfulLogins.length}`);
  console.log(`❌ 失敗登入: ${failedLogins.length}`);
  
  if (successfulLogins.length > 0) {
    console.log('\n🎉 找到有效的認證憑據！');
    successfulLogins.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.credential.username} / ${result.credential.password}`);
    });
  } else {
    console.log('\n⚠️  沒有找到有效的認證憑據');
    console.log('💡 請檢查環境變數中的管理員帳號密碼');
  }
  
  console.log('\n💡 建議:');
  console.log('   1. 檢查後端環境變數 ADMIN_USERNAME 和 ADMIN_PASSWORD');
  console.log('   2. 確認資料庫中的管理員帳號');
  console.log('   3. 檢查密碼是否正確');
}

// 執行測試
runTests().catch(console.error);
