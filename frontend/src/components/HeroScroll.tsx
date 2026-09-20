"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  ChevronDown,
  ArrowRight,
  AlertTriangle,
  Layers,
  CheckCircle2,
  Workflow,
  Lock,
} from "lucide-react";

export default function HeroScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const initialImageRef = useRef<HTMLImageElement | null>(null);
  const [initialReady, setInitialReady] = useState(false);

  // Framer Motion hardware-accelerated scroll tracking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const prefersReducedMotion = useReducedMotion();

  // Preload first frame immediately for instant first-paint
  useEffect(() => {
    const img = new Image();
    img.src = "/sequence-1/frame-001.jpg";
    img.onload = () => {
      initialImageRef.current = img;
      setInitialReady(true);
    };
    img.onerror = () => {
      img.src = "/sequence-1/ezgif-frame-001.jpg";
      img.onload = () => {
        initialImageRef.current = img;
        setInitialReady(true);
      };
    };
  }, []);

  // Preload 276 frames for Sequence 1 (high-density cinematic scrub)
  const { imagesRef, isLoaded, progress: loadProgress } = useImagePreloader(
    "/sequence-1/",
    276
  );

  // Smooth frame interpolation refs for cinema-grade sub-frame blending
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);

  // Cached canvas dimensions to avoid forced synchronous reflows inside RAF
  const dimensionsRef = useRef({
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080,
    dpr: 1,
  });

  useEffect(() => {
    const updateDimensions = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = canvas.clientWidth || window.innerWidth;
      const displayHeight = canvas.clientHeight || window.innerHeight;

      dimensionsRef.current = {
        width: displayWidth,
        height: displayHeight,
        dpr: dpr,
      };

      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions, { passive: true });
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Ultra-smooth sub-frame RAF render loop (Cross-dissolve frame blending at 60/120fps)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";

    let animationId: number;

    const render = () => {
      // Direct synchronous read of scroll progress (0 latency, zero React re-renders)
      const totalFrames = 276;
      targetFrameRef.current = scrollYProgress.get() * (totalFrames - 1);

      // Snappy, fluid inertia lerp
      const diff = targetFrameRef.current - currentFrameRef.current;
      if (Math.abs(diff) > 0.0001) {
        currentFrameRef.current += diff * 0.18;
      } else {
        currentFrameRef.current = targetFrameRef.current;
      }

      const current = Math.min(
        Math.max(currentFrameRef.current, 0),
        totalFrames - 1
      );

      const { width: displayWidth, height: displayHeight, dpr } = dimensionsRef.current;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Reduced motion: show static end frame
      if (prefersReducedMotion) {
        const targetImage =
          imagesRef.current[totalFrames - 1] ||
          imagesRef.current[0] ||
          initialImageRef.current;

        if (targetImage && targetImage.complete && targetImage.naturalWidth > 0) {
          const imgWidth = targetImage.naturalWidth;
          const imgHeight = targetImage.naturalHeight;
          const headerHeight = 84;
          const scale = displayWidth / imgWidth;
          const scaledWidth = displayWidth;
          const scaledHeight = imgHeight * scale;
          const availableH = displayHeight - headerHeight;
          const offsetY =
            scaledHeight < availableH
              ? headerHeight + (availableH - scaledHeight) / 2
              : headerHeight;

          ctx.fillStyle = "#0B0E14";
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          ctx.drawImage(targetImage, 0, offsetY, scaledWidth, scaledHeight);
        }
        ctx.restore();
        animationId = requestAnimationFrame(render);
        return;
      }

      // SUB-FRAME BLENDING:
      const floorIdx = Math.floor(current);
      const ceilIdx = Math.min(floorIdx + 1, totalFrames - 1);
      const fraction = current - floorIdx;

      let img1 = imagesRef.current[floorIdx];
      let img2 = imagesRef.current[ceilIdx];

      // Fallbacks if frames are still streaming
      if (!img1 || !img1.complete || img1.naturalWidth === 0) {
        for (let i = floorIdx - 1; i >= 0; i--) {
          if (imagesRef.current[i]?.complete && imagesRef.current[i].naturalWidth > 0) {
            img1 = imagesRef.current[i];
            break;
          }
        }
        if (!img1) img1 = initialImageRef.current || imagesRef.current[0];
      }

      if (!img2 || !img2.complete || img2.naturalWidth === 0) {
        img2 = img1;
      }

      if (img1 && img1.complete && img1.naturalWidth > 0) {
        const imgWidth = img1.naturalWidth;
        const imgHeight = img1.naturalHeight;

        const headerHeight = 84;
        const scale = displayWidth / imgWidth;
        const scaledWidth = displayWidth;
        const scaledHeight = imgHeight * scale;
        const offsetX = 0;

        const availableH = displayHeight - headerHeight;
        const offsetY =
          scaledHeight < availableH
            ? headerHeight + (availableH - scaledHeight) / 2
            : headerHeight;

        // Clear background
        ctx.fillStyle = "#0B0E14";
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        // Draw primary base frame
        ctx.globalAlpha = 1;
        ctx.drawImage(img1, offsetX, offsetY, scaledWidth, scaledHeight);

        // Cross-dissolve next frame for infinite sub-frame smoothness
        if (
          ceilIdx !== floorIdx &&
          fraction > 0.005 &&
          img2 &&
          img2 !== img1 &&
          img2.complete &&
          img2.naturalWidth > 0
        ) {
          ctx.globalAlpha = fraction;
          ctx.drawImage(img2, offsetX, offsetY, scaledWidth, scaledHeight);
          ctx.globalAlpha = 1;
        }
      } else {
        ctx.fillStyle = "#0B0E14";
        ctx.fillRect(0, 0, displayWidth, displayHeight);
      }

      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [prefersReducedMotion, scrollYProgress, imagesRef]);

  // Framer Motion Checkpoint Opacities & Transforms
  // CHECKPOINT 0: HERO (Visible immediately at scroll 0, fades as user scrolls past 0.20)
  const heroOpacity = useTransform(scrollYProgress, [0, 0.16, 0.24], [1, 1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.24], [0, -25]);

  // CHECKPOINT 1: THE PROBLEM (Visible from 0.28 to 0.58)
  const problemOpacity = useTransform(scrollYProgress, [0.28, 0.35, 0.52, 0.58], [0, 1, 1, 0]);
  const problemY = useTransform(scrollYProgress, [0.28, 0.35, 0.52, 0.58], [24, 0, 0, -24]);

  // CHECKPOINT 2: AUTONOMOUS EXECUTION (Visible from 0.64 to 0.94)
  const execOpacity = useTransform(scrollYProgress, [0.64, 0.70, 0.88, 0.94], [0, 1, 1, 0]);
  const execY = useTransform(scrollYProgress, [0.64, 0.70, 0.88, 0.94], [24, 0, 0, -24]);

  const scrollPromptOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative h-[400vh] bg-crew-bg"
    >
      {/* Pinned Sticky Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        {/* Full-width Native Canvas with Hardware Acceleration */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full select-none pointer-events-none transform-gpu"
        />

        {/* Scanline Grid Effect Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B10_1px,transparent_1px),linear-gradient(to_bottom,#1E293B10_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        {/* Top & Bottom Cinematic Edge Vignette */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-crew-bg via-crew-bg/70 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-72 sm:h-96 bg-gradient-to-t from-crew-bg via-crew-bg/85 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-radial-vignette opacity-50 pointer-events-none" />

        {/* Preload Progress Indicator */}
        {!isLoaded && !initialReady && (
          <div className="absolute bottom-8 left-8 z-30 flex items-center gap-3 bg-crew-surface/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-crew-border">
            <div className="w-4 h-4 border-2 border-crew-blue border-t-transparent rounded-full animate-spin" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-widest text-slate-400">
                SYNCHRONIZING FRAMES
              </span>
              <div className="w-32 h-1 bg-crew-border rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-crew-blue transition-all duration-200"
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-mono text-crew-blue font-bold">
              {loadProgress}%
            </span>
          </div>
        )}

        {/* ================================================== */}
        {/* ================================================== */}
        {/* SECTION 01 — HERO (Visible from start, clean text without card background) */}
        {/* ================================================== */}
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="absolute inset-0 flex flex-col items-center justify-end text-center px-4 sm:px-6 pb-6 sm:pb-8 pointer-events-none z-20"
        >
          <div className="flex flex-col items-center max-w-3xl w-full">
            <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-white leading-[1.08] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
              GIVE AI{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-crew-blue to-cyan-300 drop-shadow-[0_0_35px_rgba(56,189,248,0.6)]">
                THE WORK.
              </span>{" "}
              <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-orange-400 drop-shadow-[0_0_35px_rgba(244,63,94,0.5)]">
                KEEP THE CONTROL.
              </span>
            </h1>

            <p className="mt-2.5 text-slate-200 font-sans text-xs sm:text-sm md:text-base max-w-xl leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              One brief becomes a coordinated AI team — while you stay in full control.
            </p>

            {/* CTA */}
            <div className="mt-4 flex items-center justify-center pointer-events-auto">
              <a
                href="/start"
                className="px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-crew-blue via-sky-400 to-crew-purple text-crew-bg font-bold font-display text-xs sm:text-sm tracking-wider shadow-[0_0_30px_rgba(56,189,248,0.6)] hover:scale-105 hover:shadow-[0_0_40px_rgba(56,189,248,0.8)] transition-all flex items-center gap-2"
              >
                <span>START BUILDING</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Bottom subtle prompt */}
          <motion.div
            style={{ opacity: scrollPromptOpacity }}
            className="flex flex-col items-center gap-1 text-slate-400 font-mono text-[10px] tracking-widest mt-3"
          >
            <span>SCROLL TO EXPLORE MISSION</span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce text-crew-blue" />
          </motion.div>
        </motion.div>

        {/* ================================================== */}
        {/* SECTION 02 — THE PROBLEM (Scroll 0.28 to 0.58) */}
        {/* ================================================== */}
        <motion.div
          style={{ opacity: problemOpacity, y: problemY }}
          className="absolute inset-0 flex flex-col items-center justify-end text-center px-4 sm:px-6 pb-6 sm:pb-8 pointer-events-none z-20"
        >
          <div className="max-w-5xl w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 backdrop-blur-xl border border-red-500/30 text-red-400 text-[11px] font-mono tracking-widest uppercase mb-2 shadow-[0_0_20px_rgba(239,68,68,0.25)]">
              <AlertTriangle className="w-3.5 h-3.5" />
              THE PROBLEM
            </div>

            <h2 className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight mb-1.5 drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
              AI IS EVERYWHERE.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-300 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                THE WORKFLOW ISN&apos;T.
              </span>
            </h2>

            <p className="text-slate-300 font-sans text-xs sm:text-sm max-w-xl mx-auto mb-3 leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              Scattered across chats, tabs, and tools — you still have to coordinate every step.
            </p>

            {/* 4 Glassmorphic Problem Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-left mb-3 pointer-events-auto">
              <div className="p-3 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 hover:border-red-500/30 transition-colors shadow-lg">
                <span className="text-xs font-mono font-bold text-red-400 block mb-1">
                  &ldquo;One task at a time.&rdquo;
                </span>
                <p className="text-xs text-slate-300 font-sans leading-snug">
                  AI tools wait for the next prompt instead of continuing the mission.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 hover:border-amber-500/30 transition-colors shadow-lg">
                <span className="text-xs font-mono font-bold text-amber-400 block mb-1">
                  &ldquo;Disconnected tools.&rdquo;
                </span>
                <p className="text-xs text-slate-300 font-sans leading-snug">
                  Research, coding, design, and testing live in different places.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 hover:border-crew-blue/30 transition-colors shadow-lg">
                <span className="text-xs font-mono font-bold text-crew-blue block mb-1">
                  &ldquo;Zero visibility.&rdquo;
                </span>
                <p className="text-xs text-slate-300 font-sans leading-snug">
                  Hard to know what is running, what is blocked, or needs attention.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 hover:border-purple-500/30 transition-colors shadow-lg">
                <span className="text-xs font-mono font-bold text-purple-400 block mb-1">
                  &ldquo;Uncontrolled actions.&rdquo;
                </span>
                <p className="text-xs text-slate-300 font-sans leading-snug">
                  Giving AI access without clear permissions creates risk.
                </p>
              </div>
            </div>

            <div className="inline-block px-3.5 py-1 rounded-full bg-[#0B0E14]/80 backdrop-blur-md border border-crew-border font-mono text-[11px] text-white">
              Ultron turns scattered AI tools into <span className="text-crew-blue font-bold">one coordinated workforce</span>.
            </div>
          </div>
        </motion.div>

        {/* ================================================== */}
        {/* SECTION 04 — AUTONOMOUS EXECUTION (Scroll 0.64 to 0.94) */}
        {/* ================================================== */}
        <motion.div
          style={{ opacity: execOpacity, y: execY }}
          className="absolute inset-0 flex flex-col items-center justify-end text-center px-4 sm:px-6 pb-6 sm:pb-8 pointer-events-none z-20"
        >
          <div className="max-w-5xl w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crew-blue/10 backdrop-blur-xl border border-crew-blue/40 text-crew-blue text-[11px] font-mono tracking-widest uppercase mb-2 shadow-neon-blue">
              <Workflow className="w-3.5 h-3.5" />
              AUTONOMOUS EXECUTION
            </div>

            <h2 className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight mb-1.5 drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
              YOU GIVE THE OUTCOME.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-crew-blue via-sky-300 to-crew-purple drop-shadow-[0_0_30px_rgba(56,189,248,0.6)]">
                THE CREW RUNS THE MISSION.
              </span>
            </h2>

            <p className="text-slate-300 font-sans text-xs sm:text-sm max-w-xl mx-auto mb-3 leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              Converts a single brief into tasks executed across specialized agents.
            </p>

            {/* 6 Story Steps in Glassmorphism */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-left mb-3 pointer-events-auto">
              <div className="p-2.5 sm:p-3 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-crew-blue/30 shadow-md">
                <span className="text-[10px] font-mono text-crew-blue font-bold block">01 // BRIEF</span>
                <span className="text-xs font-display font-bold text-white block mt-0.5">
                  &ldquo;Build a landing page.&rdquo;
                </span>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 shadow-md">
                <span className="text-[10px] font-mono text-slate-400 font-bold block">02 // PLAN</span>
                <span className="text-xs text-slate-300 font-sans block mt-0.5">
                  Lead creates the plan.
                </span>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 shadow-md">
                <span className="text-[10px] font-mono text-slate-400 font-bold block">03 // DELEGATE</span>
                <span className="text-xs text-slate-300 font-sans block mt-0.5">
                  Agents receive work.
                </span>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 shadow-md">
                <span className="text-[10px] font-mono text-slate-400 font-bold block">04 // EXECUTE</span>
                <span className="text-xs text-slate-300 font-sans block mt-0.5">
                  Runs in background.
                </span>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 shadow-md">
                <span className="text-[10px] font-mono text-slate-400 font-bold block">05 // VERIFY</span>
                <span className="text-xs text-slate-300 font-sans block mt-0.5">
                  Outputs checked first.
                </span>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-emerald-500/30 shadow-md">
                <span className="text-[10px] font-mono text-emerald-400 font-bold block">06 // SHIP</span>
                <span className="text-xs text-slate-200 font-sans block mt-0.5">
                  Assembled into result.
                </span>
              </div>
            </div>

            <div className="inline-block px-3.5 py-1 rounded-full bg-[#0B0E14]/80 backdrop-blur-md border border-crew-border font-mono text-[11px] text-slate-300">
              Your laptop can close. <span className="text-crew-blue font-bold">The mission doesn&apos;t have to.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
