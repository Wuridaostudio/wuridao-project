const https = require('https');

console.log('🔍 測試後端 API 狀態');
console.log('================================');

// 測試後端健康檢查
https.get('https://wuridao-backend.onrender.com/api/health', (res) => {
  console.log(`✅ 後端健康檢查狀態: ${res.statusCode}`);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('📊 回應內容:', data);
  });
}).on('error', (err) => {
  console.log(`❌ 後端健康檢查錯誤: ${err.message}`);
});

// 測試登入 API（GET 方法應該返回 405 Method Not Allowed）
https.get('https://wuridao-backend.onrender.com/api/auth/login', (res) => {
  console.log(`✅ 登入 API 狀態: ${res.statusCode}`);
  console.log('📊 預期：405 Method Not Allowed（因為這是 POST 端點）');
}).on('error', (err) => {
  console.log(`❌ 登入 API 錯誤: ${err.message}`);
});

// 測試 POST 登入 API
const postData = JSON.stringify({
  username: 'mecenas0217@gmail.com',
  password: 'Roguery@099'
});

const options = {
  hostname: 'wuridao-backend.onrender.com',
  port: 443,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Origin': 'https://wuridao-project.onrender.com'
  }
};

const req = https.request(options, (res) => {
  console.log(`✅ POST 登入 API 狀態: ${res.statusCode}`);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('📊 回應內容:', data.substring(0, 200) + '...');
  });
});

req.on('error', (err) => {
  console.log(`❌ POST 登入 API 錯誤: ${err.message}`);
});

req.write(postData);
req.end();
