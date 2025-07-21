// test-api.js - Comprehensive API testing script
const fetch = require('node-fetch');
const API_BASE = 'http://localhost:3001';

// Test data
const testUser = {
  username: 'testuser1',
  email: 'test1@example.com',
  password: 'password123'
};

const testUser2 = {
  username: 'testuser2', 
  email: 'test2@example.com',
  password: 'password456'
};

// Helper function to make requests
async function makeRequest(endpoint, options = {}) {
  try {
    console.log(`\n🔄 Testing: ${options.method || 'GET'} ${endpoint}`);
    
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

// Run all tests
async function runTests() {
  console.log('🚀 Starting API Test Suite for Notorix Backend\n');
  
  // Test 1: Get API info
  await makeRequest('/');
  
  // Test 2: Get all users (initially empty)
  await makeRequest('/users');
  
  // Test 3: Create first user
  const user1Result = await makeRequest('/users', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });
  
  // Test 4: Create second user  
  await makeRequest('/users', {
    method: 'POST',
    body: JSON.stringify(testUser2)
  });
  
  // Test 5: Get all users (should have 2 users now)
  await makeRequest('/users');
  
  // Test 6: Get user by ID (if we got a user ID from creation)
  if (user1Result.data && user1Result.data.id) {
    await makeRequest(`/users/${user1Result.data.id}`);
    
    // Test 7: Update user
    await makeRequest(`/users/${user1Result.data.id}`, {
      method: 'PUT',
      body: JSON.stringify({ username: 'updateduser1' })
    });
    
    // Test 8: Get updated user
    await makeRequest(`/users/${user1Result.data.id}`);
  }
  
  // Test 9: Try to create duplicate user (should fail)
  await makeRequest('/users', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });
  
  // Test 10: Try to get non-existent user
  await makeRequest('/users/999');
  
  // Test 11: Try invalid POST data
  await makeRequest('/users', {
    method: 'POST',
    body: JSON.stringify({ username: 'incomplete' }) // missing email and password
  });
  
  console.log('\n🎉 API Test Suite Completed!');
}

// Only run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, makeRequest }; 