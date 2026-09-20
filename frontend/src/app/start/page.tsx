"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RoomPicker } from "@/components/airstream/RoomPicker";
import MockStart from "@/components/start/MockStart";
import { ModeTabs, useAppMode } from "@/components/ModeTabs";

export default function StartPage() {
  const [mode, setMode] = useAppMode();
  const router = useRouter();

  if (!mode) return <div className="min-h-screen bg-crew-bg" />;

  return (
    <>
      <ModeTabs mode={mode} onChange={setMode} />
      {mode === "demo" ? (
        // made-up workspaces and sign-in, kept so the product can be shown off
        <MockStart />
      ) : (
        <div className="flex min-h-screen flex-col bg-crew-bg font-sans text-crew-text">
          <header className="flex h-[52px] items-center justify-between border-b border-crew-border px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/ultron-logo.png" alt="Ultron" className="h-6 w-auto" />
              <span className="font-mono text-xs font-bold tracking-widest text-red-400">ULTRON</span>
            </Link>
            <nav className="flex items-center gap-4 font-mono text-[11px] text-slate-400">
              <Link href="/airstream/" className="hover:text-slate-200">console</Link>
              <Link href="/" className="hover:text-slate-200">landing page</Link>
            </nav>
          </header>
          <main className="flex flex-1 flex-col items-center gap-6 px-4 py-14">
            <div className="text-center">
              <h1 className="font-display text-2xl font-semibold">Your rooms</h1>
              <p className="mt-1 max-w-md text-sm text-crew-text-secondary">
                A room is one job: the devices working on it, the tasks they were given and the code they built.
                Open one to watch it live.
              </p>
            </div>
            <RoomPicker onOpen={(id) => router.push(`/office?room=${encodeURIComponent(id)}`)} />
          </main>
        </div>
      )}
    </>
  );
}
