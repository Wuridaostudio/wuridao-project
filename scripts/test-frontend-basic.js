const https = require('https');

console.log('🔍 基本前端測試');
console.log('================================');

// 測試首頁
async function testHomepage() {
  console.log('\n🏠 測試首頁...');
  
  return new Promise((resolve) => {
    const req = https.get('https://wuridao-project.onrender.com', (res) => {
      console.log(`✅ 首頁狀態: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (data.includes('WURIDAO') || data.includes('智慧家')) {
            console.log('✅ 首頁內容正常');
            resolve(true);
          } else {
            console.log('❌ 首頁內容異常');
            resolve(false);
          }
        });
      } else {
        console.log(`❌ 首頁狀態異常: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log(`❌ 首頁錯誤: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      console.log('❌ 首頁超時');
      req.destroy();
      resolve(false);
    });
  });
}

// 測試 index.html
async function testIndexHtml() {
  console.log('\n📄 測試 index.html...');
  
  return new Promise((resolve) => {
    const req = https.get('https://wuridao-project.onrender.com/index.html', (res) => {
      console.log(`✅ index.html 狀態: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (data.includes('<html') && data.includes('</html>')) {
            console.log('✅ index.html 內容正常');
            resolve(true);
          } else {
            console.log('❌ index.html 內容異常');
            resolve(false);
          }
        });
      } else {
        console.log(`❌ index.html 狀態異常: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log(`❌ index.html 錯誤: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      console.log('❌ index.html 超時');
      req.destroy();
      resolve(false);
    });
  });
}

// 測試靜態資源
async function testStaticAssets() {
  console.log('\n📦 測試靜態資源...');
  
  const assets = [
    '/_nuxt/entry.js',
    '/_nuxt/app.js',
    '/favicon.ico'
  ];

  for (const asset of assets) {
    await new Promise((resolve) => {
      const url = `https://wuridao-project.onrender.com${asset}`;
      const req = https.get(url, (res) => {
        console.log(`   ${asset}: ${res.statusCode}`);
        resolve();
      });

      req.on('error', () => {
        console.log(`   ${asset}: 錯誤`);
        resolve();
      });

      req.setTimeout(5000, () => {
        console.log(`   ${asset}: 超時`);
        req.destroy();
        resolve();
      });
    });
  }
}

// 主測試函數
async function runTests() {
  console.log('🚀 開始基本前端測試...\n');
  
  const results = {
    homepage: await testHomepage(),
    indexHtml: await testIndexHtml()
  };

  console.log('\n📦 測試靜態資源...');
  await testStaticAssets();

  console.log('\n📊 測試結果總結:');
  console.log('================================');
  console.log(`首頁: ${results.homepage ? '✅ 正常' : '❌ 異常'}`);
  console.log(`index.html: ${results.indexHtml ? '✅ 正常' : '❌ 異常'}`);

  if (results.homepage && results.indexHtml) {
    console.log('\n✅ 前端基本功能正常');
    console.log('💡 問題可能在前端路由或 JavaScript 執行');
  } else {
    console.log('\n❌ 前端基本功能異常');
    console.log('💡 需要檢查部署狀態');
  }
}

// 執行測試
runTests().catch(console.error);
