#!/usr/bin/env node

// Test script to make a call and then simulate webhook events for testing
const fetch = require('node-fetch');

const LOCAL_URL = 'http://localhost:3000';
const WEBHOOK_URL = 'http://localhost:3000/api/conversation-webhook';

async function testCallAndWebhooks() {
  console.log('🧪 Testing call initiation and webhook simulation...');
  
  try {
    // Step 1: Make a call
    console.log('\n📞 Step 1: Initiating call...');
    const callResponse = await fetch(`${LOCAL_URL}/api/outbound-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: '782121339',
        countryCode: '+27'
      })
    });
    
    if (!callResponse.ok) {
      throw new Error(`Call failed: ${callResponse.status}`);
    }
    
    const callData = await callResponse.json();
    console.log('✅ Call initiated:', callData);
    
    if (!callData.conversationId) {
      throw new Error('No conversation ID returned');
    }
    
    const conversationId = callData.conversationId;
    console.log('🎯 Conversation ID:', conversationId);
    
    // Step 2: Wait a moment then simulate webhook events
    console.log('\n⏳ Waiting 3 seconds before simulating webhook events...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Simulate webhook events
    const webhookEvents = [
      {
        type: 'conversation.started',
        conversation_id: conversationId,
        call_sid: callData.fullResponse?.callSid || 'test_call_sid',
        timestamp: new Date().toISOString()
      },
      {
        type: 'conversation.user_transcript', 
        conversation_id: conversationId,
        transcript: 'Hello, I can hear you clearly!',
        timestamp: new Date().toISOString()
      },
      {
        type: 'conversation.agent_response',
        conversation_id: conversationId,
        response: 'Great! I can hear you too. This is a test of the real-time streaming system.',
        timestamp: new Date().toISOString()
      },
      {
        type: 'conversation.user_transcript',
        conversation_id: conversationId, 
        transcript: 'Amazing! I can see the conversation appearing in real-time in the browser.',
        timestamp: new Date().toISOString()
      },
      {
        type: 'conversation.agent_response',
        conversation_id: conversationId,
        response: 'Perfect! The streaming is working correctly. Thank you for testing!',
        timestamp: new Date().toISOString()
      },
      {
        type: 'conversation.ended',
        conversation_id: conversationId,
        reason: 'call_completed',
        timestamp: new Date().toISOString()
      }
    ];
    
    console.log('\n📡 Step 2: Simulating webhook events...');
    
    for (let i = 0; i < webhookEvents.length; i++) {
      const event = webhookEvents[i];
      console.log(`\n📨 Sending event ${i + 1}/${webhookEvents.length}: ${event.type}`);
      
      if (event.transcript) {
        console.log(`👤 User: ${event.transcript}`);
      }
      if (event.response) {
        console.log(`🤖 Agent: ${event.response}`);
      }
      
      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
      
      if (webhookResponse.ok) {
        console.log('✅ Webhook event sent successfully');
      } else {
        console.log('❌ Webhook event failed:', webhookResponse.status);
      }
      
      // Wait between events
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n🎉 Test completed!');
    console.log('🌐 Check your browser at http://localhost:3000');
    console.log('📺 You should see the conversation messages streaming in real-time');
    console.log('📊 The conversation should automatically end when the last event is processed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCallAndWebhooks();
