#!/usr/bin/env node

// Simple test script to simulate ElevenLabs webhook events
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3002';
const TEST_CONVERSATION_ID = 'test_conv_' + Date.now();

// Test events to send
const testEvents = [
  {
    type: 'conversation.started',
    conversation_id: TEST_CONVERSATION_ID,
    call_sid: 'test_call_sid_123',
    timestamp: new Date().toISOString()
  },
  {
    type: 'conversation.user_transcript',
    conversation_id: TEST_CONVERSATION_ID,
    transcript: 'Hello, this is a test message from the caller',
    timestamp: new Date().toISOString()
  },
  {
    type: 'conversation.agent_response',
    conversation_id: TEST_CONVERSATION_ID,
    response: 'Hello! I am the AI assistant. How can I help you today?',
    timestamp: new Date().toISOString()
  },
  {
    type: 'conversation.ended',
    conversation_id: TEST_CONVERSATION_ID,
    reason: 'caller_hung_up',
    timestamp: new Date().toISOString()
  }
];

async function testWebhook() {
  console.log('🧪 Testing webhook endpoints...');
  console.log('Conversation ID:', TEST_CONVERSATION_ID);
  
  for (let i = 0; i < testEvents.length; i++) {
    const event = testEvents[i];
    console.log(`\n📡 Sending event ${i + 1}/${testEvents.length}: ${event.type}`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/conversation-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
      
      if (response.ok) {
        console.log('✅ Event sent successfully');
      } else {
        console.log('❌ Event failed:', response.status, response.statusText);
      }
      
      // Wait a bit between events
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('❌ Error sending event:', error.message);
    }
  }
  
  console.log('\n🏁 Test completed!');
  console.log('Check your browser at http://localhost:3000 and connect to the conversation stream to see the events.');
}

// Run the test
testWebhook().catch(console.error);
