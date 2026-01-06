"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { TranscriptEntry } from "@/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface LiveTranscriptsProps {
  transcripts: TranscriptEntry[];
  elapsedTime?: string;
}

export function LiveTranscripts({ transcripts, elapsedTime = "00:00" }: LiveTranscriptsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastCount = useRef(transcripts.length);
  const isUserScrolling = useRef(false);

  // Check if near bottom
  const isNearBottom = useCallback(() => {
    if (!scrollContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 80;
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
    setUnreadCount(0);
    isUserScrolling.current = false;
  }, []);

  // Handle scroll
  const handleScroll = useCallback(() => {
    const nearBottom = isNearBottom();
    setShowScrollButton(!nearBottom);
    if (nearBottom) {
      setUnreadCount(0);
      isUserScrolling.current = false;
    } else {
      isUserScrolling.current = true;
    }
  }, [isNearBottom]);

  // Auto-scroll on new messages (if at bottom)
  useEffect(() => {
    const newMsgs = transcripts.length - lastCount.current;
    if (newMsgs > 0) {
      if (!isUserScrolling.current && isNearBottom()) {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      } else {
        setUnreadCount(prev => prev + newMsgs);
        setShowScrollButton(true);
      }
    }
    lastCount.current = transcripts.length;
  }, [transcripts.length, isNearBottom]);

  return (
    <div className="flex flex-col h-full border border-border bg-card overflow-hidden relative">
        {/* Header with timer */}
        <div className="p-3 border-b border-border bg-muted/10 flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold tracking-widest uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-foreground" />
                Transcript_Log
            </h2>
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
                ⏱ {elapsedTime}
            </span>
        </div>
        
        {/* Scrollable messages */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4"
        >
            <div className="space-y-6 pr-2">
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
                                {entry.role === "agent" ? "Sarah" : "You"}
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
                             <span className="text-xs font-mono uppercase tracking-widest">Waiting for Sarah...</span>
                        </div>
                    )}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={scrollToBottom}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-foreground text-background text-xs font-mono uppercase tracking-wider border border-foreground hover:bg-foreground/90 transition-colors z-10"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              {unreadCount > 0 ? `${unreadCount} new` : 'Latest'}
            </motion.button>
          )}
        </AnimatePresence>
    </div>
  );
}
