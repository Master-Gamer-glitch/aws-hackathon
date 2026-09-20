"use client";

import React from "react";
import {
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Download,
  Calendar,
  Shield,
  Layers,
} from "lucide-react";
import { usePrototype } from "../PrototypeContext";

export default function BillingView() {
  const { isDark } = usePrototype();

  // Core Ultron AI Budget Concept
  const totalBudget = 250.0;
  const usedBudget = 111.84;
  const remainingBudget = totalBudget - usedBudget;
  const usagePercent = Math.round((usedBudget / totalBudget) * 100);

  const invoices = [
    { id: "INV-2026-08", date: "Aug 31, 2026", amount: "$98.40", status: "PAID", pdf: "invoice_aug.pdf" },
    { id: "INV-2026-07", date: "Jul 31, 2026", amount: "$84.20", status: "PAID", pdf: "invoice_jul.pdf" },
    { id: "INV-2026-06", date: "Jun 30, 2026", amount: "$72.10", status: "PAID", pdf: "invoice_jun.pdf" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 sm:p-6 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-[18px] font-display font-bold text-inherit">Billing & AI Budget</h1>
          <p className={`text-[12px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
            Manage organizational spending caps, autonomous agent limits, and payment methods.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`px-3 py-1.5 rounded text-[12px] font-mono font-semibold border transition-all ${
              isDark
                ? "bg-[#171C24] border-[#2B333E] hover:border-[#D64B55] text-[#F2F0EA]"
                : "bg-[#FFFFFF] border-[#E2DED5] hover:border-[#B83D47] text-[#20242A]"
            }`}
          >
            Manage Payment Method
          </button>
        </div>
      </div>

      {/* CORE ULTRON CONCEPT: AI BUDGET STRIP */}
      <div
        className={`p-5 rounded-lg border space-y-4 shrink-0 ${
          isDark
            ? "bg-[#12161D] border-[#2B333E] shadow-lg"
            : "bg-[#FBFAF7] border-[#E2DED5] shadow-sm"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-mono font-bold uppercase tracking-wider text-[#D64B55]">
                Swarm AI Budget (Monthly Allocation)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#4BA982]/10 text-[#4BA982] border border-[#4BA982]/30 font-bold">
                CIRCUIT BREAKER ARMED
              </span>
            </div>
            <p className={`text-[11px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
              Hard limit capped to prevent uncontrolled recursive LLM spend across all pods.
            </p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-display font-bold text-inherit">
              ${usedBudget.toFixed(2)}
            </span>
            <span className={`text-[12px] font-mono ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
              / ${totalBudget.toFixed(2)} ({usagePercent}%)
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-black/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#D64B55] transition-all duration-300"
            style={{ width: `${usagePercent}%` }}
          />
        </div>

        {/* Budget Triad */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] font-mono">
          <div
            className={`p-3 rounded border ${
              isDark ? "bg-[#171C24] border-[#2B333E]" : "bg-[#FFFFFF] border-[#E2DED5]"
            }`}
          >
            <span className={`text-[10px] uppercase block ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
              Total Budget
            </span>
            <span className="text-[14px] font-bold text-inherit mt-0.5 block">${totalBudget.toFixed(2)}</span>
          </div>

          <div
            className={`p-3 rounded border ${
              isDark ? "bg-[#171C24] border-[#2B333E]" : "bg-[#FFFFFF] border-[#E2DED5]"
            }`}
          >
            <span className={`text-[10px] uppercase block ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
              Used This Cycle
            </span>
            <span className="text-[14px] font-bold text-[#D64B55] mt-0.5 block">${usedBudget.toFixed(2)}</span>
          </div>

          <div
            className={`p-3 rounded border ${
              isDark ? "bg-[#171C24] border-[#2B333E]" : "bg-[#FFFFFF] border-[#E2DED5]"
            }`}
          >
            <span className={`text-[10px] uppercase block ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
              Remaining Safe Balance
            </span>
            <span className="text-[14px] font-bold text-[#4BA982] mt-0.5 block">${remainingBudget.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Plan & Invoices */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-y-auto pb-6">
        {/* Current Plan */}
        <div
          className={`p-4 rounded-lg border space-y-3 ${
            isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-inherit">
            <h3 className="text-[13px] font-bold font-mono">Current Plan</h3>
            <span className="text-[10px] font-mono text-[#4BA982] font-semibold">ACTIVE</span>
          </div>

          <div className="space-y-2 font-mono text-[11px]">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[14px]">Ultron Enterprise Dedicated</span>
              <span className="font-bold text-[14px]">$199 / mo</span>
            </div>
            <p className={`text-[11px] font-sans ${isDark ? "text-[#A6AEB8]" : "text-[#626A73]"}`}>
              Includes 10 concurrent agent seats, custom AWS Cedar guardrails, hybrid model routing, and dedicated PTY terminals.
            </p>
            <div className="pt-2 text-[10px] text-[#737D89]">
              Next billing date: <strong className="text-inherit">October 1, 2026</strong> via Visa ending in 4242.
            </div>
          </div>
        </div>

        {/* Invoice History */}
        <div
          className={`p-4 rounded-lg border space-y-3 ${
            isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-inherit">
            <h3 className="text-[13px] font-bold font-mono">Invoice History</h3>
            <span className="text-[10px] font-mono text-[#737D89]">All Paid</span>
          </div>

          <div className="space-y-2 font-mono text-[11px]">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className={`p-2.5 rounded border flex items-center justify-between ${
                  isDark ? "bg-[#171C24] border-[#2B333E]" : "bg-[#FFFFFF] border-[#E2DED5]"
                }`}
              >
                <div>
                  <span className="font-bold block text-inherit">{inv.id}</span>
                  <span className="text-[10px] text-[#737D89]">{inv.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-inherit">{inv.amount}</span>
                  <span className="text-[9px] font-bold text-[#4BA982] bg-[#4BA982]/10 px-1.5 py-0.2 rounded">
                    {inv.status}
                  </span>
                  <button type="button" className="text-[#737D89] hover:text-inherit">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
