const http = require('http');

// Calculate exactly 2 minutes from now
const now = new Date();
const futureTime = new Date(now.getTime() + 2 * 60 * 1000);
const isoTime = futureTime.toISOString().replace('Z', '');

console.log(`Current time: ${now.toISOString()}`);
console.log(`Scheduled time: ${isoTime}`);
console.log('');

// Create newsletter campaign
const newsletter = {
  title: 'Test Newsletter - Exact Time Dispatch',
  message: 'This newsletter should dispatch exactly at the scheduled time. Testing exact-time dispatch functionality.',
  scheduledAt: isoTime,
  sendEmail: true,
  targetCategory: '',
  targetGenres: []
};

const postData = JSON.stringify(newsletter);

const options = {
  hostname: 'localhost',
  port: 8090,
  path: '/api/newsletters',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Response:', data);
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('\n✓ Newsletter created successfully!');
      console.log(`✓ It will dispatch at: ${isoTime}`);
      console.log('✓ Check backend logs for dispatch confirmation');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();

console.log('Sending newsletter creation request...');
