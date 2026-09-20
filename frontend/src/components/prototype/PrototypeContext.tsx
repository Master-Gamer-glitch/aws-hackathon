"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type PrimaryRoute = "office" | "tasks" | "agents" | "activity" | "workspace" | "ide";

export type SecondaryRoute =
  | "automations"
  | "agent-studio"
  | "agents-repo"
  | "tools"
  | "skills-repo"
  | "traces"
  | "llm"
  | "env"
  | "usage"
  | "billing"
  | "settings"
  | "resources"
  | null;

export type AgentWorkspaceTab =
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
  | "ide";

export interface PrototypeAgent {
  id: string;
  name: string;
  role: string;
  model: string;
  status: "working" | "idle" | "thinking" | "awaiting" | "success" | "blocked";
  avatar: string;
  accent: string;
  isLead?: boolean;
  description: string;
  toolCount: number;
  skills: string[];
  budget: { cap: number; used: number };
}

export const PROTOTYPE_AGENTS: PrototypeAgent[] = [
  {
    id: "ultron",
    name: "Ultron",
    role: "Supreme Orchestrator & Swarm Commander",
    model: "Claude 3.7 Sonnet",
    status: "working",
    avatar: "/ultron-logo.png",
    accent: "#D64B55",
    isLead: true,
    description: "Orchestrates all agents, decomposes complex DAGs, and enforces AWS Cedar zero-trust security boundaries.",
    toolCount: 14,
    skills: ["Swarm Orchestration", "Cedar Authorization", "AST Decomposition", "Task Routing"],
    budget: { cap: 10.0, used: 2.14 },
  },
  {
    id: "coder",
    name: "Coder",
    role: "Full-Stack Engineer",
    model: "Claude 3.7 Sonnet",
    status: "working",
    avatar: "/characters/coder.png",
    accent: "#38BDF8",
    description: "Synthesizes robust React components, Rust backend handlers, and manages Git workflows.",
    toolCount: 8,
    skills: ["Code Synthesis", "AST Refactoring", "Git Operations", "TypeScript / Rust"],
    budget: { cap: 5.0, used: 1.82 },
  },
  {
    id: "designer",
    name: "Designer",
    role: "Design Systems Architect",
    model: "Claude 3.5 Sonnet",
    status: "idle",
    avatar: "/characters/designer.png",
    accent: "#4BA982",
    description: "Curates design tokens, layout consistency, typography scale, and responsive viewport fidelity.",
    toolCount: 6,
    skills: ["Figma Sync", "Token Linting", "CSS Architecture", "Visual Audits"],
    budget: { cap: 3.0, used: 0.45 },
  },
  {
    id: "qa",
    name: "QA Auditor",
    role: "Verification & Security Specialist",
    model: "Claude 3.5 Haiku",
    status: "working",
    avatar: "/characters/qa.png",
    accent: "#F43F5E",
    description: "Executes test suites, regression scans, boundary fuzzing, and Cedar invariant verification.",
    toolCount: 9,
    skills: ["Cedar Verification", "E2E Testing", "Regression Fuzzing", "Invariant Checks"],
    budget: { cap: 3.0, used: 0.88 },
  },
  {
    id: "rag",
    name: "Research & RAG",
    role: "Knowledge & Memory Synthesizer",
    model: "Claude 3.5 Sonnet",
    status: "thinking",
    avatar: "/characters/research.png",
    accent: "#A855F7",
    description: "Indexes workspace repositories, vector memory embeddings, and synthesizes technical documentation.",
    toolCount: 7,
    skills: ["Vector Search", "Memory Compaction", "Doc Synthesis", "RAG Pipeline"],
    budget: { cap: 4.0, used: 1.12 },
  },
  {
    id: "launch",
    name: "Launch",
    role: "Deployment & Infrastructure Guard",
    model: "Claude 3.5 Haiku",
    status: "awaiting",
    avatar: "/characters/marketing.png",
    accent: "#EAB308",
    description: "Manages staging pipelines, canary deployments, container runtimes, and human authorization gates.",
    toolCount: 5,
    skills: ["Deployment Automation", "Health Checking", "Canary Rollouts", "Rollback Gates"],
    budget: { cap: 3.0, used: 0.64 },
  },
];

interface PrototypeContextType {
  primaryRoute: PrimaryRoute;
  setPrimaryRoute: (route: PrimaryRoute) => void;
  secondaryRoute: SecondaryRoute;
  setSecondaryRoute: (route: SecondaryRoute) => void;
  selectedAgent: PrototypeAgent;
  setSelectedAgent: (agent: PrototypeAgent) => void;
  selectedAgentId: string;
  setSelectedAgentId: (id: string) => void;
  workspaceTab: AgentWorkspaceTab;
  setWorkspaceTab: (tab: AgentWorkspaceTab) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  toggleTheme: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  isAutoMode: boolean;
  setIsAutoMode: (auto: boolean) => void;
  openAgentInStudio: (agent: PrototypeAgent) => void;
  openAgentWorkspace: (agent: PrototypeAgent, tab?: AgentWorkspaceTab) => void;
}

const PrototypeContext = createContext<PrototypeContextType | undefined>(undefined);

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [primaryRoute, setPrimaryRouteState] = useState<PrimaryRoute>("office");
  const [secondaryRoute, setSecondaryRouteState] = useState<SecondaryRoute>(null);
  const [selectedAgentId, setSelectedAgentIdState] = useState<string>("ultron");
  const [workspaceTab, setWorkspaceTab] = useState<AgentWorkspaceTab>("terminal");
  const [isDark, setIsDark] = useState<boolean>(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);

  // Initialize theme from localStorage if available
  useEffect(() => {
    const savedTheme = localStorage.getItem("ultron-theme");
    if (savedTheme) {
      setIsDark(savedTheme !== "classic");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("ultron-theme", next ? "ultron" : "classic");
      return next;
    });
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const selectedAgent =
    PROTOTYPE_AGENTS.find((a) => a.id === selectedAgentId) || PROTOTYPE_AGENTS[0];

  const setSelectedAgent = (agent: PrototypeAgent) => {
    setSelectedAgentIdState(agent.id);
  };

  const setSelectedAgentId = (id: string) => {
    setSelectedAgentIdState(id);
  };

  const setPrimaryRoute = (route: PrimaryRoute) => {
    setPrimaryRouteState(route);
    setSecondaryRouteState(null);
  };

  const setSecondaryRoute = (route: SecondaryRoute) => {
    setSecondaryRouteState(route);
  };

  const openAgentInStudio = (agent: PrototypeAgent) => {
    setSelectedAgent(agent);
    setSecondaryRouteState("agent-studio");
  };

  const openAgentWorkspace = (agent: PrototypeAgent, tab: AgentWorkspaceTab = "terminal") => {
    setSelectedAgent(agent);
    setWorkspaceTab(tab);
    setPrimaryRouteState("workspace");
    setSecondaryRouteState(null);
  };

  return (
    <PrototypeContext.Provider
      value={{
        primaryRoute,
        setPrimaryRoute,
        secondaryRoute,
        setSecondaryRoute,
        selectedAgent,
        setSelectedAgent,
        selectedAgentId,
        setSelectedAgentId,
        workspaceTab,
        setWorkspaceTab,
        isDark,
        setIsDark,
        toggleTheme,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
        isAutoMode,
        setIsAutoMode,
        openAgentInStudio,
        openAgentWorkspace,
      }}
    >
      {children}
    </PrototypeContext.Provider>
  );
}

export function usePrototype() {
  const context = useContext(PrototypeContext);
  if (!context) {
    throw new Error("usePrototype must be used within a PrototypeProvider");
  }
  return context;
}
