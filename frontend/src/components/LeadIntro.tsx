"use client";

import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  ShieldCheck,
  Wallet,
  FileCode2,
  CheckCircle2,
  Cpu,
} from "lucide-react";

export default function LeadIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const { images } = useImagePreloader("/sequence-2/", 2, {
    customFiles: ["frame-001.jpg", "frame-002.jpg"],
  });

  // Crossfade & scale mapped directly to GPU compositor values (zero React re-renders)
  const crossfade = useTransform(scrollYProgress, [0, 0.65], [0, 1]);
  const img1Opacity = useTransform(crossfade, [0, 1], [1, 0]);
  const img2Opacity = useTransform(crossfade, [0, 1], [0, 1]);
  const scale1 = useTransform(scrollYProgress, [0, 1], [0.88, 0.92]);
  const scale2 = useTransform(scrollYProgress, [0, 1], [0.92, 0.88]);

  // Card trigger: ONLY triggers React state update at the moment of threshold crossing
  const [showCards, setShowCards] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const shouldShow = latest > 0.40;
    setShowCards((prev) => (prev !== shouldShow ? shouldShow : prev));
  });

  const springTransition = {
    type: "spring",
    stiffness: 120,
    damping: 14,
  };

  return (
    <section
      id="lead"
      ref={containerRef}
      className="relative h-[300vh] bg-crew-bg"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {/* Base Frame */}
          <motion.div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${images[0]?.src || "/sequence-1/frame-001.jpg"})`,
              opacity: prefersReducedMotion ? 0 : img1Opacity,
              scale: scale1,
            }}
          />

          {/* Target Frame */}
          <motion.div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${images[1]?.src || "/sequence-1/frame-060.jpg"})`,
              opacity: prefersReducedMotion ? 1 : img2Opacity,
              scale: scale2,
            }}
          />

          <div className="absolute inset-0 bg-radial-vignette opacity-80 pointer-events-none" />
          <div className="absolute inset-0 bg-crew-bg/40 backdrop-blur-[2px] pointer-events-none" />
        </div>

        <div className="absolute top-20 inset-x-0 z-10 flex flex-col items-center text-center px-6 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crew-surface/90 border border-crew-blue/40 text-crew-blue text-xs font-mono tracking-widest uppercase mb-2 shadow-neon-blue">
            <Cpu className="w-3.5 h-3.5" />
            ACTOR 01 // ORCHESTRATOR
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight">
            THE LEAD AGENT
          </h2>
          <p className="mt-1 text-slate-400 font-sans text-xs sm:text-sm max-w-xl">
            Synthesizes high-level developer intent into deterministic sub-tasks,
            allocates compute wallets, and enforces Cedar security boundaries.
          </p>
        </div>

        <div className="relative z-20 w-full max-w-6xl h-full px-6 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ y: -200, opacity: 0 }}
            animate={
              showCards
                ? { y: 0, opacity: 1 }
                : { y: -200, opacity: 0 }
            }
            transition={{ ...springTransition, delay: 0 }}
            className="absolute top-36 sm:top-40 max-w-md w-full pointer-events-auto"
          >
            <div className="bg-crew-surface/90 backdrop-blur-xl border border-crew-blue/40 rounded-xl p-4 shadow-neon-blue relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-crew-blue/10 rounded-full blur-2xl" />
              <div className="flex items-center justify-between border-b border-crew-border pb-2.5 mb-2.5">
                <div className="flex items-center gap-2 font-mono text-xs text-crew-blue font-bold tracking-wider">
                  <FileCode2 className="w-4 h-4" />
                  <span>CONTRACT #CRW-8492</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-semibold">
                  STATUS: EXECUTING
                </span>
              </div>
              <div className="font-mono text-xs text-slate-200 font-semibold mb-1">
                Autonomous Feature Spec & Execution
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-crew-border/60 text-[10px] font-mono text-slate-400">
                <div>
                  <span className="text-slate-500 block">SLA</span>
                  <span className="text-white font-semibold">120s</span>
                </div>
                <div>
                  <span className="text-slate-500 block">BUDGET</span>
                  <span className="text-crew-blue font-semibold">45,000 TOKENS</span>
                </div>
                <div>
                  <span className="text-slate-500 block">TARGET</span>
                  <span className="text-crew-purple font-semibold">AWS ECS / FARGATE</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={
              showCards
                ? { x: 0, opacity: 1 }
                : { x: -300, opacity: 0 }
            }
            transition={{ ...springTransition, delay: 0.12 }}
            className="absolute left-6 sm:left-12 top-1/2 -translate-y-1/2 max-w-xs w-full pointer-events-auto hidden md:block"
          >
            <div className="bg-crew-surface/90 backdrop-blur-xl border border-crew-amber/40 rounded-xl p-4 shadow-neon-amber relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 font-mono text-xs text-crew-amber font-bold tracking-wider">
                  <Wallet className="w-4 h-4" />
                  <span>COMPUTE LEDGER</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  REAL-TIME BURN
                </span>
              </div>
              <div className="text-2xl font-display font-black text-white">
                $1,240.00
                <span className="text-xs font-mono font-normal text-slate-400 ml-1">
                  / $1,500.00 CAP
                </span>
              </div>
              <div className="w-full h-2 bg-crew-bg rounded-full overflow-hidden my-2.5 border border-crew-border">
                <div className="h-full bg-gradient-to-r from-crew-amber to-yellow-300 w-[84%] rounded-full shadow-[0_0_10px_#F59E0B]" />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>ALLOCATED: 84%</span>
                <span className="text-crew-amber">$0.0012 / SEC</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={
              showCards
                ? { x: 0, opacity: 1 }
                : { x: 300, opacity: 0 }
            }
            transition={{ ...springTransition, delay: 0.24 }}
            className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 max-w-xs w-full pointer-events-auto hidden md:block"
          >
            <div className="bg-crew-surface/90 backdrop-blur-xl border border-crew-purple/40 rounded-xl p-4 shadow-neon-purple relative overflow-hidden">
              <div className="flex items-center gap-2 text-crew-purple font-mono text-xs font-bold tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>HUMAN-IN-THE-LOOP</span>
              </div>
              <div className="font-mono text-xs text-white font-medium mb-2">
                Cedar Policy #402 Checkpoint
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Automated lock preventing unauthorized VPC route table mutation
                without cryptographic engineer sign-off.
              </p>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-crew-border/60">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  VERIFIED PASS
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  LATENCY 12ms
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={
              showCards
                ? { y: 0, opacity: 1 }
                : { y: 200, opacity: 0 }
            }
            transition={{ ...springTransition, delay: 0.36 }}
            className="absolute bottom-12 inset-x-6 max-w-xl mx-auto pointer-events-auto"
          >
            <div className="bg-crew-surface/95 backdrop-blur-xl border border-crew-border rounded-xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-crew-blue to-crew-purple flex items-center justify-center text-white font-bold font-display text-sm">
                  01
                </div>
                <div>
                  <div className="text-white font-display font-bold text-sm tracking-wide flex items-center gap-2">
                    LEAD AGENT
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-crew-blue/20 text-crew-blue border border-crew-blue/40">
                      CHARCOAL SUIT
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Role: Orchestrator & Task Broker // Model: Claude 3.5 Sonnet
                  </div>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <span className="text-[10px] font-mono text-slate-500 block">
                  ACTIVE DELEGATIONS
                </span>
                <span className="text-xs font-mono font-bold text-crew-blue">
                  5 SUB-AGENTS BOUND
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
