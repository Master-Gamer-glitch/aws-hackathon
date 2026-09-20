"use client";

import React, { useState } from "react";
import {
  Activity,
  Search,
  Filter,
  Clock,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Terminal,
  Shield,
  Layers,
} from "lucide-react";
import { usePrototype } from "../PrototypeContext";

interface TraceRun {
  id: string;
  timestamp: string;
  agent: string;
  task: string;
  duration: string;
  model: string;
  tokens: { prompt: number; completion: number; total: number };
  toolsCalled: string[];
  status: "SUCCESS" | "FAILED" | "IN_PROGRESS" | "BLOCKED";
  steps: {
    time: string;
    type: "THOUGHT" | "TOOL_CALL" | "TOOL_RESULT" | "CEDAR_CHECK" | "OUTPUT";
    content: string;
    duration?: string;
  }[];
}

export default function TracesView() {
  const { isDark } = usePrototype();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTraceId, setSelectedTraceId] = useState<string>("tr-9842");

  const traces: TraceRun[] = [
    {
      id: "tr-9842",
      timestamp: "12:44:35 UTC",
      agent: "Ultron",
      task: "Decompose staging token refresh migration (#ULT-8815)",
      duration: "1.42s",
      model: "Claude 3.7 Sonnet",
      tokens: { prompt: 1420, completion: 412, total: 1832 },
      toolsCalled: ["cedar.validate_schema", "git.diff"],
      status: "BLOCKED",
      steps: [
        { time: "00:00.02", type: "THOUGHT", content: "Evaluating incoming task contract. Task involves mutating schema for token refresh endpoint." },
        { time: "00:00.18", type: "CEDAR_CHECK", content: "Evaluating policy POL-CEDAR-09 on principal Ultron -> PERMIT" },
        { time: "00:00.35", type: "TOOL_CALL", content: "cedar.validate_schema --strict", duration: "14ms" },
        { time: "00:00.41", type: "TOOL_RESULT", content: "Schema validation exit code 0. Zero violations detected." },
        { time: "00:00.95", type: "OUTPUT", content: "Human approval required for production migration gate. Suspending execution." },
      ],
    },
    {
      id: "tr-9841",
      timestamp: "12:42:10 UTC",
      agent: "Coder",
      task: "Synthesize token_refresh.rs handler with JWT verification",
      duration: "3.18s",
      model: "Claude 3.7 Sonnet",
      tokens: { prompt: 2840, completion: 1120, total: 3960 },
      toolsCalled: ["fs.write", "ast.parse", "cargo.check"],
      status: "SUCCESS",
      steps: [
        { time: "00:00.05", type: "THOUGHT", content: "Parsing AST for token refresh endpoint. Refactoring handler into modular Rust functions." },
        { time: "00:00.82", type: "TOOL_CALL", content: "fs.write src/handlers/token_refresh.rs", duration: "22ms" },
        { time: "00:02.10", type: "TOOL_CALL", content: "cargo.check --quiet", duration: "1.28s" },
        { time: "00:03.18", type: "OUTPUT", content: "Handler synthesized and type checked with 0 compiler warnings." },
      ],
    },
    {
      id: "tr-9840",
      timestamp: "12:38:44 UTC",
      agent: "QA Auditor",
      task: "Execute Haiku E2E authentication test suite",
      duration: "2.04s",
      model: "Claude 3.5 Haiku",
      tokens: { prompt: 1120, completion: 240, total: 1360 },
      toolsCalled: ["test.runner"],
      status: "SUCCESS",
      steps: [
        { time: "00:00.01", type: "THOUGHT", content: "Spawning isolated test container for auth flow regression scan." },
        { time: "00:01.80", type: "TOOL_CALL", content: "vitest run tests/auth.spec.ts", duration: "1.79s" },
        { time: "00:02.04", type: "OUTPUT", content: "12/12 assertions passed. Zero regressions detected." },
      ],
    },
  ];

  const selectedTrace = traces.find((t) => t.id === selectedTraceId) || traces[0];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 sm:p-6 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-[18px] font-display font-bold text-inherit">Execution Traces</h1>
          <p className={`text-[12px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
            Deep observability into agent reasoning, tool invocations, token spend, and latency.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#4BA982]/30 text-[#4BA982] bg-[#4BA982]/10 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4BA982] animate-pulse" />
            <span>Telemetry Mesh Streaming</span>
          </span>
        </div>
      </div>

      {/* Main Content: Left Run Table + Right Trace Inspector */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
        {/* Left: Trace Runs Table */}
        <div
          className={`flex-1 lg:w-7/12 rounded-lg border flex flex-col min-h-0 overflow-hidden ${
            isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
          }`}
        >
          <div className="p-3 border-b border-inherit flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#737D89]" />
              <input
                type="text"
                placeholder="Filter traces by ID, agent, or task..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1 text-[11px] font-mono rounded border focus:outline-none ${
                  isDark
                    ? "bg-[#171C24] border-[#2B333E] text-[#F2F0EA] placeholder-[#626A73]"
                    : "bg-[#FFFFFF] border-[#E2DED5] text-[#20242A] placeholder-[#8A9198]"
                }`}
              />
            </div>
            <span className="text-[10px] font-mono text-[#737D89]">{traces.length} runs</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left font-mono text-[11px]">
              <thead
                className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                  isDark ? "bg-[#171C24] border-[#2B333E] text-[#737D89]" : "bg-[#F2EFE8] border-[#E2DED5] text-[#858C94]"
                }`}
              >
                <tr>
                  <th className="py-2 px-3">Run ID</th>
                  <th className="py-2 px-3">Agent</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Duration</th>
                  <th className="py-2 px-3">Tokens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {traces.map((trace) => (
                  <tr
                    key={trace.id}
                    onClick={() => setSelectedTraceId(trace.id)}
                    className={`transition-colors cursor-pointer ${
                      selectedTraceId === trace.id
                        ? isDark
                          ? "bg-[#1A212B]"
                          : "bg-[#EAE4D7]"
                        : isDark
                        ? "hover:bg-[#151B23]"
                        : "hover:bg-[#F4EFE5]"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-[#D64B55]">{trace.id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold">{trace.agent}</div>
                      <div className="text-[9px] text-[#737D89] truncate max-w-[150px]">
                        {trace.task}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          trace.status === "SUCCESS"
                            ? "text-[#4BA982] bg-[#4BA982]/10"
                            : trace.status === "BLOCKED"
                            ? "text-[#C99A45] bg-[#C99A45]/10"
                            : "text-[#F43F5E] bg-[#F43F5E]/10"
                        }`}
                      >
                        {trace.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#A6AEB8]">{trace.duration}</td>
                    <td className="py-2.5 px-3 font-semibold">{trace.tokens.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Trace Step-by-Step Drill Down */}
        <div
          className={`flex-1 lg:w-5/12 rounded-lg border p-4 flex flex-col min-h-0 overflow-hidden ${
            isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
          }`}
        >
          <div className="pb-3 border-b border-inherit shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[13px] font-mono">Trace Inspector: {selectedTrace.id}</span>
              <span className="text-[10px] font-mono text-[#737D89]">{selectedTrace.timestamp}</span>
            </div>
            <div className={`text-[11px] font-mono mt-1 ${isDark ? "text-[#A6AEB8]" : "text-[#626A73]"}`}>
              Task: {selectedTrace.task}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-3">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#737D89]">
              Execution Timeline ({selectedTrace.steps.length} Steps)
            </div>

            {selectedTrace.steps.map((step, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded border font-mono text-[11px] space-y-1 ${
                  isDark ? "bg-[#171C24] border-[#2B333E]" : "bg-[#FFFFFF] border-[#E2DED5]"
                }`}
              >
                <div className="flex items-center justify-between text-[9px]">
                  <span
                    className={`font-bold uppercase px-1 py-0.2 rounded ${
                      step.type === "THOUGHT"
                        ? "text-[#A855F7] bg-[#A855F7]/10"
                        : step.type === "TOOL_CALL"
                        ? "text-[#38BDF8] bg-[#38BDF8]/10"
                        : step.type === "CEDAR_CHECK"
                        ? "text-[#4BA982] bg-[#4BA982]/10"
                        : "text-[#C99A45] bg-[#C99A45]/10"
                    }`}
                  >
                    {step.type}
                  </span>
                  <span className="text-[#737D89]">+{step.time}</span>
                </div>
                <div className="text-inherit leading-relaxed">{step.content}</div>
                {step.duration && (
                  <div className="text-[9px] text-[#4BA982]">Completed in {step.duration}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
