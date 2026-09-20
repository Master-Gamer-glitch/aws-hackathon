"use client";

import React, { useState } from "react";
import {
  Terminal,
  Cpu,
} from "lucide-react";

interface AgentProfile {
  id: string;
  name: string;
  codename: string;
  role: string;
  outfitBadge: string;
  accent: "blue" | "purple" | "amber" | "emerald";
  imageFallback: string;
  model: string;
  tools: string[];
  cedarScope: string;
  description: string;
  stats: {
    contractsCompleted: number;
    accuracy: string;
    avgLatency: string;
  };
}

const AGENTS: AgentProfile[] = [
  {
    id: "lead",
    name: "Lead",
    codename: "LEAD // 01",
    role: "Plans the mission and coordinates the crew.",
    outfitBadge: "3-Piece Charcoal Suit • Maroon Tie • Gold Chain",
    accent: "blue",
    imageFallback: "/sequence-1/frame-001.jpg",
    model: "Claude 3.5 Sonnet / AWS Bedrock",
    tools: ["DAG Compiler", "Task Decomposer", "Consensus Engine"],
    cedarScope: "Full Workspace Delegation & Policy Enforcement",
    description:
      "Plans the mission and coordinates the crew. Give Ultron an outcome, and the Lead Agent breaks it into work, assigns the right specialist, tracks progress and coordinates the team.",
    stats: {
      contractsCompleted: 1420,
      accuracy: "99.8%",
      avgLatency: "1.4s",
    },
  },
  {
    id: "engineer",
    name: "Engineer",
    codename: "ENGINEER // 02",
    role: "Builds and changes the product.",
    outfitBadge: "Headphones • Black Hoodie • Laptop with </> Badge",
    accent: "purple",
    imageFallback: "/sequence-1/frame-001.jpg",
    model: "Claude 3.5 Sonnet / AWS CodeWhisperer",
    tools: ["AST Parser", "Git Worktree", "TypeChecker", "TestRunner"],
    cedarScope: "Read/Write Codebases, Create Pull Requests",
    description:
      "Builds and changes the product. Writes high-performance, strictly typed full-stack code, generates unit tests, and adheres to repository conventions.",
    stats: {
      contractsCompleted: 4890,
      accuracy: "99.4%",
      avgLatency: "2.1s",
    },
  },
  {
    id: "designer",
    name: "Designer",
    codename: "DESIGNER // 03",
    role: "Creates interfaces, assets and visual systems.",
    outfitBadge: "Olive Jacket • Cargo Pants • Flask Badge & Tablet",
    accent: "purple",
    imageFallback: "/sequence-1/frame-001.jpg",
    model: "Midjourney API + GPT-4o Vision",
    tools: ["Figma REST API", "Tailwind Tokenizer", "Contrast Checker"],
    cedarScope: "Read/Write Stylesheets, Asset Repositories",
    description:
      "Creates interfaces, assets and visual systems. Enforces design tokens, generates glassmorphism styles, and audits visual hierarchy.",
    stats: {
      contractsCompleted: 1850,
      accuracy: "99.6%",
      avgLatency: "1.9s",
    },
  },
  {
    id: "researcher",
    name: "Researcher",
    codename: "RESEARCHER // 04",
    role: "Finds information, compares sources and prepares evidence.",
    outfitBadge: "Black Turtleneck • Cream Trench • iPad & Stylus",
    accent: "blue",
    imageFallback: "/sequence-1/frame-001.jpg",
    model: "Gemini 1.5 Pro / Amazon OpenSearch",
    tools: ["Web Scraper", "Vector DB", "ArXiv Indexer", "Graph Builder"],
    cedarScope: "Read External Sources, Write Knowledge Graphs",
    description:
      "Finds information, compares sources and prepares evidence. Ingests documentation, RFCs, and API schemas into high-dimensional vector memory.",
    stats: {
      contractsCompleted: 2310,
      accuracy: "99.9%",
      avgLatency: "0.8s",
    },
  },
  {
    id: "reviewer",
    name: "Reviewer",
    codename: "REVIEWER // 05",
    role: "Checks quality, correctness and completion.",
    outfitBadge: "Black Sweater • Glasses • Magnifying-Glass Badge",
    accent: "emerald",
    imageFallback: "/sequence-1/frame-001.jpg",
    model: "AWS Cedar Engine + Claude 3.5",
    tools: ["Cedar Validator", "Playwright", "Chaos Monkey", "Fuzz Engine"],
    cedarScope: "Gatekeeper: Block Deployments, Audit AST",
    description:
      "Checks quality, correctness and completion. Evaluates every diff against strict Cedar security policies, ensuring zero leaks and full test coverage.",
    stats: {
      contractsCompleted: 6120,
      accuracy: "100.0%",
      avgLatency: "0.4s",
    },
  },
  {
    id: "marketer",
    name: "Marketer",
    codename: "MARKETER // 06",
    role: "Turns finished work into launch-ready messaging.",
    outfitBadge: "Tan Blazer • Turtleneck • Megaphone Badge & Coffee",
    accent: "amber",
    imageFallback: "/sequence-1/frame-001.jpg",
    model: "Claude 3.5 Haiku",
    tools: ["Markdown Engine", "SEO Analyzer", "Changelog Compiler"],
    cedarScope: "Write Documentation, Release Notes, Social Diffs",
    description:
      "Turns finished work into launch-ready messaging. Crafts developer-first documentation, generates release notes from Git commits, and manages launch announcements.",
    stats: {
      contractsCompleted: 3410,
      accuracy: "99.7%",
      avgLatency: "1.1s",
    },
  },
];

export default function AgentRoster() {
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile>(AGENTS[0]);

  return (
    <section id="roster" className="relative py-28 bg-crew-bg overflow-hidden">
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-crew-blue/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-crew-purple/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-crew-surface/80 border border-crew-border text-slate-300 text-xs font-mono tracking-widest uppercase mb-3 shadow-[0_0_20px_rgba(56,189,248,0.15)]">
            <Cpu className="w-3.5 h-3.5 text-crew-blue" />
            MEET THE WORKFORCE
          </div>
          <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-white tracking-tight">
            SIX SPECIALISTS. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-crew-blue via-sky-300 to-crew-purple">
              ONE SHARED MISSION.
            </span>
          </h2>
          <p className="mt-4 text-slate-300 font-sans text-sm sm:text-base leading-relaxed">
            Give Ultron an outcome. The Lead Agent breaks it into work, assigns
            the right specialist, tracks progress and coordinates the team.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {AGENTS.map((agent) => {
            const isSelected = selectedAgent.id === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? "bg-crew-surface border-crew-blue shadow-neon-blue"
                    : "bg-crew-surface/60 border-crew-border/80 hover:border-slate-500 hover:bg-crew-surface"
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono tracking-wider text-slate-500 block mb-1">
                    {agent.codename}
                  </span>
                  <div className="font-display font-bold text-sm text-white truncate">
                    {agent.name}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? "bg-crew-blue animate-pulse" : "bg-slate-600"
                    }`}
                  />
                  <span className="text-[9px] font-mono text-slate-400 uppercase">
                    ACTIVE
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-crew-surface/90 border border-crew-border rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-md bg-crew-bg border border-crew-border font-mono text-xs text-crew-blue font-bold tracking-wider">
                    {selectedAgent.codename}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/40 font-mono text-xs text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE & READY
                  </span>
                </div>

                <h3 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                  {selectedAgent.name}
                </h3>
                <div className="text-sm font-mono text-crew-blue font-semibold mt-1">
                  {selectedAgent.role}
                </div>

                <p className="mt-4 text-slate-300 font-sans text-sm sm:text-base leading-relaxed">
                  {selectedAgent.description}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-crew-bg/70 border border-crew-border/80">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
                  CHARACTER ATTIRE & VISUAL BADGE
                </span>
                <span className="text-xs font-mono text-slate-200">
                  {selectedAgent.outfitBadge}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-crew-bg/50 border border-crew-border">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
                    FOUNDATION MODEL
                  </span>
                  <span className="text-xs font-mono text-crew-purple font-semibold">
                    {selectedAgent.model}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-crew-bg/50 border border-crew-border">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
                    CEDAR SECURITY BOUNDARY
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-semibold truncate block">
                    {selectedAgent.cedarScope}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-2">
                  REGISTERED EXECUTION TOOLS
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.tools.map((tool, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-crew-surface border border-crew-border text-xs font-mono text-slate-300 flex items-center gap-1.5"
                    >
                      <Terminal className="w-3 h-3 text-crew-blue" />
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full relative rounded-2xl bg-gradient-to-b from-crew-bg/80 to-crew-surface/90 border border-crew-border p-6 shadow-inner flex flex-col items-center justify-between">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-2 border-crew-border p-1 bg-crew-bg shadow-neon-blue mb-6">
                  <div
                    className="w-full h-full rounded-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${selectedAgent.imageFallback})`,
                      backgroundPosition: "center 20%",
                    }}
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-crew-bg/80 via-transparent to-transparent pointer-events-none" />
                </div>

                <div className="w-full grid grid-cols-3 gap-3 text-center border-t border-crew-border pt-4">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block">
                      CONTRACTS
                    </span>
                    <span className="text-base font-mono font-bold text-white">
                      {selectedAgent.stats.contractsCompleted}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block">
                      ACCURACY
                    </span>
                    <span className="text-base font-mono font-bold text-emerald-400">
                      {selectedAgent.stats.accuracy}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block">
                      AVG LATENCY
                    </span>
                    <span className="text-base font-mono font-bold text-crew-blue">
                      {selectedAgent.stats.avgLatency}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-block px-5 py-2.5 rounded-full bg-crew-surface/90 border border-crew-border/85 backdrop-blur-xl shadow-xl">
            <p className="font-mono text-xs sm:text-sm text-slate-300">
              They don&apos;t just answer.{" "}
              <span className="text-crew-blue font-bold">They work together.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
