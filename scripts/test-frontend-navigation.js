const https = require('https');

console.log('🔍 測試前端導航');
console.log('================================');

// 測試首頁
https.get('https://wuridao-project.onrender.com/', (res) => {
  console.log(`✅ 首頁狀態: ${res.statusCode}`);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('📊 首頁內容長度:', data.length);
    
    // 檢查是否包含 Nuxt 相關內容
    if (data.includes('nuxt') || data.includes('__NUXT__')) {
      console.log('✅ 首頁包含 Nuxt 內容');
    } else {
      console.log('❌ 首頁可能不是正確的 Nuxt 應用');
    }
    
    // 檢查是否包含管理後台相關內容
    if (data.includes('admin') || data.includes('login')) {
      console.log('✅ 首頁包含管理後台相關內容');
    } else {
      console.log('❌ 首頁不包含管理後台相關內容');
    }
  });
}).on('error', (err) => {
  console.log(`❌ 首頁錯誤: ${err.message}`);
});

// 測試直接訪問 index.html
https.get('https://wuridao-project.onrender.com/index.html', (res) => {
  console.log(`✅ index.html 狀態: ${res.statusCode}`);
}).on('error', (err) => {
  console.log(`❌ index.html 錯誤: ${err.message}`);
});
