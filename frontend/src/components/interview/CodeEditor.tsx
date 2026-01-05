"use client";

import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
}

export function CodeEditor({ code, onChange }: CodeEditorProps) {
  const { theme } = useTheme();

  return (
    <div className="h-full w-full border border-border bg-card flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border">
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 bg-primary animate-pulse" />
           <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Editor_Active</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground uppercase">main.js</span>
      </div>
      <div className="flex-1 relative">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            theme={theme === "light" ? "light" : "vs-dark"}
            value={code}
            onChange={onChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 1.6,
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: "phase",
              cursorSmoothCaretAnimation: "on",
              roundedSelection: false,
              renderLineHighlight: "line",
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,
            }}
            className="bg-card"
          />
      </div>
    </div>
  );
}
