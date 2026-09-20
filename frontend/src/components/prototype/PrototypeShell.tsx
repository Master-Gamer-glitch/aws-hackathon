"use client";

import React from "react";
import { usePrototype } from "./PrototypeContext";
import PrimaryNavbar from "./nav/PrimaryNavbar";
import SecondarySidebar from "./nav/SecondarySidebar";

// Primary Views
import OfficeView from "./primary/OfficeView";
import TasksView from "./primary/TasksView";
import ActivityView from "./primary/ActivityView";

// Build Section Views
import AutomationsView from "./build/AutomationsView";
import AgentStudioView from "./build/AgentStudioView";
import AgentsRepositoryView from "./build/AgentsRepositoryView";
import ToolsIntegrationsView from "./build/ToolsIntegrationsView";
import SkillsRepositoryView from "./build/SkillsRepositoryView";

// Operate Section Views
import TracesView from "./operate/TracesView";
import LLMConnectionsView from "./operate/LLMConnectionsView";
import EnvVariablesView from "./operate/EnvVariablesView";

// Manage Section Views
import UsageView from "./manage/UsageView";
import BillingView from "./manage/BillingView";
import SettingsView from "./manage/SettingsView";
import ResourcesView from "./manage/ResourcesView";

// Workspace & IDE
import AgentWorkspaceView from "./workspace/AgentWorkspaceView";
import UltronIDEView from "./ide/UltronIDEView";

export default function PrototypeShell() {
  const { primaryRoute, secondaryRoute, isDark } = usePrototype();

  const renderContent = () => {
    // 1. Secondary Route takes precedence when selected
    if (secondaryRoute) {
      switch (secondaryRoute) {
        case "automations":
          return <AutomationsView />;
        case "agent-studio":
          return <AgentStudioView />;
        case "agents-repo":
          return <AgentsRepositoryView />;
        case "tools":
          return <ToolsIntegrationsView />;
        case "skills-repo":
          return <SkillsRepositoryView />;
        case "traces":
          return <TracesView />;
        case "llm":
          return <LLMConnectionsView />;
        case "env":
          return <EnvVariablesView />;
        case "usage":
          return <UsageView />;
        case "billing":
          return <BillingView />;
        case "settings":
          return <SettingsView />;
        case "resources":
          return <ResourcesView />;
      }
    }

    // 2. Otherwise render the active Primary Route
    switch (primaryRoute) {
      case "office":
        return <OfficeView />;
      case "tasks":
        return <TasksView />;
      case "agents":
        return <AgentsRepositoryView />;
      case "activity":
        return <ActivityView />;
      case "workspace":
        return <AgentWorkspaceView />;
      case "ide":
        return <UltronIDEView />;
      default:
        return <OfficeView />;
    }
  };

  return (
    <div
      className={`w-full h-screen flex flex-col overflow-hidden font-sans select-none transition-colors ${
        isDark ? "bg-[#0D1015] text-[#F2F0EA]" : "bg-[#F4F2ED] text-[#20242A]"
      }`}
    >
      {/* 1. Minimal Primary Top Navigation */}
      <PrimaryNavbar />

      {/* 2. Main Body with Collapsible Secondary Sidebar & Content Viewport */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <SecondarySidebar />
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
