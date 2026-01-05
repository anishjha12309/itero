"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight uppercase">Itero_</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 text-xs font-mono uppercase tracking-wider text-muted-foreground">
             <span>Session_Active</span>
             <span>Rec_On</span>
          </div>
          <div className="h-4 w-px bg-border hidden md:block" />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
