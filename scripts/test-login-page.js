const https = require('https');

// 測試生產端登入頁面
async function testLoginPage() {
  console.log('🔍 測試生產端登入頁面...');
  
  const options = {
    hostname: 'wuridao-project.onrender.com',
    port: 443,
    path: '/admin/login',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`📊 狀態碼: ${res.statusCode}`);
      console.log(`📋 響應頭:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📄 響應內容長度: ${data.length} 字符`);
        console.log(`📄 響應內容前500字符:`);
        console.log(data.substring(0, 500));
        
        if (data.includes('管理員登入') || data.includes('admin/login')) {
          console.log('✅ 登入頁面內容正確');
        } else if (data.includes('window.location.href')) {
          console.log('⚠️ 檢測到重定向腳本');
        } else {
          console.log('❌ 登入頁面內容異常');
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          contentLength: data.length,
          hasLoginContent: data.includes('管理員登入'),
          hasRedirectScript: data.includes('window.location.href')
        });
      });
    });

    req.on('error', (error) => {
      console.error('❌ 請求錯誤:', error);
      reject(error);
    });

    req.end();
  });
}

// 測試首頁
async function testHomePage() {
  console.log('\n🔍 測試生產端首頁...');
  
  const options = {
    hostname: 'wuridao-project.onrender.com',
    port: 443,
    path: '/',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`📊 首頁狀態碼: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📄 首頁內容長度: ${data.length} 字符`);
        resolve({
          statusCode: res.statusCode,
          contentLength: data.length
        });
      });
    });

    req.on('error', (error) => {
      console.error('❌ 首頁請求錯誤:', error);
      reject(error);
    });

    req.end();
  });
}

// 執行測試
async function runTests() {
  try {
    console.log('🚀 開始測試生產端頁面...\n');
    
    const loginResult = await testLoginPage();
    const homeResult = await testHomePage();
    
    console.log('\n📊 測試結果總結:');
    console.log(`登入頁面狀態: ${loginResult.statusCode}`);
    console.log(`登入頁面包含登入內容: ${loginResult.hasLoginContent}`);
    console.log(`登入頁面包含重定向腳本: ${loginResult.hasRedirectScript}`);
    console.log(`首頁狀態: ${homeResult.statusCode}`);
    
    if (loginResult.statusCode === 200 && loginResult.hasLoginContent) {
      console.log('✅ 登入頁面正常');
    } else if (loginResult.hasRedirectScript) {
      console.log('⚠️ 登入頁面被重定向');
    } else {
      console.log('❌ 登入頁面異常');
    }
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }
}

runTests();
