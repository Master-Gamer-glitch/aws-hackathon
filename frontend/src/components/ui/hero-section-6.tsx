"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Server,
  UserCheck,
  CheckCircle2,
  Terminal,
  Database,
  Cloud,
} from "lucide-react";

interface PipelineStep {
  step: string;
  name: string;
  tech: string;
  role: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgColor: string;
}

const ARCHITECTURE_STEPS: PipelineStep[] = [
  {
    step: "01",
    name: "USER",
    tech: "CLI / Webhook / Console",
    role: "Defines mission outcome and budget ceiling",
    icon: <Terminal className="w-4 h-4 text-crew-blue" />,
    color: "text-crew-blue",
    borderColor: "border-crew-blue/40",
    bgColor: "bg-crew-blue/10",
  },
  {
    step: "02",
    name: "ULTRON",
    tech: "Control Plane // EventBridge",
    role: "Central event bus & workspace state manager",
    icon: <Database className="w-4 h-4 text-sky-400" />,
    color: "text-sky-400",
    borderColor: "border-sky-500/40",
    bgColor: "bg-sky-500/10",
  },
  {
    step: "03",
    name: "LEAD AGENT",
    tech: "Claude 3.5 Sonnet on AWS Bedrock",
    role: "Compiles DAG, allocates tokens, coordinates crew",
    icon: <Cpu className="w-4 h-4 text-purple-400" />,
    color: "text-purple-400",
    borderColor: "border-purple-500/40",
    bgColor: "bg-purple-500/10",
  },
  {
    step: "04",
    name: "TASK ORCHESTRATION",
    tech: "Amazon OpenSearch + Vector DB",
    role: "Knowledge synthesis and dependency resolution",
    icon: <Layers className="w-4 h-4 text-indigo-400" />,
    color: "text-indigo-400",
    borderColor: "border-indigo-500/40",
    bgColor: "bg-indigo-500/10",
  },
  {
    step: "05",
    name: "SPECIALIST AGENTS",
    tech: "5 Autonomous Execution Roles",
    role: "Engineer, Designer, Researcher, Reviewer, Marketer",
    icon: <Cpu className="w-4 h-4 text-amber-400" />,
    color: "text-amber-400",
    borderColor: "border-amber-500/40",
    bgColor: "bg-amber-500/10",
  },
  {
    step: "06",
    name: "CLOUD EXECUTION",
    tech: "AWS ECS Fargate & Firecracker",
    role: "Sub-second microVM sandboxes & Git worktrees",
    icon: <Server className="w-4 h-4 text-crew-blue" />,
    color: "text-crew-blue",
    borderColor: "border-crew-blue/40",
    bgColor: "bg-crew-blue/10",
  },
  {
    step: "07",
    name: "VERIFICATION",
    tech: "AWS Cedar Engine + Playwright",
    role: "Cryptographic policy gates & automated regressions",
    icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/40",
    bgColor: "bg-emerald-500/10",
  },
  {
    step: "08",
    name: "HUMAN CHECKPOINT",
    tech: "Cedar Human-in-the-Loop Gateway",
    role: "Pause workflow for high-risk approvals",
    icon: <UserCheck className="w-4 h-4 text-rose-400" />,
    color: "text-rose-400",
    borderColor: "border-rose-500/40",
    bgColor: "bg-rose-500/10",
  },
  {
    step: "09",
    name: "RESULT",
    tech: "Production Deployment",
    role: "Live code shipped, verified, and reported back",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-300" />,
    color: "text-emerald-300",
    borderColor: "border-emerald-400/40",
    bgColor: "bg-emerald-400/10",
  },
];

export default function HeroSection6() {
  return (
    <section id="architecture" className="relative py-28 bg-crew-bg overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/3 -left-48 w-96 h-96 bg-crew-blue/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-crew-surface/90 border border-crew-blue/40 text-crew-blue text-xs font-mono tracking-widest uppercase mb-3 shadow-neon-blue">
            <Cloud className="w-3.5 h-3.5" />
            BUILT FOR REAL EXECUTION
          </div>

          <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-none mb-4">
            FROM PROMPT <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-crew-blue via-sky-300 to-crew-purple">
              TO PRODUCTION.
            </span>
          </h2>

          <p className="text-slate-300 font-sans text-sm sm:text-base leading-relaxed">
            Ultron connects agent reasoning, orchestration, permissions, execution and verification into one workflow.
          </p>
        </div>

        {/* Visual Architecture Flowchart */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-12">
          {ARCHITECTURE_STEPS.map((node, index) => (
            <motion.div
              key={node.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="relative"
            >
              <div
                className={`h-full p-5 rounded-2xl bg-[#0B0E14]/85 backdrop-blur-2xl border ${node.borderColor} shadow-xl hover:border-slate-400 transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-slate-500 tracking-wider">
                      STEP {node.step}
                    </span>
                    <div className={`p-1.5 rounded-lg ${node.bgColor} border ${node.borderColor}`}>
                      {node.icon}
                    </div>
                  </div>

                  <h3 className={`font-display font-black text-lg ${node.color} tracking-tight mb-1`}>
                    {node.name}
                  </h3>

                  <div className="text-xs font-mono text-slate-300 mb-2 font-semibold">
                    {node.tech}
                  </div>

                  <p className="text-xs text-slate-400 font-sans leading-relaxed">
                    {node.role}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>AWS CLOUD NATIVE</span>
                  <span className={node.color}>VERIFIED</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Flow representation summary */}
        <div className="p-6 rounded-2xl bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 text-center max-w-4xl mx-auto shadow-2xl">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-3">
            EXECUTION PIPELINE TOPOLOGY
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs text-slate-300">
            <span className="px-2.5 py-1 rounded bg-crew-bg border border-crew-blue/40 text-crew-blue font-bold">USER</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-2.5 py-1 rounded bg-crew-bg border border-white/10 text-white">ULTRON</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-2.5 py-1 rounded bg-crew-bg border border-purple-500/40 text-purple-300">LEAD AGENT</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-2.5 py-1 rounded bg-crew-bg border border-indigo-500/40 text-indigo-300">ORCHESTRATION</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-2.5 py-1 rounded bg-crew-bg border border-amber-500/40 text-amber-300">SPECIALISTS</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-2.5 py-1 rounded bg-crew-bg border border-crew-blue/40 text-crew-blue">EXECUTION</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-2.5 py-1 rounded bg-crew-bg border border-emerald-500/40 text-emerald-300">VERIFICATION</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-2.5 py-1 rounded bg-crew-bg border border-rose-500/40 text-rose-300">CHECKPOINT</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-bold">RESULT</span>
          </div>
        </div>
      </div>
    </section>
  );
}
