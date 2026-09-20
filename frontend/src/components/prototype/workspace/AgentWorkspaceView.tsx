"use client";

import React, { useState } from "react";
import {
  Terminal as TerminalIcon,
  Activity as MonitorIcon,
  CheckSquare,
  HelpCircle,
  Zap,
  Brain,
  Share2,
  ListFilter,
  Wrench,
  Thermometer,
  ChevronDown,
  Bot,
  Maximize2,
} from "lucide-react";
import { usePrototype, PROTOTYPE_AGENTS, AgentWorkspaceTab } from "../PrototypeContext";

// Import existing mission control components
import Terminal from "../../office/mission-control/Terminal";
import Monitor from "../../office/mission-control/Monitor";
import Tasks from "../../office/mission-control/Tasks";
import AskMe from "../../office/mission-control/AskMe";
import Triggers from "../../office/mission-control/Triggers";
import Memory from "../../office/mission-control/Memory";
import Graph from "../../office/mission-control/Graph";
import Activity from "../../office/mission-control/Activity";
import Skills from "../../office/mission-control/Skills";
import Temps from "../../office/mission-control/Temps";

export default function AgentWorkspaceView() {
  const {
    isDark,
    selectedAgent,
    setSelectedAgent,
    workspaceTab,
    setWorkspaceTab,
  } = usePrototype();

  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const primaryTabs: { id: AgentWorkspaceTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "terminal", label: "Terminal", icon: TerminalIcon },
    { id: "monitor", label: "Monitor", icon: MonitorIcon },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "ask-me", label: "Ask Me", icon: HelpCircle },
  ];

  const secondaryTabs: { id: AgentWorkspaceTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "triggers", label: "Triggers", icon: Zap },
    { id: "memory", label: "Memory", icon: Brain },
    { id: "graph", label: "Graph", icon: Share2 },
    { id: "activity", label: "Activity", icon: ListFilter },
    { id: "skills", label: "Skills", icon: Wrench },
    { id: "temps", label: "Temps", icon: Thermometer },
  ];

  const isSecondaryActive = secondaryTabs.some((t) => t.id === workspaceTab);
  const activeSecondaryTab = secondaryTabs.find((t) => t.id === workspaceTab);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Clean, Minimal Agent Workspace Header Strip (NO giant banner!) */}
      <div
        className={`h-[40px] px-3 border-b flex items-center justify-between shrink-0 select-none transition-colors ${
          isDark
            ? "bg-[#12161D] border-[#2B333E] text-[#F2F0EA]"
            : "bg-[#FBFAF7] border-[#E2DED5] text-[#20242A]"
        }`}
      >
        {/* Left: Compact Agent Selector */}
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedAgent.avatar}
            alt={selectedAgent.name}
            className="w-5 h-5 rounded-full object-cover border border-inherit"
          />
          <div className="flex items-center gap-1.5">
            <select
              value={selectedAgent.id}
              onChange={(e) => {
                const found = PROTOTYPE_AGENTS.find((a) => a.id === e.target.value);
                if (found) setSelectedAgent(found);
              }}
              className="bg-transparent font-mono font-bold text-[12px] focus:outline-none cursor-pointer"
            >
              {PROTOTYPE_AGENTS.map((ag) => (
                <option key={ag.id} value={ag.id} className={isDark ? "bg-[#12161D]" : "bg-[#FFFFFF]"}>
                  {ag.name} ({ag.role})
                </option>
              ))}
            </select>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                selectedAgent.status === "working"
                  ? "text-[#4BA982] bg-[#4BA982]/10"
                  : selectedAgent.status === "thinking"
                  ? "text-[#C99A45] bg-[#C99A45]/10"
                  : "text-[#737D89] bg-[#737D89]/10"
              }`}
            >
              {selectedAgent.status}
            </span>
          </div>
        </div>

        {/* Right: Clean Workspace Navigation Tabs */}
        <div className="flex items-center gap-1">
          {/* Primary Tabs */}
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = workspaceTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setWorkspaceTab(tab.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                  isActive
                    ? isDark
                      ? "bg-[#171C24] text-[#D64B55] font-bold border border-[#2B333E]"
                      : "bg-[#FFFFFF] text-[#B83D47] font-bold border border-[#E2DED5] shadow-xs"
                    : isDark
                    ? "text-[#A6AEB8] hover:text-[#F2F0EA] hover:bg-[#151B23]"
                    : "text-[#626A73] hover:text-[#20242A] hover:bg-[#F2EFE8]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* Secondary / More Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
                isSecondaryActive
                  ? isDark
                    ? "bg-[#171C24] text-[#D64B55] font-bold border-[#2B333E]"
                    : "bg-[#FFFFFF] text-[#B83D47] font-bold border-[#E2DED5]"
                  : isDark
                  ? "border-transparent text-[#A6AEB8] hover:text-[#F2F0EA] hover:bg-[#151B23]"
                  : "border-transparent text-[#626A73] hover:text-[#20242A] hover:bg-[#F2EFE8]"
              }`}
            >
              <span>{isSecondaryActive ? activeSecondaryTab?.label : "More"}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isMoreOpen && (
              <div
                className={`absolute right-0 top-full mt-1 w-40 rounded-lg border shadow-xl p-1 z-50 font-mono text-[11px] ${
                  isDark
                    ? "bg-[#12161D] border-[#2B333E] text-[#F2F0EA]"
                    : "bg-[#FBFAF7] border-[#E2DED5] text-[#20242A]"
                }`}
              >
                {secondaryTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = workspaceTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setWorkspaceTab(tab.id);
                        setIsMoreOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-colors ${
                        isActive
                          ? isDark
                            ? "bg-[#171C24] text-[#D64B55] font-bold"
                            : "bg-[#FFFFFF] text-[#B83D47] font-bold"
                          : isDark
                          ? "hover:bg-[#171C24] text-[#A6AEB8] hover:text-[#F2F0EA]"
                          : "hover:bg-[#F2EFE8] text-[#626A73] hover:text-[#20242A]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area: Renders the active workspace tool */}
      <div className="flex-1 overflow-auto min-h-0 bg-crew-bg">
        {workspaceTab === "terminal" && <Terminal />}
        {workspaceTab === "monitor" && <Monitor />}
        {workspaceTab === "tasks" && <Tasks />}
        {workspaceTab === "ask-me" && <AskMe />}
        {workspaceTab === "triggers" && <Triggers />}
        {workspaceTab === "memory" && <Memory />}
        {workspaceTab === "graph" && <Graph />}
        {workspaceTab === "activity" && <Activity />}
        {workspaceTab === "skills" && <Skills />}
        {workspaceTab === "temps" && <Temps />}
      </div>
    </div>
  );
}
