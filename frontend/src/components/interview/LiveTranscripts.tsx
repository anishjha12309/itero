"use client";

import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TranscriptEntry } from "@/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface LiveTranscriptsProps {
  transcripts: TranscriptEntry[];
}

export function LiveTranscripts({ transcripts }: LiveTranscriptsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcripts]);

  return (
    <div className="flex flex-col h-full border border-border bg-card overflow-hidden">
        <div className="p-3 border-b border-border bg-muted/10">
            <h2 className="text-xs font-mono font-bold tracking-widest uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-foreground" />
                Transcript_Log
            </h2>
        </div>
        
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-6 pr-3">
                <AnimatePresence initial={false}>
                    {transcripts.map((entry) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                                "flex flex-col max-w-[95%] gap-2",
                                entry.role === "agent" ? "self-start items-start" : "self-end items-end ml-auto"
                            )}
                        >
                            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
                                {entry.role === "agent" ? "Interviewer // AI" : "Candidate // You"}
                            </span>
                            <div className={cn(
                                "p-4 text-sm font-mono leading-relaxed border",
                                entry.role === "agent" 
                                    ? "bg-secondary/50 border-border text-foreground" 
                                    : "bg-primary text-primary-foreground border-primary"
                            )}>
                                {entry.content}
                            </div>
                        </motion.div>
                    ))}
                    {transcripts.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground space-y-2">
                             <div className="w-12 h-12 border border-dashed border-muted-foreground/30 rounded-full flex items-center justify-center">
                                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-ping" />
                             </div>
                             <span className="text-xs font-mono uppercase tracking-widest">Awaiting_Audio_Input</span>
                        </div>
                    )}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>
        </ScrollArea>
    </div>
  );
}
