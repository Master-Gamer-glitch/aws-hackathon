"use client";

import React from "react";
import {
  Workflow,
  Sparkles,
  Bot,
  Wrench,
  BookOpen,
  Activity,
  Cpu,
  KeyRound,
  BarChart3,
  CreditCard,
  Settings,
  FolderArchive,
  ChevronLeft,
  ChevronRight,
  Code2,
  Terminal,
} from "lucide-react";
import { usePrototype, SecondaryRoute } from "../PrototypeContext";

interface NavGroup {
  title: string;
  items: {
    id: SecondaryRoute;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: string | number;
  }[];
}

export default function SecondarySidebar() {
  const {
    secondaryRoute,
    setSecondaryRoute,
    setPrimaryRoute,
    primaryRoute,
    isDark,
    isSidebarCollapsed,
    toggleSidebar,
    selectedAgent,
  } = usePrototype();

  const groups: NavGroup[] = [
    {
      title: "BUILD",
      items: [
        { id: "automations", label: "Automations", icon: Workflow, count: "4" },
        { id: "agent-studio", label: "Agent Studio", icon: Sparkles },
        { id: "agents-repo", label: "Agents Repository", icon: Bot, count: "6" },
        { id: "tools", label: "Tools & Integrations", icon: Wrench, count: "12" },
        { id: "skills-repo", label: "Skills Repository", icon: BookOpen, count: "8" },
      ],
    },
    {
      title: "OPERATE",
      items: [
        { id: "traces", label: "Traces", icon: Activity, count: "Live" },
        { id: "llm", label: "LLM Connections", icon: Cpu, count: "4" },
        { id: "env", label: "Environment Variables", icon: KeyRound },
      ],
    },
    {
      title: "MANAGE",
      items: [
        { id: "usage", label: "Usage", icon: BarChart3 },
        { id: "billing", label: "Billing", icon: CreditCard },
        { id: "settings", label: "Settings", icon: Settings },
        { id: "resources", label: "Resources", icon: FolderArchive },
      ],
    },
  ];

  return (
    <aside
      className={`border-r flex flex-col justify-between shrink-0 select-none transition-all duration-200 z-30 ${
        isSidebarCollapsed ? "w-[56px]" : "w-[220px]"
      } ${
        isDark
          ? "bg-[#10141A] border-[#2B333E] text-[#F2F0EA]"
          : "bg-[#FBFAF7] border-[#E2DED5] text-[#20242A]"
      }`}
    >
      {/* Upper Navigation List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-4">
        {groups.map((group) => (
          <div key={group.title} className="px-2">
            {!isSidebarCollapsed && (
              <div
                className={`px-2.5 pb-1 text-[10px] font-mono font-bold tracking-wider uppercase ${
                  isDark ? "text-[#737D89]" : "text-[#858C94]"
                }`}
              >
                {group.title}
              </div>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = secondaryRoute === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSecondaryRoute(item.id)}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[12px] font-mono transition-all text-left ${
                      isActive
                        ? isDark
                          ? "bg-[#171C24] text-[#D64B55] font-semibold border border-[#2B333E]"
                          : "bg-[#FFFFFF] text-[#B83D47] font-semibold border border-[#E2DED5] shadow-xs"
                        : isDark
                        ? "text-[#A6AEB8] hover:text-[#F2F0EA] hover:bg-[#141922] border border-transparent"
                        : "text-[#626A73] hover:text-[#20242A] hover:bg-[#F2EFE8] border border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isSidebarCollapsed && (
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <span className="truncate">{item.label}</span>
                        {item.count && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              item.count === "Live"
                                ? isDark
                                  ? "bg-[#172B23] text-[#4BA982]"
                                  : "bg-[#E6F4EE] text-[#287B5B]"
                                : isDark
                                ? "bg-[#171C24] text-[#737D89]"
                                : "bg-[#EAE6DD] text-[#858C94]"
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Context Strip: Selected Agent Workspace & IDE Shortcuts */}
      <div
        className={`p-2 border-t shrink-0 space-y-1 ${
          isDark ? "border-[#2B333E] bg-[#0D1015]" : "border-[#E2DED5] bg-[#F4F2ED]"
        }`}
      >
        {/* Agent Workspace Quick Jump */}
        <button
          type="button"
          onClick={() => {
            setSecondaryRoute(null);
            setPrimaryRoute("workspace");
          }}
          title={isSidebarCollapsed ? `${selectedAgent.name} Workspace` : undefined}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] font-mono border transition-all ${
            primaryRoute === "workspace" && !secondaryRoute
              ? isDark
                ? "bg-[#1B212D] border-[#D64B55] text-[#F2F0EA]"
                : "bg-[#FFFFFF] border-[#B83D47] text-[#20242A]"
              : isDark
              ? "bg-[#12161D] border-[#2B333E] text-[#A6AEB8] hover:text-[#F2F0EA]"
              : "bg-[#FBFAF7] border-[#E2DED5] text-[#626A73] hover:text-[#20242A]"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedAgent.avatar}
            alt={selectedAgent.name}
            className="w-4 h-4 rounded-full object-cover shrink-0"
          />
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0 text-left">
              <div className="font-bold truncate text-[11px]">{selectedAgent.name}</div>
              <div className={`text-[9px] truncate ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                Workspace View
              </div>
            </div>
          )}
        </button>

        {/* IDE Quick Jump */}
        <button
          type="button"
          onClick={() => {
            setSecondaryRoute(null);
            setPrimaryRoute("ide");
          }}
          title={isSidebarCollapsed ? "Ultron IDE" : undefined}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] font-mono border transition-all ${
            primaryRoute === "ide" && !secondaryRoute
              ? isDark
                ? "bg-[#1E192B] border-[#927BAA] text-[#C4B5FD]"
                : "bg-[#F3EEF9] border-[#78658D] text-[#6D28D9]"
              : isDark
              ? "bg-[#12161D] border-[#2B333E] text-[#A6AEB8] hover:text-[#F2F0EA]"
              : "bg-[#FBFAF7] border-[#E2DED5] text-[#626A73] hover:text-[#20242A]"
          }`}
        >
          <Code2 className="w-4 h-4 shrink-0 text-[#927BAA]" />
          {!isSidebarCollapsed && (
            <span className="font-semibold text-[11px]">Ultron IDE</span>
          )}
        </button>

        {/* Collapse toggle button at bottom */}
        <button
          type="button"
          onClick={toggleSidebar}
          className={`w-full flex items-center justify-center py-1 rounded text-[10px] font-mono transition-colors ${
            isDark
              ? "text-[#737D89] hover:text-[#F2F0EA] hover:bg-[#171C24]"
              : "text-[#858C94] hover:text-[#20242A] hover:bg-[#FFFFFF]"
          }`}
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <div className="flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Collapse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
