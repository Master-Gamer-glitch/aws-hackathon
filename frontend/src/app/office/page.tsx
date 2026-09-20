"use client";

import dynamic from "next/dynamic";

// The live office is a PixiJS/WebGL scene plus browser-only state (localStorage,
// requestAnimationFrame, canvas). It must never render on the server, so the whole
// workspace is loaded client-side only — this also rules out hydration mismatches.
const OfficeWorkspace = dynamic(
  () => import("@/components/office/OfficeWorkspace"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-[#0D1015] font-mono text-xs text-slate-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#D64B55]" />
        <span className="tracking-widest">BOOTING ULTRON FLOOR…</span>
      </div>
    ),
  }
);

export default function OfficePage() {
  return <OfficeWorkspace />;
}
