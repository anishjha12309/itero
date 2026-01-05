"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useInterview } from "@/lib/hooks/useInterview";
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export default function Home() {
  const router = useRouter();
  const { startInterview, isLoading } = useInterview();

  const handleStart = async () => {
    try {
      const data = await startInterview();
      if (data && data.sessionId) {
         router.push(`/interview?sessionId=${data.sessionId}&assistantId=${data.assistantId}`);
      } else {
         router.push("/interview");
      }
    } catch (error) {
      console.error("Failed to start", error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground selection:text-background">
      {/* Navigation / Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight uppercase">Itero_</span>
            </div>
            <div className="flex items-center gap-4">
                <ModeToggle />
            </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col border-x border-border/50 container mx-auto relative">
        <div className="flex-1 flex flex-col justify-center px-4 md:px-12 py-20 relative overflow-hidden">
            
            {/* Grid Background Effect */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none grid-background" />

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-5xl z-10"
            >
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.9] mb-12 uppercase text-balance-marketing">
                    Master The <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground/50">Technical</span> <br />
                    Interview.
                </h1>
                
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center pt-8 border-t border-border/50">
                    <p className="text-lg md:text-xl text-muted-foreground max-w-md font-mono">
                        Experience an autonomous AI evaluator. <br />
                        Real-time voice interaction. Live code execution.
                    </p>
                    
                    <Button
                        size="lg"
                        className="h-16 px-10 text-lg rounded-none bg-foreground text-background hover:bg-foreground/90 transition-all uppercase tracking-wide group"
                        onClick={handleStart}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                Initializing
                            </>
                        ) : (
                            <span className="flex items-center">
                                Start Simulation
                                <ArrowRight className="ml-3 w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </span>
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>

        {/* Footer Marquee / Status */}
        <div className="h-12 border-t border-border flex items-center justify-between px-4 md:px-8 text-xs font-mono text-muted-foreground uppercase tracking-wider bg-muted/10">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 animate-pulse" />
                System Operational
            </div>
            <div>
                {/* System Operational */}
            </div>
        </div>
      </main>
    </div>
  );
}
