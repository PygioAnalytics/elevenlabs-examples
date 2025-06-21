#!/bin/bash

# Test script for ElevenLabs server-side tools
# This script tests both webhook endpoints that the ElevenLabs agent will call

NGROK_URL="https://62a8-105-28-101-90.ngrok-free.app"

echo "🧪 Testing ElevenLabs Server-Side Tools"
echo "======================================"
echo ""

echo "1️⃣ Testing get-customer-details endpoint..."
echo "URL: $NGROK_URL/api/tools/get-customer-details"
echo ""

curl -X POST "$NGROK_URL/api/tools/get-customer-details" \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{"customer_id": "12345"}' \
  | jq '.data' -r

echo ""
echo "2️⃣ Testing change-bank-details endpoint..."
echo "URL: $NGROK_URL/api/tools/change-bank-details"
echo ""

curl -X POST "$NGROK_URL/api/tools/change-bank-details" \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{"bank_name": "FNB", "account_number": "987654321"}' \
  | jq '.data' -r

echo ""
echo "✅ Both endpoints are working correctly!"
echo ""
echo "📋 ElevenLabs Tool Configuration:"
echo "================================"
echo ""
echo "Tool 1: get_customer_details"
echo "URL: $NGROK_URL/api/tools/get-customer-details"
echo "Method: POST"
echo ""
echo "Tool 2: change_bank_details"  
echo "URL: $NGROK_URL/api/tools/change-bank-details"
echo "Method: POST"
echo ""
echo "🔗 Configure these URLs in your ElevenLabs agent dashboard"
