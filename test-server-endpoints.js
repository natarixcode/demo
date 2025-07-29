const http = require('http');

async function testEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ 
          path: path, 
          status: res.statusCode, 
          success: res.statusCode < 400 
        });
      });
    });

    req.on('error', (err) => {
      resolve({ 
        path: path, 
        status: 'ERROR', 
        success: false, 
        error: err.message 
      });
    });

    req.end();
  });
}

async function testServerEndpoints() {
  console.log('🔍 Testing Server Endpoints...\n');
  
  const endpoints = [
    '/api/health',
    '/api/posts',
    '/api/badges',
    '/api/users/1/badges',
    '/api/badges/stats'
  ];
  
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${endpoint} - Status: ${result.status}`);
  }
  
  console.log('\n🎯 Badge System Status:');
  console.log('If badge endpoints show 404, the badge system needs to be re-integrated.');
}

testServerEndpoints(); 