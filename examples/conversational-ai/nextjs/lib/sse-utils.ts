// SSE utility functions for managing Server-Sent Events connections

// Store active SSE connections
const sseConnections = new Map<string, ReadableStreamDefaultController>();

// Function to register a new SSE connection
export function registerSSEConnection(conversationId: string, controller: ReadableStreamDefaultController) {
  sseConnections.set(conversationId, controller);
  console.log(`SSE connection registered for conversation: ${conversationId}`);
}

// Function to unregister an SSE connection
export function unregisterSSEConnection(conversationId: string) {
  sseConnections.delete(conversationId);
  console.log(`SSE connection unregistered for conversation: ${conversationId}`);
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
