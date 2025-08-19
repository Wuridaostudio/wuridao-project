#!/usr/bin/env node

/**
 * 前端部署診斷腳本
 * 詳細檢查前端服務的狀態和配置
 */

const https = require('https');

// 配置
const config = {
  frontendUrl: 'https://wuridao-project.onrender.com',
  backendUrl: 'https://wuridao-backend.onrender.com'
};

console.log('🔍 前端部署診斷');
console.log('=====================================');
console.log(`前端 URL: ${config.frontendUrl}`);
console.log(`後端 URL: ${config.backendUrl}`);
console.log('');

// 測試基本連接
async function testBasicConnection() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(config.frontendUrl).hostname,
      port: 443,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const response = {
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        };
        resolve(response);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('請求超時'));
    });

    req.end();
  });
}

// 測試各種路徑
async function testPaths() {
  const paths = [
    { path: '/', name: '首頁' },
    { path: '/admin', name: '管理後台' },
    { path: '/admin/login', name: '登入頁面' },
    { path: '/about', name: '關於頁面' },
    { path: '/plan', name: '方案頁面' },
    { path: '/articles', name: '文章列表' },
    { path: '/media', name: '媒體列表' }
  ];

  const results = [];

  for (const pathInfo of paths) {
    try {
      const response = await testPath(pathInfo.path);
      results.push({
        ...pathInfo,
        ...response
      });
    } catch (error) {
      results.push({
        ...pathInfo,
        error: error.message,
        statusCode: 'ERROR'
      });
    }
  }

  return results;
}

// 測試單個路徑
async function testPath(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(config.frontendUrl).hostname,
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const response = {
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        };
        resolve(response);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('請求超時'));
    });

    req.end();
  });
}

// 分析響應內容
function analyzeResponse(response, pathName) {
  const analysis = {
    status: response.statusCode === 200 ? '✅ 正常' : 
            response.statusCode === 404 ? '❌ 404 錯誤' :
            response.statusCode === 500 ? '❌ 500 錯誤' :
            `⚠️  ${response.statusCode} 狀態碼`,
    size: response.body.length,
    hasHtml: response.body.includes('<html'),
    hasScript: response.body.includes('<script'),
    hasNuxt: response.body.includes('nuxt') || response.body.includes('Nuxt'),
    hasVue: response.body.includes('vue') || response.body.includes('Vue'),
    contentType: response.headers['content-type'] || '未設置',
    server: response.headers['server'] || '未設置',
    poweredBy: response.headers['x-powered-by'] || '未設置'
  };

  // 檢查是否為錯誤頁面
  if (response.body.includes('404') || response.body.includes('Not Found')) {
    analysis.isErrorPage = true;
  }

  // 檢查是否為 Nuxt 應用
  if (response.body.includes('__NUXT__') || response.body.includes('nuxt')) {
    analysis.isNuxtApp = true;
  }

  return analysis;
}

// 主診斷函數
async function runDiagnosis() {
  try {
    console.log('1️⃣ 測試基本連接...');
    const basicResponse = await testBasicConnection();
    console.log(`   狀態碼: ${basicResponse.statusCode}`);
    console.log(`   內容類型: ${basicResponse.headers['content-type'] || '未設置'}`);
    console.log(`   伺服器: ${basicResponse.headers['server'] || '未設置'}`);
    console.log(`   響應大小: ${basicResponse.body.length} bytes`);
    
    if (basicResponse.statusCode === 200) {
      console.log('   ✅ 基本連接正常');
    } else {
      console.log('   ❌ 基本連接失敗');
    }
    
    console.log('');

    console.log('2️⃣ 測試各個路徑...');
    const pathResults = await testPaths();
    
    console.log('   路徑狀態:');
    pathResults.forEach(result => {
      if (result.error) {
        console.log(`   ${result.name} (${result.path}): ❌ ${result.error}`);
      } else {
        const analysis = analyzeResponse(result, result.name);
        console.log(`   ${result.name} (${result.path}): ${analysis.status} (${analysis.size} bytes)`);
        
        if (analysis.isErrorPage) {
          console.log(`      ⚠️  可能是錯誤頁面`);
        }
        
        if (analysis.isNuxtApp) {
          console.log(`      ✅ 檢測到 Nuxt 應用`);
        }
      }
    });

    console.log('');

    console.log('3️⃣ 分析響應內容...');
    const homeAnalysis = analyzeResponse(basicResponse, '首頁');
    console.log('   首頁分析:');
    console.log(`   HTML 結構: ${homeAnalysis.hasHtml ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`   JavaScript: ${homeAnalysis.hasScript ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`   Nuxt 標識: ${homeAnalysis.hasNuxt ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`   Vue 標識: ${homeAnalysis.hasVue ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`   內容類型: ${homeAnalysis.contentType}`);

    // 檢查響應內容的前100個字符
    const preview = basicResponse.body.substring(0, 200).replace(/\n/g, ' ').trim();
    console.log(`   內容預覽: ${preview}...`);

    console.log('');

    console.log('4️⃣ 檢查部署狀態...');
    
    // 檢查是否為靜態文件服務
    if (basicResponse.headers['server'] && basicResponse.headers['server'].includes('nginx')) {
      console.log('   ✅ 檢測到 Nginx 伺服器（可能是靜態文件服務）');
    } else if (basicResponse.headers['server'] && basicResponse.headers['server'].includes('render')) {
      console.log('   ✅ 檢測到 Render 伺服器');
    } else {
      console.log('   ⚠️  伺服器類型未知');
    }

    // 檢查是否有重定向
    if (basicResponse.statusCode === 301 || basicResponse.statusCode === 302) {
      console.log('   🔄 檢測到重定向');
      console.log(`   重定向位置: ${basicResponse.headers.location}`);
    }

    // 檢查是否為 SPA 應用
    if (homeAnalysis.hasScript && homeAnalysis.hasHtml && !homeAnalysis.isErrorPage) {
      console.log('   ✅ 可能是單頁應用 (SPA)');
    }

  } catch (error) {
    console.error('❌ 診斷過程中發生錯誤:', error.message);
  }
}

// 執行診斷
runDiagnosis().then(() => {
  console.log('');
  console.log('=====================================');
  console.log('🎯 診斷完成');
  console.log('');
  console.log('💡 可能的問題和解決方案:');
  console.log('');
  console.log('如果所有路徑都返回 404:');
  console.log('1. 前端服務可能未正確部署');
  console.log('2. 檢查 Render 上的部署日誌');
  console.log('3. 確認構建過程是否成功');
  console.log('4. 檢查環境變數設置');
  console.log('');
  console.log('如果只有部分路徑返回 404:');
  console.log('1. 可能是路由配置問題');
  console.log('2. 檢查 Nuxt 的路由規則');
  console.log('3. 確認 SSR/SPA 配置');
  console.log('');
  console.log('如果基本連接失敗:');
  console.log('1. 服務可能已停止');
  console.log('2. 檢查 Render 服務狀態');
  console.log('3. 重新部署前端服務');
});
