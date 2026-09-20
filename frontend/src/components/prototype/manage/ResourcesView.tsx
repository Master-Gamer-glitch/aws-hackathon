"use client";

import React, { useState } from "react";
import { FolderArchive, Search, Plus, GitBranch, Database, FileText, ExternalLink, HardDrive } from "lucide-react";
import { usePrototype } from "../PrototypeContext";

interface ResourceItem {
  id: string;
  name: string;
  type: "REPOSITORY" | "DATASET" | "DOCUMENTATION" | "WORKSPACE";
  path: string;
  size: string;
  accessCount: string;
  description: string;
}

export default function ResourcesView() {
  const { isDark } = usePrototype();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const resources: ResourceItem[] = [
    {
      id: "res-repo-core",
      name: "ultron-core (Rust/TS)",
      type: "REPOSITORY",
      path: "~/workspace/CareFlow/core",
      size: "42.8 MB",
      accessCount: "1,420 reads",
      description: "Primary microservices repository containing token refresh handlers and PTY runtime.",
    },
    {
      id: "res-cedar-policies",
      name: "policies/invariants.cedar",
      type: "DOCUMENTATION",
      path: "~/workspace/CareFlow/policies",
      size: "14.2 KB",
      accessCount: "8,920 evals",
      description: "AWS Cedar zero-trust security invariant rules and tenant boundary schemas.",
    },
    {
      id: "res-vector-db",
      name: "Qdrant Architecture Index",
      type: "DATASET",
      path: "qdrant://embeddings/architecture-v3",
      size: "1.2 GB",
      accessCount: "340 queries",
      description: "Vector embeddings of historical code diffs, RFCs, and mission directives.",
    },
    {
      id: "res-workspace-scratch",
      name: "Ephemeral Scratchpad Mount",
      type: "WORKSPACE",
      path: "/tmp/ultron/scratchpad",
      size: "128 KB",
      accessCount: "Continuous",
      description: "Shared multi-agent scratchpad for active task card decomposition.",
    },
  ];

  const filtered = resources.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 sm:p-6 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-[18px] font-display font-bold text-inherit">Resources</h1>
          <p className={`text-[12px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
            Repositories, datasets, and documentation accessible to autonomous agents.
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
          <span>Mount New Resource</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div
        className={`p-2.5 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
          isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
        }`}
      >
        <div className="relative flex-1 w-full sm:w-auto max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#737D89]" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-3 py-1 text-[11px] font-mono rounded border focus:outline-none ${
              isDark
                ? "bg-[#171C24] border-[#2B333E] text-[#F2F0EA] placeholder-[#626A73]"
                : "bg-[#FFFFFF] border-[#E2DED5] text-[#20242A] placeholder-[#8A9198]"
            }`}
          />
        </div>

        <div className="flex items-center gap-1.5">
          {["all", "REPOSITORY", "DATASET", "DOCUMENTATION", "WORKSPACE"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`px-2.5 py-1 text-[10px] font-mono rounded uppercase transition-colors ${
                typeFilter === type
                  ? isDark
                    ? "bg-[#171C24] text-[#D64B55] font-bold border border-[#2B333E]"
                    : "bg-[#FFFFFF] text-[#B83D47] font-bold border border-[#E2DED5] shadow-xs"
                  : isDark
                  ? "text-[#737D89] hover:text-[#F2F0EA]"
                  : "text-[#858C94] hover:text-[#20242A]"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Cards Grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pb-6">
          {filtered.map((res) => (
            <div
              key={res.id}
              className={`p-4 rounded-lg border flex flex-col justify-between transition-all ${
                isDark
                  ? "bg-[#12161D] border-[#2B333E] hover:border-[#3E4756]"
                  : "bg-[#FBFAF7] border-[#E2DED5] hover:border-[#CAC4B8]"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded border border-inherit flex items-center justify-center bg-inherit">
                      {res.type === "REPOSITORY" && <GitBranch className="w-4 h-4 text-[#38BDF8]" />}
                      {res.type === "DATASET" && <Database className="w-4 h-4 text-[#A855F7]" />}
                      {res.type === "DOCUMENTATION" && <FileText className="w-4 h-4 text-[#4BA982]" />}
                      {res.type === "WORKSPACE" && <HardDrive className="w-4 h-4 text-[#EAB308]" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-[13px] font-mono">{res.name}</h3>
                      <code className={`text-[10px] ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                        {res.path}
                      </code>
                    </div>
                  </div>

                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border border-inherit text-[#737D89]">
                    {res.type}
                  </span>
                </div>

                <p
                  className={`text-[11px] font-sans mt-3 line-clamp-2 leading-relaxed ${
                    isDark ? "text-[#A6AEB8]" : "text-[#626A73]"
                  }`}
                >
                  {res.description}
                </p>

                <div className="mt-3 pt-3 border-t border-inherit flex justify-between text-[10px] font-mono">
                  <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>Size: {res.size}</span>
                  <span className="text-[#4BA982]">{res.accessCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
