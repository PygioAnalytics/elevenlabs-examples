import { NextRequest } from "next/server";

// Store active SSE connections
const sseConnections = new Map<string, ReadableStreamDefaultController>();

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
      sseConnections.set(conversationId, controller);
      
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
      sseConnections.delete(conversationId);
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

// Function to broadcast events to SSE clients (to be called from webhook)
export function broadcastToSSE(conversationId: string, data: any) {
  const controller = sseConnections.get(conversationId);
  if (controller) {
    try {
      const eventData = `data: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(new TextEncoder().encode(eventData));
    } catch (error) {
      console.error('Error broadcasting to SSE:', error);
      // Remove broken connection
      sseConnections.delete(conversationId);
    }
  }
}

// Function to close SSE connection
export function closeSSEConnection(conversationId: string) {
  const controller = sseConnections.get(conversationId);
  if (controller) {
    try {
      const data = `data: ${JSON.stringify({
        type: 'connection_closed',
        conversationId,
        timestamp: new Date().toISOString()
      })}\n\n`;
      
      controller.enqueue(new TextEncoder().encode(data));
      controller.close();
    } catch (error) {
      console.error('Error closing SSE connection:', error);
    } finally {
      sseConnections.delete(conversationId);
    }
  }
}
