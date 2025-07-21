// test-frontend-backend.js - Frontend-Backend Connectivity Test
const http = require('http');

// Test configurations
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:3001';

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
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
          const parsed = res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(responseData) 
            : responseData;
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test functions
async function testServerConnectivity() {
  console.log('🔍 TESTING SERVER CONNECTIVITY');
  console.log('='.repeat(50));
  
  try {
    // Test Frontend
    console.log('\n📱 Testing Frontend (React/Vite)...');
    const frontendResponse = await makeRequest(FRONTEND_URL);
    if (frontendResponse.status === 200) {
      console.log('✅ Frontend is running on port 5173');
      console.log(`📄 Content-Type: ${frontendResponse.headers['content-type']}`);
    } else {
      console.log(`❌ Frontend returned status: ${frontendResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Frontend is not accessible:', error.message);
  }

  try {
    // Test Backend Health
    console.log('\n🔧 Testing Backend Health...');
    const healthResponse = await makeRequest(`${BACKEND_URL}/api/health`);
    if (healthResponse.status === 200) {
      console.log('✅ Backend is running on port 3001');
      console.log('📊 Health Status:', JSON.stringify(healthResponse.data, null, 2));
    } else {
      console.log(`❌ Backend health check failed: ${healthResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Backend is not accessible:', error.message);
  }

  try {
    // Test Backend API Root
    console.log('\n📡 Testing Backend API Root...');
    const apiResponse = await makeRequest(`${BACKEND_URL}/`);
    if (apiResponse.status === 200) {
      console.log('✅ Backend API root is accessible');
      console.log('🔗 Available Endpoints:', Object.keys(apiResponse.data.endpoints || {}).length);
    } else {
      console.log(`❌ Backend API root failed: ${apiResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Backend API root not accessible:', error.message);
  }
}

async function testAuthenticationFlow() {
  console.log('\n🔐 TESTING AUTHENTICATION FLOW');
  console.log('='.repeat(50));

  // Test Registration
  console.log('\n👤 Testing User Registration...');
  try {
    const registerData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };
    
    const registerResponse = await makeRequest(`${BACKEND_URL}/api/auth/register`, 'POST', registerData);
    
    if (registerResponse.status === 201) {
      console.log('✅ User registration successful');
      console.log('📄 Response:', JSON.stringify(registerResponse.data, null, 2));
      
      // Test Login with the registered user
      console.log('\n🔑 Testing User Login...');
      const loginData = {
        username: 'testuser',
        password: 'password123'
      };
      
      const loginResponse = await makeRequest(`${BACKEND_URL}/api/auth/login`, 'POST', loginData);
      
      if (loginResponse.status === 200) {
        console.log('✅ User login successful');
        console.log('📄 Login Response:', JSON.stringify(loginResponse.data, null, 2));
        return loginResponse.data;
      } else {
        console.log(`❌ Login failed: ${loginResponse.status}`);
        console.log('📄 Error:', loginResponse.data);
      }
    } else if (registerResponse.status === 400 && registerResponse.data.error?.includes('already exists')) {
      console.log('⚠️ User already exists, testing login...');
      
      const loginData = {
        username: 'testuser',
        password: 'password123'
      };
      
      const loginResponse = await makeRequest(`${BACKEND_URL}/api/auth/login`, 'POST', loginData);
      
      if (loginResponse.status === 200) {
        console.log('✅ Login with existing user successful');
        return loginResponse.data;
      } else {
        console.log(`❌ Login failed: ${loginResponse.status}`);
      }
    } else {
      console.log(`❌ Registration failed: ${registerResponse.status}`);
      console.log('📄 Error:', registerResponse.data);
    }
  } catch (error) {
    console.log('❌ Authentication flow error:', error.message);
  }
  
  return null;
}

async function testPostsFlow(authData) {
  console.log('\n📝 TESTING POSTS FUNCTIONALITY');
  console.log('='.repeat(50));

  try {
    // Test getting all posts
    console.log('\n📖 Testing Get All Posts...');
    const postsResponse = await makeRequest(`${BACKEND_URL}/api/posts`);
    
    if (postsResponse.status === 200) {
      console.log('✅ Get posts successful');
      console.log(`📄 Found ${postsResponse.data.length} posts`);
      
      if (authData && authData.user) {
        // Test creating a new post
        console.log('\n✍️ Testing Create Post...');
        const postData = {
          title: 'Test Post from API Test',
          content: 'This is a test post created during frontend-backend connectivity testing.',
          author: authData.user.id
        };
        
        const createResponse = await makeRequest(`${BACKEND_URL}/api/posts`, 'POST', postData);
        
        if (createResponse.status === 201) {
          console.log('✅ Post creation successful');
          console.log('📄 Created Post:', JSON.stringify(createResponse.data, null, 2));
          
          // Test getting the specific post
          const postId = createResponse.data.id;
          console.log(`\n🔍 Testing Get Post by ID (${postId})...`);
          
          const getPostResponse = await makeRequest(`${BACKEND_URL}/api/posts/${postId}`);
          
          if (getPostResponse.status === 200) {
            console.log('✅ Get post by ID successful');
            console.log('📄 Retrieved Post:', JSON.stringify(getPostResponse.data, null, 2));
          } else {
            console.log(`❌ Get post by ID failed: ${getPostResponse.status}`);
          }
        } else {
          console.log(`❌ Post creation failed: ${createResponse.status}`);
          console.log('📄 Error:', createResponse.data);
        }
      }
    } else {
      console.log(`❌ Get posts failed: ${postsResponse.status}`);
      console.log('📄 Error:', postsResponse.data);
    }
  } catch (error) {
    console.log('❌ Posts flow error:', error.message);
  }
}

async function runComprehensiveTest() {
  console.log('🚀 NOTORIX FRONTEND-BACKEND CONNECTIVITY TEST');
  console.log('='.repeat(60));
  console.log(`📅 Test started at: ${new Date().toISOString()}`);
  console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
  console.log(`🔗 Backend URL: ${BACKEND_URL}`);
  
  try {
    // Test 1: Server Connectivity
    await testServerConnectivity();
    
    // Test 2: Authentication Flow
    const authData = await testAuthenticationFlow();
    
    // Test 3: Posts Flow
    await testPostsFlow(authData);
    
    console.log('\n🎉 COMPREHENSIVE TEST COMPLETED!');
    console.log('='.repeat(60));
    console.log('✅ Frontend-Backend connectivity test finished');
    console.log('📊 Check the results above for any issues');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run the test
if (require.main === module) {
  runComprehensiveTest();
}

module.exports = { runComprehensiveTest }; 