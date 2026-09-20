"use client";

import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  Sparkles,
  ArrowRight,
  Terminal,
} from "lucide-react";

export default function CommandHubClimax() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const { images } = useImagePreloader("/sequence-5/", 2, {
    customFiles: ["frame-001.jpg", "frame-002.jpg"],
  });

  // Crossfade & scale mapped to GPU values
  const crossfade = useTransform(scrollYProgress, [0, 0.65], [0, 1]);
  const img1Opacity = useTransform(crossfade, [0, 1], [1, 0]);
  const img2Opacity = useTransform(crossfade, [0, 1], [0, 1]);
  const scale1 = useTransform(scrollYProgress, [0, 1], [0.88, 0.92]);
  const scale2 = useTransform(scrollYProgress, [0, 1], [0.92, 0.88]);

  // Bloom intensity: peaks at 0.70 between 0.55 and 0.88
  const bloomOpacity = useTransform(
    scrollYProgress,
    [0, 0.55, 0.70, 0.88, 1],
    [0, 0, 1, 0, 0]
  );
  const haloScale = useTransform(bloomOpacity, [0, 1], [1, 1.4]);

  // CTA Card trigger: threshold-only state update
  const [showCTA, setShowCTA] = useState(false);
  const [decision, setDecision] = useState<"pending" | "approved" | "denied">("pending");
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const shouldShow = latest >= 0.65;
    setShowCTA((prev) => (prev !== shouldShow ? shouldShow : prev));
  });

  const springTransition = {
    type: "spring",
    stiffness: 120,
    damping: 14,
  };

  return (
    <section
      id="climax"
      ref={containerRef}
      className="relative h-[350vh] bg-crew-bg"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {/* Base Frame */}
          <motion.div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${images[0]?.src || "/sequence-1/frame-030.jpg"})`,
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

          <div className="absolute inset-0 bg-gradient-to-b from-crew-bg via-transparent to-crew-bg pointer-events-none" />
        </div>

        {/* Ambient Radial Bloom (GPU Composited) */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: prefersReducedMotion ? 0 : bloomOpacity,
            background: `radial-gradient(circle at 50% 55%, rgba(56, 189, 248, 0.75) 0%, rgba(167, 139, 250, 0.45) 30%, rgba(245, 158, 11, 0.2) 55%, transparent 75%)`,
            filter: "blur(30px)",
            mixBlendMode: "screen",
          }}
        />

        {/* Radial Pulse Halo (GPU Composited) */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full border border-crew-blue/40 pointer-events-none"
          style={{
            opacity: prefersReducedMotion ? 0 : bloomOpacity,
            scale: haloScale,
            boxShadow: "0 0 100px 30px rgba(56, 189, 248, 0.35)",
          }}
        />

        <div className="absolute top-16 inset-x-0 z-10 flex flex-col items-center text-center px-6 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-crew-surface/90 border border-crew-blue/40 text-crew-blue text-xs font-mono tracking-widest uppercase mb-2 shadow-neon-blue">
            <Sparkles className="w-3.5 h-3.5" />
            ONE CONTROL PLANE
          </div>
          <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-none mb-2">
            EVERYTHING IN ONE PLACE.
          </h2>
          <p className="text-slate-300 font-sans text-xs sm:text-sm max-w-lg mb-3">
            See your entire AI workforce from one command center.
          </p>

          {/* Section 09 Small UI Labels */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl pointer-events-auto">
            {[
              { label: "ACTIVE AGENTS", val: "6", color: "text-crew-blue" },
              { label: "RUNNING TASKS", val: "3", color: "text-amber-400" },
              { label: "WAITING FOR APPROVAL", val: "1", color: "text-purple-400" },
              { label: "COMPLETED", val: "14", color: "text-emerald-400" },
              { label: "BLOCKED", val: "0", color: "text-slate-400" },
              { label: "BUDGET", val: "$5.00", color: "text-crew-blue" },
              { label: "TOKENS", val: "42.1k", color: "text-slate-300" },
              { label: "VERIFICATION", val: "100%", color: "text-emerald-400" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-[#0B0E14]/80 backdrop-blur-xl border border-white/10 flex items-center gap-2 text-[10px] font-mono shadow-md"
              >
                <span className="text-slate-400">{item.label}:</span>
                <span className={`font-bold ${item.color}`}>{item.val}</span>
              </div>
            ))}
          </div>

          <div className="mt-2 text-[11px] font-mono text-slate-400">
            One mission. One workforce. <span className="text-crew-blue font-bold">One control plane.</span>
          </div>
        </div>

        {/* Section 10 — Human Approval Card */}
        <div className="relative z-30 w-full max-w-2xl px-6 pointer-events-none flex flex-col items-center mt-28">
          <motion.div
            initial={{ y: 150, scale: 0.92, opacity: 0 }}
            animate={
              showCTA
                ? { y: 0, scale: 1, opacity: 1 }
                : { y: 150, scale: 0.92, opacity: 0 }
            }
            transition={springTransition}
            className="w-full pointer-events-auto"
          >
            <div className="bg-[#0B0E14]/95 backdrop-blur-2xl border border-crew-blue/50 rounded-2xl p-6 sm:p-8 shadow-bloom text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-crew-blue via-crew-purple to-crew-amber" />

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-mono mb-3">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span>YOU STAY IN THE LOOP // HUMAN APPROVAL</span>
              </div>

              <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight mb-2">
                AI MOVES FAST. YOU DECIDE WHEN IT MATTERS.
              </h3>

              <p className="text-slate-300 font-sans text-xs sm:text-sm max-w-lg mx-auto mb-5 leading-relaxed">
                When an action crosses a defined risk boundary, Ultron pauses the workflow and asks for your approval.
              </p>

              {/* Example Checkpoint Box */}
              <div className="p-4 rounded-xl bg-crew-bg/90 border border-crew-border/80 text-left mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-crew-blue font-bold">
                    ENGINEERING AGENT
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/70 border border-red-500/40 text-red-300">
                    RISK: Production environment
                  </span>
                </div>

                <div className="text-sm font-mono text-white font-semibold mb-3">
                  &ldquo;Deploy production build to AWS ECS Fargate?&rdquo;
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDecision("approved")}
                    className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                      decision === "approved"
                        ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30"
                        : "bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30"
                    }`}
                  >
                    APPROVE
                  </button>
                  <button
                    onClick={() => setDecision("denied")}
                    className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                      decision === "denied"
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                        : "bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30"
                    }`}
                  >
                    DENY
                  </button>

                  <span className="text-xs font-mono text-slate-400 ml-auto">
                    {decision === "approved" && (
                      <span className="text-emerald-400 font-semibold">
                        ✓ Approved: Mission continues.
                      </span>
                    )}
                    {decision === "denied" && (
                      <span className="text-amber-400 font-semibold">
                        ⚠ Denied: Mission pauses safely.
                      </span>
                    )}
                    {decision === "pending" && (
                      <span className="text-slate-500">
                        Awaiting cryptographic decision
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                <a
                  href="/office"
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-crew-blue via-sky-400 to-crew-purple text-crew-bg font-display font-bold text-xs sm:text-sm tracking-wider shadow-neon-blue hover:brightness-110 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>START BUILDING</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>

                <a
                  href="#roster"
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-crew-bg/80 hover:bg-crew-bg border border-crew-border hover:border-slate-400 text-slate-200 font-mono text-xs tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Terminal className="w-3.5 h-3.5 text-crew-blue" />
                  <span>INSPECT CREW ROSTER</span>
                </a>
              </div>

              <p className="font-mono text-xs text-slate-300">
                You don&apos;t supervise every step. <span className="text-crew-blue font-bold">You approve the decisions that matter.</span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
