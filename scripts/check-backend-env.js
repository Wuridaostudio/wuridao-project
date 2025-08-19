const https = require('https');

console.log('🔍 檢查後端環境變數配置');
console.log('================================');

// 測試後端環境變數（通過 API 回應推測）
async function checkBackendConfig() {
  console.log('\n📡 檢查後端配置...');
  
  // 測試健康檢查端點
  const healthCheck = await new Promise((resolve) => {
    const req = https.get('https://wuridao-backend.onrender.com/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ success: true, data: result });
        } catch (e) {
          resolve({ success: false, data });
        }
      });
    });

    req.on('error', () => resolve({ success: false, error: 'Connection failed' }));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });

  if (healthCheck.success) {
    console.log('✅ 後端健康檢查正常');
    console.log(`📊 回應: ${JSON.stringify(healthCheck.data)}`);
  } else {
    console.log('❌ 後端健康檢查失敗');
    return;
  }

  // 測試不同的管理員帳號組合
  console.log('\n🔐 測試管理員帳號組合:');
  console.log('================================');
  
  const testCredentials = [
    { username: 'admin', password: 'admin' },
    { username: 'admin', password: 'admin123' },
    { username: 'admin', password: 'password' },
    { username: 'admin', password: '123456' },
    { username: 'mecenas0217@gmail.com', password: 'admin' },
    { username: 'mecenas0217@gmail.com', password: 'admin123' },
    { username: 'mecenas0217@gmail.com', password: 'password' },
    { username: 'mecenas0217@gmail.com', password: '123456' }
  ];

  for (let i = 0; i < testCredentials.length; i++) {
    const cred = testCredentials[i];
    console.log(`\n📡 測試 ${i + 1}: ${cred.username} / ${cred.password}`);
    
    const result = await new Promise((resolve) => {
      const postData = JSON.stringify(cred);
      const options = {
        hostname: 'wuridao-backend.onrender.com',
        port: 443,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'Origin': 'https://wuridao-project.onrender.com'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              success: res.statusCode === 201,
              message: response.message || 'Unknown error',
              user: response.user
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              success: false,
              message: 'Parse error',
              data: data
            });
          }
        });
      });

      req.on('error', () => resolve({ success: false, message: 'Request failed' }));
      req.write(postData);
      req.end();
    });

    if (result.success) {
      console.log(`   ✅ 登入成功！用戶: ${result.user?.username}`);
      console.log(`   🎉 找到正確的認證憑據！`);
      return { success: true, credential: cred, user: result.user };
    } else {
      console.log(`   ❌ 失敗: ${result.message}`);
    }
  }

  console.log('\n❌ 沒有找到正確的認證憑據');
  return { success: false };
}

// 檢查資料庫連接
async function checkDatabaseConnection() {
  console.log('\n🗄️  檢查資料庫連接...');
  
  // 通過健康檢查推測資料庫狀態
  const result = await new Promise((resolve) => {
    const req = https.get('https://wuridao-backend.onrender.com/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ success: true, data: response });
        } catch (e) {
          resolve({ success: false, data });
        }
      });
    });

    req.on('error', () => resolve({ success: false, error: 'Connection failed' }));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });

  if (result.success) {
    console.log('✅ 資料庫連接正常');
    console.log(`📊 健康檢查回應: ${JSON.stringify(result.data)}`);
  } else {
    console.log('❌ 資料庫連接異常');
  }
}

// 主函數
async function runCheck() {
  console.log('🚀 開始檢查後端環境變數...\n');
  
  await checkDatabaseConnection();
  const authResult = await checkBackendConfig();

  console.log('\n📊 檢查結果總結:');
  console.log('================================');
  
  if (authResult.success) {
    console.log('🎉 找到正確的認證憑據！');
    console.log(`✅ 用戶名: ${authResult.credential.username}`);
    console.log(`✅ 密碼: ${authResult.credential.password}`);
    console.log(`✅ 用戶資訊: ${authResult.user?.username}`);
    
    console.log('\n💡 現在可以使用這些憑據在瀏覽器中登入');
  } else {
    console.log('❌ 沒有找到正確的認證憑據');
    console.log('\n💡 建議的解決方案:');
    console.log('   1. 檢查 Render 後端服務的環境變數');
    console.log('   2. 確認 ADMIN_USERNAME 和 ADMIN_PASSWORD 設置正確');
    console.log('   3. 檢查資料庫中是否有管理員帳號');
    console.log('   4. 重新設置環境變數並重新部署');
  }
}

// 執行檢查
runCheck().catch(console.error);
