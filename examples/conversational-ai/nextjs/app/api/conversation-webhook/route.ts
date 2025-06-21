import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { broadcastToSSE, closeSSEConnection } from '@/lib/sse-utils';

// Store active conversations and their WebSocket connections
const activeConversations = new Map<string, {
  conversationId: string;
  callSid: string;
  status: 'active' | 'ended';
  messages: Array<{
    id: string;
    type: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
}>();

// WebSocket connections for real-time updates
const wsConnections = new Map<string, WebSocket>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    
    // Verify webhook signature (optional but recommended)
    const signature = req.headers.get("elevenlabs-signature");
    const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
    
    if (secret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
      
      if (signature !== `sha256=${expectedSignature}`) {
        console.error("Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    console.log("Received webhook event:", JSON.stringify(event, null, 2));

    // ElevenLabs webhook events structure
    switch (event.type || event.event_type) {
      case "conversation.started":
      case "conversation_started":
        handleConversationStarted(event);
        break;
      
      case "conversation.user_transcript":
      case "user_transcript":
        handleUserTranscript(event);
        break;
      
      case "conversation.agent_response":
      case "agent_response":
        handleAgentResponse(event);
        break;
      
      case "conversation.tool_call":
      case "tool_call":
      case "function_call":
        handleToolCall(event);
        break;
      
      case "conversation.tool_result":
      case "tool_result":
      case "function_result":
        handleToolResult(event);
        break;
      
      case "conversation.ended":
      case "conversation_ended":
        handleConversationEnded(event);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type || event.event_type}`);
        console.log("Full event data:", event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

function handleConversationStarted(event: any) {
  const conversation_id = event.conversation_id || event.data?.conversation_id;
  const call_sid = event.call_sid || event.data?.call_sid;
  
  if (!conversation_id) {
    console.error("No conversation_id found in event:", event);
    return;
  }
  
  activeConversations.set(conversation_id, {
    conversationId: conversation_id,
    callSid: call_sid,
    status: 'active',
    messages: []
  });
  
  console.log(`Conversation started: ${conversation_id}`);
  
  // Broadcast to frontend via Server-Sent Events
  broadcastToFrontend({
    type: 'conversation_started',
    conversationId: conversation_id,
    callSid: call_sid
  });
}

function handleUserTranscript(event: any) {
  const conversation_id = event.conversation_id || event.data?.conversation_id;
  const transcript = event.transcript || event.data?.transcript;
  
  if (!conversation_id || !transcript) {
    console.error("Missing conversation_id or transcript in event:", event);
    return;
  }
  
  const conversation = activeConversations.get(conversation_id);
  
  if (conversation) {
    const message = {
      id: `user_${Date.now()}`,
      type: 'user' as const,
      content: transcript,
      timestamp: new Date().toISOString()
    };
    
    conversation.messages.push(message);
    
    console.log(`User said: ${transcript}`);
    
    // Broadcast to frontend
    broadcastToFrontend({
      type: 'user_message',
      conversationId: conversation_id,
      message
    });
  }
}

function handleAgentResponse(event: any) {
  const conversation_id = event.conversation_id || event.data?.conversation_id;
  const response = event.response || event.data?.response;
  
  if (!conversation_id || !response) {
    console.error("Missing conversation_id or response in event:", event);
    return;
  }
  
  const conversation = activeConversations.get(conversation_id);
  
  if (conversation) {
    const message = {
      id: `agent_${Date.now()}`,
      type: 'assistant' as const,
      content: response,
      timestamp: new Date().toISOString()
    };
    
    conversation.messages.push(message);
    
    console.log(`Agent said: ${response}`);
    
    // Broadcast to frontend
    broadcastToFrontend({
      type: 'agent_message',
      conversationId: conversation_id,
      message
    });
  }
}

// Tool call handler
function handleToolCall(event: any) {
  const conversation_id = event.conversation_id || event.conversationId;
  console.log(`🔧 Tool call detected for conversation ${conversation_id}:`, event);
  
  if (conversation_id && activeConversations.has(conversation_id)) {
    const conversation = activeConversations.get(conversation_id)!;
    
    // Extract tool call information
    const toolCall = {
      name: event.tool_name || event.function_name || event.name,
      parameters: event.parameters || event.arguments || {},
      id: event.tool_call_id || event.id
    };
    
    console.log(`🔧 Broadcasting tool call: ${toolCall.name}`);
    
    // Broadcast tool call to frontend
    broadcastToFrontend({
      type: 'tool_call',
      conversationId: conversation_id,
      toolCall: toolCall,
      timestamp: new Date().toISOString()
    });
  }
}

// Tool result handler
function handleToolResult(event: any) {
  const conversation_id = event.conversation_id || event.conversationId;
  console.log(`✅ Tool result detected for conversation ${conversation_id}:`, event);
  
  if (conversation_id && activeConversations.has(conversation_id)) {
    const conversation = activeConversations.get(conversation_id)!;
    
    // Extract tool result information
    const toolResult = {
      name: event.tool_name || event.function_name || event.name,
      result: event.result || event.data || event.output,
      success: event.success !== false, // Default to true unless explicitly false
      id: event.tool_call_id || event.id
    };
    
    console.log(`✅ Broadcasting tool result: ${toolResult.name}`);
    
    // Broadcast tool result to frontend
    broadcastToFrontend({
      type: 'tool_result',
      conversationId: conversation_id,
      toolResult: toolResult,
      timestamp: new Date().toISOString()
    });
  }
}

function handleConversationEnded(event: any) {
  const conversation_id = event.conversation_id || event.data?.conversation_id;
  const reason = event.reason || event.data?.reason || 'Call ended';
  
  if (!conversation_id) {
    console.error("No conversation_id found in event:", event);
    return;
  }
  
  const conversation = activeConversations.get(conversation_id);
  
  if (conversation) {
    conversation.status = 'ended';
    
    console.log(`Conversation ended: ${conversation_id}, reason: ${reason}`);
    
    // Broadcast to frontend
    broadcastToFrontend({
      type: 'conversation_ended',
      conversationId: conversation_id,
      reason
    });
    
    // Close SSE connection
    if (closeSSEConnection) {
      closeSSEConnection(conversation_id);
    }
    
    // Clean up after a delay
    setTimeout(() => {
      activeConversations.delete(conversation_id);
    }, 60000); // Keep for 1 minute for any late requests
  }
}

function broadcastToFrontend(data: any) {
  console.log("Broadcasting to frontend:", data);
  
  // Use Server-Sent Events to broadcast to frontend
  if (data.conversationId) {
    try {
      broadcastToSSE(data.conversationId, data);
      console.log(`✅ Successfully broadcasted ${data.type} to SSE clients`);
    } catch (error) {
      console.error(`❌ Failed to broadcast to SSE:`, error);
    }
  } else {
    console.error("❌ No conversationId provided for broadcast");
  }
}

// GET endpoint to retrieve conversation data
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');
  
  if (conversationId) {
    const conversation = activeConversations.get(conversationId);
    if (conversation) {
      return NextResponse.json(conversation);
    }
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  
  // Return all active conversations
  return NextResponse.json({
    conversations: Array.from(activeConversations.values())
  });
}
