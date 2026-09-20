"use client";

import React, { useState } from "react";
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  MoreVertical,
  Bot,
  Search,
} from "lucide-react";
import { usePrototype } from "../PrototypeContext";

interface AutomationItem {
  id: string;
  name: string;
  status: "active" | "paused" | "failed";
  schedule: string;
  triggerType: "SCHEDULE" | "WEBHOOK" | "EVENT";
  assignedAgent: string;
  lastRun: string;
  nextRun: string;
  executionCount: number;
  description: string;
}

export default function AutomationsView() {
  const { isDark } = usePrototype();
  const [searchQuery, setSearchQuery] = useState("");

  const [automations, setAutomations] = useState<AutomationItem[]>([
    {
      id: "auto-1",
      name: "Daily Swarm Standup & Task Triage",
      status: "active",
      schedule: "Every day at 09:00 UTC",
      triggerType: "SCHEDULE",
      assignedAgent: "Ultron",
      lastRun: "Today, 09:00",
      nextRun: "Tomorrow, 09:00",
      executionCount: 142,
      description: "Aggregates blocked tasks, reconciles backlog tickets, and assigns execution cards to specialized agents.",
    },
    {
      id: "auto-2",
      name: "Cedar Security Invariant Audit",
      status: "active",
      schedule: "Every 2 hours",
      triggerType: "SCHEDULE",
      assignedAgent: "QA Auditor",
      lastRun: "45m ago",
      nextRun: "In 1h 15m",
      executionCount: 890,
      description: "Scans repository commit diffs and active container sockets against POL-CEDAR-09 invariants.",
    },
    {
      id: "auto-3",
      name: "GitHub Pull Request AST Verification",
      status: "active",
      schedule: "On pull request opened",
      triggerType: "WEBHOOK",
      assignedAgent: "Coder",
      lastRun: "2h ago",
      nextRun: "Awaiting webhook",
      executionCount: 512,
      description: "Synthesizes automated test runners and analyzes TypeScript/Rust AST changes for breaking changes.",
    },
    {
      id: "auto-4",
      name: "Hourly Vector Memory Compaction",
      status: "paused",
      schedule: "0 * * * * (Hourly)",
      triggerType: "SCHEDULE",
      assignedAgent: "Research & RAG",
      lastRun: "Yesterday",
      nextRun: "Paused",
      executionCount: 320,
      description: "Compacts conversational embeddings and removes expired temporary context buffers.",
    },
  ]);

  const togglePause = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: a.status === "active" ? "paused" : "active",
              nextRun: a.status === "active" ? "Paused" : "Calculated on resume",
            }
          : a
      )
    );
  };

  const handleRunNow = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, executionCount: a.executionCount + 1, lastRun: "Just now" } : a
      )
    );
  };

  const filtered = automations.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.assignedAgent.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 sm:p-6 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-[18px] font-display font-bold text-inherit">Automations</h1>
          <p className={`text-[12px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
            Schedule recurring swarm directives and configure event-driven autonomous tasks.
          </p>
        </div>

        <button
          type="button"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-mono font-semibold transition-all ${
            isDark
              ? "bg-[#D64B55] hover:bg-[#C23E48] text-white"
              : "bg-[#B83D47] hover:bg-[#A3343E] text-white"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Automation</span>
        </button>
      </div>

      {/* Filter / Search Strip */}
      <div
        className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 shrink-0 ${
          isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
        }`}
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#737D89]" />
          <input
            type="text"
            placeholder="Search automations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-3 py-1 text-[11px] font-mono rounded border focus:outline-none ${
              isDark
                ? "bg-[#171C24] border-[#2B333E] text-[#F2F0EA] placeholder-[#626A73]"
                : "bg-[#FFFFFF] border-[#E2DED5] text-[#20242A] placeholder-[#8A9198]"
            }`}
          />
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>
            {automations.filter((a) => a.status === "active").length} Active Schedules
          </span>
        </div>
      </div>

      {/* Automations Cards / Table */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pb-6">
        {filtered.map((auto) => (
          <div
            key={auto.id}
            className={`rounded-lg border p-4 transition-all ${
              isDark
                ? "bg-[#12161D] border-[#2B333E] hover:border-[#3E4756]"
                : "bg-[#FBFAF7] border-[#E2DED5] hover:border-[#CAC4B8]"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Left Details */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      auto.status === "active" ? "bg-[#4BA982] animate-pulse" : "bg-[#737D89]"
                    }`}
                  />
                  <h3 className="font-bold text-[13px] font-mono">{auto.name}</h3>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                      auto.status === "active"
                        ? "text-[#4BA982] bg-[#4BA982]/10 border border-[#4BA982]/30"
                        : "text-[#737D89] bg-[#737D89]/10 border border-[#737D89]/30"
                    }`}
                  >
                    {auto.status}
                  </span>
                  <span className="text-[9px] font-mono text-[#927BAA] px-1.5 py-0.2 rounded border border-[#927BAA]/30">
                    {auto.triggerType}
                  </span>
                </div>

                <p
                  className={`text-[11px] font-sans leading-relaxed ${
                    isDark ? "text-[#A6AEB8]" : "text-[#626A73]"
                  }`}
                >
                  {auto.description}
                </p>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#737D89]" />
                    <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>Schedule:</span>
                    <span className="font-semibold">{auto.schedule}</span>
                  </span>

                  <span className="flex items-center gap-1">
                    <Bot className="w-3 h-3 text-[#737D89]" />
                    <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>Assigned Agent:</span>
                    <span className="font-semibold text-[#D64B55]">{auto.assignedAgent}</span>
                  </span>

                  <span className="flex items-center gap-1">
                    <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>Last run:</span>
                    <span className="font-semibold">{auto.lastRun}</span>
                  </span>

                  <span className="flex items-center gap-1">
                    <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>Next run:</span>
                    <span className="font-semibold">{auto.nextRun}</span>
                  </span>

                  <span className="flex items-center gap-1">
                    <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>Runs:</span>
                    <span className="font-semibold">{auto.executionCount}</span>
                  </span>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleRunNow(auto.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-mono font-semibold border transition-colors ${
                    isDark
                      ? "bg-[#171C24] border-[#2B333E] hover:border-[#D64B55] text-[#F2F0EA]"
                      : "bg-[#FFFFFF] border-[#E2DED5] hover:border-[#B83D47] text-[#20242A]"
                  }`}
                >
                  <Play className="w-3 h-3 text-[#4BA982]" />
                  <span>Run Now</span>
                </button>

                <button
                  type="button"
                  onClick={() => togglePause(auto.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-mono border transition-colors ${
                    isDark
                      ? "border-[#2B333E] hover:bg-[#171C24] text-[#A6AEB8]"
                      : "border-[#E2DED5] hover:bg-[#FFFFFF] text-[#626A73]"
                  }`}
                >
                  {auto.status === "active" ? (
                    <>
                      <Pause className="w-3 h-3 text-[#C99A45]" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-[#4BA982]" />
                      <span>Resume</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
