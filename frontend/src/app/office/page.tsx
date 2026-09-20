"use client";

import dynamic from "next/dynamic";
import { ModeTabs, useAppMode } from "@/components/ModeTabs";

// The office is a PixiJS/WebGL scene plus browser-only state (localStorage, requestAnimationFrame,
// canvas). It must never render on the server, so both versions load client-side only, which also
// rules out hydration mismatches.
const Booting = () => (
  <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-[#0D1015] font-mono text-xs text-slate-400">
    <span className="h-2 w-2 animate-pulse rounded-full bg-[#D64B55]" />
    <span className="tracking-widest">BOOTING ULTRON FLOOR…</span>
  </div>
);

// Live: the real office, driven by a backend room.
const LiveOffice = dynamic(() => import("@/components/office/live/LiveOffice"), { ssr: false, loading: Booting });
// See how it works: the frontend team's simulated office, with made-up data.
const OfficeWorkspace = dynamic(() => import("@/components/office/OfficeWorkspace"), { ssr: false, loading: Booting });

export default function OfficePage() {
  const [mode, setMode] = useAppMode();
  if (!mode) return <div className="h-screen w-screen bg-[#0D1015]" />;
  return (
    <>
      <ModeTabs mode={mode} onChange={setMode} />
      {mode === "demo" ? <OfficeWorkspace /> : <LiveOffice />}
    </>
  );
}
