#!/usr/bin/env node

// Simulate conversation events for the real conversation
const fetch = require('node-fetch');

const BASE_URL = 'https://6d88-196-39-18-233.ngrok-free.app';
const CONVERSATION_ID = 'conv_01jxvvj3bten7ahccr6gt95jhf';

const simulatedEvents = [
  {
    type: 'conversation.started',
    conversation_id: CONVERSATION_ID,
    call_sid: 'CA341481e2572f7660389409333aa8568e',
    timestamp: new Date().toISOString()
  },
  {
    type: 'conversation.user_transcript',
    conversation_id: CONVERSATION_ID,
    transcript: 'Hello, I received your call. How can I help you?',
    timestamp: new Date().toISOString()
  },
  {
    type: 'conversation.agent_response',
    conversation_id: CONVERSATION_ID,
    response: 'Hi there! I am an AI assistant calling to demonstrate the real-time conversation streaming feature. Can you hear me clearly?',
    timestamp: new Date().toISOString()
  },
  {
    type: 'conversation.user_transcript',
    conversation_id: CONVERSATION_ID,
    transcript: 'Yes, I can hear you perfectly. This is amazing!',
    timestamp: new Date().toISOString()
  },
  {
    type: 'conversation.agent_response',
    conversation_id: CONVERSATION_ID,
    response: 'Great! The conversation is being streamed in real-time to the web interface. You should be able to see this conversation appearing live in your browser.',
    timestamp: new Date().toISOString()
  },
  {
    type: 'conversation.ended',
    conversation_id: CONVERSATION_ID,
    reason: 'caller_hung_up',
    timestamp: new Date().toISOString()
  }
];

async function simulateConversation() {
  console.log('📞 Simulating conversation events for real call...');
  console.log('Conversation ID:', CONVERSATION_ID);
  
  for (let i = 0; i < simulatedEvents.length; i++) {
    const event = simulatedEvents[i];
    console.log(`\n📡 Sending event ${i + 1}/${simulatedEvents.length}: ${event.type}`);
    
    if (event.type === 'conversation.user_transcript') {
      console.log(`👤 User: ${event.transcript}`);
    } else if (event.type === 'conversation.agent_response') {
      console.log(`🤖 Agent: ${event.response}`);
    }
    
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
      
      // Wait between events to simulate natural conversation flow
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error('❌ Error sending event:', error.message);
    }
  }
  
  console.log('\n🏁 Conversation simulation completed!');
  console.log('Check your browser and terminal to see the real-time streaming in action.');
}

// Only run simulation if --simulate flag is passed
if (process.argv.includes('--simulate')) {
  simulateConversation().catch(console.error);
} else {
  console.log('📞 Real call initiated to +27782121339');
  console.log('🎯 Conversation ID:', CONVERSATION_ID);
  console.log('🌐 Webhook URL:', BASE_URL + '/api/conversation-webhook');
  console.log('📺 Web Interface: http://localhost:3002');
  console.log('📡 SSE Stream: http://localhost:3002/api/conversation-stream?conversationId=' + CONVERSATION_ID);
  console.log('\n📱 Answer the phone and start talking to see real-time streaming!');
  console.log('📝 Or run: node test-real-call.js --simulate');
}
