const https = require('https');
const http = require('http');

const config = {
  local: {
    frontendUrl: 'http://localhost:3001',
    backendUrl: 'http://localhost:3000',
    testCredentials: {
      username: 'mecenas0217@gmail.com',
      password: 'Roguery@099'
    }
  },
  production: {
    frontendUrl: 'https://wuridao-project.onrender.com',
    backendUrl: 'https://wuridao-backend.onrender.com',
    testCredentials: {
      username: 'mecenas0217@gmail.com',
      password: 'Roguery@099'
    }
  }
};

async function makeRequest(options, data = null, isHttps = false) {
  return new Promise((resolve, reject) => {
    const req = isHttps ? https.request(options) : http.request(options);
    
    req.on('response', (res) => {
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

async function testLogin(environment, envName) {
  console.log(`\n🔍 測試 ${envName} 登入...`);
  
  try {
    const loginData = JSON.stringify({
      username: environment.testCredentials.username,
      password: environment.testCredentials.password
    });

    const loginOptions = {
      hostname: environment.backendUrl.replace(/^https?:\/\//, ''),
      port: environment.backendUrl.startsWith('https') ? 443 : 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData),
        'Origin': environment.frontendUrl,
        'Referer': environment.frontendUrl + '/admin/login',
        'User-Agent': 'Compare-Script/1.0'
      }
    };

    const loginResponse = await makeRequest(
      loginOptions, 
      loginData, 
      environment.backendUrl.startsWith('https')
    );
    
    console.log(`📊 ${envName} 登入響應狀態: ${loginResponse.statusCode}`);
    
    if (loginResponse.statusCode === 201) {
      console.log(`✅ ${envName} 登入成功`);
      
      // 檢查 Set-Cookie 標頭
      const setCookieHeader = loginResponse.headers['set-cookie'];
      if (setCookieHeader) {
        console.log(`🍪 ${envName} Set-Cookie 標頭:`);
        setCookieHeader.forEach((cookie, index) => {
          console.log(`   ${index + 1}: ${cookie}`);
          
          // 分析 Cookie 內容
          if (cookie.includes('auth-token=')) {
            console.log('   ✅ 包含 auth-token');
          }
          if (cookie.includes('Domain=')) {
            console.log('   ✅ 包含 Domain 設置');
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
        console.log(`📊 ${envName} 登入響應內容:`, {
          hasAccessToken: !!responseData.access_token,
          tokenLength: responseData.access_token?.length,
          hasUser: !!responseData.user,
          userId: responseData.user?.id,
          username: responseData.user?.username
        });
      } catch (error) {
        console.log(`❌ ${envName} 無法解析登入響應:`, error.message);
      }
      
      return { success: true, response: loginResponse };
    } else {
      console.log(`❌ ${envName} 登入失敗`);
      console.log(`響應:`, loginResponse.data);
      return { success: false, response: loginResponse };
    }
    
  } catch (error) {
    console.error(`❌ ${envName} 測試失敗:`, error.message);
    return { success: false, error: error.message };
  }
}

async function testFrontendPage(environment, envName) {
  console.log(`\n🔍 測試 ${envName} 前端頁面...`);
  
  try {
    const pageOptions = {
      hostname: environment.frontendUrl.replace(/^https?:\/\//, ''),
      port: environment.frontendUrl.startsWith('https') ? 443 : 3001,
      path: '/admin/login',
      method: 'GET',
      headers: {
        'User-Agent': 'Compare-Script/1.0'
      }
    };

    const pageResponse = await makeRequest(
      pageOptions, 
      null, 
      environment.frontendUrl.startsWith('https')
    );
    
    console.log(`📊 ${envName} 前端頁面狀態: ${pageResponse.statusCode}`);
    
    if (pageResponse.statusCode === 200) {
      console.log(`✅ ${envName} 前端頁面可訪問`);
      
      // 檢查 HTML 內容中的配置
      const html = pageResponse.data;
      if (html.includes('siteUrl')) {
        const siteUrlMatch = html.match(/siteUrl":"([^"]+)"/);
        if (siteUrlMatch) {
          console.log(`🌐 ${envName} siteUrl: ${siteUrlMatch[1]}`);
        }
      }
      
      if (html.includes('apiBaseUrl')) {
        const apiBaseUrlMatch = html.match(/apiBaseUrl":"([^"]+)"/);
        if (apiBaseUrlMatch) {
          console.log(`🔗 ${envName} apiBaseUrl: ${apiBaseUrlMatch[1]}`);
        }
      }
      
      return { success: true, response: pageResponse };
    } else {
      console.log(`❌ ${envName} 前端頁面無法訪問`);
      console.log(`響應:`, pageResponse.data.substring(0, 200) + '...');
      return { success: false, response: pageResponse };
    }
    
  } catch (error) {
    console.error(`❌ ${envName} 前端測試失敗:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 開始對比本地端和生產端...\n');
  
  try {
    // 測試本地端
    console.log('📍 本地端測試');
    const localLogin = await testLogin(config.local, '本地端');
    const localPage = await testFrontendPage(config.local, '本地端');
    
    // 測試生產端
    console.log('\n📍 生產端測試');
    const productionLogin = await testLogin(config.production, '生產端');
    const productionPage = await testFrontendPage(config.production, '生產端');
    
    // 對比結果
    console.log('\n📋 對比結果:');
    console.log('='.repeat(50));
    
    // 登入對比
    console.log('🔐 登入狀態對比:');
    console.log(`   本地端: ${localLogin.success ? '✅ 成功' : '❌ 失敗'}`);
    console.log(`   生產端: ${productionLogin.success ? '✅ 成功' : '❌ 失敗'}`);
    
    if (localLogin.success && !productionLogin.success) {
      console.log('   ⚠️  本地端成功但生產端失敗 - 這是問題所在！');
    }
    
    // 前端頁面對比
    console.log('\n🌐 前端頁面對比:');
    console.log(`   本地端: ${localPage.success ? '✅ 可訪問' : '❌ 無法訪問'}`);
    console.log(`   生產端: ${productionPage.success ? '✅ 可訪問' : '❌ 無法訪問'}`);
    
    if (localPage.success && !productionPage.success) {
      console.log('   ⚠️  本地端可訪問但生產端無法訪問 - 這是問題所在！');
    }
    
    // 具體差異分析
    console.log('\n🔍 具體差異分析:');
    
    if (localLogin.success && productionLogin.success) {
      const localCookie = localLogin.response.headers['set-cookie'];
      const productionCookie = productionLogin.response.headers['set-cookie'];
      
      if (localCookie && productionCookie) {
        console.log('🍪 Cookie 設置差異:');
        console.log(`   本地端: ${localCookie[0]}`);
        console.log(`   生產端: ${productionCookie[0]}`);
        
        // 檢查 Domain 設置
        const localHasDomain = localCookie[0].includes('Domain=');
        const productionHasDomain = productionCookie[0].includes('Domain=');
        
        console.log(`   本地端 Domain: ${localHasDomain ? '✅ 有' : '❌ 無'}`);
        console.log(`   生產端 Domain: ${productionHasDomain ? '✅ 有' : '❌ 無'}`);
        
        if (!localHasDomain && productionHasDomain) {
          console.log('   ✅ 這是正常的 - 本地端不需要 Domain，生產端需要');
        }
      }
    }
    
    console.log('\n💡 建議:');
    if (localLogin.success && !productionLogin.success) {
      console.log('   1. 檢查生產端密碼是否正確');
      console.log('   2. 檢查生產端環境變數設置');
    }
    
    if (localPage.success && !productionPage.success) {
      console.log('   1. 檢查前端部署是否成功');
      console.log('   2. 檢查前端路由配置');
    }
    
  } catch (error) {
    console.error('❌ 對比過程出錯:', error.message);
  }
}

main();
