#!/usr/bin/env node

// Test script to verify ElevenLabs API key
require('dotenv').config();

async function testApiKey() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No ELEVENLABS_API_KEY found in environment variables');
    process.exit(1);
  }
  
  if (!apiKey.startsWith('sk_')) {
    console.error('❌ API key should start with "sk_"');
    process.exit(1);
  }
  
  console.log('🔑 Testing API key...');
  
  try {
    // Test basic API access
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: {
        'xi-api-key': apiKey
      }
    });
    
    if (response.ok) {
      const userData = await response.json();
      console.log('✅ API key is valid!');
      console.log(`👤 User: ${userData.email || 'Unknown'}`);
      console.log(`💰 Credits: ${userData.subscription?.character_count || 'Unknown'}`);
      
      // Test Conversational AI access
      console.log('\n🤖 Testing Conversational AI access...');
      const agentResponse = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
        headers: {
          'xi-api-key': apiKey
        }
      });
      
      if (agentResponse.ok) {
        const agents = await agentResponse.json();
        console.log('✅ Conversational AI access confirmed!');
        console.log(`🤖 Found ${agents.length || 0} agents`);
      } else if (agentResponse.status === 403) {
        console.error('❌ API key does not have Conversational AI access');
        console.log('💡 Please check your ElevenLabs subscription includes Conversational AI');
      } else {
        console.error('⚠️  Could not verify Conversational AI access');
      }
      
    } else if (response.status === 401) {
      console.error('❌ Invalid API key');
      console.log('💡 Please check your API key in the ElevenLabs dashboard');
    } else {
      console.error(`❌ API error: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testApiKey();
