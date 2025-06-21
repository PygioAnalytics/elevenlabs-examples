import { NextRequest } from "next/server";
import { registerSSEConnection, unregisterSSEConnection } from "@/lib/sse-utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');
  
  if (!conversationId) {
    return new Response("Conversation ID required", { status: 400 });
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Store the connection
      registerSSEConnection(conversationId, controller);
      
      // Send initial connection message
      const data = `data: ${JSON.stringify({
        type: 'connection_established',
        conversationId,
        timestamp: new Date().toISOString()
      })}\n\n`;
      
      controller.enqueue(new TextEncoder().encode(data));
      
      console.log(`SSE connection established for conversation: ${conversationId}`);
    },
    
    cancel() {
      // Clean up when client disconnects
      unregisterSSEConnection(conversationId);
      console.log(`SSE connection closed for conversation: ${conversationId}`);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}
