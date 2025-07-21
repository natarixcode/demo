// test-connection.js - Simple connection test
const http = require('http');

function testEndpoint(path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          console.log(`✅ ${options.method} ${path} - Status: ${res.statusCode}`);
          console.log(`📄 Response:`, JSON.stringify(parsed, null, 2));
          resolve(parsed);
        } catch (e) {
          console.log(`✅ ${options.method} ${path} - Status: ${res.statusCode}`);
          console.log(`📄 Raw Response:`, responseData);
          resolve(responseData);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${options.method} ${path} - Error:`, err.message);
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Testing Notorix API Connection\n');
  
  try {
    // Test 1: API Info
    console.log('📊 Testing API Info...');
    await testEndpoint('/');
    
    console.log('\n👥 Testing Users Endpoint...');
    await testEndpoint('/users');
    
    console.log('\n👤 Testing User Registration...');
    await testEndpoint('/auth/register', {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('\n🔐 Testing User Login...');
    await testEndpoint('/auth/login', {
      username: 'testuser',
      password: 'password123'
    });
    
    console.log('\n📖 Testing Posts Endpoint...');
    await testEndpoint('/posts');
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests(); 