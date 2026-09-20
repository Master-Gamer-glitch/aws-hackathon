"use client";

import React, { useState } from "react";
import { Cpu, Plus, Check, RefreshCw, AlertCircle, Shield, Key } from "lucide-react";
import { usePrototype } from "../PrototypeContext";

interface LLMConnection {
  id: string;
  provider: string;
  model: string;
  status: "CONNECTED" | "DEGRADED" | "STANDBY";
  isDefault: boolean;
  contextLimit: string;
  latency: string;
  costPer1kTokens: string;
  endpoint: string;
}

export default function LLMConnectionsView() {
  const { isDark } = usePrototype();
  const [testingId, setTestingId] = useState<string | null>(null);

  const [connections, setConnections] = useState<LLMConnection[]>([
    {
      id: "conn-anthropic",
      provider: "Anthropic",
      model: "Claude 3.7 Sonnet (Hybrid Reasoning)",
      status: "CONNECTED",
      isDefault: true,
      contextLimit: "1,000,000 tokens",
      latency: "142ms",
      costPer1kTokens: "$0.003 / $0.015",
      endpoint: "https://api.anthropic.com/v1",
    },
    {
      id: "conn-bedrock",
      provider: "AWS Bedrock",
      model: "Claude 3.5 Sonnet (us-east-1)",
      status: "CONNECTED",
      isDefault: false,
      contextLimit: "200,000 tokens",
      latency: "118ms",
      costPer1kTokens: "$0.003 / $0.015",
      endpoint: "bedrock-runtime.us-east-1.amazonaws.com",
    },
    {
      id: "conn-haiku",
      provider: "Anthropic",
      model: "Claude 3.5 Haiku",
      status: "CONNECTED",
      isDefault: false,
      contextLimit: "200,000 tokens",
      latency: "64ms",
      costPer1kTokens: "$0.0008 / $0.004",
      endpoint: "https://api.anthropic.com/v1",
    },
    {
      id: "conn-openai",
      provider: "OpenAI",
      model: "GPT-4o (Omnimodal)",
      status: "STANDBY",
      isDefault: false,
      contextLimit: "128,000 tokens",
      latency: "185ms",
      costPer1kTokens: "$0.0025 / $0.010",
      endpoint: "https://api.openai.com/v1",
    },
  ]);

  const testConnection = (id: string) => {
    setTestingId(id);
    setTimeout(() => {
      setTestingId(null);
    }, 1200);
  };

  const setDefault = (id: string) => {
    setConnections((prev) =>
      prev.map((c) => ({ ...c, isDefault: c.id === id }))
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 sm:p-6 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-[18px] font-display font-bold text-inherit">LLM Connections</h1>
          <p className={`text-[12px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
            Foundation model endpoints, API credentials, latency benchmarks, and default swarm routers.
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
          <span>Add Model Connection</span>
        </button>
      </div>

      {/* Connection Cards Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pb-6">
        {connections.map((conn) => (
          <div
            key={conn.id}
            className={`rounded-lg border p-4 transition-all ${
              isDark
                ? "bg-[#12161D] border-[#2B333E] hover:border-[#3E4756]"
                : "bg-[#FBFAF7] border-[#E2DED5] hover:border-[#CAC4B8]"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#D64B55]" />
                  <h3 className="font-bold text-[13px] font-mono">{conn.model}</h3>
                  <span className="text-[10px] font-mono text-[#737D89]">({conn.provider})</span>
                  {conn.isDefault && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#D64B55]/20 text-[#D64B55] border border-[#D64B55]/30">
                      DEFAULT SWARM MODEL
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono pt-1">
                  <div>
                    <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>Context Window: </span>
                    <span className="font-semibold">{conn.contextLimit}</span>
                  </div>
                  <div>
                    <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>Latency (p95): </span>
                    <span className="font-semibold text-[#4BA982]">{conn.latency}</span>
                  </div>
                  <div>
                    <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>Token Cost: </span>
                    <span className="font-semibold">{conn.costPer1kTokens}</span>
                  </div>
                  <div>
                    <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>Endpoint: </span>
                    <code className="text-[10px] font-semibold">{conn.endpoint}</code>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {!conn.isDefault && (
                  <button
                    type="button"
                    onClick={() => setDefault(conn.id)}
                    className={`px-2.5 py-1.5 rounded text-[11px] font-mono border transition-colors ${
                      isDark
                        ? "border-[#2B333E] hover:bg-[#171C24] text-[#A6AEB8]"
                        : "border-[#E2DED5] hover:bg-[#FFFFFF] text-[#626A73]"
                    }`}
                  >
                    Set as Default
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => testConnection(conn.id)}
                  disabled={testingId === conn.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono font-semibold border transition-colors ${
                    isDark
                      ? "bg-[#171C24] border-[#2B333E] hover:border-[#D64B55] text-[#F2F0EA]"
                      : "bg-[#FFFFFF] border-[#E2DED5] hover:border-[#B83D47] text-[#20242A]"
                  }`}
                >
                  <RefreshCw
                    className={`w-3 h-3 ${testingId === conn.id ? "animate-spin text-[#D64B55]" : ""}`}
                  />
                  <span>{testingId === conn.id ? "Testing..." : "Test Connection"}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
