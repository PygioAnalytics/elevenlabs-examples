import { RealtimeAgents } from "@/components/RealtimeAgents";
import { RealtimeAgentsWebSocket } from "@/components/RealtimeAgentsWebSocket";

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">
                        ElevenLabs Conversational AI Demo
                    </h1>
                    <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                        Two approaches to conversational AI: WebSocket-based real-time chat and Twilio outbound calls
                    </p>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    
                    {/* WebSocket Approach */}
                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200/60">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <h2 className="text-xl font-bold text-slate-900">Real-time WebSocket Chat</h2>
                            </div>
                            <div className="space-y-2 text-sm text-slate-600 mb-4">
                                <p>✅ <strong>Real-time streaming</strong> - See messages as they happen</p>
                                <p>✅ <strong>Browser-based</strong> - Works directly in web browser</p>
                                <p>✅ <strong>Voice input/output</strong> - Speak and hear responses</p>
                                <p>❌ <strong>No phone calls</strong> - Web-only conversation</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <p className="text-sm text-green-800">
                                    <strong>Recommended:</strong> This approach provides the real-time streaming you requested.
                                </p>
                            </div>
                        </div>
                        <div className="h-[600px]">
                            <RealtimeAgentsWebSocket />
                        </div>
                    </div>

                    {/* Twilio Approach */}
                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200/60">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <h2 className="text-xl font-bold text-slate-900">Twilio Outbound Calls</h2>
                            </div>
                            <div className="space-y-2 text-sm text-slate-600 mb-4">
                                <p>✅ <strong>Real phone calls</strong> - Calls actual phone numbers</p>
                                <p>✅ <strong>Twilio integration</strong> - Uses Twilio infrastructure</p>
                                <p>✅ <strong>Post-call transcripts</strong> - Available in ElevenLabs dashboard</p>
                                <p>❌ <strong>No real-time streaming</strong> - Transcripts available after call ends</p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800">
                                    <strong>Use case:</strong> When you need to make actual phone calls to users.
                                </p>
                            </div>
                        </div>
                        <div className="h-[600px]">
                            <RealtimeAgents />
                        </div>
                    </div>
                </div>

                {/* Technical Notes */}
                <div className="mt-12 bg-slate-100 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">📚 Technical Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-2">WebSocket Approach</h4>
                            <ul className="space-y-1 text-slate-600">
                                <li>• Uses <code>@elevenlabs/react</code> package</li>
                                <li>• Direct WebSocket connection to ElevenLabs</li>
                                <li>• Real-time message streaming</li>
                                <li>• Browser microphone and speakers</li>
                                <li>• Perfect for web applications</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-2">Twilio Approach</h4>
                            <ul className="space-y-1 text-slate-600">
                                <li>• Uses ElevenLabs Twilio API</li>
                                <li>• Makes actual phone calls</li>
                                <li>• Transcripts in ElevenLabs dashboard</li>
                                <li>• No real-time streaming to web</li>
                                <li>• Perfect for phone-based outreach</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
