const https = require('https');

const config = {
  frontendUrl: 'https://wuridao-project.onrender.com',
  backendUrl: 'https://wuridao-backend.onrender.com',
  testCredentials: {
    username: 'mecenas0217@gmail.com',
    password: 'Roguery@099'
  }
};

async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function testFrontendLogging() {
  console.log('🔍 測試前端日誌系統...\n');

  try {
    // 1. 發送測試日誌
    console.log('📊 發送測試前端日誌...');
    
    const logEntry = {
      level: 'info',
      message: '生產端登入診斷測試',
      timestamp: new Date().toISOString(),
      context: 'diagnostic',
      metadata: {
        test: true,
        source: 'production-diagnostic-script',
        userAgent: 'Node.js Test Script',
        url: 'https://wuridao-project.onrender.com/admin/login'
      }
    };

    const logOptions = {
      hostname: 'wuridao-backend.onrender.com',
      port: 443,
      path: '/api/logs/frontend',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(logEntry)),
        'Origin': config.frontendUrl,
        'Referer': config.frontendUrl + '/admin/login',
        'User-Agent': 'Production-Diagnostic-Script/1.0'
      }
    };

    const logResponse = await makeRequest(logOptions, JSON.stringify(logEntry));
    console.log(`📊 前端日誌發送狀態: ${logResponse.statusCode}`);
    
    if (logResponse.statusCode === 201) {
      console.log('✅ 前端日誌發送成功');
    } else {
      console.log('❌ 前端日誌發送失敗');
      console.log('響應:', logResponse.data);
    }

    // 2. 測試登入（使用正確的憑證）
    console.log('\n📊 測試登入...');
    
    const loginData = JSON.stringify({
      username: config.testCredentials.username,
      password: config.testCredentials.password
    });

    const loginOptions = {
      hostname: 'wuridao-backend.onrender.com',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData),
        'Origin': config.frontendUrl,
        'Referer': config.frontendUrl + '/admin/login',
        'User-Agent': 'Production-Diagnostic-Script/1.0'
      }
    };

    const loginResponse = await makeRequest(loginOptions, loginData);
    console.log(`📊 登入響應狀態: ${loginResponse.statusCode}`);
    
    if (loginResponse.statusCode === 201) {
      console.log('✅ 登入成功');
      
      // 檢查 Set-Cookie 標頭
      const setCookieHeader = loginResponse.headers['set-cookie'];
      if (setCookieHeader) {
        console.log('🍪 Set-Cookie 標頭:');
        setCookieHeader.forEach((cookie, index) => {
          console.log(`   ${index + 1}: ${cookie}`);
          
          // 分析 Cookie 內容
          if (cookie.includes('auth-token=')) {
            console.log('   ✅ 包含 auth-token');
          }
          if (cookie.includes('Domain=.onrender.com')) {
            console.log('   ✅ 包含正確的 Domain');
          }
          if (cookie.includes('Secure')) {
            console.log('   ✅ 包含 Secure 標記');
          }
          if (cookie.includes('SameSite=Lax')) {
            console.log('   ✅ 包含 SameSite=Lax');
          }
        });
      }
      
      // 嘗試解析響應
      try {
        const responseData = JSON.parse(loginResponse.data);
        console.log('📊 登入響應內容:', {
          hasAccessToken: !!responseData.access_token,
          tokenLength: responseData.access_token?.length,
          hasUser: !!responseData.user,
          userId: responseData.user?.id,
          username: responseData.user?.username
        });
      } catch (error) {
        console.log('❌ 無法解析登入響應:', error.message);
      }
    } else {
      console.log('❌ 登入失敗');
      console.log('響應:', loginResponse.data);
      
      // 如果是 401 錯誤，可能是密碼問題
      if (loginResponse.statusCode === 401) {
        console.log('💡 提示: 登入失敗可能是密碼不正確');
        console.log('   請確認生產端的管理員密碼是否為: admin123');
      }
    }

    // 3. 測試前端頁面訪問
    console.log('\n📊 測試前端頁面訪問...');
    
    const pageOptions = {
      hostname: 'wuridao-project.onrender.com',
      port: 443,
      path: '/admin/login',
      method: 'GET',
      headers: {
        'User-Agent': 'Production-Diagnostic-Script/1.0'
      }
    };

    const pageResponse = await makeRequest(pageOptions);
    console.log(`📊 前端登入頁面狀態: ${pageResponse.statusCode}`);
    
    if (pageResponse.statusCode === 200) {
      console.log('✅ 前端登入頁面可訪問');
    } else {
      console.log('❌ 前端登入頁面無法訪問');
      console.log('響應:', pageResponse.data);
    }

  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
  }
}

async function main() {
  console.log('🚀 開始生產端登入診斷...\n');
  
  try {
    await testFrontendLogging();
    
    console.log('\n📋 診斷總結:');
    console.log('✅ 前端日誌系統測試完成');
    console.log('📝 請檢查生產端後端日誌，看是否有前端日誌被接收');
    console.log('🔍 如果登入失敗，請確認密碼是否正確');
    console.log('🌐 如果前端頁面無法訪問，可能是前端部署問題');
    
  } catch (error) {
    console.error('❌ 診斷過程出錯:', error.message);
  }
}

main();
