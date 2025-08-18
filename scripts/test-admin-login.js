#!/usr/bin/env node

console.log('🔍 測試管理員登入');
console.log('==================\n');

const BACKEND_URL = 'https://wuridao-backend.onrender.com';

// 測試不同的帳戶組合
const testAccounts = [
  { username: 'admin', password: 'admin123' },
  { username: 'admin', password: 'admin' },
  { username: 'admin', password: 'password' },
  { username: 'admin@example.com', password: 'admin123' },
  { username: 'admin@example.com', password: 'admin' }
];

async function testLogin(account) {
  try {
    console.log(`🔐 測試帳戶: ${account.username}`);
    
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(account),
      credentials: 'include'
    });
    
    console.log(`   狀態碼: ${response.status}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log(`   ✅ 登入成功！`);
      console.log(`   用戶: ${data.user?.username}`);
      console.log(`   Token: ${data.access_token ? '已生成' : '未生成'}`);
      
      // 檢查 Set-Cookie 標頭
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        console.log(`   🍪 Cookie: ${setCookie}`);
      } else {
        console.log(`   ❌ 沒有 Set-Cookie 標頭`);
      }
      
      return true;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ 登入失敗: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 請求失敗: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('開始測試管理員帳戶...\n');
  
  let successCount = 0;
  
  for (const account of testAccounts) {
    const success = await testLogin(account);
    if (success) {
      successCount++;
    }
    console.log(''); // 空行分隔
  }
  
  console.log('📊 測試結果總結:');
  console.log('==================');
  console.log(`總測試數: ${testAccounts.length}`);
  console.log(`成功數: ${successCount}`);
  console.log(`失敗數: ${testAccounts.length - successCount}`);
  
  if (successCount === 0) {
    console.log('\n💡 建議:');
    console.log('1. 檢查 Render 後端服務的環境變數:');
    console.log('   - ADMIN_USERNAME');
    console.log('   - ADMIN_PASSWORD');
    console.log('   - DATABASE_URL');
    console.log('2. 檢查資料庫連接是否正常');
    console.log('3. 重新部署後端服務');
  } else {
    console.log('\n🎉 找到可用的管理員帳戶！');
  }
}

main().catch(console.error);
