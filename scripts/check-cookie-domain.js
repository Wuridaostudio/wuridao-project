#!/usr/bin/env node

console.log('🔍 檢查 Cookie Domain 設置');
console.log('==========================\n');

const BACKEND_URL = 'https://wuridao-backend.onrender.com';

async function checkCookieDomain() {
  try {
    console.log('🔐 測試登入並檢查 Cookie Domain...');
    
    // 使用環境變數或提示用戶輸入
    const loginData = {
      username: process.env.ADMIN_USERNAME || 'your-admin-username',
      password: process.env.ADMIN_PASSWORD || 'your-admin-password'
    };
    
    console.log(`📋 使用帳戶: ${loginData.username}`);
    
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
      credentials: 'include'
    });
    
    console.log(`📋 登入響應狀態: ${response.status}`);
    
    // 檢查 Set-Cookie 標頭
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      console.log(`🍪 Set-Cookie: ${setCookie}`);
      
      // 解析 Cookie 屬性
      const cookieParts = setCookie.split(';');
      console.log('\n📋 Cookie 屬性分析:');
      
      for (const part of cookieParts) {
        const trimmed = part.trim();
        if (trimmed.startsWith('Domain=')) {
          const domain = trimmed.replace('Domain=', '');
          console.log(`   Domain: ${domain}`);
          
          if (domain === '.onrender.com') {
            console.log('   ✅ Domain 設置正確');
          } else if (domain === '.wuridaostudio.com') {
            console.log('   ❌ Domain 設置錯誤 - 應該是 .onrender.com');
            console.log('   💡 請檢查 AUTH_COOKIE_DOMAIN 環境變數');
          } else {
            console.log(`   ⚠️  Domain 設置為: ${domain}`);
          }
        } else if (trimmed.startsWith('Secure')) {
          console.log('   Secure: 已設置');
        } else if (trimmed.startsWith('SameSite=')) {
          console.log(`   SameSite: ${trimmed.replace('SameSite=', '')}`);
        } else if (trimmed.startsWith('Path=')) {
          console.log(`   Path: ${trimmed.replace('Path=', '')}`);
        } else if (trimmed.startsWith('Max-Age=')) {
          console.log(`   Max-Age: ${trimmed.replace('Max-Age=', '')}`);
        }
      }
    } else {
      console.log('❌ 沒有 Set-Cookie 標頭');
    }
    
    return setCookie;
  } catch (error) {
    console.log(`❌ 請求失敗: ${error.message}`);
    return null;
  }
}

async function main() {
  const cookie = await checkCookieDomain();
  
  console.log('\n📊 分析結果:');
  console.log('============');
  
  if (cookie) {
    if (cookie.includes('Domain=.onrender.com')) {
      console.log('✅ Cookie Domain 設置正確');
      console.log('🎉 跨域登入應該可以正常工作！');
    } else if (cookie.includes('Domain=.wuridaostudio.com')) {
      console.log('❌ Cookie Domain 設置錯誤');
      console.log('\n💡 解決方案:');
      console.log('1. 在 Render 後端服務中設置環境變數:');
      console.log('   AUTH_COOKIE_DOMAIN=.onrender.com');
      console.log('2. 重新部署後端服務');
      console.log('3. 再次測試登入');
    } else {
      console.log('⚠️ Cookie Domain 設置異常');
      console.log('請檢查環境變數配置');
    }
  } else {
    console.log('❌ 無法獲取 Cookie 信息');
  }
  
  console.log('\n💡 使用說明:');
  console.log('設置環境變數來使用實際帳戶:');
  console.log('export ADMIN_USERNAME=your-actual-username');
  console.log('export ADMIN_PASSWORD=your-actual-password');
}

main().catch(console.error);
