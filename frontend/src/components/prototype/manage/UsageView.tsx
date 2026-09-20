"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Cpu,
  Bot,
  Layers,
  Users,
  Zap,
  Clock,
  Calendar,
} from "lucide-react";
import { usePrototype } from "../PrototypeContext";

export default function UsageView() {
  const { isDark } = usePrototype();
  const [timeRange, setTimeRange] = useState("30d");

  const agentExecutions = [
    { name: "Ultron (Lead)", count: 2480, percent: 42, tokens: "18.4M", cost: "$42.10" },
    { name: "Coder", count: 1890, percent: 32, tokens: "14.2M", cost: "$31.80" },
    { name: "QA Auditor", count: 840, percent: 14, tokens: "4.1M", cost: "$8.40" },
    { name: "Research & RAG", count: 460, percent: 8, tokens: "3.2M", cost: "$7.12" },
    { name: "Launch", count: 230, percent: 4, tokens: "1.1M", cost: "$2.30" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 sm:p-6 space-y-4">
      {/* Top Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-[18px] font-display font-bold text-inherit">Usage & Telemetry</h1>
          <p className={`text-[12px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
            Aggregate execution metrics, token utilization, and agent compute runtime.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded border border-inherit text-[11px] font-mono">
          {["24h", "7d", "30d", "90d"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`px-2 py-0.5 rounded transition-colors ${
                timeRange === r
                  ? isDark
                    ? "bg-[#171C24] text-[#D64B55] font-bold border border-[#2B333E]"
                    : "bg-[#FFFFFF] text-[#B83D47] font-bold border border-[#E2DED5]"
                  : "text-[#737D89] hover:text-inherit"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Top 5 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
        {[
          { label: "ACTIVE AGENTS", val: "6 Online", sub: "100% healthy", icon: Bot, color: "#4BA982" },
          { label: "TOTAL EXECUTIONS", val: "5,900", sub: "+18% vs last mo", icon: Zap, color: "#D64B55" },
          { label: "RUNS THIS MONTH", val: "3,842", sub: "On track", icon: BarChart3, color: "#38BDF8" },
          { label: "DEPLOYMENTS", val: "48", sub: "12 canaries active", icon: Layers, color: "#927BAA" },
          { label: "OPERATORS", val: "8", sub: "Multi-tenant seat", icon: Users, color: "#C99A45" },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono uppercase font-bold ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                  {m.label}
                </span>
                <Icon className="w-3.5 h-3.5 text-[#737D89]" />
              </div>
              <div className="my-2">
                <div className="text-[18px] font-bold font-mono text-inherit">{m.val}</div>
                <div className="text-[10px] font-mono text-[#4BA982] mt-0.5">{m.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Breakdown Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-y-auto pb-6">
        {/* Executions by Agent */}
        <div
          className={`p-4 rounded-lg border space-y-3 ${
            isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-inherit">
            <h3 className="text-[13px] font-bold font-mono">Executions by Agent</h3>
            <span className="text-[10px] font-mono text-[#737D89]">5,900 Total</span>
          </div>

          <div className="space-y-2.5">
            {agentExecutions.map((ag) => (
              <div key={ag.name} className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="font-semibold">{ag.name}</span>
                  <span className="text-[#737D89]">
                    {ag.count.toLocaleString()} runs ({ag.percent}%) · {ag.tokens}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-black/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#D64B55]"
                    style={{ width: `${ag.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Token & Compute Spend by Model */}
        <div
          className={`p-4 rounded-lg border space-y-3 ${
            isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-inherit">
            <h3 className="text-[13px] font-bold font-mono">Token Utilization by Model</h3>
            <span className="text-[10px] font-mono text-[#737D89]">41.0M Tokens</span>
          </div>

          <div className="space-y-3 font-mono text-[11px]">
            {[
              { model: "Claude 3.7 Sonnet (Hybrid)", tokens: "24.8M", cost: "$74.40", percent: 60 },
              { model: "Claude 3.5 Sonnet", tokens: "10.2M", cost: "$30.60", percent: 25 },
              { model: "Claude 3.5 Haiku", tokens: "4.8M", cost: "$3.84", percent: 12 },
              { model: "GPT-4o Omnimodal", tokens: "1.2M", cost: "$3.00", percent: 3 },
            ].map((m) => (
              <div key={m.model} className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold">{m.model}</span>
                  <span className="text-[#4BA982] font-semibold">{m.cost}</span>
                </div>
                <div className="flex justify-between text-[10px] text-[#737D89]">
                  <span>{m.tokens} consumed</span>
                  <span>{m.percent}% of total</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-black/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#38BDF8]"
                    style={{ width: `${m.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
