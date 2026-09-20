"use client";

import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  CheckCircle2,
  Zap,
} from "lucide-react";

export interface ZoneFeatureBullet {
  title: string;
  desc: string;
  tag?: string;
}

export interface ZoneRevealProps {
  id: string;
  sequencePath: string;
  zoneNumber: string;
  zoneLabel: string;
  eyebrow?: string;
  subtitle: string;
  featureBullets: ZoneFeatureBullet[];
  accentColor: "blue" | "purple" | "amber";
  fallbackStartImage?: string;
  fallbackEndImage?: string;
  bottomStatement?: string;
}

export default function ZoneReveal({
  id,
  sequencePath,
  zoneNumber,
  zoneLabel,
  eyebrow,
  subtitle,
  featureBullets,
  accentColor,
  fallbackStartImage = "/sequence-1/frame-030.jpg",
  fallbackEndImage = "/sequence-1/frame-060.jpg",
  bottomStatement,
}: ZoneRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const { images } = useImagePreloader(sequencePath, 2, {
    customFiles: ["frame-001.jpg", "frame-002.jpg"],
  });

  // Hardware-composited crossfade & subtle scale (zero React re-renders while scrolling)
  const crossfade = useTransform(scrollYProgress, [0, 0.65], [0, 1]);
  const img1Opacity = useTransform(crossfade, [0, 1], [1, 0]);
  const img2Opacity = useTransform(crossfade, [0, 1], [0, 1]);
  const scale1 = useTransform(scrollYProgress, [0, 1], [0.88, 0.92]);
  const scale2 = useTransform(scrollYProgress, [0, 1], [0.92, 0.88]);

  // Threshold-only trigger for cards
  const [showCards, setShowCards] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const shouldShow = latest > 0.35;
    setShowCards((prev) => (prev !== shouldShow ? shouldShow : prev));
  });

  const springTransition = {
    type: "spring",
    stiffness: 120,
    damping: 14,
  };

  const accentStyles = {
    blue: {
      text: "text-crew-blue",
      border: "border-crew-blue/40",
      bg: "bg-crew-blue/10",
      shadow: "shadow-neon-blue",
      chip: "border-crew-blue/40 text-crew-blue",
      glow: "#38BDF8",
    },
    purple: {
      text: "text-crew-purple",
      border: "border-crew-purple/40",
      bg: "bg-crew-purple/10",
      shadow: "shadow-neon-purple",
      chip: "border-crew-purple/40 text-crew-purple",
      glow: "#A78BFA",
    },
    amber: {
      text: "text-crew-amber",
      border: "border-crew-amber/40",
      bg: "bg-crew-amber/10",
      shadow: "shadow-neon-amber",
      chip: "border-crew-amber/40 text-crew-amber",
      glow: "#F59E0B",
    },
  }[accentColor];

  return (
    <section
      id={id}
      ref={containerRef}
      className="relative h-[300vh] bg-crew-bg"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {/* Base Frame */}
          <motion.div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${images[0]?.src || fallbackStartImage})`,
              opacity: prefersReducedMotion ? 0 : img1Opacity,
              scale: scale1,
            }}
          />

          {/* Target Frame */}
          <motion.div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${images[1]?.src || fallbackEndImage})`,
              opacity: prefersReducedMotion ? 1 : img2Opacity,
              scale: scale2,
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-crew-bg via-crew-bg/40 to-crew-bg/80 pointer-events-none" />
          <div className="absolute inset-0 bg-radial-vignette opacity-70 pointer-events-none" />
        </div>

        <div className="absolute top-20 inset-x-0 z-10 flex flex-col items-center text-center px-6 pointer-events-none">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-crew-surface/90 border ${accentStyles.chip} text-xs font-mono tracking-widest uppercase mb-2 ${accentStyles.shadow}`}
          >
            <Zap className="w-3.5 h-3.5" />
            {eyebrow || `ZONE ${zoneNumber} // ARCHITECTURE`}
          </div>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-none">
            {zoneLabel}
          </h2>
          <p className="mt-1 text-slate-300 font-sans text-xs sm:text-sm max-w-xl">
            {subtitle}
          </p>
        </div>

        <div className="relative z-20 w-full max-w-6xl px-6 flex flex-col items-center pointer-events-none mt-16">
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
            {featureBullets.map((bullet, index) => {
              const xInitial = index === 0 ? -180 : index === 2 ? 180 : 0;
              const yInitial = index === 1 ? 160 : 0;

              return (
                <motion.div
                  key={index}
                  initial={{ x: xInitial, y: yInitial, opacity: 0 }}
                  animate={
                    showCards
                      ? { x: 0, y: 0, opacity: 1 }
                      : { x: xInitial, y: yInitial, opacity: 0 }
                  }
                  transition={{
                    ...springTransition,
                    delay: index * 0.14,
                  }}
                  className="pointer-events-auto"
                >
                  <div
                    className={`bg-crew-surface/90 backdrop-blur-xl border ${accentStyles.border} rounded-xl p-5 ${accentStyles.shadow} transition-all duration-300 hover:scale-[1.02]`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-xs font-mono font-bold ${accentStyles.text} tracking-wider`}
                      >
                        FEATURE 0{index + 1}
                      </span>
                      {bullet.tag && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-crew-bg border border-crew-border text-slate-400">
                          {bullet.tag}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-base text-white mb-2">
                      {bullet.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {bullet.desc}
                    </p>
                    <div className="mt-4 pt-3 border-t border-crew-border/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${accentStyles.text}`} />
                        Verified Sub-Routine
                      </span>
                      <span className="text-slate-500">REAL-TIME</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {bottomStatement && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={
                showCards
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 30 }
              }
              transition={{ ...springTransition, delay: 0.45 }}
              className="mt-8 px-5 py-2.5 rounded-full bg-[#0B0E14]/85 backdrop-blur-xl border border-white/10 shadow-xl pointer-events-auto"
            >
              <p className="font-mono text-xs sm:text-sm text-slate-200 text-center">
                {bottomStatement}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
