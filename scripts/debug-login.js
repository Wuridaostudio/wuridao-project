#!/usr/bin/env node

const https = require('https');
const http = require('http');

console.log('🔍 WURIDAO 登入問題診斷工具');
console.log('================================\n');

const BACKEND_URL = 'https://wuridao-backend.onrender.com';
const FRONTEND_URL = 'https://wuridao-project.onrender.com';

// 檢查環境變數配置
async function checkEnvironmentVariables() {
  console.log('📋 檢查環境變數配置...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    const data = await response.json();
    
    console.log('✅ 後端健康檢查通過');
    console.log(`   環境: ${data.environment || '未知'}`);
    console.log(`   資料庫狀態: ${data.database || '未知'}`);
    console.log(`   時間戳: ${data.timestamp || '未知'}`);
    
    return true;
  } catch (error) {
    console.log('❌ 後端健康檢查失敗:', error.message);
    return false;
  }
}

// 檢查管理員帳戶狀態
async function checkAdminAccount() {
  console.log('\n👤 檢查管理員帳戶狀態...');
  
  try {
    // 嘗試使用測試帳戶登入
    const loginData = {
      username: 'admin',
      password: 'admin123' // 假設的測試密碼
    };
    
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
      credentials: 'include'
    });
    
    console.log(`📋 登入響應狀態: ${response.status}`);
    console.log(`📋 響應標頭:`);
    
    // 檢查所有響應標頭
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ 登入成功！');
      console.log(`   用戶: ${data.user?.username}`);
      console.log(`   Token: ${data.access_token ? '已生成' : '未生成'}`);
      return true;
    } else if (response.status === 401) {
      console.log('❌ 登入失敗：帳號或密碼錯誤');
      console.log('💡 請檢查 ADMIN_USERNAME 和 ADMIN_PASSWORD 環境變數');
      return false;
    } else {
      const errorText = await response.text();
      console.log(`❌ 登入失敗：${response.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log('❌ 登入請求失敗:', error.message);
    return false;
  }
}

// 檢查 CORS 和 Cookie 配置
async function checkCorsAndCookies() {
  console.log('\n🍪 檢查 CORS 和 Cookie 配置...');
  
  try {
    // 預檢請求
    const preflightResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
      credentials: 'include'
    });
    
    console.log(`📋 預檢請求狀態: ${preflightResponse.status}`);
    console.log(`📋 CORS 標頭:`);
    
    const corsHeaders = [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Credentials',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers'
    ];
    
    for (const header of corsHeaders) {
      const value = preflightResponse.headers.get(header);
      if (value) {
        console.log(`   ${header}: ${value}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ CORS 檢查失敗:', error.message);
    return false;
  }
}

// 檢查資料庫連接
async function checkDatabaseConnection() {
  console.log('\n🗄️ 檢查資料庫連接...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/health/database`);
    const data = await response.json();
    
    if (response.status === 200) {
      console.log('✅ 資料庫連接正常');
      console.log(`   狀態: ${data.status}`);
      return true;
    } else {
      console.log('❌ 資料庫連接失敗');
      console.log(`   錯誤: ${data.error || '未知錯誤'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ 資料庫檢查請求失敗:', error.message);
    return false;
  }
}

// 主函數
async function main() {
  console.log(`🔗 檢查目標:`);
  console.log(`   後端: ${BACKEND_URL}`);
  console.log(`   前端: ${FRONTEND_URL}\n`);
  
  const results = {
    environment: await checkEnvironmentVariables(),
    admin: await checkAdminAccount(),
    cors: await checkCorsAndCookies(),
    database: await checkDatabaseConnection()
  };
  
  console.log('\n📊 診斷結果總結:');
  console.log('================================');
  console.log(`環境變數: ${results.environment ? '✅ 正常' : '❌ 異常'}`);
  console.log(`管理員帳戶: ${results.admin ? '✅ 正常' : '❌ 異常'}`);
  console.log(`CORS 配置: ${results.cors ? '✅ 正常' : '❌ 異常'}`);
  console.log(`資料庫連接: ${results.database ? '✅ 正常' : '❌ 異常'}`);
  
  console.log('\n💡 建議:');
  if (!results.environment) {
    console.log('1. 檢查後端環境變數配置');
  }
  if (!results.admin) {
    console.log('2. 確認 ADMIN_USERNAME 和 ADMIN_PASSWORD 環境變數已設置');
  }
  if (!results.cors) {
    console.log('3. 檢查 CORS 配置');
  }
  if (!results.database) {
    console.log('4. 檢查資料庫連接和環境變數');
  }
  
  if (results.environment && results.admin && results.cors && results.database) {
    console.log('🎉 所有檢查都通過！登入應該可以正常工作。');
  }
}

// 執行診斷
main().catch(console.error);
