"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CodeEditor } from "@/components/interview/CodeEditor";
import { LiveTranscripts } from "@/components/interview/LiveTranscripts";
import { AgentControls } from "@/components/interview/AgentControls";
import { useInterview } from "@/lib/hooks/useInterview";
import { useVapi } from "@/lib/hooks/useVapi";
import { Navbar } from "@/components/layout/Navbar";
import { Loader2 } from "lucide-react";

export default function InterviewPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
             <Navbar />
             <main className="flex-1 overflow-hidden relative">
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center h-full space-y-6">
                        <div className="w-16 h-16 border-4 border-t-foreground border-r-foreground/30 border-b-foreground/10 border-l-foreground/50 rounded-full animate-spin" />
                        <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Environment...</p>
                    </div>
                }>
                    <InterviewContent />
                </Suspense>
             </main>
        </div>
    );
}

function InterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    startInterview, 
    sessionId, 
    handleCodeChange,
    code,
    transcript,
    addTranscript,
    endInterviewSession,
    isLoading: isSessionLoading
  } = useInterview();

  const {
    startCall,
    endCall,
    toggleMute,
    isMuted,
    isConnected,
    isSpeaking,
    isListening,
  } = useVapi({
    onTranscriptUpdate: addTranscript,
    onCallEnd: () => console.log("Call ended via Vapi event")
  });

  const [hasStarted, setHasStarted] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initCallback = async () => {
        try {
            const data = await startInterview();
            if (data && data.assistantId) {
                await startCall(data.assistantId);
                setHasStarted(true);
            }
        } catch (e) {
            console.error("Failed to init interview", e);
        }
    };
    
    initCallback();

    return () => {
      endCall();
    };
  }, []);

  const handleEndSession = async () => {
    endCall();
    await endInterviewSession();
    if (sessionId) {
        router.push(`/results/${sessionId}`);
    }
  };

  if (!hasStarted && isSessionLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-full space-y-6">
            <Loader2 className="w-12 h-12 animate-spin text-foreground" />
            <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground animate-pulse">Securing evaluation context...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-3.5rem)] p-0 md:p-0">
       {/* Left Panel: Code Editor */}
       <div className="flex-1 md:flex-[3] h-full flex flex-col border-r border-border">
            <CodeEditor code={code} onChange={(val) => handleCodeChange(val || "")} />
       </div>

       {/* Right Panel: Sidebar */}
       <div className="flex-1 md:flex-[1.2] h-full flex flex-col bg-background/50">
            <div className="flex-none p-4 pb-0">
                <AgentControls 
                    isMuted={isMuted} 
                    onToggleMute={toggleMute} 
                    onEndCall={handleEndSession}
                    status={isSpeaking ? "speaking" : isListening ? "listening" : isConnected ? "connected" : "disconnected"} 
                />
            </div>
            <div className="flex-1 min-h-0 p-4">
                <LiveTranscripts transcripts={transcript} />
            </div>
       </div>
    </div>
  );
}
