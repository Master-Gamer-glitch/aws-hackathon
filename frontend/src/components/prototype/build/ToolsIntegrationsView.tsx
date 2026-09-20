"use client";

import React, { useState } from "react";
import {
  Wrench,
  Search,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  Link2,
  Cpu,
  Database,
  Terminal,
} from "lucide-react";
import { usePrototype } from "../PrototypeContext";

type ToolTab = "connections" | "internal" | "integrations";

interface IntegrationItem {
  id: string;
  name: string;
  provider: string;
  category: "connections" | "internal" | "integrations";
  status: "connected" | "disconnected" | "sandboxed" | "prototype";
  description: string;
  authType: string;
  lastUsed?: string;
  icon: string;
}

export default function ToolsIntegrationsView() {
  const { isDark } = usePrototype();
  const [activeTab, setActiveTab] = useState<ToolTab>("connections");
  const [searchQuery, setSearchQuery] = useState("");

  const items: IntegrationItem[] = [
    // Connections
    {
      id: "databricks",
      name: "Databricks Lakehouse",
      provider: "Databricks Inc.",
      category: "connections",
      status: "connected",
      description: "Query enterprise Delta tables and Iceberg catalogs via Databricks SQL warehouse.",
      authType: "OAuth2 / PAT",
      lastUsed: "14m ago",
      icon: "📊",
    },
    {
      id: "snowflake",
      name: "Snowflake Data Cloud",
      provider: "Snowflake Computing",
      category: "connections",
      status: "connected",
      description: "Autonomous data modeling, schema reflection, and analytics querying.",
      authType: "Key Pair / JWT",
      lastUsed: "1h ago",
      icon: "❄️",
    },
    {
      id: "aws-bedrock",
      name: "AWS Bedrock Model Mesh",
      provider: "Amazon Web Services",
      category: "connections",
      status: "connected",
      description: "Serverless model inference with AWS Cedar zero-trust security perimeter.",
      authType: "IAM Role / SigV4",
      lastUsed: "Just now",
      icon: "☁️",
    },
    {
      id: "github",
      name: "GitHub Enterprise",
      provider: "GitHub, Inc.",
      category: "connections",
      status: "connected",
      description: "Pull request synthesis, code reviews, AST diff inspection, and CI triggers.",
      authType: "GitHub App / PAT",
      lastUsed: "8m ago",
      icon: "🐙",
    },

    // Internal Tools
    {
      id: "exec-sh",
      name: "Bash Execution Sandbox",
      provider: "Ultron Runtime",
      category: "internal",
      status: "sandboxed",
      description: "Secure, non-root PTY shell execution for verified compilation and test runners.",
      authType: "Cedar Invariant Gate",
      lastUsed: "Just now",
      icon: "⚡",
    },
    {
      id: "cedar-eval",
      name: "AWS Cedar Policy Engine",
      provider: "Ultron Security",
      category: "internal",
      status: "connected",
      description: "Evaluates authorization invariants before any file mutation or API invocation.",
      authType: "In-Memory Rust Engine",
      lastUsed: "14ms ago",
      icon: "🛡️",
    },
    {
      id: "vector-search",
      name: "Qdrant Vector Embeddings",
      provider: "Ultron Memory",
      category: "internal",
      status: "connected",
      description: "Semantic search across repository files, chat history, and architectural memory.",
      authType: "Internal gRPC",
      lastUsed: "2m ago",
      icon: "🧠",
    },
    {
      id: "playwright",
      name: "Headless Browser Automation",
      provider: "Playwright",
      category: "internal",
      status: "sandboxed",
      description: "E2E UI testing, visual regression snapshots, and DOM verification.",
      authType: "Container Sandbox",
      lastUsed: "12m ago",
      icon: "🌐",
    },

    // Integrations
    {
      id: "slack",
      name: "Slack Workflow Hub",
      provider: "Slack Technologies",
      category: "integrations",
      status: "prototype",
      description: "Notify channels on task blockages, request approvals, and broadcast standup summaries.",
      authType: "Bot Token (Prototype)",
      icon: "💬",
    },
    {
      id: "hubspot",
      name: "HubSpot CRM",
      provider: "HubSpot, Inc.",
      category: "integrations",
      status: "disconnected",
      description: "Sync customer feedback tickets with autonomous engineering tasks.",
      authType: "OAuth2",
      icon: "🧲",
    },
    {
      id: "salesforce",
      name: "Salesforce Cloud",
      provider: "Salesforce, Inc.",
      category: "integrations",
      status: "disconnected",
      description: "Enterprise CRM connector for support escalations and customer issue triage.",
      authType: "Connected App",
      icon: "☁️",
    },
    {
      id: "zapier",
      name: "Zapier Webhooks",
      provider: "Zapier",
      category: "integrations",
      status: "prototype",
      description: "Trigger Ultron swarm tasks from external no-code webhook payloads.",
      authType: "Webhook Secret (Prototype)",
      icon: "⚡",
    },
  ];

  const filteredItems = items.filter(
    (item) =>
      item.category === activeTab &&
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 sm:p-6 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-[18px] font-display font-bold text-inherit">Tools & Integrations</h1>
          <p className={`text-[12px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
            Configure external connections, internal runtime sandboxes, and third-party SaaS integrations.
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
          <span>New Tool Integration</span>
        </button>
      </div>

      {/* Tabs & Search Bar */}
      <div
        className={`p-2.5 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
          isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
        }`}
      >
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 w-full sm:w-auto">
          {[
            { id: "connections", label: "Connections", count: 4 },
            { id: "internal", label: "Internal Tools", count: 4 },
            { id: "integrations", label: "Integrations", count: 4 },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ToolTab)}
              className={`px-3 py-1 text-[11px] font-mono rounded transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? isDark
                    ? "bg-[#171C24] text-[#D64B55] font-semibold border border-[#2B333E]"
                    : "bg-[#FFFFFF] text-[#B83D47] font-semibold border border-[#E2DED5] shadow-xs"
                  : isDark
                  ? "text-[#A6AEB8] hover:text-[#F2F0EA]"
                  : "text-[#626A73] hover:text-[#20242A]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                  activeTab === tab.id
                    ? isDark
                      ? "bg-[#D64B55]/20 text-[#D64B55]"
                      : "bg-[#B83D47]/10 text-[#B83D47]"
                    : isDark
                    ? "bg-[#171C24] text-[#737D89]"
                    : "bg-[#EAE6DD] text-[#858C94]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#737D89]" />
          <input
            type="text"
            placeholder="Filter tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-3 py-1 text-[11px] font-mono rounded border focus:outline-none ${
              isDark
                ? "bg-[#171C24] border-[#2B333E] text-[#F2F0EA] placeholder-[#626A73]"
                : "bg-[#FFFFFF] border-[#E2DED5] text-[#20242A] placeholder-[#8A9198]"
            }`}
          />
        </div>
      </div>

      {/* Grid of Tools */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg border p-4 flex flex-col justify-between transition-all ${
                isDark
                  ? "bg-[#12161D] border-[#2B333E] hover:border-[#3E4756]"
                  : "bg-[#FBFAF7] border-[#E2DED5] hover:border-[#CAC4B8]"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded border border-inherit flex items-center justify-center text-[16px] bg-inherit">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-[13px] font-mono">{item.name}</h3>
                      <span className={`text-[10px] font-mono ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                        {item.provider}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                      item.status === "connected"
                        ? "bg-[#1F2B24] text-[#4BA982] border border-[#2B4B3B]"
                        : item.status === "sandboxed"
                        ? "bg-[#271E33] text-[#A855F7] border border-[#4B3566]"
                        : item.status === "prototype"
                        ? "bg-[#2B2317] text-[#C99A45] border border-[#4B3B22]"
                        : isDark
                        ? "bg-[#171C24] text-[#737D89] border border-[#2B333E]"
                        : "bg-[#EAE6DD] text-[#858C94] border border-[#E2DED5]"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <p
                  className={`text-[11px] font-sans mt-3 line-clamp-2 leading-relaxed ${
                    isDark ? "text-[#A6AEB8]" : "text-[#626A73]"
                  }`}
                >
                  {item.description}
                </p>

                <div className="mt-3 pt-3 border-t border-inherit text-[10px] font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>Auth Protocol:</span>
                    <span className="font-semibold">{item.authType}</span>
                  </div>
                  {item.lastUsed && (
                    <div className="flex justify-between">
                      <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>Activity:</span>
                      <span className="text-[#4BA982]">{item.lastUsed}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between gap-2">
                <button
                  type="button"
                  className={`flex-1 py-1 px-2 rounded text-[11px] font-mono font-semibold text-center border transition-colors ${
                    item.status === "connected" || item.status === "sandboxed"
                      ? isDark
                        ? "bg-[#171C24] border-[#2B333E] hover:border-[#D64B55] text-[#F2F0EA]"
                        : "bg-[#FFFFFF] border-[#E2DED5] hover:border-[#B83D47] text-[#20242A]"
                      : isDark
                      ? "bg-[#D64B55] text-white hover:bg-[#C23E48]"
                      : "bg-[#B83D47] text-white hover:bg-[#A3343E]"
                  }`}
                >
                  {item.status === "connected" || item.status === "sandboxed" ? "Configure" : "Connect"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
