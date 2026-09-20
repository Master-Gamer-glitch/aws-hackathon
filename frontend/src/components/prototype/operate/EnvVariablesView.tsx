"use client";

import React, { useState } from "react";
import { KeyRound, Plus, Eye, EyeOff, Copy, Trash2, ShieldCheck, Search } from "lucide-react";
import { usePrototype } from "../PrototypeContext";

interface EnvVar {
  id: string;
  name: string;
  scope: "production" | "staging" | "development" | "all";
  value: string;
  updated: string;
  isSecret: boolean;
}

export default function EnvVariablesView() {
  const { isDark } = usePrototype();
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState("all");

  const [variables, setVariables] = useState<EnvVar[]>([
    {
      id: "v-1",
      name: "ANTHROPIC_API_KEY",
      scope: "production",
      value: "sk-ant-api03-••••••••••••••••••••••••••••••••-prod",
      updated: "3d ago",
      isSecret: true,
    },
    {
      id: "v-2",
      name: "AWS_CEDAR_POLICY_BUCKET",
      scope: "production",
      value: "s3://ultron-swarm-cedar-invariants-prod",
      updated: "1w ago",
      isSecret: false,
    },
    {
      id: "v-3",
      name: "GITHUB_APP_PRIVATE_KEY",
      scope: "staging",
      value: "-----BEGIN RSA PRIVATE KEY-----\n••••••••••••••••\n-----END RSA PRIVATE KEY-----",
      updated: "4d ago",
      isSecret: true,
    },
    {
      id: "v-4",
      name: "DATABRICKS_HOST",
      scope: "production",
      value: "https://dbc-984210a-ultron.cloud.databricks.com",
      updated: "2w ago",
      isSecret: false,
    },
    {
      id: "v-5",
      name: "QDRANT_GRPC_ENDPOINT",
      scope: "development",
      value: "grpc://qdrant-cluster.internal:6334",
      updated: "1d ago",
      isSecret: false,
    },
  ]);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (id: string, val: string) => {
    navigator.clipboard?.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDelete = (id: string) => {
    setVariables((prev) => prev.filter((v) => v.id !== id));
  };

  const filtered = variables.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesScope = scopeFilter === "all" || v.scope === scopeFilter;
    return matchesSearch && matchesScope;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 sm:p-6 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-[18px] font-display font-bold text-inherit">Environment Variables</h1>
          <p className={`text-[12px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
            Encrypted keys, service endpoints, and scoped secrets injected into agent sandboxes.
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
          <span>Add Variable</span>
        </button>
      </div>

      {/* Filter / Search Strip */}
      <div
        className={`p-2.5 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
          isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
        }`}
      >
        <div className="relative flex-1 w-full sm:w-auto max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#737D89]" />
          <input
            type="text"
            placeholder="Search variable names..."
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
          {["all", "production", "staging", "development"].map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => setScopeFilter(scope)}
              className={`px-2.5 py-1 text-[10px] font-mono rounded uppercase transition-colors ${
                scopeFilter === scope
                  ? isDark
                    ? "bg-[#171C24] text-[#D64B55] font-bold border border-[#2B333E]"
                    : "bg-[#FFFFFF] text-[#B83D47] font-bold border border-[#E2DED5] shadow-xs"
                  : isDark
                  ? "text-[#737D89] hover:text-[#F2F0EA]"
                  : "text-[#858C94] hover:text-[#20242A]"
              }`}
            >
              {scope}
            </button>
          ))}
        </div>
      </div>

      {/* Variables Table */}
      <div
        className={`flex-1 rounded-lg border overflow-hidden min-h-0 ${
          isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
        }`}
      >
        <div className="overflow-y-auto h-full">
          <table className="w-full text-left font-mono text-[11px]">
            <thead
              className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                isDark ? "bg-[#171C24] border-[#2B333E] text-[#737D89]" : "bg-[#F2EFE8] border-[#E2DED5] text-[#858C94]"
              }`}
            >
              <tr>
                <th className="py-2.5 px-3">Variable Key</th>
                <th className="py-2.5 px-3">Scope</th>
                <th className="py-2.5 px-3">Value</th>
                <th className="py-2.5 px-3">Updated</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit">
              {filtered.map((v) => (
                <tr
                  key={v.id}
                  className={`transition-colors ${isDark ? "hover:bg-[#151B23]" : "hover:bg-[#F4EFE5]"}`}
                >
                  <td className="py-2.5 px-3 font-bold flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-[#927BAA]" />
                    <span>{v.name}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border ${
                        v.scope === "production"
                          ? "text-[#D64B55] border-[#D64B55]/30 bg-[#D64B55]/10"
                          : v.scope === "staging"
                          ? "text-[#C99A45] border-[#C99A45]/30 bg-[#C99A45]/10"
                          : "text-[#38BDF8] border-[#38BDF8]/30 bg-[#38BDF8]/10"
                      }`}
                    >
                      {v.scope}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <code className="px-2 py-0.5 rounded bg-black/20 text-[10px]">
                      {revealedIds[v.id] || !v.isSecret ? v.value : "••••••••••••••••••••••••"}
                    </code>
                  </td>
                  <td className="py-2.5 px-3 text-[#737D89]">{v.updated}</td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {v.isSecret && (
                        <button
                          type="button"
                          onClick={() => toggleReveal(v.id)}
                          className="p-1 rounded hover:bg-black/10 text-[#737D89] hover:text-inherit"
                          title={revealedIds[v.id] ? "Mask Value" : "Reveal Value"}
                        >
                          {revealedIds[v.id] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopy(v.id, v.value)}
                        className="p-1 rounded hover:bg-black/10 text-[#737D89] hover:text-inherit"
                        title="Copy Value"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(v.id)}
                        className="p-1 rounded hover:bg-black/10 text-[#737D89] hover:text-[#D64B55]"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
