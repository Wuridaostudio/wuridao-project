#!/usr/bin/env node

/**
 * Cookie 配置檢查腳本
 * 用於驗證前後端的 Cookie Domain 配置是否正確
 */

const https = require('https');
const http = require('http');

// 配置
const config = {
  frontendUrl: 'https://wuridao-project.onrender.com',
  backendUrl: 'https://wuridao-backend.onrender.com',
  testEndpoint: '/api/auth/profile', // 需要認證的端點
};

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Cookie-Config-Checker/1.0',
        ...options.headers,
      },
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function checkCorsHeaders() {
  log('\n🔍 檢查 CORS 配置...', 'blue');
  
  try {
    // 發送 OPTIONS 請求檢查 CORS
    const response = await makeRequest(`${config.backendUrl}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': config.frontendUrl,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    log(`✅ CORS 預檢請求狀態: ${response.statusCode}`, 'green');
    
    const corsHeaders = response.headers;
    log(`📋 CORS 標頭:`, 'yellow');
    log(`   Access-Control-Allow-Origin: ${corsHeaders['access-control-allow-origin']}`, 'yellow');
    log(`   Access-Control-Allow-Credentials: ${corsHeaders['access-control-allow-credentials']}`, 'yellow');
    log(`   Access-Control-Allow-Methods: ${corsHeaders['access-control-allow-methods']}`, 'yellow');
    log(`   Access-Control-Allow-Headers: ${corsHeaders['access-control-allow-headers']}`, 'yellow');
    
    if (corsHeaders['access-control-allow-credentials'] === 'true') {
      log('✅ CORS credentials 配置正確', 'green');
    } else {
      log('❌ CORS credentials 配置有問題', 'red');
    }
    
  } catch (error) {
    log(`❌ CORS 檢查失敗: ${error.message}`, 'red');
  }
}

async function checkCookieDomain() {
  log('\n🍪 檢查 Cookie Domain 配置...', 'blue');
  
  try {
    // 嘗試登入以觸發 Cookie 設置
    const loginData = JSON.stringify({
      username: 'test',
      password: 'test',
    });
    
    const response = await makeRequest(`${config.backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': config.frontendUrl,
      },
      body: loginData,
    });

    log(`📋 登入響應狀態: ${response.statusCode}`, 'yellow');
    
    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
      log('🍪 發現 Set-Cookie 標頭:', 'yellow');
      setCookieHeader.forEach((cookie, index) => {
        log(`   Cookie ${index + 1}: ${cookie}`, 'yellow');
        
        // 檢查 domain 設置
        if (cookie.includes('Domain=')) {
          const domainMatch = cookie.match(/Domain=([^;]+)/);
          if (domainMatch) {
            const domain = domainMatch[1];
            log(`   ✅ Domain 設置: ${domain}`, 'green');
            
            if (domain === '.onrender.com') {
              log('   ✅ Domain 配置正確，支援跨域', 'green');
            } else {
              log('   ⚠️  Domain 配置可能需要調整', 'yellow');
            }
          }
        } else {
          log('   ⚠️  未設置 Domain（使用預設 host-only）', 'yellow');
        }
        
        // 檢查其他重要屬性
        if (cookie.includes('Secure')) {
          log('   ✅ Secure 標記已設置', 'green');
        }
        if (cookie.includes('SameSite=')) {
          const sameSiteMatch = cookie.match(/SameSite=([^;]+)/);
          if (sameSiteMatch) {
            log(`   ✅ SameSite 設置: ${sameSiteMatch[1]}`, 'green');
          }
        }
      });
    } else {
      log('❌ 未發現 Set-Cookie 標頭', 'red');
    }
    
  } catch (error) {
    log(`❌ Cookie 檢查失敗: ${error.message}`, 'red');
  }
}

async function checkFrontendConfig() {
  log('\n🌐 檢查前端配置...', 'blue');
  
  try {
    const response = await makeRequest(config.frontendUrl);
    log(`✅ 前端可訪問，狀態: ${response.statusCode}`, 'green');
    
    // 檢查是否有正確的 API 配置
    if (response.data.includes('wuridao-backend.onrender.com')) {
      log('✅ 前端配置包含正確的後端 API URL', 'green');
    } else {
      log('⚠️  前端配置可能需要檢查 API URL', 'yellow');
    }
    
  } catch (error) {
    log(`❌ 前端檢查失敗: ${error.message}`, 'red');
  }
}

async function main() {
  log('🚀 WURIDAO Cookie 配置檢查工具', 'blue');
  log('================================', 'blue');
  
  log(`\n📋 檢查配置:`, 'yellow');
  log(`   前端 URL: ${config.frontendUrl}`, 'yellow');
  log(`   後端 URL: ${config.backendUrl}`, 'yellow');
  
  await checkFrontendConfig();
  await checkCorsHeaders();
  await checkCookieDomain();
  
  log('\n📝 配置建議:', 'blue');
  log('1. 確保後端環境變數 AUTH_COOKIE_DOMAIN=.onrender.com', 'yellow');
  log('2. 確保前端環境變數 NODE_ENV=production', 'yellow');
  log('3. 確保 CORS 配置包含正確的 origin', 'yellow');
  log('4. 確保所有請求都包含 credentials: "include"', 'yellow');
  
  log('\n✅ 檢查完成！', 'green');
}

// 執行檢查
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkCorsHeaders, checkCookieDomain, checkFrontendConfig };
