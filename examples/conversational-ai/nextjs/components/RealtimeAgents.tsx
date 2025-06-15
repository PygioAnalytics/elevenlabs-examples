"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Settings, Square, MessageCircle, Zap, Brain } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConversation } from "@11labs/react";
import { cn } from "@/lib/utils";

async function requestMicrophonePermission() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch {
    console.error("Microphone permission denied");
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
  type: 'user' | 'assistant' | 'system';
  content: string;
  agent?: string;
  timestamp: string;
}

export function RealtimeAgents() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAgent, setCurrentAgent] = useState('Chat Agent');
  const [conversationLogs, setConversationLogs] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs");
      addMessage('system', 'Connected to ElevenLabs Conversational AI');
      addConversationLog('✅ Connected to ElevenLabs Conversational AI');
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs");
      addMessage('system', 'Disconnected from ElevenLabs');
      addConversationLog('❌ Disconnected from ElevenLabs');
      setMessages([]);
      setConversationLogs([]);
      setCurrentAgent('Chat Agent');
    },
    onError: error => {
      console.log("Error:", error);
      const errorMessage = typeof error === 'string' ? error : 'Connection error';
      addMessage('system', `Error: ${errorMessage}`);
      addConversationLog(`❌ Error: ${errorMessage}`);
    },
    onMessage: message => {
      console.log("Message received:", message);
      addConversationLog(`📨 Message: ${JSON.stringify(message)}`);
      
      // Handle messages from ElevenLabs
      if (message.source === 'user') {
        addMessage('user', message.message, 'You');
      } else if (message.source === 'ai') {
        addMessage('assistant', message.message, currentAgent);
      }
    },
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addMessage = (type: Message['type'], content: string, agent = currentAgent) => {
    const message: Message = {
      id: Date.now() + Math.random().toString(),
      type,
      content,
      agent,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, message]);
  };

  const addConversationLog = (log: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConversationLogs(prev => [...prev, `[${timestamp}] ${log}`]);
  };

  const startConversation = useCallback(async () => {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      addMessage('system', 'Microphone permission denied');
      addConversationLog('❌ Microphone permission denied');
      return;
    }
    
    try {
      addConversationLog('🔄 Requesting signed URL...');
      const signedUrl = await getSignedUrl();
      addConversationLog('✅ Signed URL obtained');
      
      addConversationLog('🔄 Starting conversation session...');
      const conversationId = await conversation.startSession({ signedUrl });
      addConversationLog(`✅ Conversation started with ID: ${conversationId}`);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      addMessage('system', 'Failed to start conversation');
      addConversationLog(`❌ Failed to start conversation: ${error}`);
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ElevenLabs Conversational AI</h1>
                <p className="text-sm text-gray-600">Real-time voice conversation with AI agents</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-700">{connectionStatus}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4" />
                <h3 className="font-semibold text-gray-900">Voice Assistant</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                Connect to start a real-time voice conversation with ElevenLabs Conversational AI.
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={startConversation}
                  disabled={isConnected}
                  className={`w-full ${
                    isConnected 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                >
                  {isConnected ? 'Connected' : 'Connect'}
                </Button>
                
                <Button
                  onClick={stopConversation}
                  disabled={!isConnected}
                  variant="destructive"
                  className="w-full"
                >
                  Disconnect
                </Button>
              </div>

              {/* Voice Activity Indicator */}
              {isConnected && (
                <div className="mt-6 text-center">
                  <div className={cn(
                    "w-16 h-16 mx-auto rounded-full border-4 transition-all duration-300",
                    conversation.isSpeaking
                      ? "border-green-500 bg-green-100 animate-pulse"
                      : "border-blue-500 bg-blue-100"
                  )}>
                    <div className="flex items-center justify-center h-full">
                      <Mic className={cn(
                        "w-6 h-6",
                        conversation.isSpeaking ? "text-green-600" : "text-blue-600"
                      )} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {conversation.isSpeaking ? 'Agent is speaking' : 'Listening...'}
                  </p>
                </div>
              )}
            </Card>

            {/* Connection Logs */}
            <Card className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Connection Logs</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {conversationLogs.length === 0 ? (
                  <p className="text-xs text-gray-500">No logs yet</p>
                ) : (
                  conversationLogs.map((log, index) => (
                    <div key={index} className="text-xs text-gray-600 font-mono">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Main Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
                    )} />
                    <span className="font-medium text-gray-900">
                      Status: {isConnected ? 'Active Conversation' : 'Not Connected'}
                    </span>
                  </div>
                  <Settings className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                </div>
              </div>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Connect to start voice conversation with AI</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] p-3 rounded-lg",
                          message.type === 'user'
                            ? 'bg-gray-900 text-white'
                            : message.type === 'system'
                            ? 'bg-blue-100 text-blue-800 text-center'
                            : 'bg-gray-100 text-gray-900'
                        )}
                      >
                        {message.type !== 'user' && message.type !== 'system' && message.agent && (
                          <div className="text-xs text-gray-500 mb-1">{message.agent}</div>
                        )}
                        <div className="text-sm">{message.content}</div>
                        <div className="text-xs text-gray-400 mt-1">{message.timestamp}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Status Bar */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="text-center">
                  <div className="text-sm text-gray-600">
                    {isConnected ? (
                      <>
                        <span className="inline-flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          Voice conversation active - speak naturally
                        </span>
                      </>
                    ) : (
                      <>Click "Connect" to start your voice conversation</>
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
