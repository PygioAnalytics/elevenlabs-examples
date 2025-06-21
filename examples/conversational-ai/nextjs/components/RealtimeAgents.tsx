"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Settings, Square, MessageCircle, Zap, Brain, Loader2 } from 'lucide-react';
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

interface FunctionCall {
  id: string;
  name: string;
  timestamp: string;
  data: any;
  result?: any;
  status: 'calling' | 'completed' | 'error';
}

// Client-side tools for demonstration
const clientTools = {
  getCustomerDetails: async (parameters: any): Promise<string> => {
    // Show function call initiation
    console.log('🔧 Client tool called: getCustomerDetails', parameters);
    
    // Fetch customer details (e.g., from an API)
    const customerData = {
      id: 12345,
      name: "Nicolas",
      loan_type: "Mobile Handset Loan",
      device_type: "Samsung Galaxy S24",
      device_value: 24000.00,
      monthly_instalment: 1000.00,
      outstanding_payments: 6,
      payment_status: "30_days",
      bank_name: "Standard Bank",
      account_number: "155555555",
    };
    
    // Log the function result
    console.log('✅ Client tool result:', customerData);
    
    // Return data as JSON string to the agent (as per SDK requirements)
    const result = JSON.stringify(customerData);
    console.log('📤 Returning to agent:', result);
    
    return result;
  }
};

export function RealtimeAgents() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAgent, setCurrentAgent] = useState('AI Assistant');
  const [conversationLogs, setConversationLogs] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [functionCalls, setFunctionCalls] = useState<FunctionCall[]>([]);
  const [debugMode, setDebugMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Customer data state that can be updated
  const [customerData, setCustomerData] = useState({
    id: 12345,
    name: "Nicolas",
    loan_type: "Mobile Handset Loan",
    device_type: "Samsung Galaxy S24",
    device_value: 24000.00,
    monthly_instalment: 1000.00,
    outstanding_payments: 6,
    payment_status: "30_days",
    bank_name: "Standard Bank",
    account_number: "155555555",
  });

  const addMessage = (type: Message['type'], content: string, agent = currentAgent, functionName?: string, functionData?: any) => {
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
  };

  const addConversationLog = (log: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConversationLogs(prev => [...prev, `[${timestamp}] ${log}`]);
  };

  // Create client tools with access to the message system
  const clientToolsWithMessaging = {
    getCustomerDetails: async (parameters: any): Promise<string> => {
      // Show function call initiation
      console.log('🔧 Client tool called: getCustomerDetails', parameters);
      
      try {
        // Log the function result
        console.log('✅ Client tool result:', customerData);
        
        // Add function result message to chat
        addMessage('function', `✅ Customer details retrieved successfully`, 'System', 'getCustomerDetails', customerData);
        addConversationLog('✅ getCustomerDetails completed successfully');
        
        // Return data as JSON string to the agent (as per SDK requirements)
        const result = JSON.stringify(customerData);
        console.log('📤 Returning to agent:', result);
        
        return result;
      } catch (error) {
        console.error('❌ Client tool error:', error);
        addMessage('function', `❌ Error retrieving customer details: ${error}`, 'System', 'getCustomerDetails');
        addConversationLog(`❌ getCustomerDetails failed: ${error}`);
        throw error;
      }
    },

    changeBankDetails: async (parameters: any): Promise<string> => {
      // Show function call initiation
      console.log('🔧 Client tool called: changeBankDetails', parameters);
      
      try {
        const { bank_name, account_number } = parameters;
        
        if (!bank_name || !account_number) {
          throw new Error('Both bank_name and account_number are required');
        }

        // Store previous values for the response
        const previousBankName = customerData.bank_name;
        const previousAccountNumber = customerData.account_number;

        // Update customer data
        setCustomerData(prev => ({
          ...prev,
          bank_name,
          account_number
        }));

        const updateResult = {
          success: true,
          previous: {
            bank_name: previousBankName,
            account_number: previousAccountNumber
          },
          updated: {
            bank_name,
            account_number
          },
          message: `Bank details updated successfully from ${previousBankName} (${previousAccountNumber}) to ${bank_name} (${account_number})`
        };

        // Log the function result
        console.log('✅ Client tool result:', updateResult);
        
        // Add function result message to chat
        addMessage('function', `✅ Bank details updated successfully`, 'System', 'changeBankDetails', updateResult);
        addConversationLog('✅ changeBankDetails completed successfully');
        
        // Return confirmation as JSON string to the agent
        const result = JSON.stringify(updateResult);
        console.log('📤 Returning to agent:', result);
        
        return result;
      } catch (error) {
        console.error('❌ Client tool error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        addMessage('function', `❌ Error updating bank details: ${errorMessage}`, 'System', 'changeBankDetails');
        addConversationLog(`❌ changeBankDetails failed: ${errorMessage}`);
        throw error;
      }
    }
  };

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to Voice AI");
      addMessage('system', 'Connected to Voice AI');
      addConversationLog('✅ Connected to Voice AI');
    },
    onDisconnect: (reason) => {
      console.log("Disconnected from Voice AI. Reason:", reason);
      addMessage('system', `Disconnected from Voice AI${reason ? `: ${reason}` : ''}`);
      addConversationLog(`❌ Disconnected from Voice AI${reason ? `: ${reason}` : ''}`);
      setMessages([]);
      setConversationLogs([]);
      setFunctionCalls([]);
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
    onMessage: message => {
      console.log("Message received:", message);
      addConversationLog(`📨 Message: ${JSON.stringify(message)}`);
      
      // Handle messages from Voice AI
      if (message.source === 'user') {
        addMessage('user', message.message, 'You');
      } else if (message.source === 'ai') {
        addMessage('assistant', message.message, currentAgent);
      }
    },
    onModeChange: (mode: any) => {
      console.log("Mode changed:", mode);
      addConversationLog(`🔄 Mode changed: ${JSON.stringify(mode)}`);
      
      // Handle function calls
      if (mode?.mode === 'function_calling' && mode?.function_name) {
        const functionCall: FunctionCall = {
          id: Date.now() + Math.random().toString(),
          name: mode.function_name,
          timestamp: new Date().toLocaleTimeString(),
          data: mode.function_arguments ? JSON.parse(mode.function_arguments) : {},
          status: 'calling'
        };
        
        setFunctionCalls(prev => [...prev, functionCall]);
        
        // Add function call message to chat
        addMessage('function', `🔧 Calling function: ${mode.function_name}`, 'System', mode.function_name, functionCall.data);
        addConversationLog(`🔧 Function called: ${mode.function_name}`);
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

  // Debug: Track conversation status changes
  useEffect(() => {
    if (debugMode) {
      console.log('Conversation status changed:', conversation.status);
      addConversationLog(`📊 Status: ${conversation.status}`);
    }
  }, [conversation.status, debugMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        clientTools: clientToolsWithMessaging // Use the enhanced client tools
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
      addConversationLog('🔧 Client tools configured: getCustomerDetails, changeBankDetails');
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
  }, [conversation]);

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

  const isConnected = conversation.status === 'connected';
  const connectionStatus = isConnected ? 'Connected' : 'Disconnected';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
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
              <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-emerald-500/50 shadow-sm' : 'bg-slate-400'}`} />
              <span className="text-sm font-medium text-slate-700">{connectionStatus}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
                        ? "border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-500/20 animate-pulse"
                        : "border-blue-400 bg-blue-50 shadow-lg shadow-blue-500/20"
                    )}>
                      <Mic className={cn(
                        "w-8 h-8 transition-colors duration-300",
                        conversation.isSpeaking ? "text-emerald-600" : "text-blue-600"
                      )} />
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-slate-700">
                        {conversation.isSpeaking ? 'AI is speaking' : 'Listening...'}
                      </p>
                      <div className="flex justify-center mt-2">
                        <div className="flex gap-1">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-1 h-4 rounded-full transition-all duration-300",
                                conversation.isSpeaking 
                                  ? "bg-emerald-400 animate-bounce" 
                                  : "bg-blue-400",
                              )}
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

            {/* Connection Logs */}
            <Card className="p-5 bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg shadow-slate-900/5">
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
                      isConnected ? "bg-emerald-500 shadow-emerald-500/50 shadow-sm animate-pulse" : "bg-slate-400"
                    )} />
                    <div>
                      <span className="font-semibold text-slate-900">
                        {isConnected ? 'Active Conversation' : 'Ready to Connect'}
                      </span>
                      <p className="text-sm text-slate-600 mt-0.5">
                        {isConnected ? 'Speak naturally, I\'m listening' : 'Click "Start Conversation" to begin'}
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
                        Start your voice conversation with our advanced AI assistant. 
                        Simply click "Start Conversation" and begin speaking naturally.
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
                                {message.content.includes('Calling function') ? (
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
                                        {message.functionName === 'getCustomerDetails' ? (
                                          <>
                                            <div className="font-medium text-green-700 mb-2">Customer Data Retrieved:</div>
                                            <div className="space-y-1 font-mono text-green-800">
                                              <div><span className="font-semibold">ID:</span> {message.functionData.id}</div>
                                              <div><span className="font-semibold">Name:</span> {message.functionData.name}</div>
                                              <div><span className="font-semibold">Loan Type:</span> {message.functionData.loan_type}</div>
                                              <div><span className="font-semibold">Device:</span> {message.functionData.device_type}</div>
                                              <div><span className="font-semibold">Device Value:</span> R{message.functionData.device_value?.toLocaleString()}</div>
                                              <div><span className="font-semibold">Monthly Payment:</span> R{message.functionData.monthly_instalment}</div>
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
                                        ) : message.functionName === 'changeBankDetails' ? (
                                          <>
                                            <div className="font-medium text-green-700 mb-2">Bank Details Updated:</div>
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
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Status Bar */}
              <div className="p-6 border-t border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-blue-50/30">
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-3 px-4 py-2 bg-white/70 rounded-full border border-slate-200/60 shadow-sm">
                    {isConnected ? (
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
                          Voice conversation active
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                        <span className="text-sm text-slate-600">
                          Click "Start Conversation" to begin
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
