"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Sparkles,
  ChevronDown,
  Target,
  Zap,
  Lock,
} from "lucide-react";

export default function ClosingCTA() {
  const [copied, setCopied] = useState(false);
  const cliCommand = "npx ultron@latest init --team full-stack --aws-region us-east-1";

  const handleCopy = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer id="cta" className="relative bg-crew-bg border-t border-crew-border overflow-hidden">
      {/* Cinematic backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none mix-blend-luminosity"
        style={{
          backgroundImage: `url(/sequence-1/frame-060.jpg)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-crew-bg via-crew-bg/95 to-crew-bg pointer-events-none" />

      {/* ================================================== */}
      {/* SECTION 12 — FINAL VALUE */}
      {/* ================================================== */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-crew-surface/90 border border-crew-blue/40 text-crew-blue text-xs font-mono tracking-widest uppercase mb-4 shadow-neon-blue">
            <Sparkles className="w-3.5 h-3.5" />
            THE FUTURE OF BUILDING
          </div>

          <h2 className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-white tracking-tight leading-none mb-6">
            STOP MANAGING <br />
            THE WORK. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-crew-blue via-sky-300 to-crew-purple">
              LET THE WORKFORCE RUN IT.
            </span>
          </h2>

          <p className="text-slate-300 font-sans text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Ultron gives builders an AI team that can coordinate, execute, verify and report back — without giving up control.
          </p>
        </div>

        {/* 3 Short Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-24">
          <div className="p-6 rounded-2xl bg-[#0B0E14]/80 backdrop-blur-xl border border-crew-blue/30 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-crew-blue/10 border border-crew-blue/30 flex items-center justify-center mb-4">
              <Target className="w-5 h-5 text-crew-blue" />
            </div>
            <h3 className="font-display font-bold text-xl text-white mb-2">PLAN</h3>
            <p className="text-sm text-slate-300 font-sans leading-relaxed">
              Turn outcomes into executable missions. The Lead Agent compiles dependency graphs and sets verification milestones.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0B0E14]/80 backdrop-blur-xl border border-purple-500/30 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-display font-bold text-xl text-white mb-2">EXECUTE</h3>
            <p className="text-sm text-slate-300 font-sans leading-relaxed">
              Let specialized agents do the work. Engineering, Design, Research, QA and Marketing work in parallel backgrounds.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0B0E14]/80 backdrop-blur-xl border border-emerald-500/30 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-display font-bold text-xl text-white mb-2">CONTROL</h3>
            <p className="text-sm text-slate-300 font-sans leading-relaxed">
              Keep permissions, budgets and approvals in your hands. Formal Cedar policies and hard budget limits protect your systems.
            </p>
          </div>
        </div>

        {/* ================================================== */}
        {/* FINAL CTA */}
        {/* ================================================== */}
        <div className="max-w-4xl mx-auto text-center p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-[#0B0E14]/90 to-crew-surface/90 border border-crew-blue/40 shadow-bloom backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-crew-blue via-crew-purple to-crew-amber" />

          <h2 className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-white tracking-tight leading-none mb-3">
            GIVE AI THE WORK. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-300">
              KEEP THE CONTROL.
            </span>
          </h2>

          <p className="text-slate-200 font-sans text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Build with a coordinated AI workforce that works in the background, respects its boundaries and brings you in when your decision matters.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a
              href="/start"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-crew-blue via-sky-400 to-crew-purple text-crew-bg font-display font-bold text-sm tracking-wider shadow-neon-blue hover:brightness-110 transition-all flex items-center justify-center gap-2 group"
            >
              <span>START BUILDING</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>

            <a
              href="#roster"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-[#0B0E14]/80 hover:bg-[#0B0E14] border border-crew-border hover:border-slate-400 text-slate-300 hover:text-white font-mono text-xs tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <span>EXPLORE THE CREW</span>
              <ChevronDown className="w-4 h-4 text-crew-blue" />
            </a>
          </div>

          {/* Quick CLI Launcher */}
          <div className="max-w-xl mx-auto bg-crew-bg/90 border border-crew-border rounded-xl p-3 sm:p-4 backdrop-blur-xl shadow-inner flex items-center justify-between gap-4 font-mono text-xs sm:text-sm">
            <div className="flex items-center gap-3 overflow-x-auto text-slate-300 select-all">
              <span className="text-crew-blue font-bold">$</span>
              <span className="whitespace-nowrap">{cliCommand}</span>
            </div>

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-crew-surface border border-crew-border hover:border-crew-blue text-slate-300 hover:text-white transition-all flex items-center gap-1.5 shrink-0"
              aria-label="Copy CLI command"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    COPIED
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px]">COPY</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-8 text-xs font-mono text-slate-400">
            Ultron — Autonomous Control Plane for AI Work.
          </div>
        </div>
      </div>

      {/* Footer Nav & Copyright */}
      <div className="relative z-10 border-t border-crew-border/60 max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-mono text-slate-500">
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-white tracking-widest text-sm">
            ULTRON
          </span>
          <span className="text-slate-600">|</span>
          <span>© 2026 Ultron Systems Inc. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#hero" className="hover:text-slate-300 transition-colors">
            Hero
          </a>
          <a href="#zones" className="hover:text-slate-300 transition-colors">
            Living Office
          </a>
          <a href="#climax" className="hover:text-slate-300 transition-colors">
            Command Hub
          </a>
          <a href="#roster" className="hover:text-slate-300 transition-colors">
            The Crew
          </a>
          <a href="#architecture" className="hover:text-slate-300 transition-colors">
            Architecture
          </a>
          <a
            href="https://aws.amazon.com/bedrock/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 transition-colors flex items-center gap-1"
          >
            AWS Bedrock <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
