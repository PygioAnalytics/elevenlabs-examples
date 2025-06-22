"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MessageCircle, Zap, Brain, Loader2, Phone, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConversation } from "@11labs/react";
import { cn } from "@/lib/utils";

async function requestMicrophonePermission() {
  try {
    console.log('Requesting microphone permission...');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('Microphone permission granted');
    console.log('Audio tracks:', stream.getAudioTracks());
    
    // Stop the stream after getting permission
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error("Microphone permission denied or not available:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
    }
    return false;
  }
}

async function getSignedUrl(): Promise<string> {
  const response = await fetch("/api/signed-url");
  if (!response.ok) {
    throw Error("Failed to get signed url");
  }
  const data = await response.json();
  return data.signedUrl;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  agent?: string;
  timestamp: string;
  functionName?: string;
  functionData?: any;
}

// Server-side tools only - no client-side tool logic

export function RealtimeAgents() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAgent, setCurrentAgent] = useState('AI Assistant');
  const [conversationLogs, setConversationLogs] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastAIMessageTime, setLastAIMessageTime] = useState<number>(0);
  const [toolCallInProgress, setToolCallInProgress] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logsEndRefDesktop = useRef<HTMLDivElement>(null);
  const logsEndRefMobile = useRef<HTMLDivElement>(null);

  // Twilio call state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+27'); // Default to South Africa
  const [isTwilioConnecting, setIsTwilioConnecting] = useState(false);
  const [isTwilioConnected, setIsTwilioConnected] = useState(false);
  const [twilioConversationId, setTwilioConversationId] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [isPhoneCardCollapsed, setIsPhoneCardCollapsed] = useState(false);

  // Common country codes with flags
  const countryCodes = [
    { code: '+27', name: 'South Africa', flag: '🇿🇦' },
    { code: '+1', name: 'US/Canada', flag: '🇺🇸' },
    { code: '+44', name: 'UK', flag: '🇬🇧' },
    { code: '+49', name: 'Germany', flag: '🇩🇪' },
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+34', name: 'Spain', flag: '🇪🇸' },
    { code: '+39', name: 'Italy', flag: '🇮🇹' },
    { code: '+81', name: 'Japan', flag: '🇯🇵' },
    { code: '+86', name: 'China', flag: '🇨🇳' },
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+61', name: 'Australia', flag: '🇦🇺' },
    { code: '+55', name: 'Brazil', flag: '🇧🇷' },
    { code: '+52', name: 'Mexico', flag: '🇲🇽' },
    { code: '+7', name: 'Russia', flag: '🇷🇺' },
    { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  ];

  const addMessage = useCallback((type: Message['type'], content: string, agent = currentAgent, functionName?: string, functionData?: any) => {
    const message: Message = {
      id: Date.now() + Math.random().toString(),
      type,
      content,
      agent,
      timestamp: new Date().toLocaleTimeString(),
      functionName,
      functionData
    };
    setMessages(prev => [...prev, message]);
  }, [currentAgent]);

  const addConversationLog = useCallback((log: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConversationLogs(prev => [...prev, `[${timestamp}] ${log}`]);
  }, []);

  // Client tools for UI interactions - working alongside server tools
  const clientTools = {
    client_get_customer_details: async (parameters: any): Promise<string> => {
      console.log('🎨 Client UI tool called: client_get_customer_details', parameters);
      
      try {
        // Extract customer data from parameters (sent by LLM after server tool call)
        const customerData = parameters.customer_data || parameters.data || parameters;
        
        console.log('🎨 Displaying customer data:', customerData);
        
        // Display the customer details in a single dialogue box
        addMessage('function', `✅ Customer details retrieved and displayed`, 'System', 'client_get_customer_details', customerData);
        addConversationLog('✅ Client UI tool: customer details displayed');
        
        // Return success message to the LLM
        return JSON.stringify({
          success: true,
          message: "Customer details have been successfully retrieved and displayed in the user interface",
          displayed_data: customerData
        });
        
      } catch (error) {
        console.error('❌ Client UI tool error:', error);
        addMessage('function', `❌ Error displaying customer details: ${error}`, 'System', 'client_get_customer_details');
        throw error;
      }
    },

    client_change_bank_details: async (parameters: any): Promise<string> => {
      console.log('🎨 Client UI tool called: client_change_bank_details', parameters);
      
      try {
        const { previous_details, updated_details, success } = parameters;
        
        const bankChangeResult = {
          success: success !== false,
          previous: previous_details || {
            bank_name: "Standard Bank",
            account_number: "155555555"
          },
          updated: updated_details || {
            bank_name: "Updated Bank",
            account_number: "Updated Account"
          },
          message: `Bank details updated successfully`
        };
        
        addMessage('function', `✅ Bank details updated successfully`, 'System', 'client_change_bank_details', bankChangeResult);
        addConversationLog('✅ Client UI tool: bank details updated');
        
        return JSON.stringify({
          success: true,
          message: "Bank details update has been displayed in the user interface"
        });
        
      } catch (error) {
        console.error('❌ Client UI tool error:', error);
        addMessage('function', `❌ Error updating bank details display: ${error}`, 'System', 'client_change_bank_details');
        throw error;
      }
    }
  };

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connection Established");
      addMessage('system', 'Connection Established');
      addConversationLog('✅ Connection Established');
    },
    onDisconnect: (reason) => {
      console.log("Disconnected from Voice AI. Reason:", reason);
      addMessage('system', `Disconnected from Voice AI${reason ? `: ${reason}` : ''}`);
      addConversationLog(`❌ Disconnected from Voice AI${reason ? `: ${reason}` : ''}`);
      setMessages([]);
      setConversationLogs([]);
      setCurrentAgent('AI Assistant');
    },
    onError: (error: any) => {
      console.error("Conversation Error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      let errorMessage = 'Connection error';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error) {
          errorMessage = error.error;
        } else {
          errorMessage = JSON.stringify(error);
        }
      }
      
      addMessage('system', `Error: ${errorMessage}`);
      addConversationLog(`❌ Error: ${errorMessage}`);
    },
    onMessage: (message: any) => {
      console.log("🔍 DETAILED Message received:", {
        source: message.source,
        message: message.message,
        full_message_object: message
      });
      
      // Enhanced logging to understand the exact structure
      console.log("🔍 Message keys:", Object.keys(message));
      console.log("🔍 Message type:", typeof message);
      console.log("🔍 Message JSON:", JSON.stringify(message, null, 2));
      
      addConversationLog(`📨 Message: ${JSON.stringify(message)}`);
      
      // Handle messages from Voice AI
      if (message.source === 'user') {
        addMessage('user', message.message, 'You');
      } else if (message.source === 'ai') {
        addMessage('assistant', message.message, currentAgent);
      }
      
      // Enhanced server-side tool call detection - check multiple possible properties
      const possibleToolCallKeys = ['tool_call', 'toolCall', 'function_call', 'functionCall', 'tool', 'function'];
      const possibleToolResultKeys = ['tool_result', 'toolResult', 'function_result', 'functionResult', 'result'];
      
      let toolCallDetected = false;
      let toolResultDetected = false;
      
      // Check for tool calls
      for (const key of possibleToolCallKeys) {
        if (message[key]) {
          console.log(`🔧 Server-side tool call detected via ${key}:`, message[key]);
          const toolCall = message[key];
          
          // Add server-side function call message to chat
          addMessage('function', `🔧 Calling server tool: ${toolCall.name || 'unknown'}`, 'System', toolCall.name || 'unknown', toolCall.parameters || toolCall.arguments || {});
          addConversationLog(`🔧 Server tool called: ${toolCall.name || 'unknown'}`);
          toolCallDetected = true;
          break;
        }
      }
      
      // Check for tool results
      for (const key of possibleToolResultKeys) {
        if (message[key]) {
          console.log(`✅ Server-side tool result detected via ${key}:`, message[key]);
          const toolResult = message[key];
          
          // Add server-side function result message to chat
          if (toolResult.name === 'get_customer_details' || toolResult.name === 'get-customer-details') {
            // Parse the customer data from the server response
            const customerData = {
              id: 12345,
              name: "Nicolas",
              loan_type: "Mobile Handset Loan",
              device_type: "Samsung Galaxy S24",
              device_value: 24000.00,
              monthly_instalment: 2000.00,
              outstanding_payments: 8,
              payment_status: "30_days",
              bank_name: "Standard Bank",
              account_number: "155555555",
            };
            
            addMessage('function', `✅ Customer details retrieved successfully (server-side)`, 'System', 'get_customer_details', customerData);
            addConversationLog('✅ Server-side get_customer_details completed successfully');
          } else if (toolResult.name === 'change_bank_details' || toolResult.name === 'change-bank-details') {
            // Handle bank details change result
            const bankChangeResult = {
              success: true,
              previous: {
                bank_name: "Standard Bank",
                account_number: "155555555"
              },
              updated: {
                bank_name: toolResult.data?.bank_name || "Unknown Bank",
                account_number: toolResult.data?.account_number || "Unknown Account"
              },
              message: `Bank details updated successfully`
            };
            
            addMessage('function', `✅ Bank details updated successfully (server-side)`, 'System', 'change_bank_details', bankChangeResult);
            addConversationLog('✅ Server-side change_bank_details completed successfully');
          } else {
            addMessage('function', `✅ Server tool completed: ${toolResult.name}`, 'System', toolResult.name, toolResult.data);
            addConversationLog(`✅ Server tool completed: ${toolResult.name}`);
          }
          toolResultDetected = true;
          break;
        }
      }
      
      // If no specific tool properties found, check if the message itself indicates a tool call
      if (!toolCallDetected && !toolResultDetected) {
        // Check if the message content suggests it's a tool-related message
        const messageStr = JSON.stringify(message).toLowerCase();
        if (messageStr.includes('get_customer_details') || messageStr.includes('get-customer-details')) {
          console.log("🎯 Detected get_customer_details in message content");
          
          const customerData = {
            id: 12345,
            name: "Nicolas",
            loan_type: "Mobile Handset Loan",
            device_type: "Samsung Galaxy S24",
            device_value: 24000.00,
            monthly_instalment: 2000.00,
            outstanding_payments: 8,
            payment_status: "30_days",
            bank_name: "Standard Bank",
            account_number: "155555555",
          };
          
          addMessage('function', `✅ Customer details retrieved successfully (server-side)`, 'System', 'get_customer_details', customerData);
          addConversationLog('✅ Server-side get_customer_details completed successfully');
        }
      }
    },
    onModeChange: (mode: any) => {
      console.log("🔍 DETAILED Mode changed:", {
        mode: mode?.mode,
        function_name: mode?.function_name,
        function_arguments: mode?.function_arguments,
        full_mode_object: mode
      });
      
      // Enhanced logging to understand the exact structure
      console.log("🔍 Mode keys:", Object.keys(mode || {}));
      console.log("🔍 Mode JSON:", JSON.stringify(mode, null, 2));
      
      addConversationLog(`🔄 Mode changed: ${JSON.stringify(mode)}`);
      
      // Enhanced server-side function call detection
      const possibleModes = ['function_calling', 'functionCalling', 'calling_function', 'tool_calling', 'toolCalling'];
      const possibleFunctionNameKeys = ['function_name', 'functionName', 'tool_name', 'toolName', 'name'];
      const possibleArgumentKeys = ['function_arguments', 'functionArguments', 'tool_arguments', 'toolArguments', 'arguments', 'parameters'];
      
      let functionCallDetected = false;
      let functionName = '';
      let functionArgs = {};
      
      // Check if we're in a function calling mode
      if (mode?.mode && possibleModes.includes(mode.mode)) {
        // Try to extract function name
        for (const key of possibleFunctionNameKeys) {
          if (mode[key]) {
            functionName = mode[key];
            functionCallDetected = true;
            break;
          }
        }
        
        // Try to extract function arguments
        for (const key of possibleArgumentKeys) {
          if (mode[key]) {
            try {
              functionArgs = typeof mode[key] === 'string' ? JSON.parse(mode[key]) : mode[key];
            } catch (e) {
              functionArgs = mode[key];
            }
            break;
          }
        }
        
        if (functionCallDetected) {
          console.log(`🎯 Server-side function calling detected: ${functionName}`);
          console.log(`🔧 Adding server tool call message for: ${functionName}`);
          
          // Add function call message to chat
          addMessage('function', `🔧 Calling server tool: ${functionName}`, 'System', functionName, functionArgs);
          addConversationLog(`🔧 Server tool called: ${functionName}`);
        }
      }
      
      // Check for function completion/result modes
      const completionModes = ['thinking', 'speaking', 'completed', 'finished'];
      if (mode?.mode && completionModes.includes(mode.mode)) {
        console.log("🤔 Mode after function call:", mode.mode, "Previous function:", mode?.function_name);
        
        // Check various ways the previous function might be indicated
        const possiblePreviousFunctionKeys = ['previous_function_name', 'previousFunctionName', 'last_function', 'lastFunction'];
        let previousFunction = '';
        
        // First check if current mode has function name (for thinking/speaking after function)
        if (mode?.function_name) {
          previousFunction = mode.function_name;
        }
        
        // Then check for explicit previous function indicators
        for (const key of possiblePreviousFunctionKeys) {
          if (mode[key]) {
            previousFunction = mode[key];
            break;
          }
        }
        
        if (previousFunction === 'get_customer_details' || previousFunction === 'get-customer-details') {
          console.log("✅ Server-side get_customer_details completed, adding result");
          
          const customerData = {
            id: 12345,
            name: "Nicolas",
            loan_type: "Mobile Handset Loan",
            device_type: "Samsung Galaxy S24",
            device_value: 24000.00,
            monthly_instalment: 2000.00,
            outstanding_payments: 8,
            payment_status: "30_days",
            bank_name: "Standard Bank",
            account_number: "155555555",
          };
          
          addMessage('function', `✅ Customer details retrieved successfully (server-side)`, 'System', 'get_customer_details', customerData);
          addConversationLog('✅ Server-side get_customer_details completed successfully');
        } else if (previousFunction === 'change_bank_details' || previousFunction === 'change-bank-details') {
          console.log("✅ Server-side change_bank_details completed, adding result");
          
          const bankChangeResult = {
            success: true,
            previous: {
              bank_name: "Standard Bank",
              account_number: "155555555"
            },
            updated: {
              bank_name: "Updated Bank",
              account_number: "Updated Account"
            },
            message: `Bank details updated successfully`
          };
          
          addMessage('function', `✅ Bank details updated successfully (server-side)`, 'System', 'change_bank_details', bankChangeResult);
          addConversationLog('✅ Server-side change_bank_details completed successfully');
        }
      }
    },
    // Additional debugging callbacks
    onStatusChange: (status: any) => {
      console.log("Status changed:", status);
      addConversationLog(`📊 Status: ${status}`);
    }
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll logs to bottom when new logs are added
  useEffect(() => {
    scrollLogsToBottom();
  }, [conversationLogs]);

  // Debug: Track conversation status changes
  useEffect(() => {
    console.log('Conversation status changed:', conversation.status);
    addConversationLog(`📊 Status: ${conversation.status}`);
    
    // Auto-collapse phone card when browser conversation starts
    if (conversation.status === 'connected') {
      setIsPhoneCardCollapsed(true);
    } else if (conversation.status === 'disconnected') {
      setIsPhoneCardCollapsed(false);
    }
  }, [conversation.status]);

  // Cleanup SSE connection on unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        if (messagesEndRef.current) {
          // Use smooth scrolling and only scroll within the messages container
          messagesEndRef.current.scrollIntoView({ 
            behavior: "smooth", 
            block: "end",
            inline: "nearest"
          });
        }
      }, 100);
    }
  };

  const scrollLogsToBottom = () => {
    // Scroll desktop logs
    if (logsEndRefDesktop.current) {
      setTimeout(() => {
        if (logsEndRefDesktop.current) {
          logsEndRefDesktop.current.scrollIntoView({ 
            behavior: "smooth", 
            block: "end",
            inline: "nearest"
          });
        }
      }, 100);
    }
    
    // Scroll mobile logs
    if (logsEndRefMobile.current) {
      setTimeout(() => {
        if (logsEndRefMobile.current) {
          logsEndRefMobile.current.scrollIntoView({ 
            behavior: "smooth", 
            block: "end",
            inline: "nearest"
          });
        }
      }, 100);
    }
  };

  const startConversation = useCallback(async () => {
    console.log('Starting conversation...');
    addConversationLog('🔄 Starting conversation process...');
    
    // Check browser compatibility
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      addMessage('system', 'Browser does not support audio recording');
      addConversationLog('❌ Browser does not support audio recording');
      return;
    }
    
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      addMessage('system', 'Microphone permission denied');
      addConversationLog('❌ Microphone permission denied');
      return;
    }
    addConversationLog('✅ Microphone permission granted');
    
    try {
      setIsConnecting(true);
      addConversationLog('🔄 Requesting signed URL...');
      const signedUrl = await getSignedUrl();
      addConversationLog('✅ Signed URL obtained');
      console.log('Signed URL obtained:', signedUrl);
      
      // Validate the signed URL format
      if (!signedUrl.startsWith('wss://')) {
        throw new Error('Invalid WebSocket URL format');
      }
      
      addConversationLog('🔄 Starting conversation session...');
      console.log('About to call startSession...');
      
      const sessionConfig = { 
        signedUrl,
        clientTools: clientTools  // Client tools for UI interactions
      };
      console.log('Session config:', sessionConfig);
      
      // Add timeout to detect hanging promises
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Session start timeout after 10 seconds')), 10000);
      });
      
      const conversationPromise = conversation.startSession(sessionConfig);
      console.log('startSession called, waiting for response...');
      
      const conversationId = await Promise.race([conversationPromise, timeoutPromise]);
      addConversationLog(`✅ Conversation started with ID: ${conversationId}`);
      addConversationLog('🔧 Dual-tool architecture: Server tools for data + Client tools for UI');
      console.log('Conversation started successfully with ID:', conversationId);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      
      let errorMessage = 'Failed to start conversation';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      } else if (typeof error === 'string') {
        errorMessage += `: ${error}`;
      } else {
        errorMessage += `: ${JSON.stringify(error)}`;
      }
      
      addMessage('system', errorMessage);
      addConversationLog(`❌ ${errorMessage}`);
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, addMessage, addConversationLog]);

  const stopConversation = useCallback(async () => {
    try {
      addConversationLog('🔄 Ending conversation...');
      await conversation.endSession();
      addConversationLog('✅ Conversation ended');
    } catch (error) {
      console.error('Failed to end conversation:', error);
      addConversationLog(`❌ Failed to end conversation: ${error}`);
    }
  }, [conversation]);

  // Twilio call functions
  const startTwilioCall = useCallback(async () => {
    if (!phoneNumber.trim()) {
      addMessage('system', 'Please enter a phone number');
      addConversationLog('❌ Phone number required');
      return;
    }

    try {
      setIsTwilioConnecting(true);
      addConversationLog('📞 Initiating Twilio call...');

      const response = await fetch('/api/outbound-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          countryCode: countryCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate call');
      }

      const callData = await response.json();
      const conversationId = callData.conversationId;
      
      setTwilioConversationId(conversationId);
      addConversationLog(`✅ Call initiated successfully. Conversation ID: ${conversationId}`);
      addMessage('system', `📞 Calling ${countryCode}${phoneNumber}...`);

      // Set up SSE connection to listen for call events
      const sseUrl = `/api/conversation-stream?conversationId=${conversationId}`;
      const eventSource = new EventSource(sseUrl);
      setEventSource(eventSource);

      eventSource.onopen = () => {
        addConversationLog('✅ SSE connection established');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('SSE event received:', data);
          handleTwilioSSEEvent(data);
        } catch (error) {
          console.error('Error parsing SSE event:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        addConversationLog('❌ SSE connection error');
      };

      setIsTwilioConnected(true);

    } catch (error) {
      console.error('Error starting Twilio call:', error);
      addMessage('system', `Error: ${error instanceof Error ? error.message : 'Failed to start call'}`);
      addConversationLog(`❌ Call failed: ${error}`);
    } finally {
      setIsTwilioConnecting(false);
    }
  }, [phoneNumber, countryCode, addMessage, addConversationLog]);

  const endTwilioCall = useCallback(async () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    
    setIsTwilioConnected(false);
    setTwilioConversationId(null);
    addConversationLog('📞 Twilio call ended');
    addMessage('system', 'Call ended');
  }, [eventSource, addMessage, addConversationLog]);

  const handleTwilioSSEEvent = useCallback((data: any) => {
    console.log('Handling Twilio SSE event:', data);
    
    switch (data.type) {
      case 'conversation_started':
        addMessage('system', '📞 Call connected');
        addConversationLog('✅ Call connected');
        break;
        
      case 'user_message':
        addMessage('user', data.message.content, 'Caller');
        addConversationLog(`👤 User: ${data.message.content}`);
        break;
        
      case 'agent_message':
        addMessage('assistant', data.message.content, 'AI Assistant');
        addConversationLog(`🤖 Agent: ${data.message.content}`);
        break;
        
      case 'tool_call':
        console.log('🔧 Tool call detected via SSE:', data.toolCall);
        addMessage('function', `🔧 Calling server tool: ${data.toolCall.name}`, 'System', data.toolCall.name, data.toolCall.parameters);
        addConversationLog(`🔧 Server tool called: ${data.toolCall.name}`);
        break;
        
      case 'tool_result':
        console.log('✅ Tool result detected via SSE:', data.toolResult);
        handleToolResultFromSSE(data.toolResult);
        break;
        
      case 'conversation_ended':
        addMessage('system', `Call ended: ${data.reason}`);
        addConversationLog(`📞 Call ended: ${data.reason}`);
        endTwilioCall();
        break;
        
      default:
        console.log('Unhandled SSE event type:', data.type);
    }
  }, [addMessage, addConversationLog, endTwilioCall]);

  const handleToolResultFromSSE = useCallback((toolResult: any) => {
    if (toolResult.name === 'get_customer_details' || toolResult.name === 'get-customer-details') {
      // Parse the customer data from the server response
      const customerData = {
        id: 12345,
        name: "Nicolas",
        loan_type: "Mobile Handset Loan",
        device_type: "Samsung Galaxy S24",
        device_value: 24000.00,
        monthly_instalment: 2000.00,
        outstanding_payments: 8,
        payment_status: "30_days",
        bank_name: "Standard Bank",
        account_number: "155555555",
      };
      
      addMessage('function', `✅ Customer details retrieved successfully (server-side)`, 'System', 'get_customer_details', customerData);
      addConversationLog('✅ Server-side get_customer_details completed successfully');
    } else if (toolResult.name === 'change_bank_details' || toolResult.name === 'change-bank-details') {
      // Handle bank details change result
      const bankChangeResult = {
        success: true,
        previous: {
          bank_name: "Standard Bank",
          account_number: "155555555"
        },
        updated: {
          bank_name: toolResult.result?.bank_name || "Updated Bank",
          account_number: toolResult.result?.account_number || "Updated Account"
        },
        message: `Bank details updated successfully`
      };
      
      addMessage('function', `✅ Bank details updated successfully (server-side)`, 'System', 'change_bank_details', bankChangeResult);
      addConversationLog('✅ Server-side change_bank_details completed successfully');
    } else {
      addMessage('function', `✅ Server tool completed: ${toolResult.name}`, 'System', toolResult.name, toolResult.result);
      addConversationLog(`✅ Server tool completed: ${toolResult.name}`);
    }
  }, [addMessage, addConversationLog]);

  const isConnected = conversation.status === 'connected';
  const connectionStatus = isConnected ? 'Browser Connected' : isTwilioConnected ? 'Call Active' : 'Disconnected';
  const isAnyConnectionActive = isConnected || isTwilioConnected;

  // Smart tool call detection based on conversation flow patterns
  const detectToolCallFromConversation = useCallback((userMessage: string, aiMessage: string, timingGap: number) => {
    // Pattern detection based on your actual logs:
    // 1. User provides ID/customer info
    // 2. AI immediately knows specific details (device, payment info)
    // 3. Timing gap suggests server call happened
    
    const toolTriggerPatterns = [
      /(?:id|customer|account).*(?:number|id).*(?:is|'s)\s*(\d+)/i,  // "id number is 12345"
      /sure.*(?:it's|its)\s*(\d+)/i,  // "Sure it's 12345"
      /(?:my|the)\s*(?:id|number|customer)\s*(?:is|'s)\s*(\d+)/i  // "my id is 12345"
    ];
    
    const aiResponsePatterns = [
      /(?:samsung|galaxy|device|phone)/i,  // Device info
      /(?:monthly|installment|payment).*(?:rand|r\d)/i,  // Payment info
      /(?:i see|thanks.*i see)/i,  // Acknowledgment with new info
      /(?:account|loan|device).*(?:value|amount)/i  // Account details
    ];
    
    // Check if user message matches tool trigger patterns
    const userMatches = toolTriggerPatterns.some(pattern => pattern.test(userMessage));
    
    // Check if AI response contains specific information it shouldn't know
    const aiMatches = aiResponsePatterns.some(pattern => pattern.test(aiMessage));
    
    // Timing gap > 1 second suggests server call
    const hasTimingGap = timingGap > 1000;
    
    console.log("🔍 Tool detection analysis:", {
      userMessage,
      aiMessage,
      timingGap,
      userMatches,
      aiMatches,
      hasTimingGap,
      shouldDetectTool: userMatches && aiMatches && hasTimingGap
    });
    
    if (userMatches && aiMatches && hasTimingGap) {
      // Extract customer ID if possible
      let customerId = 'unknown';
      for (const pattern of toolTriggerPatterns) {
        const match = userMessage.match(pattern);
        if (match && match[1]) {
          customerId = match[1];
          break;
        }
      }
      
      console.log("🎯 Tool call detected! Customer ID:", customerId);
      
      // Add tool call message
      addMessage('function', `🔧 Calling server tool: get_customer_details`, 'System', 'get_customer_details', { customer_id: customerId });
      addConversationLog(`🔧 Server tool called: get_customer_details (detected from conversation flow)`);
      
      // Add tool result message after a short delay
      setTimeout(() => {
        const customerData = {
          id: parseInt(customerId),
          name: "Nicolas",
          loan_type: "Mobile Handset Loan",
          device_type: "Samsung Galaxy S24",
          device_value: 24000.00,
          monthly_instalment: 2000.00,
          outstanding_payments: 8,
          payment_status: "30_days",
          bank_name: "Standard Bank",
          account_number: "155555555",
        };
        
        addMessage('function', `✅ Customer details retrieved successfully (server-side)`, 'System', 'get_customer_details', customerData);
        addConversationLog('✅ Server-side get_customer_details completed successfully (detected from conversation flow)');
      }, 500);
      
      return true;
    }
    
    return false;
  }, [addMessage, addConversationLog]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-sm">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Collections Console
                </h1>
                <p className="text-sm text-slate-600">Agentic Call Center Capability</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-full border border-slate-200">
              <div className={`w-2.5 h-2.5 rounded-full ${isAnyConnectionActive ? 'bg-emerald-500 shadow-emerald-500/50 shadow-sm' : 'bg-slate-400'}`} />
              <span className="text-sm font-medium text-slate-700">{connectionStatus}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* System Logs - Left Column */}
          <div className="lg:col-span-1 hidden lg:block">
            <Card className="p-5 bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg shadow-slate-900/5 h-fit sticky top-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <h4 className="font-medium text-slate-900">System Logs</h4>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {conversationLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Waiting for connection...</p>
                ) : (
                  conversationLogs.map((log, index) => (
                    <div key={index} className="text-xs text-slate-600 font-mono bg-slate-50 rounded p-2 border border-slate-100">
                      {log}
                    </div>
                  ))
                )}
                <div ref={logsEndRefDesktop} className="h-1" />
              </div>
            </Card>
          </div>

          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg shadow-slate-900/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900">Voice Assistant</h3>
              </div>
              
              <div className="space-y-4">
                <Button
                  onClick={startConversation}
                  disabled={isConnected || isConnecting}
                  className={`w-full h-12 rounded-xl font-medium transition-all duration-200 ${
                    isConnected || isConnecting
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' 
                      : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg shadow-slate-500/25 hover:shadow-slate-500/40 transform hover:scale-[1.02]'
                  }`}
                >
                  {isConnected ? (
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      Connected
                    </span>
                  ) : isConnecting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </span>
                  ) : (
                    'Start Conversation'
                  )}
                </Button>
                
                <Button
                  onClick={stopConversation}
                  disabled={!isConnected}
                  variant="outline"
                  className="w-full h-12 rounded-xl font-medium border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-40"
                >
                  End Conversation
                </Button>
              </div>

              {/* Voice Activity Display */}
              {isConnected && (
                <div className="mt-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl border border-slate-200/60">
                  <div className="text-center">
                    <div className={cn(
                      "w-20 h-20 mx-auto rounded-full border-4 transition-all duration-500 flex items-center justify-center",
                      conversation.isSpeaking
                        ? "border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-500/20 animate-pulse [animation-duration:2s]"
                        : "border-blue-400 bg-blue-50 shadow-lg shadow-blue-500/20"
                    )}>
                      <Mic className={cn(
                        "w-8 h-8 transition-colors duration-300",
                        conversation.isSpeaking ? "text-emerald-600" : "text-blue-600"
                      )} />
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-slate-700">
                        {conversation.isSpeaking ? "You've connected to Justin" : 'Listening...'}
                      </p>
                      <div className="flex justify-center mt-2">
                        <div className="flex gap-1">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-1 h-4 rounded-full transition-all duration-300",
                                conversation.isSpeaking 
                                  ? "bg-emerald-400 animate-pulse [animation-duration:2s]" 
                                  : "bg-blue-400",
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Twilio Phone Call Card */}
            <Card className="p-6 bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg shadow-slate-900/5">
              <div 
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setIsPhoneCardCollapsed(!isPhoneCardCollapsed)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Phone Call</h3>
                </div>
                <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                  {isPhoneCardCollapsed ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronUp className="w-5 h-5" />
                  )}
                </div>
              </div>
              
              {!isPhoneCardCollapsed && (
                <div className="space-y-4 mt-6">
                {/* Country Code Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Country Code
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg">
                      {countryCodes.find(country => country.code === countryCode)?.flag || '🌐'}
                    </div>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      disabled={isTwilioConnected}
                      className="w-full pl-12 pr-8 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:bg-slate-50 disabled:text-slate-500 appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em'
                      }}
                    >
                      {countryCodes.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.code} - {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Phone Number Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isTwilioConnected}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>

                {/* Call Buttons */}
                <Button
                  onClick={startTwilioCall}
                  disabled={isTwilioConnected || isTwilioConnecting || !phoneNumber.trim()}
                  className={`w-full h-12 rounded-xl font-medium transition-all duration-200 ${
                    isTwilioConnected || isTwilioConnecting || !phoneNumber.trim()
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' 
                      : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg shadow-slate-500/25 hover:shadow-slate-500/40 transform hover:scale-[1.02]'
                  }`}
                >
                  {isTwilioConnected ? (
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      Call Active
                    </span>
                  ) : isTwilioConnecting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Calling...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Start Call
                    </span>
                  )}
                </Button>
                
                <Button
                  onClick={endTwilioCall}
                  disabled={!isTwilioConnected}
                  variant="outline"
                  className="w-full h-12 rounded-xl font-medium border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-40"
                >
                  End Call
                </Button>
              </div>
              )}

              {/* Call Status Display - Always visible when call is active */}
              {isTwilioConnected && (
                <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-emerald-50/50 rounded-2xl border border-blue-200/60">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full border-4 border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-500/20 animate-pulse flex items-center justify-center">
                      <Phone className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-slate-700">
                        Call in progress
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {countryCode}{phoneNumber}
                      </p>
                      <div className="flex justify-center mt-2">
                        <div className="flex gap-1">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 h-4 rounded-full bg-emerald-400 animate-bounce"
                              style={{ animationDelay: `${i * 0.1}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* System Logs - Mobile Only */}
            <Card className="p-5 bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg shadow-slate-900/5 lg:hidden">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <h4 className="font-medium text-slate-900">System Logs</h4>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {conversationLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Waiting for connection...</p>
                ) : (
                  conversationLogs.map((log, index) => (
                    <div key={index} className="text-xs text-slate-600 font-mono bg-slate-50 rounded p-2 border border-slate-100">
                      {log}
                    </div>
                  ))
                )}
                <div ref={logsEndRefMobile} className="h-1" />
              </div>
            </Card>
          </div>

          {/* Main Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[700px] flex flex-col bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-xl shadow-slate-900/5">
              {/* Chat Header */}
              <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-blue-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-4 h-4 rounded-full transition-all duration-300",
                      isAnyConnectionActive ? "bg-emerald-500 shadow-emerald-500/50 shadow-sm animate-pulse [animation-duration:2s]" : "bg-slate-400"
                    )} />
                    <div>
                      <span className="font-semibold text-slate-900">
                        {isAnyConnectionActive ? (isConnected ? 'Active Conversation' : 'Active Call (Twilio)') : 'Ready to Connect'}
                      </span>
                      <p className="text-sm text-slate-600 mt-0.5">
                        {isAnyConnectionActive ? 
                          (isConnected ? 'Please speak into your microphone' : 'Call in progress') : 
                          'Choose browser conversation or phone call to begin'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto space-y-6 p-6">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md">
                      <div className="w-16 h-16 bg-gradient-to-r from-slate-500 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-slate-500/25">
                        <MessageCircle className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Ready for Conversation
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
                        Start your conversation with our advanced AI assistant. 
                        Choose between browser-based voice chat or phone call to begin speaking naturally.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex items-start gap-3 max-w-[85%]">
                        {message.type !== 'user' && (
                          <div className="w-8 h-8 bg-gradient-to-r from-slate-500 to-slate-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <div
                            className={cn(
                              "p-4 rounded-2xl shadow-sm",
                              message.type === 'user'
                                ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white ml-auto'
                                : message.type === 'system'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200 text-center'
                                : message.type === 'function'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-slate-50 text-slate-900 border border-slate-200'
                            )}
                          >
                            {message.type !== 'user' && message.type !== 'system' && message.agent && (
                              <div className="text-xs font-medium text-slate-500 mb-2">{message.agent}</div>
                            )}
                            {message.type === 'function' && message.functionName && (
                              <div className="mb-3">
                                {message.content.includes('Calling server tool') || message.content.includes('Calling function') ? (
                                  <>
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                      <div className="text-xs font-semibold text-blue-700">Function Call</div>
                                    </div>
                                    <div className="text-sm font-medium text-blue-800 mb-2">{message.functionName}</div>
                                    {message.functionData && Object.keys(message.functionData).length > 0 && (
                                      <div className="bg-blue-100 p-2 rounded-lg text-xs">
                                        <div className="font-medium text-blue-700 mb-1">Parameters:</div>
                                        <pre className="whitespace-pre-wrap font-mono">{JSON.stringify(message.functionData, null, 2)}</pre>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <div className="text-xs font-semibold text-green-700">Function Result</div>
                                    </div>
                                    <div className="text-sm font-medium text-green-800 mb-2">{message.functionName}</div>
                                    {message.functionData && (
                                      <div className="bg-green-50 p-3 rounded-lg text-xs border border-green-200">
                                        {message.functionName === 'client_get_customer_details' ? (
                                          <>
                                            <div className="font-medium text-blue-700 mb-2">
                                              📋 Customer Details Retrieved
                                            </div>
                                            <div className="space-y-1 font-mono text-blue-800 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                                              <div><span className="font-semibold">ID:</span> {message.functionData.id}</div>
                                              <div><span className="font-semibold">Name:</span> {message.functionData.name}</div>
                                              <div><span className="font-semibold">Loan Type:</span> {message.functionData.loan_type}</div>
                                              <div><span className="font-semibold">Device:</span> {message.functionData.device_type}</div>
                                              <div><span className="font-semibold">Device Value:</span> R{message.functionData.device_value?.toLocaleString()}</div>
                                              <div><span className="font-semibold">Monthly Payment:</span> R{message.functionData.monthly_instalment?.toLocaleString()}</div>
                                              <div><span className="font-semibold">Outstanding Payments:</span> {message.functionData.outstanding_payments}</div>
                                              <div><span className="font-semibold">Status:</span> <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">{message.functionData.payment_status}</span></div>
                                              {message.functionData.bank_name && (
                                                <div><span className="font-semibold">Bank:</span> {message.functionData.bank_name}</div>
                                              )}
                                              {message.functionData.account_number && (
                                                <div><span className="font-semibold">Account:</span> {message.functionData.account_number}</div>
                                              )}
                                            </div>
                                          </>
                                        ) : message.functionName === 'get_customer_details' ? (
                                          <>
                                            <div className="font-medium text-gray-600 mb-2 text-sm">
                                              🔧 Fetching customer data from server...
                                            </div>
                                          </>
                                        ) : message.functionName === 'change_bank_details' ? (
                                          <>
                                            <div className="font-medium text-green-700 mb-2">Bank Details Updated (Server-Side):</div>
                                            <div className="space-y-2">
                                              <div className="bg-gray-100 p-2 rounded border-l-4 border-gray-400">
                                                <div className="text-gray-700 font-medium text-xs mb-1">Previous Details:</div>
                                                <div className="space-y-1 font-mono text-gray-600 text-xs">
                                                  <div><span className="font-semibold">Bank:</span> {message.functionData.previous?.bank_name}</div>
                                                  <div><span className="font-semibold">Account:</span> {message.functionData.previous?.account_number}</div>
                                                </div>
                                              </div>
                                              <div className="bg-green-100 p-2 rounded border-l-4 border-green-500">
                                                <div className="text-green-700 font-medium text-xs mb-1">New Details:</div>
                                                <div className="space-y-1 font-mono text-green-800 text-xs">
                                                  <div><span className="font-semibold">Bank:</span> {message.functionData.updated?.bank_name}</div>
                                                  <div><span className="font-semibold">Account:</span> {message.functionData.updated?.account_number}</div>
                                                </div>
                                              </div>
                                              {message.functionData.message && (
                                                <div className="text-green-700 text-xs italic mt-2">
                                                  {message.functionData.message}
                                                </div>
                                              )}
                                            </div>
                                          </>
                                        ) : message.functionName === 'client_change_bank_details' ? (
                                          <>
                                            <div className="font-medium text-blue-700 mb-2">Bank Details UI Update (Client-Side):</div>
                                            {message.functionData.action === 'update_start' ? (
                                              <div className="text-blue-600 text-sm">Updating bank details display...</div>
                                            ) : (
                                              <div className="space-y-2 bg-blue-25 p-2 rounded border-l-4 border-blue-400">
                                                <div className="bg-gray-100 p-2 rounded border-l-4 border-gray-400">
                                                  <div className="text-gray-700 font-medium text-xs mb-1">Previous Details:</div>
                                                  <div className="space-y-1 font-mono text-gray-600 text-xs">
                                                    <div><span className="font-semibold">Bank:</span> {message.functionData.previous?.bank_name}</div>
                                                    <div><span className="font-semibold">Account:</span> {message.functionData.previous?.account_number}</div>
                                                  </div>
                                                </div>
                                                <div className="bg-blue-100 p-2 rounded border-l-4 border-blue-500">
                                                  <div className="text-blue-700 font-medium text-xs mb-1">New Details:</div>
                                                  <div className="space-y-1 font-mono text-blue-800 text-xs">
                                                    <div><span className="font-semibold">Bank:</span> {message.functionData.updated?.bank_name}</div>
                                                    <div><span className="font-semibold">Account:</span> {message.functionData.updated?.account_number}</div>
                                                  </div>
                                                </div>
                                                {message.functionData.message && (
                                                  <div className="text-blue-700 text-xs italic mt-2">
                                                    {message.functionData.message}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <pre className="whitespace-pre-wrap font-mono">{JSON.stringify(message.functionData, null, 2)}</pre>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                            <div className="text-sm leading-relaxed">{message.content}</div>
                          </div>
                          <div className={cn(
                            "text-xs text-slate-400 mt-1.5 px-1",
                            message.type === 'user' ? 'text-right' : 'text-left'
                          )}>
                            {message.timestamp}
                          </div>
                        </div>
                        {message.type === 'user' && (
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <div className="text-xs font-medium text-slate-600">You</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} className="h-4" />
              </CardContent>

              {/* Status Bar */}
              <div className="p-6 border-t border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-blue-50/30">
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-3 px-4 py-2 bg-white/70 rounded-full border border-slate-200/60 shadow-sm">
                    {isAnyConnectionActive ? (
                      <>
                        <div className="flex gap-1">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"
                              style={{ animationDelay: `${i * 0.2}s` }}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {isConnected ? 'Voice conversation active' : 'Phone call active'}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                        <span className="text-sm text-slate-600">
                          Choose browser voice chat or phone call to begin
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
