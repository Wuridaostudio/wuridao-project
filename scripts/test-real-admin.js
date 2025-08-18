#!/usr/bin/env node

console.log('🔍 測試實際管理員帳戶');
console.log('======================\n');

const BACKEND_URL = 'https://wuridao-backend.onrender.com';

// 使用環境變數或提示用戶輸入
const adminAccount = {
  username: process.env.ADMIN_USERNAME || 'your-admin-username',
  password: process.env.ADMIN_PASSWORD || 'your-admin-password'
};

async function testRealAdminLogin() {
  try {
    console.log(`🔐 測試管理員帳戶: ${adminAccount.username}`);
    
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminAccount),
      credentials: 'include'
    });
    
    console.log(`📋 登入響應狀態: ${response.status}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log(`✅ 登入成功！`);
      console.log(`   用戶: ${data.user?.username}`);
      console.log(`   Token: ${data.access_token ? '已生成' : '未生成'}`);
      
      // 檢查 Set-Cookie 標頭
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        console.log(`🍪 Cookie: ${setCookie}`);
        
        // 檢查 Cookie 的 domain 設置
        if (setCookie.includes('Domain=.onrender.com')) {
          console.log(`✅ Cookie Domain 設置正確: .onrender.com`);
        } else {
          console.log(`❌ Cookie Domain 設置可能有問題`);
        }
        
        // 檢查其他 Cookie 屬性
        if (setCookie.includes('Secure')) {
          console.log(`✅ Cookie Secure 屬性已設置`);
        }
        if (setCookie.includes('SameSite=lax')) {
          console.log(`✅ Cookie SameSite 屬性設置正確`);
        }
      } else {
        console.log(`❌ 沒有 Set-Cookie 標頭`);
      }
      
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ 登入失敗: ${errorText}`);
      
      // 檢查響應標頭
      console.log(`📋 響應標頭:`);
      for (const [key, value] of response.headers.entries()) {
        console.log(`   ${key}: ${value}`);
      }
      
      return false;
    }
  } catch (error) {
    console.log(`❌ 請求失敗: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('開始測試實際管理員帳戶...\n');
  
  const success = await testRealAdminLogin();
  
  console.log('\n📊 測試結果總結:');
  console.log('==================');
  if (success) {
    console.log('🎉 登入成功！Cookie 配置應該正常。');
    console.log('\n💡 如果前端仍然無法登入，請檢查:');
    console.log('1. 前端環境變數 NODE_ENV=production');
    console.log('2. 前端環境變數 NUXT_PUBLIC_API_BASE_URL=https://wuridao-backend.onrender.com');
    console.log('3. 前端是否正確設置了 credentials: "include"');
  } else {
    console.log('❌ 登入失敗，請檢查:');
    console.log('1. 後端服務是否正常運行');
    console.log('2. 資料庫連接是否正常');
    console.log('3. 環境變數是否正確設置');
  }
  
  console.log('\n💡 使用說明:');
  console.log('設置環境變數來使用實際帳戶:');
  console.log('export ADMIN_USERNAME=your-actual-username');
  console.log('export ADMIN_PASSWORD=your-actual-password');
}

main().catch(console.error);
