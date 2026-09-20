"use client";

import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Image from "next/image";
import {
  Zap,
  Activity,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";

export function HeroScrollDemo() {
  return (
    <section id="living-office" className="relative w-full bg-crew-bg overflow-hidden pt-6">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-crew-blue/10 via-transparent to-transparent pointer-events-none" />

      {/* 3D Container Scroll Tablet */}
      <ContainerScroll
        titleComponent={
          <div className="flex flex-col items-center text-center px-4 max-w-4xl mx-auto mb-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B0E14]/90 backdrop-blur-xl border border-crew-blue/40 text-crew-blue text-xs font-mono tracking-widest uppercase mb-3 shadow-[0_0_20px_rgba(56,189,248,0.3)]">
              <Zap className="w-3.5 h-3.5 text-crew-blue animate-pulse" />
              ZONE 01 // THE LIVING OFFICE
            </div>

            <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-none mb-3 drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
              WATCH THE{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-crew-blue via-sky-300 to-cyan-300 drop-shadow-[0_0_35px_rgba(56,189,248,0.6)]">
                WORK HAPPEN.
              </span>
            </h2>

            <p className="text-slate-300 font-sans text-xs sm:text-base max-w-2xl leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              Ultron turns invisible AI execution into a living workspace. Every agent has a role, a location, a task and a current state.
            </p>
          </div>
        }
      >
        {/* Tablet Screen Content: 3D Living Office with Futuristic Mission HUD */}
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#0B0E14] border border-white/10 group">
          {/* 3D Office Workspace Base Image */}
          <Image
            src="/sequence-3/frame-001.jpg"
            alt="Ultron Living Office Workspace"
            fill
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            priority
          />

          {/* Cinematic Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B15_1px,transparent_1px),linear-gradient(to_bottom,#1E293B15_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

          {/* Top HUD: Status Bar */}
          <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B0E14]/85 backdrop-blur-xl border border-crew-blue/30 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-mono text-white font-bold tracking-wider">
                LIVE MISSION: SPRINT 04
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-md bg-[#0B0E14]/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-cyan-300">
                3 AGENTS ACTIVE
              </div>
              <div className="px-2.5 py-1 rounded-md bg-[#0B0E14]/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-emerald-400">
                1 VERIFIED
              </div>
              <div className="px-2.5 py-1 rounded-md bg-[#0B0E14]/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-400">
                0 BLOCKERS
              </div>
            </div>
          </div>

          {/* Bottom HUD: 3 Live Agent Workspaces */}
          <div className="absolute bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 flex flex-col gap-2 pointer-events-none">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-crew-blue/30 shadow-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-crew-blue tracking-wider">
                    ENGINEERING & DESIGN
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-crew-blue/10 text-crew-blue">
                    ACTIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-tight">
                  Auth build • Dashboard UI in sync
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-purple-500/30 shadow-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-purple-400 tracking-wider">
                    RESEARCH & QA
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">
                    TESTING
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-tight">
                  Automated test suites running
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-amber-500/30 shadow-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider">
                    LEAD & MARKETING
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300">
                    COORDINATING
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-tight">
                  Release notes & mission sync
                </p>
              </div>
            </div>

            {/* Bottom Statement Chip */}
            <div className="mx-auto px-4 py-1.5 rounded-full bg-[#0B0E14]/95 backdrop-blur-xl border border-white/15 text-center shadow-lg">
              <span className="text-[11px] font-mono text-slate-200">
                Your AI workforce isn&apos;t a chat history.{" "}
                <span className="text-crew-blue font-bold">It&apos;s an operating team.</span>
              </span>
            </div>
          </div>
        </div>
      </ContainerScroll>

      {/* ================================================== */}
      {/* FUTURISTIC LIGHT GATE TRANSITION FROM TABLET */}
      {/* ================================================== */}
      <div className="relative w-full flex flex-col items-center justify-center -mt-8 pb-16 overflow-hidden">
        {/* Ambient Light Blooms */}
        <div className="absolute top-1/2 -translate-y-1/2 w-[700px] h-28 bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -translate-y-1/2 w-[320px] h-12 bg-sky-400/35 blur-xl pointer-events-none" />

        {/* Horizontal Laser / Light Gate Beam */}
        <div className="relative w-full max-w-5xl flex items-center justify-center px-6">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-sky-400 via-50% to-transparent shadow-[0_0_20px_#38bdf8]" />

          {/* Central Light Gate Diamond Node */}
          <div className="absolute flex items-center justify-center">
            <div className="w-5 h-5 rotate-45 border-2 border-cyan-300 bg-[#0B0E14] shadow-[0_0_25px_#38bdf8] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
            </div>
          </div>
        </div>

        {/* Sub-label under Light Gate */}
        <div className="mt-5 flex items-center gap-2 text-[10px] font-mono tracking-widest text-slate-400 uppercase">
          <span className="text-crew-blue">◆</span>
          <span>ZONE 01 COMPLETE // PROCEEDING TO VERIFICATION CHECKPOINTS</span>
          <span className="text-crew-blue">◆</span>
        </div>
      </div>
    </section>
  );
}

export default HeroScrollDemo;
