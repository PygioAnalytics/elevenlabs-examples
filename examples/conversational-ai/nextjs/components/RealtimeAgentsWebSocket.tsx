'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, Settings, Square, MessageCircle, Zap, Brain, Loader2, Phone } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  agent?: string;
  timestamp: string;
}

export function RealtimeAgentsWebSocket() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAgent, setCurrentAgent] = useState('AI Assistant');
  const [conversationLogs, setConversationLogs] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use ElevenLabs WebSocket conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('✅ Connected to ElevenLabs');
      addConversationLog('🔗 Connected to voice AI');
      addMessage('system', 'Connected! You can now speak with the AI assistant.');
    },
    onDisconnect: () => {
      console.log('🔌 Disconnected from ElevenLabs');
      addConversationLog('🔌 Disconnected from voice AI');
      addMessage('system', 'Conversation ended.');
    },
    onMessage: (message) => {
      console.log('📨 Message received:', message);
      
      // Handle different message types based on the actual API structure
      if (message.source === 'user') {
        addMessage('user', message.message, 'You');
        addConversationLog(`👤 You: ${message.message}`);
      } else if (message.source === 'ai') {
        addMessage('assistant', message.message, currentAgent);
        addConversationLog(`🤖 Agent: ${message.message}`);
      }
    },
    onError: (error) => {
      console.error('❌ Conversation error:', error);
      addConversationLog(`❌ Error: ${error}`);
      addMessage('system', `Error: ${error}`);
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
    try {
      addConversationLog('🎤 Requesting microphone permission...');
      
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      addConversationLog('✅ Microphone permission granted');
      
      // Start the conversation with your agent
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_AGENT_ID || 'your-agent-id', // You'll need to add this to .env
      });
      
      addConversationLog('🚀 Starting conversation...');
      
    } catch (error) {
      console.error('Failed to start conversation:', error);
      addConversationLog(`❌ Failed to start: ${error}`);
      addMessage('system', `Failed to start conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    try {
      addConversationLog('🔄 Ending conversation...');
      await conversation.endSession();
      addConversationLog('✅ Conversation ended');
    } catch (error) {
      console.error('Failed to end conversation:', error);
      addConversationLog(`❌ Failed to end: ${error}`);
    }
  }, [conversation]);

  const isConnected = conversation.status === 'connected';
  const isConnecting = conversation.status === 'connecting';
  const connectionStatus = conversation.status;

  return (
    <div className="min-h-screen bg-slate-50/30">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] shadow-2xl border-slate-200/60 bg-white/95 backdrop-blur-sm transform hover:shadow-3xl transition-all duration-300">
              <CardContent className="p-0 h-full flex flex-col">
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={cn(
                      "flex items-start gap-3",
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    )}>
                      {message.type !== 'user' && (
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                          message.type === 'assistant' ? 'bg-gradient-to-r from-slate-600 to-slate-700' : 'bg-slate-500'
                        )}>
                          {message.type === 'assistant' ? <Brain className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                        </div>
                      )}
                      
                      <div className={cn(
                        "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl",
                        message.type === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-md' 
                          : message.type === 'assistant'
                          ? 'bg-slate-100 text-slate-900 rounded-bl-md'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      )}>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                      </div>
                      
                      {message.type === 'user' && (
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          <Mic className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Controls */}
                <div className="border-t border-slate-200/60 p-6">
                  <div className="flex items-center justify-center gap-4">
                    {!isConnected ? (
                      <Button
                        onClick={startConversation}
                        disabled={isConnecting}
                        className="px-8 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Mic className="w-5 h-5 mr-2" />
                            Start Voice Chat
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={stopConversation}
                        className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Square className="w-5 h-5 mr-2" />
                        End Conversation
                      </Button>
                    )}
                  </div>
                  
                  {isConnected && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-slate-600">
                        🎤 {conversation.isSpeaking ? 'AI is speaking...' : 'Listening for your voice...'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            
            {/* Connection Status */}
            <Card className="shadow-xl border-slate-200/60 bg-white/95 backdrop-blur-sm transform hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MessageCircle className="w-5 h-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-900">Connection Status</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status</span>
                    <span className={cn(
                      "text-sm font-medium",
                      isConnected ? "text-green-600" : "text-slate-600"
                    )}>
                      {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Agent</span>
                    <span className="text-sm font-medium text-slate-900">{currentAgent}</span>
                  </div>
                  
                  {isConnected && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Speaking</span>
                      <span className="text-sm font-medium text-slate-900">
                        {conversation.isSpeaking ? 'Yes' : 'No'}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Activity Log */}
            <Card className="shadow-xl border-slate-200/60 bg-white/95 backdrop-blur-sm transform hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Settings className="w-5 h-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-900">Activity Log</h3>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {conversationLogs.slice(-10).map((log, index) => (
                    <div key={index} className="text-xs text-slate-600 font-mono bg-slate-50 p-2 rounded">
                      {log}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
