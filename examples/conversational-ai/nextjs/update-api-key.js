#!/usr/bin/env node

// Quick script to update the ElevenLabs API key
const fs = require('fs');
const path = require('path');

function updateApiKey(newApiKey) {
  if (!newApiKey) {
    console.error('❌ Please provide a new API key');
    console.log('Usage: node update-api-key.js sk_your_new_api_key_here');
    process.exit(1);
  }

  if (!newApiKey.startsWith('sk_')) {
    console.error('❌ API key should start with "sk_"');
    process.exit(1);
  }

  const envFiles = ['.env', '.env.local'];
  
  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile);
    
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf8');
      
      // Update ELEVENLABS_API_KEY line
      const updatedContent = content.replace(
        /ELEVENLABS_API_KEY="[^"]*"/g,
        `ELEVENLABS_API_KEY="${newApiKey}"`
      );
      
      if (content !== updatedContent) {
        fs.writeFileSync(envPath, updatedContent);
        console.log(`✅ Updated API key in ${envFile}`);
      } else {
        console.log(`ℹ️  ${envFile} - ELEVENLABS_API_KEY not found`);
      }
    } else {
      console.log(`⚠️  ${envFile} not found`);
    }
  }

  console.log('\n🎉 API key update complete!');
  console.log('🔐 New API key set (hidden for security)');
  console.log('\n📋 Next steps:');
  console.log('1. Restart your Next.js dev server');
  console.log('2. Try making a phone call again');
}

// Get API key from command line arguments
const newApiKey = process.argv[2];
updateApiKey(newApiKey);
