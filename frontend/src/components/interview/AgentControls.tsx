"use client";

import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AgentControlsProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onEndCall: () => void;
  status: "connected" | "disconnected" | "speaking" | "listening";
}

export function AgentControls({ isMuted, onToggleMute, onEndCall, status }: AgentControlsProps) {
  
  return (
    <div className="border border-border bg-card p-4 flex flex-col gap-4">
        {/* Visualizer Area */}
        <div className="h-24 bg-background border border-border flex items-center justify-between px-6 relative overflow-hidden group">
             
             {/* Simple Audio Wave Animation */}
             <div className="flex items-center gap-1 h-full z-10">
                {(status === "speaking" || status === "listening") ? (
                    [...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className={cn(
                                "w-1 bg-foreground",
                                status === "speaking" ? "bg-foreground" : "bg-muted-foreground/30"
                            )}
                            animate={{ 
                                height: status === "speaking" ? [10, 40, 15, 60, 20] : [5, 15, 5] 
                            }}
                            transition={{ 
                                duration: 1.2, 
                                repeat: Infinity, 
                                ease: "easeInOut",
                                delay: i * 0.05,
                                repeatType: "mirror" 
                            }}
                        />
                    ))
                ) : (
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        <Activity className="w-4 h-4" />
                        <span>Initializing_Stream...</span>
                    </div>
                )}
             </div>

             <div className="absolute top-2 right-2 z-20">
                 <div className={cn(
                     "px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border",
                     status === "speaking" ? "bg-green-500/10 border-green-500 text-green-500" :
                     status === "listening" ? "bg-blue-500/10 border-blue-500 text-blue-500" :
                     "bg-gray-500/10 border-gray-500 text-gray-500"
                 )}>
                     {status}
                 </div>
             </div>
             
             {/* Grid overlay */}
             <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('/grid.svg')] bg-[length:10px_10px]" />
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-3">
            <Button 
                variant={isMuted ? "destructive" : "outline"} 
                className={cn(
                    "w-full rounded-none border-foreground/20 hover:border-foreground transition-all uppercase text-xs tracking-wider h-12",
                    isMuted && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                )}
                onClick={onToggleMute}
            >
                {isMuted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                {isMuted ? "Muted" : "Mute Mic"}
            </Button>
            
            <Button 
                variant="default" // Using default (foreground bg) for contrast
                className="w-full rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90 uppercase text-xs tracking-wider h-12"
                onClick={onEndCall}
            >
                <PhoneOff className="mr-2 h-4 w-4" />
                End Session
            </Button>
        </div>
    </div>
  );
}
