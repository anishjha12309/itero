"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getResults } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Editor from "@monaco-editor/react";
import { Loader2, CheckCircle2, AlertTriangle, Lightbulb, ArrowLeft, Terminal, ShieldAlert, Award } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";

interface IEvaluation {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  missingEdgeCases: string[];
  nextSteps: string[];
  codeReview: string;
}

interface IResults {
  code: string;
  evaluation: IEvaluation;
  questions: string[];
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<IResults | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const result = await getResults(id);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch results", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
        fetchResults();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-6">
        <Loader2 className="w-16 h-16 animate-spin text-foreground border-t-2 border-foreground rounded-full" />
        <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground animate-pulse">Computing Final Evaluation...</p>
      </div>
    );
  }

  if (!data || !data.evaluation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-4">
        <p className="text-destructive font-mono uppercase tracking-wider">Evaluation Data Unavailable</p>
        <Button onClick={() => router.push('/')} variant="outline" className="rounded-none uppercase tracking-wider">Return Home</Button>
      </div>
    );
  }

  const { evaluation } = data;

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
       <Navbar />
      
       <main className="flex-1 container mx-auto px-4 md:px-8 py-10 space-y-12">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col space-y-4 border-b border-border pb-8"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase mb-2">
                            Session Report
                        </h1>
                        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
                            ID: {id} // STATUS: COMPLETE
                        </p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Overall Score</span>
                        <div className="text-6xl font-bold tracking-tighter text-foreground">
                            {evaluation.overallScore}<span className="text-2xl text-muted-foreground">/10</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                {/* Left Column: Code & Review */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-8"
                >
                    {/* Code Editor View */}
                    <div className="border border-border bg-card flex flex-col h-[500px]">
                        <div className="flex items-center justify-between px-4 py-3 bg-muted/10 border-b border-border">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                                <Terminal className="w-4 h-4" />
                                Final Code Submission
                            </span>
                        </div>
                        <div className="flex-1 relative bg-card">
                            <Editor
                                height="100%"
                                defaultLanguage="javascript"
                                theme={theme === "light" ? "light" : "vs-dark"}
                                value={data.code || "// No code submitted"}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    fontSize: 13,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    scrollBeyondLastLine: false,
                                    contextmenu: false,
                                    renderLineHighlight: "none",
                                }}
                            />
                        </div>
                    </div>

                    {/* Detailed Code Review */}
                    <div className="border border-border bg-card p-6 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">
                           <Lightbulb className="w-4 h-4" />
                           Code Review
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                            {evaluation.codeReview}
                        </p>
                    </div>
                </motion.div>

                {/* Right Column: Structured Feedback */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-6"
                >
                    {/* Strengths */}
                    <Card className="rounded-none border-border bg-card/50">
                        <CardHeader className="py-4 border-b border-border bg-green-500/5">
                            <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="w-4 h-4" />
                                Strengths
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <ul className="space-y-3">
                                {evaluation.strengths.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                                        <span className="mt-1.5 w-1.5 h-1.5 bg-green-500/50 flex-none" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Improvements */}
                    <Card className="rounded-none border-border bg-card/50">
                        <CardHeader className="py-4 border-b border-border bg-yellow-500/5">
                            <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                                <AlertTriangle className="w-4 h-4" />
                                Areas for Improvement
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                             <ul className="space-y-3">
                                {evaluation.improvements.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                                        <span className="mt-1.5 w-1.5 h-1.5 bg-yellow-500/50 flex-none" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Missing Edge Cases */}
                    <Card className="rounded-none border-border bg-card/50">
                        <CardHeader className="py-4 border-b border-border bg-red-500/5">
                            <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2 text-red-600 dark:text-red-400">
                                <ShieldAlert className="w-4 h-4" />
                                Missing Edge Cases
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                             <ul className="space-y-3">
                                {evaluation.missingEdgeCases.length > 0 ? (
                                    evaluation.missingEdgeCases.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                                            <span className="mt-1.5 w-1.5 h-1.5 bg-red-500/50 flex-none" />
                                            {item}
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-sm italic text-muted-foreground">No critical edge cases missed.</li>
                                )}
                            </ul>
                        </CardContent>
                    </Card>
                    
                    {/* Next Steps */}
                    <Card className="rounded-none border-border bg-card/50">
                        <CardHeader className="py-4 border-b border-border bg-blue-500/5">
                            <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                <Award className="w-4 h-4" />
                                Next Steps
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                             <ul className="space-y-3">
                                {evaluation.nextSteps.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                                        <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500/50 flex-none" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                </motion.div>
            </div>
            
            <div className="flex justify-center pt-10 pb-20">
                <Button 
                    size="lg" 
                    variant="default" 
                    className="rounded-none uppercase tracking-widest px-8 h-14 text-xs font-mono bg-foreground text-background hover:bg-foreground/90"
                    onClick={() => router.push('/')}
                >
                    Start New Simulation
                </Button>
            </div>
       </main>
    </div>
  );
}
