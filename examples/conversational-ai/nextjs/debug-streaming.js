#!/usr/bin/env node

// Monitor SSE connections and webhook events
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function monitorWebhooks() {
  console.log('🔍 Monitoring webhook events...');
  console.log('📡 Make a call through the UI and watch for events here.\n');
  
  // Test webhook endpoint
  try {
    const response = await fetch(`${BASE_URL}/api/conversation-webhook`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Webhook endpoint is accessible');
      console.log('📊 Active conversations:', data.conversations?.length || 0);
    } else {
      console.log('❌ Webhook endpoint test failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }
  
  // Test SSE endpoint
  console.log('\n🧪 Testing SSE endpoint...');
  const testConversationId = 'test_' + Date.now();
  
  try {
    const response = await fetch(`${BASE_URL}/api/conversation-stream?conversationId=${testConversationId}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      }
    });
    
    if (response.ok) {
      console.log('✅ SSE endpoint is accessible');
      
      // Read first event
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      const result = await reader.read();
      if (!result.done) {
        const chunk = decoder.decode(result.value);
        console.log('📥 First SSE event:', chunk.trim());
      }
      
      reader.releaseLock();
    } else {
      console.log('❌ SSE endpoint test failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Error testing SSE:', error.message);
  }
  
  console.log('\n📱 Now make a call through the UI and watch the server logs!');
  console.log('🌐 Open: http://localhost:3000');
  console.log('🔍 Server logs will show webhook events and SSE connections.');
}

monitorWebhooks().catch(console.error);
