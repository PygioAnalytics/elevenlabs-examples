import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "elevenlabs";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, countryCode } = await req.json();
    
    if (!phoneNumber || !countryCode) {
      return NextResponse.json(
        { error: "Phone number and country code are required" },
        { status: 400 }
      );
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    
    // Environment variables
    const agentId = process.env.AGENT_ID;
    const agentPhoneNumberId = process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!agentId || !agentPhoneNumberId || !apiKey) {
      console.error("Missing required environment variables:", {
        agentId: !!agentId,
        agentPhoneNumberId: !!agentPhoneNumberId,
        apiKey: !!apiKey
      });
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get the base URL for webhook
    const baseUrl = process.env.BASE_URL;
    
    if (!baseUrl) {
      console.error("BASE_URL environment variable not set");
      return NextResponse.json(
        { error: "Server configuration error: missing base URL" },
        { status: 500 }
      );
    }
    
    const webhookUrl = `${baseUrl}/api/conversation-webhook`;

    console.log("Initiating outbound call to:", fullPhoneNumber);
    console.log("Webhook URL:", webhookUrl);

    // Use ElevenLabs' Twilio outbound call API
    const requestBody = {
      agent_id: agentId,
      agent_phone_number_id: agentPhoneNumberId,
      to_number: fullPhoneNumber,
      webhook_url: webhookUrl,
    };
    
    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("ElevenLabs API error:", errorData);
      return NextResponse.json(
        { error: "Failed to initiate call" },
        { status: response.status }
      );
    }

    const callData = await response.json();
    console.log("ElevenLabs API response:", JSON.stringify(callData, null, 2));

    return NextResponse.json({
      success: true,
      message: "Call initiated successfully",
      conversationId: callData.conversation_id,
      callSid: callData.call_sid,
      fullResponse: callData, // Include full response for debugging
    });

  } catch (error) {
    console.error("Error initiating outbound call:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}