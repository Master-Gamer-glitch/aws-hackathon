"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Folder,
  Plus,
  ArrowRight,
  Shield,
  Sun,
  Moon,
  Check,
  Cpu,
  Terminal as TerminalIcon,
  Sparkles,
  Layers,
  ChevronRight,
  Lock,
  Boxes,
  Zap,
} from "lucide-react";

interface WorkspaceConfig {
  id: string;
  name: string;
  path: string;
  isCurrent?: boolean;
  status?: "active" | "synced" | "standby";
  agentsCount?: number;
}

export default function StartPage() {
  const router = useRouter();

  // Screen View:
  // 'picker' = "ULTRON WORKSPACE SELECTOR"
  // 'signin' = "Sign in to Ultron"
  // 'wizard-1' = Name your workspace
  // 'wizard-2' = Meet Ultron — Supreme Orchestrator
  // 'wizard-3' = Confirmation & launch
  const [view, setView] = useState<"picker" | "signin" | "wizard-1" | "wizard-2" | "wizard-3">("picker");

  // Harness / Workspace Configs
  const [currentConfig, setCurrentConfig] = useState<WorkspaceConfig>({
    id: "careflow",
    name: "CareFlow",
    path: "Users/codesmoker/CareFlow/",
    isCurrent: true,
    status: "active",
    agentsCount: 6,
  });

  const [recentConfigs, setRecentConfigs] = useState<WorkspaceConfig[]>([
    {
      id: "fitsura",
      name: "Fitsura",
      path: "Users/codesmoker/projects/Fitsura/",
      status: "synced",
      agentsCount: 4,
    },
    {
      id: "harness-agents",
      name: "HarnessAgents",
      path: "Users/codesmoker/HarnessAgents/",
      status: "standby",
      agentsCount: 3,
    },
    {
      id: "sehatnxt",
      name: "SehatNxt-dev",
      path: "Users/codesmoker/projects/SehatNxt-dev/",
      status: "synced",
      agentsCount: 5,
    },
  ]);

  // Wizard form state
  const [email, setEmail] = useState("");
  const [workspaceName, setWorkspaceName] = useState("Ultron Swarm Core");
  const [folderPath, setFolderPath] = useState("~/workspace/ultron");
  const [audience, setAudience] = useState<"technical" | "non-technical">("technical");
  const [orchestratorName, setOrchestratorName] = useState("Ultron");
  const [engine, setEngine] = useState("Ultron Swarm Core (Claude 3.7 Sonnet)");
  const [model, setModel] = useState("Claude 3.7 Sonnet (Hybrid Reasoning)");

  const [isDark, setIsDark] = useState(true);
  const [isOpening, setIsOpening] = useState<string | null>(null);

  // Load saved workspace on mount
  useEffect(() => {
    try {
      const savedName = localStorage.getItem("ultron-workspace-name");
      const savedPath = localStorage.getItem("ultron-folder-path");
      if (savedName) {
        setCurrentConfig({
          id: savedName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          name: savedName,
          path: savedPath || "Users/codesmoker/workspace/",
          isCurrent: true,
          status: "active",
          agentsCount: 6,
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleOpenConfig = (config: WorkspaceConfig) => {
    setIsOpening(config.id);
    try {
      localStorage.setItem("ultron-workspace-name", config.name);
      localStorage.setItem("ultron-folder-path", config.path);
      localStorage.setItem("ultron-orchestrator-name", "Ultron");
      localStorage.removeItem("ultron-closed");
      sessionStorage.setItem("ultron-session-opened", "true");
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      router.push("/office");
    }, 350);
  };

  const handleFinishWizard = () => {
    try {
      localStorage.setItem("ultron-workspace-name", workspaceName);
      localStorage.setItem("ultron-folder-path", folderPath);
      localStorage.setItem("ultron-audience", audience);
      localStorage.setItem("ultron-orchestrator-name", orchestratorName);
      localStorage.setItem("ultron-orchestrator-engine", engine);
      localStorage.setItem("ultron-orchestrator-model", model);
      localStorage.removeItem("ultron-closed");
      sessionStorage.setItem("ultron-session-opened", "true");
    } catch {
      /* ignore */
    }
    router.push("/office");
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-200 select-none ${
        isDark ? "bg-[#0A0D14] text-[#E6EDF3]" : "bg-[#F3F5F9] text-[#1E232A]"
      }`}
      style={{
        backgroundImage: isDark
          ? "radial-gradient(circle at 50% 0%, rgba(220, 38, 38, 0.12) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.08) 0%, transparent 50%)"
          : "radial-gradient(circle at 50% 0%, rgba(220, 38, 38, 0.05) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.05) 0%, transparent 50%)",
      }}
    >
      {/* Sleek Ultron Top Bar */}
      <header
        className={`h-12 px-4 sm:px-6 border-b flex items-center justify-between text-xs font-mono shrink-0 z-30 ${
          isDark
            ? "bg-[#0E121B]/90 border-slate-800/80 backdrop-blur-md text-slate-300"
            : "bg-white/90 border-slate-200 backdrop-blur-md text-slate-700"
        }`}
      >
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ultron-logo.png"
              alt="Ultron"
              className="h-6 w-auto object-contain transition-transform duration-150 group-hover:scale-105"
            />
            <span className="font-bold tracking-wider text-sm bg-gradient-to-r from-red-500 via-rose-500 to-cyan-400 bg-clip-text text-transparent">
              ULTRON
            </span>
          </Link>

          <div className="h-4 w-px bg-slate-700/50 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500 font-semibold uppercase tracking-wider">SWARM CONTROL</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">v3.2 Autonomous Mesh</span>
          </div>
        </div>

        {/* Right Navigation & Controls */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            className={`p-1.5 rounded-lg border transition-all ${
              isDark
                ? "bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                : "bg-slate-100 border-slate-300 text-slate-700 hover:text-black hover:bg-slate-200"
            }`}
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <Link
            href="/"
            className="hover:text-cyan-400 transition-colors hidden md:inline"
          >
            Landing Page
          </Link>

          {view !== "signin" && (
            <button
              onClick={() => setView("signin")}
              className="px-3 py-1 rounded-lg border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 transition-colors font-semibold"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        {/* ============================================================ */}
        {/* 1. ULTRON WORKSPACE SELECTOR (Returning User Screen) */}
        {/* ============================================================ */}
        {view === "picker" && (
          <div className="w-full max-w-[620px] animate-in fade-in duration-200">
            {/* Header Badge & Title */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10.5px] font-mono font-bold tracking-widest uppercase mb-2 border border-red-500/30 bg-red-500/10 text-red-400">
                <Boxes className="w-3 h-3" />
                <span>ULTRON CONTROL PLANE</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight font-display">
                SELECT A WORKSPACE CONFIG
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto leading-relaxed font-sans">
                Each workspace isolates agent memory, task DAGs, Cedar policies, and execution history.
              </p>
            </div>

            {/* Modern High-Tech Card */}
            <div
              className={`rounded-2xl border shadow-2xl p-5 sm:p-7 space-y-5 transition-all ${
                isDark
                  ? "bg-[#10141E]/95 border-slate-800/80 backdrop-blur-xl text-slate-200"
                  : "bg-white/95 border-slate-200 backdrop-blur-xl text-slate-800"
              }`}
            >
              {/* CURRENT Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>CURRENT ACTIVE WORKSPACE</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                    {currentConfig.agentsCount || 6} AGENTS ONLINE
                  </span>
                </div>

                <div
                  className={`p-4 rounded-xl border flex items-center gap-3.5 transition-all ${
                    isDark
                      ? "bg-gradient-to-r from-[#0B1E19] to-[#0D1520] border-emerald-500/40 text-emerald-50 shadow-lg shadow-emerald-950/20"
                      : "bg-gradient-to-r from-emerald-50 to-teal-50/50 border-emerald-300 text-emerald-950"
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <Folder className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm font-mono tracking-tight flex items-center gap-2">
                      <span className="truncate">{currentConfig.name}</span>
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-medium">PRIMARY</span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-400/80 truncate mt-0.5">
                      {currentConfig.path}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenConfig(currentConfig)}
                    disabled={!!isOpening}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold tracking-wider transition-all shadow-md shadow-emerald-600/30 active:scale-95 cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>{isOpening === currentConfig.id ? "OPENING…" : "OPEN"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* RECENT Section */}
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3 h-3" />
                  <span>RECENT WORKSPACES</span>
                </div>

                <div className="space-y-2">
                  {recentConfigs.map((cfg) => (
                    <div
                      key={cfg.id}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                        isDark
                          ? "bg-[#141926] border-slate-800/80 hover:border-cyan-500/40 hover:bg-[#182030]"
                          : "bg-slate-50 border-slate-200 hover:border-cyan-500/50 hover:bg-white"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-800/40 border border-slate-700/50 flex items-center justify-center text-slate-400 shrink-0">
                        <Folder className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs font-mono flex items-center gap-2">
                          <span className="truncate">{cfg.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {cfg.status?.toUpperCase() || "SYNCED"}
                          </span>
                        </div>
                        <div className="text-[10.5px] font-mono text-slate-400 truncate">
                          {cfg.path}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenConfig(cfg)}
                        disabled={!!isOpening}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-cyan-400 hover:text-cyan-400 font-mono text-xs transition-colors cursor-pointer shrink-0"
                      >
                        {isOpening === cfg.id ? "opening…" : "switch →"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs border-t border-slate-800/50">
                <button
                  type="button"
                  onClick={() => {
                    const chosen = prompt("Enter directory path:", "~/workspace/project");
                    if (chosen) {
                      handleOpenConfig({
                        id: "custom-" + Date.now(),
                        name: chosen.split("/").filter(Boolean).pop() || "Workspace",
                        path: chosen,
                      });
                    }
                  }}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    isDark
                      ? "bg-slate-800/40 border-slate-700 hover:bg-slate-800 text-slate-300"
                      : "bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <Folder className="w-4 h-4 text-slate-400" />
                  <span>Open existing config...</span>
                </button>

                <button
                  type="button"
                  onClick={() => setView("wizard-1")}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-red-600/20 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create new config...</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. SIGN IN TO USE IT FREE */}
        {/* ============================================================ */}
        {view === "signin" && (
          <div className="w-full max-w-md flex flex-col items-center animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-cyan-500 p-0.5 mb-3 shadow-lg shadow-red-500/20">
              <div className="w-full h-full bg-[#0A0D14] rounded-2xl flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ultron-logo.png" alt="Ultron" className="h-7 w-auto object-contain" />
              </div>
            </div>

            <h1 className="font-display font-black text-2xl sm:text-3xl text-center tracking-tight mb-1">
              Sign in to Ultron
            </h1>
            <p className="text-xs sm:text-sm text-center text-slate-400 mb-6 max-w-sm">
              Connect your developer credentials to unlock persistent agent memory and swarm synchronization.
            </p>

            <div
              className={`w-full rounded-2xl border shadow-2xl p-6 sm:p-8 font-sans ${
                isDark
                  ? "bg-[#10141E]/95 border-slate-800/80 backdrop-blur-xl"
                  : "bg-white border-slate-200 shadow-xl"
              }`}
            >
              {/* Google Button */}
              <button
                type="button"
                onClick={() => setView("picker")}
                className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-3 transition-all hover:shadow-sm active:scale-[0.99] cursor-pointer ${
                  isDark
                    ? "bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-white"
                    : "bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-800"
                }`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center my-5">
                <div className="flex-1 h-px bg-slate-700/50" />
                <span className="px-3 text-[11px] text-slate-500 font-mono">or</span>
                <div className="flex-1 h-px bg-slate-700/50" />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setView("picker");
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-mono font-semibold mb-1.5 text-slate-400">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="operator@ultron.internal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40 font-mono ${
                      isDark
                        ? "bg-[#0A0D14] border-slate-700 text-white placeholder-slate-600"
                        : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/20 active:scale-[0.99]"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-800/60 text-center space-y-3 text-xs">
                <button
                  type="button"
                  onClick={() => setView("picker")}
                  className="text-xs text-cyan-400 hover:underline font-mono"
                >
                  ← Back to workspace selector
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-mono">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Secured with AWS Cedar Policies</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. WIZARD STEP 1: NAME WORKSPACE */}
        {/* ============================================================ */}
        {view === "wizard-1" && (
          <div
            className={`w-full max-w-xl rounded-2xl border shadow-2xl p-6 sm:p-8 font-sans animate-in fade-in duration-200 ${
              isDark
                ? "bg-[#10141E]/95 border-slate-800/80 backdrop-blur-xl"
                : "bg-white border-slate-200 shadow-xl"
            }`}
          >
            {/* Step Indicator */}
            <div className="flex gap-2 mb-6">
              <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-red-500 to-rose-500" />
              <div className="h-1 flex-1 rounded-full bg-slate-800" />
              <div className="h-1 flex-1 rounded-full bg-slate-800" />
            </div>

            <div className="font-mono text-[10.5px] text-red-400 font-bold uppercase tracking-wider mb-1">
              STEP 1 OF 3 · WORKSPACE INITIALIZATION
            </div>
            <h1 className="font-bold text-xl sm:text-2xl tracking-tight mb-1.5">
              Name your workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
              Everything your autonomous agents execute lives inside this workspace: code changes, memory graphs, task contracts, and audit logs.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase font-bold tracking-wider mb-1.5 text-slate-400">
                  WORKSPACE NAME
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40 font-mono ${
                    isDark
                      ? "bg-[#0A0D14] border-slate-700 text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase font-bold tracking-wider mb-1.5 text-slate-400">
                  WORKSPACE ROOT DIRECTORY
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={folderPath}
                    onChange={(e) => setFolderPath(e.target.value)}
                    className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40 font-mono ${
                      isDark
                        ? "bg-[#0A0D14] border-slate-700 text-white"
                        : "bg-white border-slate-300 text-slate-900"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setFolderPath("~/workspace/ultron-core")}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-semibold font-mono flex items-center gap-1.5 cursor-pointer ${
                      isDark
                        ? "bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300"
                        : "bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 opacity-70" />
                    <span>Browse</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-mono uppercase font-bold tracking-wider mb-2 text-slate-400">
                  WORKSPACE MODE
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAudience("technical")}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      audience === "technical"
                        ? isDark
                          ? "bg-cyan-950/20 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/30"
                          : "bg-cyan-50 border-cyan-500 text-cyan-950"
                        : isDark
                        ? "bg-[#0A0D14] border-slate-800 text-slate-400"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    <div className="font-bold text-xs font-mono mb-1 flex items-center gap-1.5">
                      <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Technical (IDE + CLI)</span>
                    </div>
                    <div className="text-[11px] opacity-70 leading-snug">
                      Raw PTY terminals, file explorer, session UUIDs, and live git branches inline.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudience("non-technical")}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      audience === "non-technical"
                        ? isDark
                          ? "bg-purple-950/20 border-purple-500 text-purple-200 shadow-md shadow-purple-950/30"
                          : "bg-purple-50 border-purple-500 text-purple-950"
                        : isDark
                        ? "bg-[#0A0D14] border-slate-800 text-slate-400"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    <div className="font-bold text-xs font-mono mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Executive (Visual Swarm)</span>
                    </div>
                    <div className="text-[11px] opacity-70 leading-snug">
                      Visual knowledge graph, high-level task contracts, and token budget gauges.
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between font-mono">
              <button
                type="button"
                onClick={() => setView("picker")}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                ← Back to selector
              </button>
              <button
                type="button"
                onClick={() => setView("wizard-2")}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs tracking-wider transition-all shadow-md shadow-red-600/20 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>Continue to Orchestrator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. WIZARD STEP 2: MEET ULTRON — SUPREME ORCHESTRATOR */}
        {/* ============================================================ */}
        {view === "wizard-2" && (
          <div
            className={`w-full max-w-xl rounded-2xl border shadow-2xl p-6 sm:p-8 font-sans animate-in fade-in duration-200 ${
              isDark
                ? "bg-[#10141E]/95 border-slate-800/80 backdrop-blur-xl"
                : "bg-white border-slate-200 shadow-xl"
            }`}
          >
            {/* Step Indicator */}
            <div className="flex gap-2 mb-6">
              <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-red-500 to-rose-500" />
              <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-red-500 to-rose-500" />
              <div className="h-1 flex-1 rounded-full bg-slate-800" />
            </div>

            <div className="font-mono text-[10.5px] text-red-400 font-bold uppercase tracking-wider mb-1">
              STEP 2 OF 3 · SUPREME ORCHESTRATOR
            </div>
            <h1 className="font-bold text-xl sm:text-2xl tracking-tight mb-1.5">
              Meet Ultron — Supreme Orchestrator
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mb-5 leading-relaxed">
              Ultron is the supreme head of all agents. Every mission passes through Ultron: it plans DAGs, commands sub-agents, owns the token budget, and enforces Cedar security boundaries.
            </p>

            {/* Ultron Orchestrator Card */}
            <div
              className={`p-4 rounded-xl border mb-5 flex items-start gap-4 transition-all ${
                isDark
                  ? "bg-gradient-to-r from-red-950/20 via-[#161C28] to-cyan-950/20 border-red-500/30"
                  : "bg-gradient-to-r from-red-50/50 via-slate-50 to-cyan-50/50 border-red-200"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-cyan-500 p-0.5 shrink-0 shadow-lg shadow-red-500/20">
                <div className="w-full h-full bg-[#0A0D14] rounded-[10px] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/ultron-logo.png" alt="Ultron" className="h-7 w-auto object-contain" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm font-mono text-white">{orchestratorName}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 uppercase tracking-wider">
                    HEAD OF ALL AGENTS
                  </span>
                </div>
                <div className="text-[11.5px] text-slate-300 leading-relaxed font-mono">
                  Directs Coder, Designer, QA Auditor, and Research agents. Coordinates task contracts and enforces Cedar security policies.
                </div>
              </div>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[11px] uppercase font-bold tracking-wider mb-1.5 text-slate-400">
                  ORCHESTRATOR CODENAME
                </label>
                <input
                  type="text"
                  value={orchestratorName}
                  onChange={(e) => setOrchestratorName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-red-500/40 font-mono ${
                    isDark
                      ? "bg-[#0A0D14] border-slate-700 text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold tracking-wider mb-1.5 text-slate-400">
                  ORCHESTRATOR ENGINE
                </label>
                <select
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-red-500/40 font-mono ${
                    isDark
                      ? "bg-[#0A0D14] border-slate-700 text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  <option value="Ultron Swarm Core (Claude 3.7 Sonnet)">Ultron Swarm Core (Claude 3.7 Sonnet)</option>
                  <option value="Ultron High-Reasoning (Opus 4.8 · 1M)">Ultron High-Reasoning (Opus 4.8 · 1M)</option>
                  <option value="Ultron Fast Swarm (Claude 3.5 Sonnet)">Ultron Fast Swarm (Claude 3.5 Sonnet)</option>
                  <option value="AWS Bedrock Swarm (Amazon Nova Pro)">AWS Bedrock Swarm (Amazon Nova Pro)</option>
                  <option value="Google Antigravity (Gemini 2.0 Flash)">Google Antigravity (Gemini 2.0 Flash)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold tracking-wider mb-1.5 text-slate-400">
                  REASONING MODEL CONFIGURATION
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-red-500/40 font-mono ${
                    isDark
                      ? "bg-[#0A0D14] border-slate-700 text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  <option value="Claude 3.7 Sonnet (Hybrid Reasoning)">Claude 3.7 Sonnet (Hybrid Reasoning · 200k)</option>
                  <option value="Opus 4.8 · 1M Context">Opus 4.8 · 1M Context (Deep Planning)</option>
                  <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet (Rapid Execution)</option>
                  <option value="Gemini 2.0 Flash">Gemini 2.0 Flash (Multimodal Stream)</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between font-mono">
              <button
                type="button"
                onClick={() => setView("wizard-1")}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setView("wizard-3")}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs tracking-wider transition-all shadow-md shadow-red-600/20 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>Continue to Launch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 5. WIZARD STEP 3: CONFIRM & LAUNCH */}
        {/* ============================================================ */}
        {view === "wizard-3" && (
          <div
            className={`w-full max-w-xl rounded-2xl border shadow-2xl p-6 sm:p-8 font-sans animate-in fade-in duration-200 ${
              isDark
                ? "bg-[#10141E]/95 border-slate-800/80 backdrop-blur-xl"
                : "bg-white border-slate-200 shadow-xl"
            }`}
          >
            {/* Step Indicator */}
            <div className="flex gap-2 mb-6">
              <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-red-500 to-rose-500" />
              <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-red-500 to-rose-500" />
              <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-red-500 to-rose-500" />
            </div>

            <div className="font-mono text-[10.5px] text-emerald-400 font-bold uppercase tracking-wider mb-1">
              STEP 3 OF 3 · READY TO LAUNCH
            </div>
            <h1 className="font-bold text-xl sm:text-2xl tracking-tight mb-1.5">
              Launch Ultron Swarm
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
              Your autonomous AI team is primed. {orchestratorName} will boot as the head of all agents and initialize the live office mesh.
            </p>

            {/* Launch Summary Card */}
            <div
              className={`p-4 rounded-xl border mb-6 space-y-3 font-mono text-xs ${
                isDark ? "bg-[#0A0D14] border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                <span className="text-slate-500">WORKSPACE:</span>
                <span className="font-bold text-white">{workspaceName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                <span className="text-slate-500">ROOT PATH:</span>
                <span className="text-cyan-400 truncate max-w-[280px]">{folderPath}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                <span className="text-slate-500">SUPREME HEAD:</span>
                <span className="font-bold text-red-400">{orchestratorName} (Orchestrator)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ENGINE & MODEL:</span>
                <span className="text-emerald-400">{model}</span>
              </div>
            </div>

            <div className="flex items-center justify-between font-mono">
              <button
                type="button"
                onClick={() => setView("wizard-2")}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleFinishWizard}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs tracking-wider transition-all shadow-xl shadow-red-600/30 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>LAUNCH ULTRON SWARM</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
