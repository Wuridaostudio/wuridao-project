#!/usr/bin/env node

console.log('🔍 測試多域名 Cookie 功能');
console.log('==========================\n');

const BACKEND_URL = 'https://wuridao-backend.onrender.com';

async function testMultiDomainCookies() {
  try {
    console.log('🔐 測試登入並檢查多域名 Cookie...');
    
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
    
    // 檢查所有 Set-Cookie 標頭
    const setCookieHeaders = response.headers.get('set-cookie');
    if (setCookieHeaders) {
      console.log(`🍪 Set-Cookie 標頭:`);
      
      // 解析多個 Cookie
      const cookies = setCookieHeaders.split(',').map(cookie => cookie.trim());
      
      cookies.forEach((cookie, index) => {
        console.log(`\n📋 Cookie ${index + 1}:`);
        console.log(`   ${cookie}`);
        
        // 解析 Cookie 屬性
        const cookieParts = cookie.split(';');
        for (const part of cookieParts) {
          const trimmed = part.trim();
          if (trimmed.startsWith('Domain=')) {
            const domain = trimmed.replace('Domain=', '');
            console.log(`   Domain: ${domain}`);
            
            if (domain === '.onrender.com') {
              console.log('   ✅ .onrender.com Domain 設置正確');
            } else if (domain === '.wuridaostudio.com') {
              console.log('   ✅ .wuridaostudio.com Domain 設置正確');
            } else {
              console.log(`   ⚠️  未知 Domain: ${domain}`);
            }
          } else if (trimmed.startsWith('auth-token=')) {
            console.log('   Type: 主要認證 Token');
          } else if (trimmed.startsWith('auth-token-backup=')) {
            console.log('   Type: 備用認證 Token');
          }
        }
      });
      
      // 檢查是否有多個 Cookie
      const hasOnrenderCookie = cookies.some(cookie => cookie.includes('Domain=.onrender.com'));
      const hasWuridaostudioCookie = cookies.some(cookie => cookie.includes('Domain=.wuridaostudio.com'));
      
      console.log('\n📊 多域名 Cookie 分析:');
      console.log(`   .onrender.com Cookie: ${hasOnrenderCookie ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`   .wuridaostudio.com Cookie: ${hasWuridaostudioCookie ? '✅ 存在' : '❌ 不存在'}`);
      
      if (hasOnrenderCookie && hasWuridaostudioCookie) {
        console.log('🎉 多域名 Cookie 設置成功！');
        console.log('💡 現在可以同時支援兩個域名的登入');
      } else if (hasOnrenderCookie) {
        console.log('✅ 主要 Cookie 設置成功');
        console.log('💡 需要啟用多域名 Cookie 功能');
      } else {
        console.log('❌ Cookie 設置有問題');
      }
      
    } else {
      console.log('❌ 沒有 Set-Cookie 標頭');
    }
    
    return setCookieHeaders;
  } catch (error) {
    console.log(`❌ 請求失敗: ${error.message}`);
    return null;
  }
}

async function main() {
  const cookies = await testMultiDomainCookies();
  
  console.log('\n📋 配置建議:');
  console.log('============');
  console.log('要啟用多域名 Cookie 功能，請在 Render 後端設置:');
  console.log('ENABLE_MULTI_DOMAIN_COOKIES=true');
  console.log('');
  console.log('這樣可以同時支援:');
  console.log('- https://wuridao-project.onrender.com');
  console.log('- https://wuridaostudio.com');
  console.log('');
  console.log('前端會自動選擇可用的 Cookie 進行認證');
  
  console.log('\n💡 使用說明:');
  console.log('設置環境變數來使用實際帳戶:');
  console.log('export ADMIN_USERNAME=your-actual-username');
  console.log('export ADMIN_PASSWORD=your-actual-password');
}

main().catch(console.error);
