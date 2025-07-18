// Central configuration for URLs and endpoints
// Update BASE_URL in .env when ngrok URL changes

export const config = {
  // Get base URL from environment or fallback to localhost
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  
  // API endpoints
  endpoints: {
    webhook: '/api/conversation-webhook',
    conversationStream: '/api/conversation-stream',
    outboundCall: '/api/outbound-call',
    signedUrl: '/api/signed-url',
    tools: {
      customerDetails: '/api/tools/get-customer-details',
      changeBankDetails: '/api/tools/change-bank-details'
    }
  },
  
  // Helper functions to get full URLs
  getWebhookUrl: () => `${config.baseUrl}${config.endpoints.webhook}`,
  getStreamUrl: () => `${config.baseUrl}${config.endpoints.conversationStream}`,
  getCallUrl: () => `${config.baseUrl}${config.endpoints.outboundCall}`,
  getToolUrl: (toolName: string) => {
    const toolPath = config.endpoints.tools[toolName as keyof typeof config.endpoints.tools];
    return toolPath ? `${config.baseUrl}${toolPath}` : null;
  }
};

// For CommonJS compatibility in test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}
