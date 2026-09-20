"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ArrowRight,
  Menu,
  X,
  Cpu,
  ShieldCheck,
  Zap,
  Terminal,
  Layers,
  Sparkles,
  FileCode2,
  Lock,
  Workflow,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ShinyButton from "@/components/ui/shiny-button";

interface NavItem {
  key: string;
  label: string;
  hasDropdown: boolean;
  href?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "WORKFORCE", label: "WORKFORCE", hasDropdown: true, href: "#roster" },
  { key: "HOW_IT_WORKS", label: "HOW IT WORKS", hasDropdown: true, href: "#zones" },
  { key: "CONTROL", label: "CONTROL", hasDropdown: true, href: "#server-lounge" },
  { key: "ARCHITECTURE", label: "ARCHITECTURE", hasDropdown: true, href: "#architecture" },
  { key: "DEVELOPERS", label: "DEVELOPERS", hasDropdown: false, href: "#cta" },
];

const AGENTS = [
  {
    title: "Lead Agent",
    role: "Plans the mission and coordinates the crew.",
    tag: "DAG & CONSENSUS",
    href: "#roster",
    icon: Cpu,
    accent: "text-crew-blue",
  },
  {
    title: "Engineering Agent",
    role: "Builds and changes the product with full-stack code.",
    tag: "CODE & REFACTOR",
    href: "#roster",
    icon: FileCode2,
    accent: "text-crew-purple",
  },
  {
    title: "Design Agent",
    role: "Creates interfaces, design tokens and visual systems.",
    tag: "FIGMA & TOKENS",
    href: "#roster",
    icon: Sparkles,
    accent: "text-crew-purple",
  },
  {
    title: "Research Agent",
    role: "Finds information, compares sources and indexes knowledge.",
    tag: "OPENSEARCH & RAG",
    href: "#roster",
    icon: Layers,
    accent: "text-crew-blue",
  },
  {
    title: "Reviewer Agent",
    role: "Checks quality, correctness, and Cedar security policies.",
    tag: "CEDAR AUDIT",
    href: "#roster",
    icon: ShieldCheck,
    accent: "text-emerald-400",
  },
  {
    title: "Marketing Agent",
    role: "Turns finished work into launch-ready messaging and docs.",
    tag: "CHANGELOG & LAUNCH",
    href: "#roster",
    icon: Terminal,
    accent: "text-crew-amber",
  },
];

const STEPS = [
  { num: "01", title: "BRIEF", desc: "User defines outcome and financial ceiling." },
  { num: "02", title: "PLAN", desc: "Lead Agent creates AST execution plan and DAG." },
  { num: "03", title: "DELEGATE", desc: "Specialists receive prioritized contract tasks." },
  { num: "04", title: "EXECUTE", desc: "Parallel microVM execution in background." },
  { num: "05", title: "VERIFY", desc: "Outputs checked against tests and Cedar rules." },
  { num: "06", title: "SHIP", desc: "Finished result deployed to production." },
];

const CONTROLS = [
  {
    title: "Cedar Permission Boundaries",
    desc: "Every agent operates inside a strictly authorized scope. Zero unauthorized access or dangerous actions.",
    tag: "AWS CEDAR",
    accent: "text-crew-blue",
  },
  {
    title: "Hard Mission Budget Limit",
    desc: "Set a $5.00 limit with real-time token tracking. Automated circuit breaker prevents runaway billing.",
    tag: "$5.00 CAP",
    accent: "text-crew-amber",
  },
  {
    title: "Human Approval Checkpoints",
    desc: "When actions cross sensitive boundaries (e.g. production deploy), workflow pauses for your sign-off.",
    tag: "HUMAN GATE",
    accent: "text-purple-400",
  },
];

const ARCHITECTURE_ZONES = [
  {
    number: "01",
    title: "The Living Office",
    desc: "Watch the work happen with live agent state tracking across all pods.",
    href: "#zones",
    tag: "LIVE WORKSPACE",
  },
  {
    number: "02",
    title: "Verification & Quality",
    desc: "Task contracts, automated regressions, and cryptographic audits.",
    href: "#design-qa",
    tag: "CEDAR POLICIES",
  },
  {
    number: "03",
    title: "Controlled Autonomy & Budgets",
    desc: "Hard budget limits, idle power-down, and microVM sandboxes.",
    href: "#server-lounge",
    tag: "BUDGET METER",
  },
  {
    number: "04",
    title: "AWS Architecture Pipeline",
    desc: "Amazon Bedrock, OpenSearch, ECS Fargate, Lambda, and DynamoDB.",
    href: "#architecture",
    tag: "AWS CLOUD",
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (
    pathname?.startsWith("/office") ||
    pathname?.startsWith("/prototype") ||
    pathname?.startsWith("/airstream") ||
    pathname?.startsWith("/start")
  ) {
    return null;
  }

  const handleToggle = (key: string, hasDropdown: boolean, href?: string) => {
    if (!hasDropdown) {
      setActiveDropdown(null);
      if (href) {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }
    setActiveDropdown((prev) => (prev === key ? null : key));
  };

  const handleLinkClick = (href: string) => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleStartBuilding = () => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    window.location.href = "/start";
  };

  return (
    <header
      ref={navRef}
      className={cn(
        "fixed top-0 inset-x-0 z-[100] w-full transition-all duration-300 border-b",
        scrolled
          ? "bg-[#0B0E14]/75 backdrop-blur-2xl border-white/[0.12] shadow-[0_10px_30px_rgba(0,0,0,0.8)] py-2"
          : "bg-[#0B0E14]/40 backdrop-blur-xl border-white/[0.06] py-3"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand / Logo: Big Ultron Logo with glowing aura (No CREWDESK text) */}
        <a
          href="#hero"
          onClick={() => setActiveDropdown(null)}
          className="relative flex items-center group py-0.5"
        >
          <div className="absolute -inset-2 bg-red-600/25 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative h-10 sm:h-12 md:h-13 w-auto flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ultron-logo.png"
              alt="Ultron"
              className="h-9 sm:h-11 md:h-12 w-auto object-contain filter drop-shadow-[0_0_16px_rgba(239,68,68,0.7)] group-hover:drop-shadow-[0_0_24px_rgba(239,68,68,0.95)] group-hover:scale-105 transition-all duration-300"
            />
          </div>
        </a>

        {/* Clean Nav Links with On-Click Dropdowns (No Numbers, No Accidental Hover Popups) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {NAV_ITEMS.map((item) => {
            const isOpen = activeDropdown === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleToggle(item.key, item.hasDropdown, item.href)}
                className={cn(
                  "px-3.5 py-2 rounded-lg font-mono text-xs font-semibold tracking-wider transition-all duration-200 flex items-center gap-1.5",
                  isOpen
                    ? "bg-white/10 text-white shadow-inner"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                )}
              >
                <span>{item.label}</span>
                {item.hasDropdown && (
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 transition-transform duration-200 text-slate-400",
                      isOpen && "rotate-180 text-crew-blue"
                    )}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right CTA Button: Integrated ShinyButton */}
        <div className="hidden sm:flex items-center gap-3">
          <ShinyButton
            label="START BUILDING →"
            onClick={handleStartBuilding}
            fillColor="#0B0E14"
            accentColor="#38BDF8"
            accentSoftColor="#818CF8"
            cornerRadius={12}
            className="!py-2.5 !px-5 !text-xs !font-display !font-bold !tracking-wider !border-crew-blue/40 hover:!border-crew-blue shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)]"
          />
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-slate-300 hover:text-white p-2 rounded-lg bg-white/5 border border-white/10"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ================================================== */}
      {/* ON-CLICK DROPDOWN PANELS (Controlled, No Hover Issues) */}
      {/* ================================================== */}
      {activeDropdown && (
        <div className="hidden md:block absolute top-full inset-x-0 pt-3 px-6 pointer-events-none z-50">
          <div className="max-w-5xl mx-auto pointer-events-auto bg-[#0B0E14]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-6 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* 1. WORKFORCE DROPDOWN */}
            {activeDropdown === "WORKFORCE" && (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-crew-border/80 mb-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-crew-blue" />
                    <span className="font-mono text-xs font-bold text-white tracking-wider">
                      AUTONOMOUS AGENT ROSTER
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                    6 SPECIALISTS ONLINE
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {AGENTS.map((agent) => {
                    const Icon = agent.icon;
                    return (
                      <button
                        key={agent.title}
                        onClick={() => handleLinkClick(agent.href)}
                        className="group p-3 rounded-xl border border-crew-border/60 hover:border-crew-blue/60 bg-crew-surface/40 hover:bg-crew-surface transition-all text-left flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-display font-bold text-white group-hover:text-crew-blue transition-colors flex items-center gap-1.5">
                              <Icon className={cn("w-3.5 h-3.5", agent.accent)} />
                              {agent.title}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500 bg-crew-bg px-1.5 py-0.5 rounded border border-crew-border">
                              {agent.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-sans leading-snug">
                            {agent.role}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-crew-border/60 flex items-center justify-between">
                  <p className="text-xs font-mono text-slate-400">
                    They don&apos;t just answer.{" "}
                    <span className="text-crew-blue font-bold">They work together.</span>
                  </p>
                  <button
                    onClick={() => handleLinkClick("#roster")}
                    className="px-4 py-2 rounded-lg bg-crew-surface hover:bg-crew-elevated border border-crew-border hover:border-crew-blue text-xs font-mono text-white flex items-center gap-1.5 transition-all group"
                  >
                    <span>INSPECT FULL ROSTER</span>
                    <ArrowRight className="w-3.5 h-3.5 text-crew-blue group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* 2. HOW IT WORKS DROPDOWN */}
            {activeDropdown === "HOW_IT_WORKS" && (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-crew-border/80 mb-4">
                  <div className="flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-crew-blue" />
                    <span className="font-mono text-xs font-bold text-white tracking-wider">
                      AUTONOMOUS EXECUTION WORKFLOW
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    BRIEF → PLAN → EXECUTE → VERIFY → SHIP
                  </span>
                </div>

                <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">
                  {STEPS.map((step) => (
                    <div
                      key={step.num}
                      className="p-3 rounded-xl bg-crew-surface/40 border border-crew-border/60 text-left"
                    >
                      <span className="text-[10px] font-mono text-crew-blue font-bold block mb-1">
                        {step.num} // {step.title}
                      </span>
                      <p className="text-[11px] text-slate-300 font-sans leading-snug">
                        {step.desc}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-crew-border/60 flex items-center justify-between">
                  <p className="text-xs font-mono text-slate-400">
                    Your laptop can close.{" "}
                    <span className="text-crew-blue font-bold">The mission doesn&apos;t have to.</span>
                  </p>
                  <button
                    onClick={() => handleLinkClick("#zones")}
                    className="px-4 py-2 rounded-lg bg-crew-surface hover:bg-crew-elevated border border-crew-border hover:border-crew-blue text-xs font-mono text-white flex items-center gap-1.5 transition-all group"
                  >
                    <span>EXPLORE MISSION ZONES</span>
                    <ArrowRight className="w-3.5 h-3.5 text-crew-blue group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* 3. CONTROL DROPDOWN */}
            {activeDropdown === "CONTROL" && (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-crew-border/80 mb-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <span className="font-mono text-xs font-bold text-white tracking-wider">
                      GOVERNANCE, BUDGETS & HUMAN APPROVAL
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-500/40">
                    ZERO RUNAWAY RISK
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  {CONTROLS.map((ctrl, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-crew-surface/40 border border-crew-border/60 text-left flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-mono font-bold ${ctrl.accent}`}>
                            {ctrl.tag}
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-sm text-white mb-1.5">
                          {ctrl.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-sans leading-relaxed">
                          {ctrl.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-crew-border/60 flex items-center justify-between">
                  <p className="text-xs font-mono text-slate-400">
                    You don&apos;t supervise every step.{" "}
                    <span className="text-crew-blue font-bold">You approve the decisions that matter.</span>
                  </p>
                  <button
                    onClick={() => handleLinkClick("#server-lounge")}
                    className="px-4 py-2 rounded-lg bg-crew-surface hover:bg-crew-elevated border border-crew-border hover:border-crew-blue text-xs font-mono text-white flex items-center gap-1.5 transition-all group"
                  >
                    <span>VIEW CONTROL DECK</span>
                    <ArrowRight className="w-3.5 h-3.5 text-crew-blue group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* 4. ARCHITECTURE DROPDOWN */}
            {activeDropdown === "ARCHITECTURE" && (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-crew-border/80 mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-crew-amber" />
                    <span className="font-mono text-xs font-bold text-white tracking-wider">
                      ISOMETRIC OFFICE CUTAWAY & AWS PIPELINE
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    4 ZONES // AWS BEDROCK & CEDAR
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {ARCHITECTURE_ZONES.map((zone) => (
                    <button
                      key={zone.number}
                      onClick={() => handleLinkClick(zone.href)}
                      className="p-3.5 rounded-xl bg-crew-surface/40 hover:bg-crew-surface border border-crew-border/60 hover:border-crew-blue/60 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] text-crew-blue font-bold">
                          ZONE {zone.number}
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-crew-bg border border-crew-border text-slate-400">
                          {zone.tag}
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-xs text-white group-hover:text-crew-blue transition-colors mb-1">
                        {zone.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                        {zone.desc}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="pt-3 border-t border-crew-border/60 flex items-center justify-between">
                  <p className="text-xs font-mono text-slate-400">
                    Connecting agent reasoning, orchestration, permissions, and cloud execution.
                  </p>
                  <button
                    onClick={() => handleLinkClick("#architecture")}
                    className="px-4 py-2 rounded-lg bg-crew-surface hover:bg-crew-elevated border border-crew-border hover:border-crew-blue text-xs font-mono text-white flex items-center gap-1.5 transition-all group"
                  >
                    <span>VIEW FULL ARCHITECTURE</span>
                    <ArrowRight className="w-3.5 h-3.5 text-crew-blue group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer with Glassmorphism */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0B0E14]/95 backdrop-blur-2xl px-6 py-6 flex flex-col gap-3 font-mono text-sm max-h-[85vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-crew-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ultron-logo.png" alt="Ultron" className="h-8 w-auto object-contain" />
            <span className="text-[10px] font-mono text-emerald-400">6 AGENTS ONLINE</span>
          </div>

          <div className="flex flex-col gap-1 py-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => handleLinkClick(item.href || "#hero")}
                className="text-slate-300 hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/5 flex items-center justify-between tracking-wider text-xs text-left"
              >
                <span>{item.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            ))}
          </div>

          <div className="pt-2">
            <ShinyButton
              label="START BUILDING →"
              onClick={handleStartBuilding}
              fillColor="#0B0E14"
              accentColor="#38BDF8"
              accentSoftColor="#818CF8"
              cornerRadius={12}
              className="w-full !py-3 !text-xs !font-bold"
            />
          </div>
        </div>
      )}
    </header>
  );
}
