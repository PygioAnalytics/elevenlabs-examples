#!/usr/bin/env node

const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

console.log('🎯 Webhook Test Server Starting...');
console.log('📡 Listening for webhooks on port 3001');
console.log('🌐 Accessible at: http://localhost:3001/webhook');

let eventCount = 0;

app.post('/webhook', (req, res) => {
  eventCount++;
  console.log(`\n📨 Webhook Event #${eventCount} Received:`, new Date().toLocaleTimeString());
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  res.json({ received: true, eventNumber: eventCount });
});

app.get('/status', (req, res) => {
  res.json({ 
    status: 'running',
    eventsReceived: eventCount,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`✅ Webhook test server running on port ${port}`);
  console.log(`📊 Status endpoint: http://localhost:${port}/status`);
  console.log('\n📱 Now test your webhook by making a call!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down webhook test server...');
  process.exit(0);
});
