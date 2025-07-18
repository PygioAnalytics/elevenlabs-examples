#!/usr/bin/env node

// Quick script to update the ngrok URL in all configuration files
const fs = require('fs');
const path = require('path');

function updateNgrokUrl(newUrl) {
  if (!newUrl) {
    console.error('❌ Please provide a new ngrok URL');
    console.log('Usage: node update-ngrok-url.js https://your-new-ngrok-url.ngrok-free.app');
    process.exit(1);
  }

  // Remove trailing slash if present
  const cleanUrl = newUrl.replace(/\/$/, '');

  const envFiles = ['.env', '.env.local'];
  
  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile);
    
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf8');
      
      // Update BASE_URL line
      const updatedContent = content.replace(
        /BASE_URL="[^"]*"/g,
        `BASE_URL="${cleanUrl}"`
      );
      
      if (content !== updatedContent) {
        fs.writeFileSync(envPath, updatedContent);
        console.log(`✅ Updated ${envFile}`);
      } else {
        console.log(`ℹ️  ${envFile} - no changes needed or BASE_URL not found`);
      }
    } else {
      console.log(`⚠️  ${envFile} not found`);
    }
  }

  console.log('\n🎉 ngrok URL update complete!');
  console.log(`📡 New URL: ${cleanUrl}`);
  console.log('\n📋 Next steps:');
  console.log('1. Restart your Next.js dev server if it\'s running');
  console.log('2. Make sure your ngrok tunnel is pointing to the correct port');
  console.log('3. Test your phone calls!');
}

// Get URL from command line arguments
const newUrl = process.argv[2];
updateNgrokUrl(newUrl);
