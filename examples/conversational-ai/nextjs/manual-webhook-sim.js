#!/usr/bin/env node

// Manual webhook simulation - run this after making a call through the UI
const fetch = require('node-fetch');

const WEBHOOK_URL = 'http://localhost:3000/api/conversation-webhook';

async function simulateWebhooksForManualCall() {
  console.log('🎯 Manual Webhook Simulation');
  console.log('📋 Instructions:');
  console.log('1. Make a call through the UI');
  console.log('2. Copy the conversation ID from browser console');
  console.log('3. Run: node manual-webhook-sim.js <conversation_id>');
  console.log('');
  
  const conversationId = process.argv[2];
  
  if (!conversationId) {
    console.log('❌ Please provide a conversation ID');
    console.log('📝 Usage: node manual-webhook-sim.js conv_01jxvwavepexntz3k6teg5fjh1');
    return;
  }
  
  console.log('🎯 Using conversation ID:', conversationId);
  
  const events = [
    {
      type: 'conversation.started',
      conversation_id: conversationId,
      call_sid: 'manual_test_call',
      timestamp: new Date().toISOString()
    },
    {
      type: 'conversation.user_transcript',
      conversation_id: conversationId, 
      transcript: 'Hi, this is a test of the manual webhook simulation.',
      timestamp: new Date().toISOString()
    },
    {
      type: 'conversation.agent_response',
      conversation_id: conversationId,
      response: 'Hello! I can see you are testing the webhook system. This message should appear in your browser in real-time!',
      timestamp: new Date().toISOString()
    },
    {
      type: 'conversation.user_transcript',
      conversation_id: conversationId,
      transcript: 'Perfect! I can see the messages streaming live.',
      timestamp: new Date().toISOString()
    },
    {
      type: 'conversation.agent_response', 
      conversation_id: conversationId,
      response: 'Excellent! The real-time conversation streaming is working perfectly.',
      timestamp: new Date().toISOString()
    },
    {
      type: 'conversation.ended',
      conversation_id: conversationId,
      reason: 'manual_test_completed',
      timestamp: new Date().toISOString()
    }
  ];
  
  console.log('\n📡 Sending webhook events...');
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    console.log(`\n📨 Event ${i + 1}/${events.length}: ${event.type}`);
    
    if (event.transcript) console.log(`👤 User: ${event.transcript}`);
    if (event.response) console.log(`🤖 Agent: ${event.response}`);
    
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      
      if (response.ok) {
        console.log('✅ Sent successfully');
      } else {
        console.log('❌ Failed:', response.status);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🎉 Manual webhook simulation completed!');
  console.log('📺 Check your browser - the conversation should be streaming live!');
}

simulateWebhooksForManualCall();
