const http = require('http');

function testEndpoint(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: url,
      method: method,
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
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function testVoteEndpoints() {
  console.log('🧪 Testing vote endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await testEndpoint('/api/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response: ${JSON.stringify(health.data)}\n`);

    // Test posts endpoint
    console.log('2. Testing posts endpoint...');
    const posts = await testEndpoint('/api/posts');
    console.log(`   Status: ${posts.status}`);
    console.log(`   Found ${posts.data?.data?.length || 0} posts\n`);

    // Test GET vote endpoint
    console.log('3. Testing GET vote endpoint...');
    const getVote = await testEndpoint('/api/posts/1/vote/1');
    console.log(`   Status: ${getVote.status}`);
    console.log(`   Response: ${JSON.stringify(getVote.data, null, 2)}\n`);

    if (getVote.status === 200) {
      console.log('✅ GET vote endpoint is working!');
    } else {
      console.log('❌ GET vote endpoint failed');
    }

  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
}

testVoteEndpoints(); 