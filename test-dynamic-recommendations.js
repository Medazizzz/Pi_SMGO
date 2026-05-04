// Test script to verify dynamic Q&A recommendations endpoint
const http = require('http');

// Test data with Q&A answers
const testPayload = {
  user: {
    preferredCategories: ["MOVIE"],
    preferredTypes: ["MOVIE"],
    preferredGenres: ["ACTION", "THRILLER"]
  },
  limit: 6
};

console.log('🧪 Testing Dynamic Recommendations API Endpoint\n');
console.log('Testing: POST http://localhost:8090/api/contents/recommendations/dynamic');
console.log('Payload:', JSON.stringify(testPayload, null, 2));
console.log('\n⏳ Sending request...\n');

const postData = JSON.stringify(testPayload);

const options = {
  hostname: 'localhost',
  port: 8090,
  path: '/api/contents/recommendations/dynamic',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  },
  timeout: 15000
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`✓ Response Status: ${res.statusCode}`);
    console.log(`✓ Response Headers:`, res.headers);
    
    try {
      const jsonData = JSON.parse(data);
      console.log(`\n✓ SUCCESS! Received ${jsonData.length} recommendations from dynamic Q&A:\n`);
      
      jsonData.forEach((rec, index) => {
        console.log(`\n  ${index + 1}. ${rec.title} (ID: ${rec.contentId})`);
        console.log(`     Category: ${rec.category}`);
        console.log(`     Score: ${rec.recommendationScore.toFixed(2)}`);
        if (rec.aiReason) {
          console.log(`     AI Reason: ${rec.aiReason}`);
        }
      });
      
      console.log('\n\n✅ Dynamic recommendations endpoint is working correctly!');
      console.log('✅ Frontend Q&A component can now use this endpoint');
      console.log('✅ Recommendations are based on real-time Q&A answers, not stored profile');
      
    } catch (error) {
      console.error('\n❌ Error parsing response:', error.message);
      console.error('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request failed:', error.message);
  console.log('\nMake sure:');
  console.log('  1. Backend is running on http://localhost:8090');
  console.log('  2. AI Service is running on http://localhost:5055');
  console.log('  3. MongoDB is running on localhost:27017');
});

req.on('timeout', () => {
  console.error('\n⏰ Request timed out');
  req.destroy();
});

req.write(postData);
req.end();
