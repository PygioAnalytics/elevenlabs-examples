#!/usr/bin/env node

// Debug script to check ElevenLabs agent configuration
require('dotenv').config();

async function checkAgentConfig() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.AGENT_ID;
  
  if (!apiKey || !agentId) {
    console.error('❌ Missing API key or Agent ID');
    process.exit(1);
  }
  
  console.log('🔍 Checking ElevenLabs agent configuration...');
  console.log('Agent ID:', agentId);
  
  try {
    // Get agent details
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      headers: {
        'xi-api-key': apiKey
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to get agent config:', error);
      return;
    }
    
    const agent = await response.json();
    console.log('✅ Agent found:', agent.name);
    
    // Check webhook configuration
    console.log('\n📡 Webhook Configuration:');
    if (agent.webhook_url) {
      console.log('✅ Webhook URL set:', agent.webhook_url);
    } else {
      console.log('❌ No webhook URL configured in agent');
    }
    
    if (agent.webhook_events) {
      console.log('✅ Webhook events configured:', agent.webhook_events);
    } else {
      console.log('⚠️  No webhook events configuration found');
    }
    
    // Check other relevant settings
    console.log('\n🔧 Agent Settings:');
    console.log('- Language:', agent.language || 'Not set');
    console.log('- Voice ID:', agent.voice_id || 'Not set');
    console.log('- First message:', agent.first_message || 'Not set');
    
    if (agent.tools && agent.tools.length > 0) {
      console.log('🛠️  Tools configured:', agent.tools.length);
      agent.tools.forEach((tool, index) => {
        console.log(`  ${index + 1}. ${tool.name || tool.function?.name || 'Unknown tool'}`);
      });
    } else {
      console.log('⚠️  No tools configured');
    }
    
    console.log('\n📋 Full agent configuration:');
    console.log(JSON.stringify(agent, null, 2));
    
  } catch (error) {
    console.error('❌ Error checking agent config:', error.message);
  }
}

checkAgentConfig();
