"use client";

import React, { useState } from "react";
import {
  Bot,
  Search,
  Plus,
  Copy,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Layers,
  Wrench,
} from "lucide-react";
import { usePrototype, PROTOTYPE_AGENTS, PrototypeAgent } from "../PrototypeContext";

export default function AgentsRepositoryView() {
  const { isDark, openAgentInStudio, openAgentWorkspace, setSelectedAgent, selectedAgentId } =
    usePrototype();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const filteredAgents = PROTOTYPE_AGENTS.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 sm:p-6 space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-display font-bold text-inherit">
              Agents Repository
            </h1>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isDark
                  ? "bg-[#171C24] border-[#2B333E] text-[#A6AEB8]"
                  : "bg-[#FBFAF7] border-[#E2DED5] text-[#626A73]"
              }`}
            >
              {filteredAgents.length} Agents
            </span>
          </div>
          <p className={`text-[12px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
            Autonomous workforce directory and operational agent specifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Agent */}
          <button
            type="button"
            onClick={() => openAgentInStudio(PROTOTYPE_AGENTS[0])}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-mono font-semibold transition-all ${
              isDark
                ? "bg-[#D64B55] hover:bg-[#C23E48] text-white"
                : "bg-[#B83D47] hover:bg-[#A3343E] text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Agent</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className={`p-2.5 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 ${
          isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
        }`}
      >
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#737D89]" />
          <input
            type="text"
            placeholder="Search agents by name, role, or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-3 py-1 text-[12px] font-mono rounded border focus:outline-none transition-colors ${
              isDark
                ? "bg-[#171C24] border-[#2B333E] text-[#F2F0EA] placeholder-[#626A73] focus:border-[#D64B55]"
                : "bg-[#FFFFFF] border-[#E2DED5] text-[#20242A] placeholder-[#8A9198] focus:border-[#B83D47]"
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-2.5 py-1 text-[11px] font-mono rounded border focus:outline-none ${
              isDark
                ? "bg-[#171C24] border-[#2B333E] text-[#F2F0EA]"
                : "bg-[#FFFFFF] border-[#E2DED5] text-[#20242A]"
            }`}
          >
            <option value="all">Status: All</option>
            <option value="working">Working</option>
            <option value="idle">Idle</option>
            <option value="thinking">Thinking</option>
            <option value="awaiting">Awaiting</option>
          </select>

          {/* View Toggle */}
          <div
            className={`p-0.5 rounded border flex items-center ${
              isDark ? "bg-[#171C24] border-[#2B333E]" : "bg-[#FFFFFF] border-[#E2DED5]"
            }`}
          >
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                viewMode === "grid"
                  ? isDark
                    ? "bg-[#242A33] text-[#F2F0EA]"
                    : "bg-[#EAE6DD] text-[#20242A]"
                  : "text-[#737D89]"
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                viewMode === "table"
                  ? isDark
                    ? "bg-[#242A33] text-[#F2F0EA]"
                    : "bg-[#EAE6DD] text-[#20242A]"
                  : "text-[#737D89]"
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Agents View: Grid or Table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-6">
            {filteredAgents.map((agent) => {
              const isSelected = selectedAgentId === agent.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`rounded-lg border p-4 transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? isDark
                        ? "bg-[#171C24] border-[#D64B55] ring-1 ring-[#D64B55]/30 shadow-lg"
                        : "bg-[#FFFFFF] border-[#B83D47] ring-1 ring-[#B83D47]/30 shadow-md"
                      : isDark
                      ? "bg-[#12161D] border-[#2B333E] hover:border-[#3E4756] hover:bg-[#151B23]"
                      : "bg-[#FBFAF7] border-[#E2DED5] hover:border-[#CAC4B8] hover:bg-[#FFFFFF]"
                  }`}
                >
                  <div>
                    {/* Header: Avatar, Name, Role, Badge */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-md overflow-hidden border border-inherit shrink-0 bg-inherit flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[13px] font-mono">{agent.name}</span>
                            {agent.isLead && (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#D64B55]/20 text-[#D64B55] border border-[#D64B55]/30">
                                ORCHESTRATOR
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-[11px] font-mono truncate max-w-[180px] ${
                              isDark ? "text-[#737D89]" : "text-[#858C94]"
                            }`}
                          >
                            {agent.role}
                          </div>
                        </div>
                      </div>

                      {/* Status chip */}
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wide flex items-center gap-1 ${
                          agent.status === "working"
                            ? isDark
                              ? "bg-[#1F2B24] text-[#4BA982] border border-[#2B4B3B]"
                              : "bg-[#E6F4EE] text-[#287B5B] border border-[#B7DFCE]"
                            : agent.status === "thinking"
                            ? isDark
                              ? "bg-[#2B2317] text-[#C99A45] border border-[#4B3B22]"
                              : "bg-[#FBF2E6] text-[#9A6A1F] border border-[#E8D4B0]"
                            : agent.status === "awaiting"
                            ? isDark
                              ? "bg-[#271E33] text-[#A855F7] border border-[#4B3566]"
                              : "bg-[#F3EEF9] text-[#78658D] border border-[#D4C7E6]"
                            : isDark
                            ? "bg-[#171C24] text-[#737D89] border border-[#2B333E]"
                            : "bg-[#EAE6DD] text-[#858C94] border border-[#E2DED5]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            agent.status === "working"
                              ? "bg-[#4BA982] animate-pulse"
                              : agent.status === "thinking"
                              ? "bg-[#C99A45] animate-pulse"
                              : "bg-current"
                          }`}
                        />
                        {agent.status}
                      </span>
                    </div>

                    {/* Description */}
                    <p
                      className={`text-[11px] font-sans mt-3 line-clamp-2 leading-relaxed ${
                        isDark ? "text-[#A6AEB8]" : "text-[#626A73]"
                      }`}
                    >
                      {agent.description}
                    </p>

                    {/* Meta Strip: Model, Tools, Skills */}
                    <div className="mt-3 pt-3 border-t border-inherit space-y-1.5 text-[10px] font-mono">
                      <div className="flex justify-between items-center">
                        <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>Model:</span>
                        <span className="font-semibold">{agent.model}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>
                          Tool Access:
                        </span>
                        <span className="font-semibold">{agent.toolCount} verified tools</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>AI Budget:</span>
                        <span className="font-semibold">
                          ${agent.budget.used.toFixed(2)} / ${agent.budget.cap.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Skills pills */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {agent.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                            isDark
                              ? "bg-[#171C24] border-[#2B333E] text-[#A6AEB8]"
                              : "bg-[#FFFFFF] border-[#E2DED5] text-[#626A73]"
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                      {agent.skills.length > 3 && (
                        <span className="text-[9px] font-mono text-[#737D89]">
                          +{agent.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAgentWorkspace(agent);
                      }}
                      className={`flex-1 py-1 px-2 rounded text-[11px] font-mono font-semibold text-center border transition-colors ${
                        isDark
                          ? "bg-[#171C24] border-[#2B333E] hover:border-[#D64B55] text-[#F2F0EA]"
                          : "bg-[#FFFFFF] border-[#E2DED5] hover:border-[#B83D47] text-[#20242A]"
                      }`}
                    >
                      Workspace →
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAgentInStudio(agent);
                      }}
                      title="Edit in Agent Studio"
                      className={`p-1 rounded border transition-colors ${
                        isDark
                          ? "border-[#2B333E] hover:bg-[#171C24] text-[#A6AEB8]"
                          : "border-[#E2DED5] hover:bg-[#FFFFFF] text-[#626A73]"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#927BAA]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div
            className={`rounded-lg border overflow-hidden ${
              isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
            }`}
          >
            <table className="w-full text-left font-mono text-[11px]">
              <thead
                className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                  isDark ? "bg-[#171C24] border-[#2B333E] text-[#737D89]" : "bg-[#F2EFE8] border-[#E2DED5] text-[#858C94]"
                }`}
              >
                <tr>
                  <th className="py-2.5 px-3">Agent</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Tools</th>
                  <th className="py-2.5 px-3">Budget</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {filteredAgents.map((agent) => (
                  <tr
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`transition-colors cursor-pointer ${
                      selectedAgentId === agent.id
                        ? isDark
                          ? "bg-[#1A212B]"
                          : "bg-[#EAE4D7]"
                        : isDark
                        ? "hover:bg-[#151B23]"
                        : "hover:bg-[#F4EFE5]"
                    }`}
                  >
                    <td className="py-2.5 px-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded overflow-hidden border border-inherit shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-bold">{agent.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[#A6AEB8]">{agent.role}</td>
                    <td className="py-2.5 px-3">{agent.model}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          agent.status === "working"
                            ? "text-[#4BA982]"
                            : agent.status === "thinking"
                            ? "text-[#C99A45]"
                            : "text-[#737D89]"
                        }`}
                      >
                        {agent.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{agent.toolCount} tools</td>
                    <td className="py-2.5 px-3 font-semibold">
                      ${agent.budget.used.toFixed(2)} / ${agent.budget.cap.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAgentWorkspace(agent);
                        }}
                        className="text-[#D64B55] hover:underline font-bold mr-3"
                      >
                        Workspace
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAgentInStudio(agent);
                        }}
                        className="text-[#927BAA] hover:underline font-bold"
                      >
                        Studio
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
