"use client";

import React, { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Wrench,
  Minimize2,
  PanelLeftClose,
  PanelLeft,
  ArrowLeft,
  User,
  Shield,
  HelpCircle,
  LogOut,
  Workflow,
  Sparkles,
  Bot,
  BookOpen,
  Activity as ActivityIcon,
  Cpu,
  KeyRound,
  BarChart3,
  CreditCard,
  Settings,
  FolderArchive,
  Code2,
  Terminal as TerminalIcon,
  Layers,
} from "lucide-react";
import AgentSidebar from "./AgentSidebar";

// Sub-pages: Agent Workspace Tools
import Terminal from "./Terminal";
import Monitor from "./Monitor";
import Tasks from "./Tasks";
import AskMe from "./AskMe";
import Triggers from "./Triggers";
import Memory from "./Memory";
import Graph from "./Graph";
import Activity from "./Activity";
import Skills from "./Skills";
import Temps from "./Temps";

// Sub-pages: Build Section
import AutomationsView from "../../prototype/build/AutomationsView";
import AgentStudioView from "../../prototype/build/AgentStudioView";
import AgentsRepositoryView from "../../prototype/build/AgentsRepositoryView";
import ToolsIntegrationsView from "../../prototype/build/ToolsIntegrationsView";
import SkillsRepositoryView from "../../prototype/build/SkillsRepositoryView";

// Sub-pages: Operate Section
import TracesView from "../../prototype/operate/TracesView";
import LLMConnectionsView from "../../prototype/operate/LLMConnectionsView";
import EnvVariablesView from "../../prototype/operate/EnvVariablesView";

// Sub-pages: Manage Section
import UsageView from "../../prototype/manage/UsageView";
import BillingView from "../../prototype/manage/BillingView";
import SettingsView from "../../prototype/manage/SettingsView";
import ResourcesView from "../../prototype/manage/ResourcesView";

// Sub-pages: IDE
import UltronIDEView from "../../prototype/ide/UltronIDEView";

import { PrototypeProvider } from "../../prototype/PrototypeContext";

export type MissionCategory = "agent-tools" | "build" | "operate" | "manage" | "ide";

export type MissionTab =
  // Agent Workspace
  | "terminal"
  | "monitor"
  | "tasks"
  | "ask-me"
  | "triggers"
  | "memory"
  | "graph"
  | "activity"
  | "skills"
  | "temps"
  // Build
  | "automations"
  | "agent-studio"
  | "agents-repo"
  | "tools"
  | "skills-repo"
  // Operate
  | "traces"
  | "llm"
  | "env"
  // Manage
  | "usage"
  | "billing"
  | "settings"
  | "resources"
  // IDE
  | "ide";

interface MissionControlViewProps {
  isDark?: boolean;
  onToggleTheme?: () => void;
  onExitFocusMode?: () => void;
  initialTab?: MissionTab;
  onTabChange?: (tab: MissionTab) => void;
  agents?: any[];
  selectedAgentId?: string;
  onSelectAgent?: (id: string) => void;
  onAddAgent?: () => void;
}

export default function MissionControlView(props: MissionControlViewProps) {
  return (
    <PrototypeProvider>
      <MissionControlViewContent {...props} />
    </PrototypeProvider>
  );
}

function MissionControlViewContent({
  isDark: propIsDark,
  onToggleTheme: propOnToggleTheme,
  onExitFocusMode,
  initialTab = "terminal",
  onTabChange,
  agents = [],
  selectedAgentId,
  onSelectAgent,
  onAddAgent,
}: MissionControlViewProps) {
  const [activeCategory, setActiveCategory] = useState<MissionCategory>(() => {
    if (["automations", "agent-studio", "agents-repo", "tools", "skills-repo"].includes(initialTab)) return "build";
    if (["traces", "llm", "env"].includes(initialTab)) return "operate";
    if (["usage", "billing", "settings", "resources"].includes(initialTab)) return "manage";
    if (initialTab === "ide") return "ide";
    return "agent-tools";
  });

  const [activeTab, setActiveTab] = useState<MissionTab>(initialTab);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true);

  // Internal theme handling with localStorage & HTML class synchronization
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof propIsDark === "boolean") return propIsDark;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("crewdesk-theme");
      if (saved) return saved === "dark";
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  // Sync theme with document.documentElement
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("crewdesk-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("crewdesk-theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    if (typeof propIsDark === "boolean") {
      setIsDark(propIsDark);
      if (propIsDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [propIsDark]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleToggleTheme = () => {
    if (propOnToggleTheme) {
      propOnToggleTheme();
    } else {
      setIsDark((prev) => {
        const next = !prev;
        if (next) {
          document.documentElement.classList.add("dark");
          localStorage.setItem("crewdesk-theme", "dark");
        } else {
          document.documentElement.classList.remove("dark");
          localStorage.setItem("crewdesk-theme", "light");
        }
        return next;
      });
    }
  };

  const handleCategorySelect = (category: MissionCategory) => {
    setActiveCategory(category);
    switch (category) {
      case "agent-tools":
        setActiveTab("terminal");
        break;
      case "build":
        setActiveTab("automations");
        break;
      case "operate":
        setActiveTab("traces");
        break;
      case "manage":
        setActiveTab("usage");
        break;
      case "ide":
        setActiveTab("ide");
        break;
    }
  };

  const handleTabSelect = (tab: MissionTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const handleExit = () => {
    if (onExitFocusMode) {
      onExitFocusMode();
    } else if (typeof window !== "undefined") {
      window.location.href = "/office";
    }
  };

  // Sub-tabs configuration based on active category
  const getSubTabs = () => {
    switch (activeCategory) {
      case "agent-tools":
        return [
          { id: "terminal", label: "Terminal", icon: "terminal" },
          { id: "monitor", label: "Monitor", icon: "monitoring" },
          { id: "tasks", label: "Tasks", icon: "format_list_bulleted" },
          { id: "ask-me", label: "Ask Me", icon: "chat" },
          { id: "triggers", label: "Triggers", icon: "flash_on" },
          { id: "memory", label: "Memory", icon: "memory" },
          { id: "graph", label: "Graph", icon: "schema" },
          { id: "activity", label: "Activity", icon: "history" },
          { id: "skills", label: "Skills", icon: "psychology" },
          { id: "temps", label: "Temps", icon: "layers" },
        ];
      case "build":
        return [
          { id: "automations", label: "Automations", icon: "sync" },
          { id: "agent-studio", label: "Agent Studio", icon: "auto_awesome" },
          { id: "agents-repo", label: "Agents Repository", icon: "smart_toy" },
          { id: "tools", label: "Tools & Integrations", icon: "build" },
          { id: "skills-repo", label: "Skills Repository", icon: "menu_book" },
        ];
      case "operate":
        return [
          { id: "traces", label: "Traces", icon: "timeline" },
          { id: "llm", label: "LLM Connections", icon: "memory" },
          { id: "env", label: "Environment Variables", icon: "key" },
        ];
      case "manage":
        return [
          { id: "usage", label: "Usage", icon: "bar_chart" },
          { id: "billing", label: "Billing & Budget", icon: "credit_card" },
          { id: "settings", label: "Settings", icon: "settings" },
          { id: "resources", label: "Resources", icon: "folder" },
        ];
      case "ide":
        return [{ id: "ide", label: "Ultron Workspace Editor & CLI", icon: "code" }];
    }
  };

  const subTabs = getSubTabs();

  return (
    <div
      data-lenis-prevent="true"
      className="fixed inset-0 h-screen w-screen overflow-hidden flex flex-col font-sans z-50 bg-crew-bg text-crew-text transition-colors duration-150"
    >
      {/* 1. TOP NAVBAR IN MISSION CONTROL */}
      <header className="h-[48px] px-3 sm:px-4 bg-crew-surface border-b border-crew-border flex items-center justify-between shrink-0 select-none z-50 transition-colors">
        {/* Left: Return to Office Floor + Category Tabs */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={handleExit}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-crew-primary-soft text-crew-primary border border-crew-primary/30 text-xs font-mono font-bold transition-all hover:-translate-x-0.5 shadow-subtle cursor-pointer shrink-0"
            title="Return to Live Office Floor"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← OFFICE FLOOR</span>
          </button>

          {/* Ultron Mission Control Brand */}
          <div className="hidden md:flex items-center gap-2 pr-3 border-r border-crew-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ultron-logo.png" alt="Ultron" className="w-4 h-4 object-contain" />
            <span className="font-display font-bold text-[12px] tracking-wider">
              MISSION CONTROL
            </span>
          </div>

          {/* Category Tabs: AGENT TOOLS | BUILD | OPERATE | MANAGE | IDE */}
          <nav className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: "agent-tools", label: "AGENT WORKSPACE", icon: Bot },
              { id: "build", label: "BUILD", icon: Workflow },
              { id: "operate", label: "OPERATE", icon: ActivityIcon },
              { id: "manage", label: "MANAGE", icon: BarChart3 },
              { id: "ide", label: "IDE", icon: Code2 },
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id as MissionCategory)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-control text-[11px] font-mono font-bold tracking-wide transition-all border whitespace-nowrap ${
                    isActive
                      ? "bg-crew-card text-crew-primary border-crew-border shadow-subtle"
                      : "border-transparent text-crew-text-secondary hover:text-crew-text hover:bg-crew-hover"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Auto toggle, Theme, Exit, Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Autonomous Status Pill */}
          <button
            type="button"
            onClick={() => setIsAutoMode(!isAutoMode)}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-control border text-[11px] font-mono transition-colors ${
              isAutoMode
                ? "bg-crew-success-soft border-crew-success/30 text-crew-success"
                : "bg-crew-surface-secondary border-crew-border text-crew-text-muted"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isAutoMode ? "bg-crew-success animate-pulse" : "bg-current"}`} />
            <span className="font-bold">{isAutoMode ? "AUTO" : "MANUAL"}</span>
          </button>

          {/* Sidebar Toggle (Only active on Agent Workspace) */}
          {activeCategory === "agent-tools" && (
            <button
              type="button"
              onClick={() => setShowSidebar(!showSidebar)}
              className="w-7 h-7 rounded-control flex items-center justify-center text-crew-text-secondary hover:text-crew-text hover:bg-crew-hover border border-crew-border transition-colors"
              title={showSidebar ? "Hide Agent Sidebar" : "Show Agent Sidebar"}
            >
              {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={handleToggleTheme}
            className="w-7 h-7 rounded-control flex items-center justify-center text-crew-text-secondary hover:text-crew-text hover:bg-crew-hover border border-crew-border transition-colors"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Exit / Minimize Button */}
          <button
            type="button"
            onClick={handleExit}
            className="w-7 h-7 rounded-control flex items-center justify-center bg-crew-primary-soft text-crew-primary hover:bg-crew-hover border border-crew-primary/30 transition-colors"
            title="Return to Office Floor"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. ROW 2: SUB-NAVIGATION TABS */}
      <div className="h-[38px] px-3 sm:px-4 bg-crew-surface-secondary border-b border-crew-border flex items-center gap-1 overflow-x-auto shrink-0 select-none transition-colors">
        {subTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabSelect(tab.id as MissionTab)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-control text-[11px] font-mono whitespace-nowrap transition-colors border ${
                isActive
                  ? "bg-crew-card border-crew-border text-crew-primary font-bold shadow-subtle"
                  : "border-transparent text-crew-text-secondary hover:text-crew-text hover:bg-crew-hover font-medium"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. MAIN WORKSPACE CONTENT */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Agent Sidebar (Visible when on AGENT TOOLS) */}
        {activeCategory === "agent-tools" && showSidebar && (
          <AgentSidebar
            agents={agents as any}
            selectedAgentId={selectedAgentId}
            onSelectAgent={onSelectAgent}
            onAddAgent={onAddAgent}
          />
        )}

        {/* Center / Main Content Body */}
        <main
          data-lenis-prevent="true"
          className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0 bg-crew-bg select-text transition-colors duration-150"
        >
          {/* Agent Tools */}
          {activeTab === "terminal" && <Terminal />}
          {activeTab === "monitor" && <Monitor />}
          {activeTab === "tasks" && <Tasks />}
          {activeTab === "ask-me" && <AskMe />}
          {activeTab === "triggers" && <Triggers />}
          {activeTab === "memory" && <Memory />}
          {activeTab === "graph" && <Graph agents={agents} isDark={isDark} />}
          {activeTab === "activity" && <Activity />}
          {activeTab === "skills" && <Skills />}
          {activeTab === "temps" && <Temps />}

          {/* Build Views */}
          {activeTab === "automations" && <AutomationsView />}
          {activeTab === "agent-studio" && <AgentStudioView />}
          {activeTab === "agents-repo" && <AgentsRepositoryView />}
          {activeTab === "tools" && <ToolsIntegrationsView />}
          {activeTab === "skills-repo" && <SkillsRepositoryView />}

          {/* Operate Views */}
          {activeTab === "traces" && <TracesView />}
          {activeTab === "llm" && <LLMConnectionsView />}
          {activeTab === "env" && <EnvVariablesView />}

          {/* Manage Views */}
          {activeTab === "usage" && <UsageView />}
          {activeTab === "billing" && <BillingView />}
          {activeTab === "settings" && <SettingsView />}
          {activeTab === "resources" && <ResourcesView />}

          {/* IDE View */}
          {activeTab === "ide" && <UltronIDEView />}
        </main>
      </div>
    </div>
  );
}
