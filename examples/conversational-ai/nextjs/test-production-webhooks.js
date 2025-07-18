#!/usr/bin/env node

// Test webhook events on production
const fetch = require('node-fetch');

const WEBHOOK_URL = 'https://www.pygiocollections.com/api/conversation-webhook';
const CONVERSATION_ID = 'test_conv_' + Date.now();

const simulatedEvents = [
  {
    type: 'conversation_started',
    conversation_id: CONVERSATION_ID,
    call_sid: 'test_call_123'
  },
  {
    type: 'user_message',
    conversation_id: CONVERSATION_ID,
    message: {
      content: 'Hi, my customer ID is 12345',
      timestamp: new Date().toISOString()
    }
  },
  {
    type: 'tool_call',
    conversation_id: CONVERSATION_ID,
    toolCall: {
      name: 'get_customer_details',
      parameters: { customer_id: '12345' },
      id: 'tool_call_123'
    }
  },
  {
    type: 'tool_result',
    conversation_id: CONVERSATION_ID,
    toolResult: {
      name: 'get_customer_details',
      result: {
        id: 12345,
        name: 'Nicolas',
        loan_type: 'Mobile Handset Loan',
        device_type: 'Samsung Galaxy S24',
        device_value: 24000,
        monthly_instalment: 2000,
        outstanding_payments: 8,
        payment_status: '30_days',
        bank_name: 'Standard Bank',
        account_number: '155555555'
      },
      success: true
    }
  },
  {
    type: 'agent_message',
    conversation_id: CONVERSATION_ID,
    message: {
      content: 'I can see you have a Samsung Galaxy S24 loan with 8 outstanding payments.',
      timestamp: new Date().toISOString()
    }
  }
];

async function testWebhookEvents() {
  console.log('🧪 Testing webhook events on production...');
  console.log(`📍 URL: ${WEBHOOK_URL}`);
  console.log(`🆔 Conversation ID: ${CONVERSATION_ID}`);
  console.log('');
  
  for (let i = 0; i < simulatedEvents.length; i++) {
    const event = simulatedEvents[i];
    
    console.log(`📤 Sending event ${i + 1}/${simulatedEvents.length}: ${event.type}`);
    
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
      
      if (response.ok) {
        console.log(`✅ Event sent successfully`);
      } else {
        console.log(`❌ Failed to send event: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }
    
    // Wait between events
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('');
  console.log('🌐 Now check your frontend at: https://www.pygiocollections.com');
  console.log(`📡 Connect to SSE stream: /api/conversation-stream?conversationId=${CONVERSATION_ID}`);
  console.log('');
  console.log('If you see tool calls in the chat, the frontend is working correctly!');
}

testWebhookEvents();
