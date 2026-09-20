"use client";

// The small floating tab on the app screens: "Live" (real backend data, the default) and
// "See how it works" (the simulated demo the frontend team built, with made-up data).
// The mode lives in the URL (?mode=demo) so a demo link can be shared and the back button works.

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type AppMode = "live" | "demo";

/** Current mode, or null until the URL has been read (the page is statically exported). */
export function useAppMode(): [AppMode | null, (m: AppMode) => void] {
  const [mode, setMode] = useState<AppMode | null>(null);

  useEffect(() => {
    const read = () => setMode(new URLSearchParams(window.location.search).get("mode") === "demo" ? "demo" : "live");
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  const change = useCallback((m: AppMode) => {
    const url = new URL(window.location.href);
    if (m === "demo") url.searchParams.set("mode", "demo");
    else url.searchParams.delete("mode");
    window.history.pushState(null, "", url);
    setMode(m);
  }, []);

  return [mode, change];
}

export function ModeTabs({ mode, onChange }: { mode: AppMode; onChange: (m: AppMode) => void }) {
  const tab = (m: AppMode, label: string, live?: boolean) => (
    <button
      role="tab"
      aria-selected={mode === m}
      onClick={() => onChange(m)}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors",
        mode === m ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200",
      )}
    >
      {live && <span className={cn("h-1.5 w-1.5 rounded-full", mode === "live" ? "animate-pulse bg-emerald-400" : "bg-slate-500")} />}
      {label}
    </button>
  );

  return (
    <div className="pointer-events-none fixed left-1/2 top-2 z-[60] flex -translate-x-1/2 items-center gap-2">
      <div role="tablist" aria-label="Screen mode" className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/10 bg-[#0B0E14]/90 p-0.5 shadow-lg backdrop-blur">
        {tab("live", "Live", true)}
        {tab("demo", "See how it works")}
      </div>
      {mode === "demo" && (
        <span className="pointer-events-auto rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-300">
          simulated data
        </span>
      )}
    </div>
  );
}
