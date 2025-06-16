"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Settings, Square, MessageCircle, Zap, Brain, Loader2 } from 'lucide-react';
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
  const [currentAgent, setCurrentAgent] = useState('AI Assistant');
  const [conversationLogs, setConversationLogs] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to Voice AI");
      addMessage('system', 'Connected to Voice AI');
      addConversationLog('✅ Connected to Voice AI');
    },
    onDisconnect: () => {
      console.log("Disconnected from Voice AI");
      addMessage('system', 'Disconnected from Voice AI');
      addConversationLog('❌ Disconnected from Voice AI');
      setMessages([]);
      setConversationLogs([]);
      setCurrentAgent('AI Assistant');
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
      
      // Handle messages from Voice AI
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
      setIsConnecting(true);
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
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Mission Voice AI
                </h1>
                <p className="text-sm text-slate-600">Advanced conversational intelligence</p>
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
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900">Voice Assistant</h3>
              </div>
              
              <p className="text-sm text-slate-600 mb-8 leading-relaxed">
                Connect to start an intelligent voice conversation powered by advanced AI technology.
              </p>
              
              <div className="space-y-4">
                <Button
                  onClick={startConversation}
                  disabled={isConnected || isConnecting}
                  className={`w-full h-12 rounded-xl font-medium transition-all duration-200 ${
                    isConnected || isConnecting
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' 
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transform hover:scale-[1.02]'
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
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25">
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
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <div
                            className={cn(
                              "p-4 rounded-2xl shadow-sm",
                              message.type === 'user'
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white ml-auto'
                                : message.type === 'system'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200 text-center'
                                : 'bg-slate-50 text-slate-900 border border-slate-200'
                            )}
                          >
                            {message.type !== 'user' && message.type !== 'system' && message.agent && (
                              <div className="text-xs font-medium text-slate-500 mb-2">{message.agent}</div>
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
