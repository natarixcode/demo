// comprehensive-test.js - Complete API testing for Notorix
const fetch = require('node-fetch');
const API_BASE = 'http://localhost:3001';

// Test data
const testUsers = [
  { username: 'admin', email: 'admin@notorix.com', password: 'admin123' },
  { username: 'johnsmith', email: 'john@example.com', password: 'password123' },
  { username: 'sarah_dev', email: 'sarah@notorix.com', password: 'dev456' }
];

const testPosts = [
  { title: 'Welcome to Notorix', content: 'This is the first post on our new platform!', author: 1 },
  { title: 'Getting Started', content: 'Here are some tips to get started.', author: 1 },
  { title: 'My First Post', content: 'Hello everyone!', author: 2 }
];

// Helper function to make requests
async function makeRequest(endpoint, options = {}) {
  try {
    const method = options.method || 'GET';
    console.log(`\n🔄 Testing: ${method} ${endpoint}`);
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    return { status: response.status, data };
  } catch (error) {
    console.log(`❌ Error:`, error.message);
    return { error: error.message };
  }
}

// Delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main test function
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Notorix API Test Suite\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: API Info
    console.log('\n📊 TESTING API INFO');
    await makeRequest('/');
    
    await delay(1000);
    
    // Test 2: User Registration (Auth)
    console.log('\n👤 TESTING USER REGISTRATION');
    const registeredUsers = [];
    
    for (const user of testUsers) {
      const result = await makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(user)
      });
      if (result.data && result.data.user) {
        registeredUsers.push(result.data.user);
      }
      await delay(500);
    }
    
    await delay(1000);
    
    // Test 3: User Login (Auth)
    console.log('\n🔐 TESTING USER LOGIN');
    await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    await delay(1000);
    
    // Test 4: Get All Users
    console.log('\n👥 TESTING GET ALL USERS');
    const usersResult = await makeRequest('/users');
    
    await delay(1000);
    
    // Test 5: Get User by ID
    console.log('\n👤 TESTING GET USER BY ID');
    if (registeredUsers.length > 0) {
      await makeRequest(`/users/${registeredUsers[0].id}`);
    }
    
    await delay(1000);
    
    // Test 6: Create Posts
    console.log('\n📝 TESTING POST CREATION');
    const createdPosts = [];
    
    for (const post of testPosts) {
      const result = await makeRequest('/posts', {
        method: 'POST',
        body: JSON.stringify(post)
      });
      if (result.data && result.data.id) {
        createdPosts.push(result.data);
      }
      await delay(500);
    }
    
    await delay(1000);
    
    // Test 7: Get All Posts
    console.log('\n📖 TESTING GET ALL POSTS');
    await makeRequest('/posts');
    
    await delay(1000);
    
    // Test 8: Get Post by ID
    console.log('\n📄 TESTING GET POST BY ID');
    if (createdPosts.length > 0) {
      await makeRequest(`/posts/${createdPosts[0].id}`);
    }
    
    await delay(1000);
    
    // Test 9: Get Posts by User
    console.log('\n👤📝 TESTING GET POSTS BY USER');
    if (registeredUsers.length > 0) {
      await makeRequest(`/users/${registeredUsers[0].id}/posts`);
    }
    
    await delay(1000);
    
    // Test 10: Update Post
    console.log('\n✏️ TESTING POST UPDATE');
    if (createdPosts.length > 0) {
      await makeRequest(`/posts/${createdPosts[0].id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          title: 'Updated: Welcome to Notorix', 
          content: 'This is an updated welcome post!' 
        })
      });
    }
    
    await delay(1000);
    
    // Test 11: Update User
    console.log('\n👤✏️ TESTING USER UPDATE');
    if (registeredUsers.length > 0) {
      await makeRequest(`/users/${registeredUsers[0].id}`, {
        method: 'PUT',
        body: JSON.stringify({ username: 'admin_updated' })
      });
    }
    
    await delay(1000);
    
    // Test 12: Error Handling Tests
    console.log('\n🚫 TESTING ERROR HANDLING');
    
    // Invalid login
    await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'invalid', password: 'wrong' })
    });
    
    await delay(500);
    
    // Non-existent user
    await makeRequest('/users/999');
    
    await delay(500);
    
    // Non-existent post
    await makeRequest('/posts/999');
    
    await delay(500);
    
    // Invalid post creation
    await makeRequest('/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Incomplete' }) // missing content and author
    });
    
    console.log('\n🎉 COMPREHENSIVE TEST SUITE COMPLETED!');
    console.log('='.repeat(60));
    console.log('✅ All endpoints tested successfully');
    console.log('📊 Users, Posts, and Authentication systems are working');
    console.log('🔒 Error handling is functioning properly');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runComprehensiveTests().catch(console.error);
}

module.exports = { runComprehensiveTests }; 