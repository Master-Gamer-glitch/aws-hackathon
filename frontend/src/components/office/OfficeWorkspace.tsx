"use client";

import React, { useState, useEffect, useRef, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Wrench,
  Users,
  Plus,
  Mic,
  Info,
  Code2,
  Play,
  Volume2,
  ArrowRight,
  Laptop,
  Server,
  Cpu,
  Radio,
  Wifi,
  HardDrive,
  ShieldCheck,
  Clock,
  ChevronDown,
  LayoutDashboard,
  Boxes,
} from "lucide-react";
import MissionControlView from "./mission-control/MissionControlView";
import Monitor from "./mission-control/Monitor";
import Tasks from "./mission-control/Tasks";
import AskMe from "./mission-control/AskMe";
import Triggers from "./mission-control/Triggers";
import Memory from "./mission-control/Memory";
import Graph from "./mission-control/Graph";
import Activity from "./mission-control/Activity";
import Skills from "./mission-control/Skills";
import Temps from "./mission-control/Temps";
import UltronIDE from "./UltronIDE";
import { AddAgentModal, type NewAgentData } from "./AddAgentModal";

// ── Live office engine (ported from the working aws-hackathon-frontend) ─────────
// OFFICE ENVIRONMENT  → @office/scene/office/*   (Pixi tile map, seats, coffee economy)
// CHARACTER STATE     → @office/store/store      (zustand: status/action/station per agent)
// AGENT DATA          → @office/crewdesk/roster  (who is on the floor + CrewDesk presentation)
// TASK DATA           → @office/bridge/mockLedger (swap for the CrewDesk backend)
import { OfficeFloor } from "@office/scene/office/OfficeFloor";
import { useStore, type Agent } from "@office/store/store";
import type { StatusKind } from "@office/store/statusKind";
import { startLiveOffice } from "@office/runtime";
import { metaFor, type CrewMeta } from "@office/crewdesk/roster";
import {
  getLedger,
  subscribeLedger,
  addLedgerTask,
  resolveBlocked,
  setAutoApprove,
} from "@office/bridge/mockLedger";

/** What the CrewDesk UI renders for one agent — derived from the live store, never stored. */
interface AgentView extends CrewMeta {
  name: string;
  status: StatusKind;
  /** Human-readable state (idle / walking / working / awaiting / …). */
  state: string;
  action: string;
  isGod: boolean;
}

const ANSI = /\x1b\[[0-9;]*m/g;
const stripAnsi = (s: string) => s.replace(ANSI, "");

/**
 * Map the engine's run-state (StatusKind + current action) to CrewDesk's display
 * vocabulary. This is a *view* over the one state machine in the store — there is
 * deliberately no second state system.
 */
function describeState(agent: Agent, meta: CrewMeta): string {
  const action = agent.action ?? "";
  switch (agent.status) {
    case "blocked":
      return "blocked";
    case "waiting":
      return "awaiting";
    case "success":
      return "completed";
    case "thinking":
      if (action.startsWith("approved")) return "approved";
      if (action.startsWith("heading")) return "walking";
      return "starting up";
    case "working":
      if (meta.focus === "reviewing") return "reviewing";
      if (meta.focus === "researching") return "researching";
      if (meta.focus === "coordinating") return "coordinating";
      return "working";
    case "idle":
      return action === "awaiting" ? "awaiting" : "idle";
    default:
      return agent.status;
  }
}

const STATE_COLOR: Record<string, string> = {
  idle: "text-slate-400",
  walking: "text-sky-400",
  "starting up": "text-cyan-400",
  working: "text-amber-400",
  coordinating: "text-amber-400",
  reviewing: "text-emerald-400",
  researching: "text-violet-400",
  awaiting: "text-yellow-300",
  completed: "text-emerald-400",
  approved: "text-emerald-400",
  blocked: "text-red-400",
};

/** Where an agent currently is, in office terms. */
function describeLocation(agent: Agent, meta: CrewMeta): string {
  switch (agent.currentStation) {
    case "shelf": return "Archive shelf";
    case "terminal": return "Terminal bay";
    case "web": return "Web research bay";
    case "board": return "Task board";
    case "mailbox": return "Mailroom";
    case "mcp": return "Tool rack";
    default: return agent.isGod ? "Command Center" : `${meta.area} desk`;
  }
}

const BOOT_LOG = [
  "⚡ ULTRON SWARM RUNTIME v3.2.0 [INITIALIZED]",
  "Supreme Orchestrator: ULTRON (Head of All Agents)",
  "Engine: Claude 3.7 Sonnet (Hybrid Reasoning · 1M Context)",
  "Workspace: ~/workspace/CareFlow · Active Sub-agents: 5 online",
  "Security Boundary: AWS Cedar Policy Enforced · Circuit Breakers: $5.00 Cap Armed",
  "",
  "> You are online as ULTRON, Supreme Orchestrator of the swarm.",
  "1. Review task DAG contracts in tasks.json and assign them to specialized sub-agents.",
  "2. Coordinate Coder, Designer, QA Auditor, and Research agents via mesh channels.",
  "3. Enforce Cedar security invariants before any file mutations or command execution.",
  "4. Maintain the unified shared memory and knowledge graph embeddings.",
  "",
  "• All sub-agents synchronized: Coder (ready), QA (ready), Design (ready), RAG (ready).",
  "• Ultron Swarm listening on pty-ultron-master. Awaiting mission directives...",
  "",
  "> ultron status --all",
  "✓ Swarm status: NOMINAL · 6 agent pods healthy · 0 policy violations · Budget remaining: $3.82",
];

const NEW_AGENT_CHARACTERS: Agent["character"][] = ["kevin", "oscar", "phyllis", "andy", "toby", "kelly"];
const NEW_AGENT_ACCENTS: Agent["accent"][] = ["sky", "mint", "peach", "coral", "lilac", "lemon"];

interface ConnectedDevice {
  id: string;
  name: string;
  type: "workstation" | "microvm" | "gateway" | "pty" | "gpu";
  icon: "laptop" | "server" | "cpu" | "harddrive" | "activity";
  subtitle: string;
  badge: string;
  badgeType: "online" | "sandbox" | "synced" | "pty" | "custom";
  dotColor: string;
  metric1Label: string;
  metric1Key: "cpu" | "vcpu" | "ctx" | "buffer" | "custom";
  metric1Value?: string;
  metric1Color: string;
  metric2Label: string;
  metric2Key: "ram" | "policy" | "latency" | "port" | "custom";
  metric2Value?: string;
  metric2Color: string;
}

const INITIAL_DEVICES: ConnectedDevice[] = [
  {
    id: "dev-mac",
    name: "MacBook Pro M3",
    type: "workstation",
    icon: "laptop",
    subtitle: "Host Workstation · macOS",
    badge: "ONLINE",
    badgeType: "online",
    dotColor: "bg-[#4BA982]",
    metric1Label: "CPU:",
    metric1Key: "cpu",
    metric1Color: "text-[#4BA982]",
    metric2Label: "RAM:",
    metric2Key: "ram",
    metric2Color: "text-[#F2F0EB]",
  },
  {
    id: "dev-microvm",
    name: "AWS MicroVM #04",
    type: "microvm",
    icon: "server",
    subtitle: "us-east-1 · Cedar Bound",
    badge: "SANDBOX",
    badgeType: "sandbox",
    dotColor: "bg-[#6B99A8]",
    metric1Label: "vCPU:",
    metric1Key: "vcpu",
    metric1Color: "text-[#6B99A8]",
    metric2Label: "Policy:",
    metric2Key: "policy",
    metric2Color: "text-[#4BA982]",
  },
  {
    id: "dev-bedrock",
    name: "Bedrock Gateway",
    type: "gateway",
    icon: "cpu",
    subtitle: "Claude 3.5 Sonnet",
    badge: "SYNCED",
    badgeType: "synced",
    dotColor: "bg-[#927BAA]",
    metric1Label: "Ctx:",
    metric1Key: "ctx",
    metric1Color: "text-[#927BAA]",
    metric2Label: "Latency:",
    metric2Key: "latency",
    metric2Color: "text-[#C99A45]",
  },
  {
    id: "dev-pty",
    name: "pty-god Bridge",
    type: "pty",
    icon: "harddrive",
    subtitle: "Unix Socket · IPC Stream",
    badge: "PTY LIVE",
    badgeType: "pty",
    dotColor: "bg-[#4BA982]",
    metric1Label: "Buffer:",
    metric1Key: "buffer",
    metric1Color: "text-[#F2F0EB]",
    metric2Label: "Port:",
    metric2Key: "port",
    metric2Color: "text-[#4BA982]",
  },
];

function getStatusBadgeStyle(status: string, isDark: boolean) {
  switch (status.toLowerCase()) {
    case "working":
    case "coordinating":
    case "reviewing":
    case "researching":
      return isDark
        ? "bg-[#18242E] text-[#6B99A8] border border-[#6B99A8]/30"
        : "bg-[#EDF4F7] text-[#4C7483] border border-[#4C7483]/30";
    case "thinking":
    case "starting up":
    case "walking":
      return isDark
        ? "bg-[#28212F] text-[#927BAA] border border-[#927BAA]/30"
        : "bg-[#F0EBF4] text-[#78658D] border border-[#78658D]/30";
    case "success":
    case "completed":
    case "approved":
      return isDark
        ? "bg-[#1E2B24] text-[#4BA982] border border-[#4BA982]/30"
        : "bg-[#EBF5F0] text-[#287B5B] border border-[#287B5B]/30";
    case "awaiting":
    case "waiting":
      return isDark
        ? "bg-[#2B2319] text-[#C99A45] border border-[#C99A45]/30"
        : "bg-[#F7F2E9] text-[#9A6A1F] border border-[#9A6A1F]/30";
    case "blocked":
      return isDark
        ? "bg-[#321A1E] text-[#D9585F] border border-[#D9585F]/30"
        : "bg-[#F7E8EA] text-[#B83D47] border border-[#B83D47]/30";
    case "idle":
    default:
      return isDark
        ? "bg-[#171C24] text-[#A6AEB8] border border-[#A6AEB8]/30"
        : "bg-[#F1EEE7] text-[#626A73] border border-[#626A73]/30";
  }
}

function getAgentRowStyle(agent: AgentView, isSelected: boolean, isDark: boolean) {
  if (isDark) {
    if (isSelected) {
      return "bg-[#1F1619] border-[#D64B55] shadow-xs border-l-[3px] border-l-[#D64B55]";
    }
    return "bg-[#151A21] border-[#2A323D] hover:bg-[#1B2129] hover:border-[#394350] hover:-translate-y-[1px] transition-all duration-150";
  }

  // Light Mode Role-based Pastel Tints
  if (isSelected) {
    return "bg-[#F8E8EA] border-[#B83D47] shadow-xs border-l-[3px] border-l-[#B83D47] hover:-translate-y-[1px] transition-all duration-150";
  }

  const id = agent.id.toLowerCase();
  const name = agent.name.toLowerCase();
  const area = (agent.area || "").toLowerCase();

  // 1. LEAD: soft peach
  if (agent.isGod || id.includes("god") || name.includes("lead") || area.includes("lead") || area.includes("coordinator")) {
    return "bg-[#FFF2EC] border-[#F0D6CC] hover:border-[#E2C3B7] hover:-translate-y-[1px] hover:shadow-xs transition-all duration-150";
  }
  // 2. CODER / ENGINEERING: soft blue
  if (id.includes("coder") || name.includes("coder") || area.includes("engineer") || area.includes("code")) {
    return "bg-[#EEF5FB] border-[#D7E5F0] hover:border-[#C4D7E5] hover:-translate-y-[1px] hover:shadow-xs transition-all duration-150";
  }
  // 3. DESIGN: soft lavender
  if (id.includes("design") || name.includes("design") || area.includes("design") || area.includes("ui/ux")) {
    return "bg-[#F3EFF8] border-[#DFD4EA] hover:border-[#CEBFDD] hover:-translate-y-[1px] hover:shadow-xs transition-all duration-150";
  }
  // 4. QA / REVIEW: soft mint
  if (id.includes("review") || id.includes("qa") || name.includes("qa") || area.includes("review") || area.includes("security")) {
    return "bg-[#EDF7F2] border-[#D3E9DD] hover:border-[#BEDCCE] hover:-translate-y-[1px] hover:shadow-xs transition-all duration-150";
  }
  // 5. RAG / RESEARCH: soft yellow
  if (id.includes("research") || id.includes("rag") || name.includes("rag") || area.includes("search") || area.includes("research")) {
    return "bg-[#FAF6E8] border-[#E9DFC0] hover:border-[#DDD0A8] hover:-translate-y-[1px] hover:shadow-xs transition-all duration-150";
  }
  // 6. LAUNCH / MARKETING: soft rose
  if (id.includes("pm") || id.includes("launch") || name.includes("launch") || area.includes("marketing") || area.includes("changelog")) {
    return "bg-[#FBEFF0] border-[#EACFD2] hover:border-[#DDBDC1] hover:-translate-y-[1px] hover:shadow-xs transition-all duration-150";
  }

  return "bg-[#FBFAF7] border-[#E2DED5] hover:border-[#D0CBC1] hover:-translate-y-[1px] hover:shadow-xs transition-all duration-150";
}

function getStatusDotAnimation(status: string, isDark: boolean) {
  switch (status.toLowerCase()) {
    case "working":
    case "executing":
      return isDark ? "bg-[#4BA982] animate-pulse" : "bg-[#287B5B] animate-pulse";
    case "thinking":
      return isDark ? "bg-[#C99A45] animate-pulse" : "bg-[#9A6A1F] animate-pulse";
    case "awaiting":
      return isDark ? "bg-[#C99A45] animate-pulse" : "bg-[#9A6A1F] animate-pulse";
    case "blocked":
      return isDark ? "bg-[#D64B55] animate-pulse" : "bg-[#B83D47] animate-pulse";
    case "done":
    case "success":
      return isDark ? "bg-[#4BA982]" : "bg-[#287B5B]";
    case "idle":
    default:
      return isDark ? "bg-[#737D89]" : "bg-[#858C94]";
  }
}

function getDeviceBadgeStyle(badgeType: string, isDark: boolean) {
  switch (badgeType) {
    case "online":
      return isDark
        ? "bg-[#1E2B24] text-[#4BA982] border border-[#4BA982]/30"
        : "bg-[#EBF5F0] text-[#287B5B] border border-[#287B5B]/30";
    case "sandbox":
      return isDark
        ? "bg-[#18242E] text-[#6B99A8] border border-[#6B99A8]/30"
        : "bg-[#EDF4F7] text-[#4C7483] border border-[#4C7483]/30";
    case "synced":
      return isDark
        ? "bg-[#28212F] text-[#927BAA] border border-[#927BAA]/30"
        : "bg-[#F0EBF4] text-[#78658D] border border-[#78658D]/30";
    case "pty":
      return isDark
        ? "bg-[#2B2319] text-[#C99A45] border border-[#C99A45]/30"
        : "bg-[#F7F2E9] text-[#9A6A1F] border border-[#9A6A1F]/30";
    default:
      return isDark
        ? "bg-[#1E2B24] text-[#4BA982] border border-[#4BA982]/30"
        : "bg-[#EBF5F0] text-[#287B5B] border border-[#287B5B]/30";
  }
}

export default function OfficeWorkspace() {
  // ── live state (single source of truth: the store) ────────────────────────────
  const storeAgents = useStore((s) => s.agents);
  const selectedId = useStore((s) => s.selectedId);
  const feeds = useStore((s) => s.feeds);
  const toolCounts = useStore((s) => s.toolCounts);
  const ccTabRequest = useStore((s) => s.ccTabRequest);
  const select = useStore((s) => s.select);
  const ledger = useSyncExternalStore(subscribeLedger, getLedger, getLedger);

  const agents: AgentView[] = useMemo(
    () =>
      storeAgents
        .filter((a) => !a.archived)
        .map((a) => {
          const meta = metaFor(a);
          return {
            ...meta,
            name: a.name.toUpperCase(),
            status: a.status,
            state: describeState(a, meta),
            action: a.action,
            isGod: !!a.isGod,
          };
        }),
    [storeAgents]
  );
  const selectedAgent = agents.find((a) => a.id === selectedId) ?? agents[0];
  const selectedStore = storeAgents.find((a) => a.id === selectedAgent?.id);

  // ── UI-only state ─────────────────────────────────────────────────────────────
  const [isAddAgentOpen, setIsAddAgentOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentRole, setNewAgentRole] = useState("Engineering");
  const [newAgentModel, setNewAgentModel] = useState("Claude 3.5 Sonnet");
  const [themeMode, setThemeMode] = useState<"ultron" | "classic">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("crewdesk-theme");
      if (saved === "light" || saved === "classic") return "classic";
    }
    return "ultron";
  });
  const isDark = themeMode === "ultron";

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("crewdesk-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("crewdesk-theme", "light");
    }
  }, [isDark]);

  const [autoMode, setAutoMode] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("terminal");
  const [officeNav, setOfficeNav] = useState<"OFFICE" | "TASKS" | "AGENTS" | "ACTIVITY">("OFFICE");
  const [fontSize, setFontSize] = useState<number>(12);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [queueMessage, setQueueMessage] = useState("");
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Connected Devices state
  const [devices, setDevices] = useState<ConnectedDevice[]>(INITIAL_DEVICES);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceType, setNewDeviceType] = useState<string>("microvm");
  const [newDeviceRegion, setNewDeviceRegion] = useState<string>("us-east-1");
  const [newDevicePolicy, setNewDevicePolicy] = useState<string>("Cedar Bound");

  // Dynamic Connected Devices Telemetry (fluctuating live)
  const [telemetry, setTelemetry] = useState({
    cpuHost: 14,
    ramHost: "8.2",
    ping: 8,
    vCpu: "4 Cores",
    policy: "Enforced",
    ctx: "56.2k",
    latency: 42,
    buffer: 400,
    port: 3000,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setTelemetry({
        cpuHost: 12 + Math.floor(Math.sin(now / 2000) * 4 + Math.random() * 4),
        ramHost: (8.1 + Math.sin(now / 6000) * 0.2 + (Math.random() * 0.1)).toFixed(1),
        ping: Math.max(5, 8 + Math.floor(Math.sin(now / 1500) * 2 + (Math.random() * 2 - 1))),
        vCpu: "4 Cores",
        policy: "Enforced",
        ctx: (56.2 + Math.sin(now / 10000) * 0.6).toFixed(1) + "k",
        latency: 40 + Math.floor(Math.sin(now / 2200) * 3 + Math.random() * 3),
        buffer: 395 + Math.floor(Math.sin(now / 3500) * 10 + Math.random() * 8),
        port: 3000,
      });
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (sec: number) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, "0");
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Boot the runtime (host bridge + agent activity loop + task ledger). The disposer
  // clears every timer, so nothing keeps running after the page unmounts.
  useEffect(() => startLiveOffice(), []);

  // Auto mode: blocked agents get approved automatically.
  useEffect(() => setAutoApprove(autoMode), [autoMode]);

  // Clicking a wall board / calendar in the scene asks the command center to open a tab.
  useEffect(() => {
    if (!ccTabRequest) return;
    const map: Record<string, string> = { tasks: "tasks", triggers: "triggers", human: "ask-me", activity: "activity" };
    const tab = map[ccTabRequest.tab];
    if (tab) setActiveTab(tab);
  }, [ccTabRequest]);

  // The wall clock ("closing time") raises an event; surface it in the terminal.
  useEffect(() => {
    const onClockOut = () => {
      const st = useStore.getState();
      const lead = st.agents.find((a) => a.isGod);
      if (lead) st.pushFeed(lead.id, "* Closing time requested — the crew stays online in the web preview.");
    };
    window.addEventListener("cth:clock-out", onClockOut);
    return () => window.removeEventListener("cth:clock-out", onClockOut);
  }, []);

  // Fullscreen toggle on the workspace root.
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    if (isMoreOpen || isSettingsOpen || isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMoreOpen, isSettingsOpen, isProfileOpen]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void workspaceRef.current?.requestFullscreen?.();
  };

  // Terminal = boot banner + this agent's live feed (tool calls, task events, messages).
  const feedLines = useMemo(
    () => (selectedAgent ? (feeds[selectedAgent.id] ?? []).map(stripAnsi) : []),
    [feeds, selectedAgent]
  );
  const terminalLogs = useMemo(() => [...BOOT_LOG, ...feedLines], [feedLines]);

  useEffect(() => {
    if (activeTab === "terminal") terminalEndRef.current?.scrollIntoView({ block: "end" });
  }, [terminalLogs.length, activeTab]);

  // Send a message: it becomes a real task on the ledger and nudges the agent, so the
  // character reacts on the floor (walks to a station, starts working).
  const handleSendMessage = () => {
    if (!queueMessage.trim() || !selectedAgent) return;
    const msg = queueMessage.trim();
    setQueueMessage("");
    const st = useStore.getState();
    st.pushFeed(selectedAgent.id, `> ${msg}`);
    st.pushFeed(selectedAgent.id, `* Queued for ${selectedAgent.name}…`);
    addLedgerTask(msg, selectedAgent.id);
    st.updateAgent(selectedAgent.id, {
      status: "thinking",
      action: "heading to terminal",
      currentStation: "terminal",
      lastPrompt: msg,
    });
  };

  const handleSpawnAgent = (data: NewAgentData) => {
    const st = useStore.getState();
    const base = data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "agent";
    const id = st.agents.some((a) => a.id === base) ? `${base}-${st.agents.length + 1}` : base;
    const n = st.agents.length;
    
    // Map hex color to AccentColorName
    let accent = "sky";
    if (data.color === "#D64B55") accent = "coral";
    else if (data.color === "#4BA982") accent = "mint";
    else if (data.color === "#EAB308") accent = "lemon";
    else if (data.color === "#A855F7") accent = "lilac";
    else if (data.color === "#F97316") accent = "peach";

    const agent: Agent = {
      id,
      name: data.name.trim(),
      character: data.character,
      accent: accent as any,
      description: data.description,
      project: data.project,
      tmuxTarget: String(n),
      cwd: data.folder,
      status: "idle",
      action: "just clocked in",
      progress: 0,
      currentStation: "desk",
      model: data.model,
      recentAssistantText: data.goal || "Ready to execute mission directives.",
      recentTextTs: Date.now(),
    };

    st.addAgent(agent);
    st.select(id);
    st.pushFeed(id, `✓ Spawned ${agent.name} (${agent.description}) running ${data.provider} / ${data.model}`);
    st.pushFeed(id, `• Command initialized: ${data.command}`);
    st.pushFeed(id, `• Workspace root: ${data.folder} (Isolation: ${data.gitIsolation ? 'Active' : 'Shared'})`);
    st.pushFeed(id, "• Agent placed on the office floor");
    setIsAddAgentOpen(false);
  };

  const handleAddDevice = () => {
    if (!newDeviceName.trim()) return;
    const name = newDeviceName.trim();
    const id = `dev-${Date.now()}`;

    let icon: ConnectedDevice["icon"] = "server";
    let badge = "SANDBOX";
    let badgeType: ConnectedDevice["badgeType"] = "sandbox";
    let dotColor = "bg-sky-400";
    let m1Label = "vCPU:";
    let m1Color = "text-sky-400";
    let m2Label = "Policy:";
    let m2Color = "text-emerald-400";

    if (newDeviceType === "gateway") {
      icon = "cpu";
      badge = "SYNCED";
      badgeType = "synced";
      dotColor = "bg-purple-400";
      m1Label = "Ctx:";
      m1Color = "text-purple-400";
      m2Label = "Latency:";
      m2Color = "text-amber-400";
    } else if (newDeviceType === "pty") {
      icon = "harddrive";
      badge = "PTY LIVE";
      badgeType = "pty";
      dotColor = "bg-emerald-400";
      m1Label = "Buffer:";
      m1Color = "text-slate-200";
      m2Label = "Port:";
      m2Color = "text-emerald-400";
    } else if (newDeviceType === "workstation") {
      icon = "laptop";
      badge = "ONLINE";
      badgeType = "online";
      dotColor = "bg-emerald-400";
      m1Label = "CPU:";
      m1Color = "text-emerald-400";
      m2Label = "RAM:";
      m2Color = "text-slate-200";
    } else if (newDeviceType === "gpu") {
      icon = "activity";
      badge = "GPU LIVE";
      badgeType = "custom";
      dotColor = "bg-emerald-400";
      m1Label = "VRAM:";
      m1Color = "text-emerald-400";
      m2Label = "Compute:";
      m2Color = "text-sky-400";
    }

    const newDev: ConnectedDevice = {
      id,
      name,
      type: newDeviceType as any,
      icon,
      subtitle: `${newDeviceRegion} · ${newDevicePolicy}`,
      badge,
      badgeType,
      dotColor,
      metric1Label: m1Label,
      metric1Key: newDeviceType === "workstation" ? "cpu" : newDeviceType === "gateway" ? "ctx" : newDeviceType === "pty" ? "buffer" : newDeviceType === "gpu" ? "custom" : "vcpu",
      metric1Value: newDeviceType === "gpu" ? "24 / 80 GB" : undefined,
      metric1Color: m1Color,
      metric2Label: m2Label,
      metric2Key: newDeviceType === "workstation" ? "ram" : newDeviceType === "gateway" ? "latency" : newDeviceType === "pty" ? "port" : newDeviceType === "gpu" ? "custom" : "policy",
      metric2Value: newDeviceType === "gpu" ? "142 TFLOPS" : undefined,
      metric2Color: m2Color,
    };

    setDevices((prev) => [...prev, newDev]);
    setIsAddDeviceOpen(false);
    setNewDeviceName("");

    if (selectedAgent) {
      const st = useStore.getState();
      st.pushFeed(selectedAgent.id, `✓ Connected new device: ${name} (${newDeviceRegion})`);
      st.pushFeed(selectedAgent.id, `• Security policy attached: ${newDevicePolicy}`);
    }
  };

  // Ledger-derived views for the tabs.
  const inFlight = ledger.filter((t) => t.status === "doing" || t.status === "blocked");
  const queued = ledger.filter((t) => t.status === "todo");
  const done = ledger.filter((t) => t.status === "done");
  const blockedTasks = ledger.filter((t) => t.status === "blocked");
  const nameOf = (id?: string) => agents.find((a) => a.id === id)?.name ?? "Unassigned";
  const totalTools = Object.values(toolCounts).reduce((a, b) => a + b, 0);
  const activeCount = agents.filter((a) => ["working", "thinking"].includes(a.status)).length;

  if (!selectedAgent) return null;

  const isSecondaryActive = ["triggers", "memory", "graph", "activity", "skills", "temps"].includes(activeTab);

  if (isFocusMode) {
    return (
      <MissionControlView
        isDark={isDark}
        onToggleTheme={() => setThemeMode(isDark ? "classic" : "ultron")}
        onExitFocusMode={() => setIsFocusMode(false)}
        initialTab={activeTab as any}
        agents={agents.map((a) => ({
          id: a.id,
          name: a.name,
          role: a.role,
          area: a.area,
          model: a.isGod ? "Opus 4.8" : "Sonnet 3.5",
          status: a.status,
          statusColor: a.status === "blocked" ? "warning" : a.status === "working" ? "success" : "muted",
          initial: a.name[0],
        }))}
        selectedAgentId={selectedAgent.id}
        onSelectAgent={(id) => select(id)}
        onAddAgent={() => setIsAddAgentOpen(true)}
      />
    );
  }

  return (
    <div
      data-lenis-prevent="true"
      className={`office-page fixed inset-0 h-screen w-screen max-h-screen max-w-screen overflow-hidden select-none font-sans flex flex-col transition-colors duration-200 ${
        isDark ? "bg-[#0D1015] text-[#F2F0EB]" : "bg-[#F4F2ED] text-[#20242A]"
      }`}
    >
      {/* ================================================== */}
      {/* 1. TOP NAVBAR (PAGE-SCOPED TO /office) */}
      {/* ================================================== */}
      <header
        className={`h-[52px] px-4 md:px-6 flex items-center border-b shrink-0 text-xs font-mono relative z-30 transition-colors ${
          isDark
            ? "bg-[#0B0E12] border-[#242A33]"
            : "bg-[#FBFAF7] border-[#DEDAD1]"
        }`}
      >
        {/* LEFT: BRAND */}
        <div className="flex-shrink-0 flex items-center mr-6 lg:mr-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            title="Ultron Home"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ultron-logo.png"
              alt="Ultron"
              className="h-5 w-auto object-contain transition-transform duration-150 group-hover:scale-105"
            />
          </Link>
        </div>

        {/* RIGHT: ACTIONS (● AUTO, THEME TOGGLE, AVATAR) */}
        <div className="ml-auto flex items-center gap-3">
          {/* ● AUTO MODE */}
          <button
            type="button"
            onClick={() => setAutoMode(!autoMode)}
            className={`h-7 px-2.5 rounded-md text-[11px] font-mono transition-colors duration-150 border flex items-center gap-1.5 ${
              autoMode
                ? isDark
                  ? "bg-[#101915] border-[#223B2F] text-[#4BA982] hover:bg-[#14221D]"
                  : "bg-[#EDF6F1] border-[#BDE0D0] text-[#287B5B] hover:bg-[#E3F0E8]"
                : isDark
                ? "bg-[#151A21] border-[#242A33] text-[#737D89] hover:text-[#929BA6] hover:bg-[#1A2029]"
                : "bg-[#F1EEE7] border-[#DEDAD1] text-[#69717A] hover:text-[#272C32] hover:bg-[#E8E4DB]"
            }`}
            title={`Auto Mode: ${autoMode ? "ON" : "OFF"} (Click to toggle)`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-150 ${
                autoMode
                  ? isDark
                    ? "bg-[#4BA982]"
                    : "bg-[#287B5B]"
                  : isDark
                  ? "bg-[#737D89]"
                  : "bg-[#929BA6]"
              }`}
            />
            <span className="font-medium tracking-wider">
              AUTO {autoMode ? "ON" : "OFF"}
            </span>
          </button>

          {/* DEDICATED MISSION CONTROL BUTTON */}
          <button
            type="button"
            onClick={() => setIsFocusMode(true)}
            className={`h-7 px-2.5 rounded-md text-[11px] font-mono transition-colors duration-150 border flex items-center gap-1.5 ${
              isDark
                ? "bg-[#1E192B] border-[#483866] text-[#C4B5FD] hover:bg-[#28213B] hover:text-[#EDE9FE]"
                : "bg-[#F3EEF9] border-[#D4C7E6] text-[#6D28D9] hover:bg-[#EAE1F4] hover:text-[#5B21B6]"
            }`}
            title="Open Mission Control (Full Screens)"
            aria-label="Mission Control"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="font-semibold tracking-wider">MISSION CONTROL</span>
          </button>

          {/* THEME TOGGLE */}
          <button
            type="button"
            onClick={() => setThemeMode(isDark ? "classic" : "ultron")}
            className={`w-[32px] h-[32px] rounded-md flex items-center justify-center transition-colors duration-150 border ${
              isDark
                ? "bg-[#151A21] border-[#242A33] text-[#A6AEB8] hover:text-[#F2F0EB] hover:bg-[#1A2029]"
                : "bg-[#F1EEE7] border-[#DEDAD1] text-[#626A73] hover:text-[#20242A] hover:bg-[#E8E4DB]"
            }`}
            title={isDark ? "Switch to Classic Light" : "Switch to Ultron Dark"}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* SETTINGS OPTION */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`w-[32px] h-[32px] rounded-md flex items-center justify-center transition-colors duration-150 border ${
                isSettingsOpen
                  ? isDark
                    ? "bg-[#202731] border-[#394350] text-[#F2F0EB]"
                    : "bg-[#E5E1D6] border-[#B5B0A4] text-[#20242A]"
                  : isDark
                  ? "bg-[#151A21] border-[#242A33] text-[#A6AEB8] hover:text-[#F2F0EB] hover:bg-[#1A2029]"
                  : "bg-[#F1EEE7] border-[#DEDAD1] text-[#626A73] hover:text-[#20242A] hover:bg-[#E8E4DB]"
              }`}
              title="Workspace Settings"
              aria-label="Settings"
            >
              <Wrench className="w-4 h-4" />
            </button>

            {isSettingsOpen && (
              <div
                ref={settingsRef}
                className={`absolute right-0 top-full mt-2 w-64 rounded-lg border shadow-2xl p-3 z-50 text-xs font-mono animate-in fade-in duration-100 ${
                  isDark
                    ? "bg-[#151A21] border-[#2A323D] text-[#EDEBE6]"
                    : "bg-[#FFFFFF] border-[#E2DED5] text-[#20242A]"
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-inherit font-semibold text-[11px] uppercase tracking-wider">
                  <span>WORKSPACE SETTINGS</span>
                  <Wrench className="w-3.5 h-3.5 opacity-60" />
                </div>

                <div className="space-y-3">
                  {/* THEME SELECTOR */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] opacity-80">Theme</span>
                    <button
                      type="button"
                      onClick={() => setThemeMode(isDark ? "classic" : "ultron")}
                      className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                        isDark
                          ? "bg-[#1B2129] border-[#2F3742] text-[#A6AEB8] hover:text-[#F2F0EB]"
                          : "bg-[#F1EEE7] border-[#DEDAD1] text-[#626A73] hover:text-[#20242A]"
                      }`}
                    >
                      {isDark ? "Ultron (Dark)" : "Classic (Light)"}
                    </button>
                  </div>

                  {/* AUTO PILOT */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] opacity-80">Auto Approval</span>
                    <button
                      type="button"
                      onClick={() => setAutoMode(!autoMode)}
                      className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                        autoMode
                          ? isDark
                            ? "bg-[#101915] border-[#223B2F] text-[#4BA982]"
                            : "bg-[#EDF6F1] border-[#BDE0D0] text-[#287B5B]"
                          : isDark
                          ? "bg-[#1B2129] border-[#2F3742] text-[#737D89]"
                          : "bg-[#F1EEE7] border-[#DEDAD1] text-[#69717A]"
                      }`}
                    >
                      {autoMode ? "ENABLED" : "DISABLED"}
                    </button>
                  </div>

                  {/* TERMINAL FONT SIZE */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] opacity-80">Terminal Font</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                        className={`w-6 h-6 rounded flex items-center justify-center border font-bold ${
                          isDark ? "border-[#2F3742] hover:bg-[#202731]" : "border-[#DEDAD1] hover:bg-[#F1EEE7]"
                        }`}
                      >
                        -
                      </button>
                      <span className="text-[11px] font-bold px-1">{fontSize}px</span>
                      <button
                        type="button"
                        onClick={() => setFontSize(Math.min(16, fontSize + 1))}
                        className={`w-6 h-6 rounded flex items-center justify-center border font-bold ${
                          isDark ? "border-[#2F3742] hover:bg-[#202731]" : "border-[#DEDAD1] hover:bg-[#F1EEE7]"
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* FULLSCREEN / ZOOM DISPLAY */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] opacity-80">Zoom / Display</span>
                    <button
                      type="button"
                      onClick={() => {
                        toggleFullscreen();
                        setIsSettingsOpen(false);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                        isFullscreen
                          ? isDark
                            ? "bg-[#321A1E] border-[#D64B55] text-[#D64B55]"
                            : "bg-[#F7E8EA] border-[#B83D47] text-[#B83D47]"
                          : isDark
                          ? "bg-[#1B2129] border-[#2F3742] text-[#A6AEB8]"
                          : "bg-[#F1EEE7] border-[#DEDAD1] text-[#626A73]"
                      }`}
                    >
                      {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    </button>
                  </div>

                  {/* INFERENCE SETTINGS LINK */}
                  <div className="pt-2 border-t border-inherit space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFocusMode(true);
                        setIsSettingsOpen(false);
                      }}
                      className={`w-full py-1.5 px-2.5 rounded text-[10px] font-bold text-left border transition-colors flex items-center justify-between ${
                        isDark
                          ? "bg-[#1E192B] border-[#483866] text-[#C4B5FD] hover:bg-[#28213B] hover:text-[#EDE9FE]"
                          : "bg-[#F3EEF9] border-[#D4C7E6] text-[#6D28D9] hover:bg-[#EAE1F4] hover:text-[#5B21B6]"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Open Mission Control</span>
                      </span>
                      <span className="text-[9px] opacity-60">→</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("temps");
                        setIsSettingsOpen(false);
                      }}
                      className={`w-full py-1.5 px-2.5 rounded text-[10px] font-bold text-left border transition-colors flex items-center justify-between ${
                        isDark
                          ? "bg-[#171C24] border-[#2A323D] text-[#A6AEB8] hover:text-[#F2F0EB] hover:border-[#394350]"
                          : "bg-[#F7F5F0] border-[#DEDAD1] text-[#626A73] hover:text-[#20242A] hover:border-[#B5B0A4]"
                      }`}
                    >
                      <span>Inference & Sampling</span>
                      <span className="text-[9px] opacity-60">→</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PROFILE / AVATAR (Interactive & Functional) */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`w-[32px] h-[32px] rounded-full overflow-hidden flex items-center justify-center border transition-all duration-150 cursor-pointer ${
                isProfileOpen
                  ? isDark
                    ? "border-[#D64B55] ring-2 ring-[#D64B55]/20 bg-[#1F1619]"
                    : "border-[#B83D47] ring-2 ring-[#B83D47]/20 bg-[#F8E8EA]"
                  : isDark
                  ? "border-[#242A33] hover:border-[#394350] bg-[#171C24]"
                  : "border-[#DEDAD1] hover:border-[#B5B0A4] bg-[#F1EEE7]"
              }`}
              title="Operator Profile & System Status"
              aria-label="User Profile"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedAgent?.avatar || "/ultron-logo.png"}
                alt="User Profile"
                className="w-full h-full object-cover"
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-72 rounded-xl border shadow-2xl p-3.5 z-50 font-mono animate-in fade-in slide-in-from-top-1 duration-150 ${
                  isDark
                    ? "bg-[#12161D] border-[#2B333E] text-[#F2F0EB]"
                    : "bg-[#FBFAF7] border-[#E2DED5] text-[#20242A]"
                }`}
              >
                {/* Header: User Info */}
                <div className="flex items-center gap-3 pb-3 border-b border-inherit">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-inherit shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedAgent?.avatar || "/ultron-logo.png"}
                      alt="User Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs truncate">Mission Controller</div>
                    <div className={`text-[10px] truncate ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                      operator@ultron.internal
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4BA982] animate-pulse" />
                      <span className="text-[9px] text-[#4BA982] font-semibold uppercase">Cluster Active</span>
                    </div>
                  </div>
                </div>

                {/* Section: Active Floor Agent */}
                <div className="py-2.5 border-b border-inherit">
                  <div className={`text-[10px] uppercase tracking-wider mb-1.5 font-bold ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                    Active Focus Agent
                  </div>
                  <div className={`p-2 rounded-lg border flex items-center justify-between ${
                    isDark ? "bg-[#171C24] border-[#242A33]" : "bg-[#FFFFFF] border-[#E2DED5]"
                  }`}>
                    <div className="min-w-0">
                      <div className="font-bold text-[11px] truncate">{selectedAgent.name}</div>
                      <div className={`text-[9px] truncate ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                        {selectedAgent.role} · {selectedAgent.isGod ? "Opus 4.8" : "Sonnet 3.5"}
                      </div>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${getStatusBadgeStyle(selectedAgent.status, isDark)}`}>
                      {selectedAgent.status}
                    </span>
                  </div>
                </div>

                {/* Section: System Status & Telemetry */}
                <div className="py-2.5 border-b border-inherit text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>Ping Latency:</span>
                    <span className="font-bold text-[#4BA982]">{telemetry.ping}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>Host CPU:</span>
                    <span className="font-semibold">{telemetry.cpuHost}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>Active Pods:</span>
                    <span className="font-semibold">{agents.length} agents / {devices.length} devices</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="pt-2.5 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFocusMode(true);
                      setIsProfileOpen(false);
                    }}
                    className={`w-full py-1.5 px-2.5 rounded text-[11px] font-bold text-left border transition-colors flex items-center justify-between ${
                      isDark
                        ? "bg-[#1E192B] border-[#483866] text-[#C4B5FD] hover:bg-[#28213B]"
                        : "bg-[#F3EEF9] border-[#D4C7E6] text-[#6D28D9] hover:bg-[#EAE1F4]"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Open Mission Control</span>
                    </span>
                    <span>→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setThemeMode(isDark ? "classic" : "ultron");
                    }}
                    className={`w-full py-1.5 px-2.5 rounded text-[11px] font-bold text-left border transition-colors flex items-center justify-between ${
                      isDark
                        ? "bg-[#171C24] border-[#2A323D] text-[#A6AEB8] hover:text-[#F2F0EB]"
                        : "bg-[#FFFFFF] border-[#E2DED5] text-[#626A73] hover:text-[#20242A]"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      <span>Theme: {isDark ? "Dark (Ultron)" : "Light (Classic)"}</span>
                    </span>
                    <span>⇄</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.removeItem("ultron_session_active");
                      localStorage.setItem("ultron-closed", "true");
                      window.location.href = "/start";
                    }}
                    className={`w-full py-1.5 px-2.5 rounded text-[11px] font-bold text-left border transition-colors flex items-center justify-between ${
                      isDark
                        ? "bg-[#1B212D] border-[#323D4D] text-[#8CB4F5] hover:bg-[#252E3E]"
                        : "bg-[#F0F4FA] border-[#D0DAE5] text-[#2563EB] hover:bg-[#E5EEF8]"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5" />
                      <span>Switch Workspace / Cluster</span>
                    </span>
                    <span>→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { window.location.href = "/"; }}
                    className={`w-full py-1.5 px-2.5 rounded text-[11px] font-bold text-left border transition-colors flex items-center justify-between ${
                      isDark
                        ? "bg-[#171C24] border-[#2A323D] text-[#D64B55] hover:bg-[#201619]"
                        : "bg-[#FFFFFF] border-[#E2DED5] text-[#B83D47] hover:bg-[#FBEFF0]"
                    }`}
                  >
                    <span>Sign Out / Exit to Home</span>
                    <span>↗</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================================================== */}
      {/* 2. MAIN APPLICATION WORKSPACE */}
      {/* ================================================== */}
      <div className="office-workspace flex flex-1 min-h-0 overflow-hidden relative">
        {/* ================================================== */}
        {/* 1. LEFT: CREW ROSTER (190px–200px) */}
        {/* ================================================== */}
        <aside
          className={`office-roster w-[195px] shrink-0 border-r flex flex-col h-full overflow-hidden transition-colors ${
            isDark
              ? "bg-[#10141A] border-[#2B333E]"
              : "bg-[#F2F3F8] border-[#DCDDE5]"
          }`}
        >
          {/* Roster Header */}
          <div
            className={`h-10 px-3 border-b flex items-center justify-between shrink-0 ${
              isDark
                ? "bg-[#0D1015] border-[#2B333E]"
                : "bg-[#F2F3F8] border-[#DCDDE5]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className={`w-3.5 h-3.5 ${isDark ? "text-[#D64B55]" : "text-[#B83D47]"}`} />
              <span className={`font-mono font-bold text-xs uppercase tracking-wider ${isDark ? "text-[#F2F0EB]" : "text-[#20242A]"}`}>
                CREW ROSTER
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                  isDark
                    ? "bg-[#171C24] text-[#A6AEB8] border-[#2B333E]"
                    : "bg-[#FFFFFF] text-[#626A73] border-[#DCDDE5]"
                }`}
              >
                {agents.length}
              </span>
            </div>

            {/* Roster Header */}
          </div>

          {/* Agents List (Vertical, Clean Navigation Panel) */}
          <div className="flex-1 min-h-0 p-2 space-y-1.5 overflow-y-auto">
            {agents.map((agent) => {
              const isSelected = selectedAgent.id === agent.id;
              const isWorking = agent.status === "working";
              return (
                <div
                  key={agent.id}
                  onClick={() => select(agent.id)}
                  className={`group relative flex items-center gap-2.5 p-2 rounded-lg border text-left cursor-pointer transition-all ${getAgentRowStyle(
                    agent,
                    isSelected,
                    isDark
                  )}`}
                >
                  {/* Avatar */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className={`w-7 h-7 rounded-md object-cover border shrink-0 ${
                      isDark
                        ? "border-[#2B333E] bg-[#12161D]"
                        : "border-[#DCDDE5] bg-[#FFFFFF]"
                    }`}
                  />

                  {/* Info: Name & Role & Status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span
                        className={`font-mono font-bold text-xs truncate ${
                          isSelected
                            ? isDark ? "text-[#F2F0EB]" : "text-[#20242A]"
                            : isDark ? "text-[#EDEBE6]" : "text-[#20242A]"
                        }`}
                      >
                        {agent.shortName}
                      </span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusDotAnimation(agent.status, isDark)}`}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[9px] font-mono truncate ${
                          isDark ? "text-[#8A939E]" : "text-[#626A73]"
                        }`}
                      >
                        {agent.area}
                      </span>
                      <span
                        className={`text-[8px] font-mono font-medium uppercase shrink-0 ${
                          isWorking
                            ? isDark ? "text-[#4BA982]" : "text-[#287B5B]"
                            : isDark ? "text-[#C99A45]" : "text-[#9A6A1F]"
                        }`}
                      >
                        {agent.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* + Add Agent Button */}
            <button
              onClick={() => setIsAddAgentOpen(true)}
              className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border border-dashed font-mono text-xs transition-all w-full h-[34px] mt-1 ${
                isDark
                  ? "border-[#2B333E] text-[#737D89] hover:text-[#F2F0EB] hover:border-[#D64B55] hover:bg-[#151A21]"
                  : "border-[#DCDDE5] text-[#858C94] hover:text-[#20242A] hover:border-[#B83D47] hover:bg-[#FFFFFF]"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>add agent</span>
            </button>
          </div>
        </aside>

        {/* ================================================== */}
        {/* 2. CENTER: OFFICE STAGE (56%–58% of central workspace) */}
        {/* ================================================== */}
        <main className={`office-stage flex-1 min-w-0 h-full overflow-hidden flex items-center justify-center p-3 relative ${isDark ? "bg-[#0D1015]" : "bg-[#F4F2ED]"}`}>
          <div
            className={`w-full h-full max-w-[1280px] max-h-[900px] relative rounded-lg border overflow-hidden shadow-xs flex items-center justify-center ${
              isDark ? "border-[#2B333E] bg-[#0A0D11]" : "border-[#DDD9D0] bg-[#EDE7D6]"
            }`}
          >
            <OfficeFloor />
          </div>
        </main>

        {/* ================================================== */}
        {/* 3. RIGHT: COMMAND CENTER (350px–380px) */}
        {/* ================================================== */}
        <aside
          className={`office-command w-[360px] xl:w-[380px] shrink-0 border-l flex flex-col h-full overflow-hidden transition-colors ${
            isDark
              ? "bg-[#10141A] border-[#2B333E]"
              : "bg-[#F0F3F7] border-[#D9DEE5]"
          }`}
        >
          {/* Command Center Header */}
          <div
            className={`h-11 px-3.5 border-b flex items-center justify-between shrink-0 ${
              isDark
                ? "bg-[#0B0E12] border-[#242A33]"
                : "bg-[#F5F7F9] border-[#D9DEE5]"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedAgent.avatar}
                alt={selectedAgent.name}
                className={`w-7 h-7 rounded-md object-cover border shrink-0 ${
                  isDark ? "border-[#2B333E]" : "border-[#D9DEE5]"
                }`}
              />
              <div className="min-w-0">
                <div
                  className={`font-mono font-bold text-xs uppercase tracking-wider truncate ${
                    isDark ? "text-[#F2F0EB]" : "text-[#20242A]"
                  }`}
                >
                  COMMAND CENTER
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  <span className={`font-semibold truncate ${isDark ? "text-[#EDEBE6]" : "text-[#20242A]"}`}>
                    {selectedAgent.name}
                  </span>
                  <span className={isDark ? "text-[#555E6B]" : "text-[#A0A6AF]"}>·</span>
                  <span className={`text-[8px] font-bold uppercase px-1 py-0.2 rounded shrink-0 ${getStatusBadgeStyle(selectedAgent.status, isDark)}`}>
                    {selectedAgent.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  const st = useStore.getState();
                  st.pushFeed(selectedAgent.id, `* Auto session refreshed for ${selectedAgent.name}`);
                }}
                className={`h-6 px-2 rounded text-[10px] font-mono font-medium flex items-center gap-1 border transition-colors ${
                  isDark
                    ? "bg-[#171C24] border-[#2B333E] text-[#A6AEB8] hover:bg-[#202731] hover:text-[#F2F0EB]"
                    : "bg-[#FFFFFF] border-[#D9DEE5] text-[#626A73] hover:bg-[#E8EBF0] hover:text-[#20242A]"
                }`}
                title="Auto mode for current agent"
              >
                <Play className="w-2.5 h-2.5" />
                <span>auto</span>
              </button>

              {/* Make Big / Focus Mode Option */}
              <button
                type="button"
                onClick={() => setIsFocusMode(true)}
                className={`h-6 px-2 rounded text-[10px] font-mono font-medium flex items-center gap-1 border transition-colors ${
                  isDark
                    ? "bg-[#1E192B] border-[#483866] text-[#C4B5FD] hover:bg-[#28213B] hover:text-[#EDE9FE]"
                    : "bg-[#F3EEF9] border-[#D4C7E6] text-[#6D28D9] hover:bg-[#EAE1F4] hover:text-[#5B21B6]"
                }`}
                title="Open Mission Control (Full Screens)"
                aria-label="Mission Control"
              >
                <LayoutDashboard className="w-3 h-3" />
                <span>MISSION CONTROL</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation (Matching Image 4: 10 Tabs in 3 Compact Rows) */}
          <div
            className={`p-2 border-b text-xs font-mono shrink-0 space-y-1 ${
              isDark
                ? "bg-[#0D1015] border-[#242A33]"
                : "bg-[#F5F7F9] border-[#D9DEE5]"
            }`}
          >
            {/* Row 1: terminal, monitor, tasks, ask me */}
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: "terminal", label: "terminal", icon: ">_" },
                { id: "monitor", label: "monitor", icon: "∿" },
                { id: "tasks", label: "tasks", icon: "✓" },
                { id: "ask-me", label: "ask me", icon: "💬" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`h-7 px-1 rounded text-[10px] font-mono font-medium transition-all border flex items-center justify-center gap-1 ${
                    activeTab === t.id
                      ? isDark
                        ? "bg-[#321A1E] border-[#D64B55] text-[#D64B55] font-bold"
                        : "bg-[#F8E8EA] border-[#E7C3C7] text-[#B83D47] font-bold shadow-2xs"
                      : isDark
                      ? "bg-[#151A21] border-[#242A33] text-[#8A939E] hover:text-[#F2F0EB] hover:bg-[#1C222B]"
                      : "bg-[#FBFAF7] border-[#E2DED5] text-[#69717A] hover:text-[#20242A] hover:bg-[#E8EBF0]"
                  }`}
                >
                  <span className="opacity-70 text-[9px]">{t.icon}</span>
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Row 2: triggers, memory, graph, activity */}
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: "triggers", label: "triggers", icon: "⏱" },
                { id: "memory", label: "memory", icon: "✦" },
                { id: "graph", label: "graph", icon: "❖" },
                { id: "activity", label: "activity", icon: "🔔" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`h-7 px-1 rounded text-[10px] font-mono font-medium transition-all border flex items-center justify-center gap-1 ${
                    activeTab === t.id
                      ? isDark
                        ? "bg-[#321A1E] border-[#D64B55] text-[#D64B55] font-bold"
                        : "bg-[#F8E8EA] border-[#E7C3C7] text-[#B83D47] font-bold shadow-2xs"
                      : isDark
                      ? "bg-[#151A21] border-[#242A33] text-[#8A939E] hover:text-[#F2F0EB] hover:bg-[#1C222B]"
                      : "bg-[#FBFAF7] border-[#E2DED5] text-[#69717A] hover:text-[#20242A] hover:bg-[#E8EBF0]"
                  }`}
                >
                  <span className="opacity-70 text-[9px]">{t.icon}</span>
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Row 3: skills, ide, temps */}
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: "skills", label: "skills", icon: "✦+" },
                { id: "ide", label: "ide / cli", icon: "</>" },
                { id: "temps", label: "temps", icon: "⚙" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`h-7 px-1.5 rounded text-[10px] font-mono font-medium transition-all border flex items-center justify-center gap-1 ${
                    activeTab === t.id
                      ? isDark
                        ? "bg-[#321A1E] border-[#D64B55] text-[#D64B55] font-bold"
                        : "bg-[#F8E8EA] border-[#E7C3C7] text-[#B83D47] font-bold shadow-2xs"
                      : isDark
                      ? "bg-[#151A21] border-[#242A33] text-[#8A939E] hover:text-[#F2F0EB] hover:bg-[#1C222B]"
                      : "bg-[#FBFAF7] border-[#E2DED5] text-[#69717A] hover:text-[#20242A] hover:bg-[#E8EBF0]"
                  }`}
                >
                  <span className="opacity-70 text-[9px]">{t.icon}</span>
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Container - Scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
            {/* 1. TERMINAL VIEW */}
            {activeTab === "terminal" && (
              <div
                className={`flex-1 p-3 font-mono text-xs space-y-1.5 select-text leading-relaxed ${
                  isDark ? "bg-[#0A0D11] text-[#A6AEB8]" : "bg-[#F1F3F6] text-[#4E565E]"
                }`}
                style={{ fontSize: `${fontSize}px` }}
              >
                {/* Status line matching Image 4 */}
                <div
                  className={`flex items-center justify-between text-[10px] pb-1.5 border-b mb-2 ${
                    isDark ? "border-[#242A33] text-[#737D89]" : "border-[#DDE1E7] text-[#8A929B]"
                  }`}
                >
                  <span className={`flex items-center gap-1.5 font-bold ${isDark ? "text-[#4BA982]" : "text-[#287B5B]"}`}>
                    <span className={`w-2 h-2 rounded-xs ${isDark ? "bg-[#4BA982]" : "bg-[#287B5B]"}`} />
                    live · pty pty-god
                  </span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                      className={`px-1.5 py-0.5 rounded border ${isDark ? "border-[#242A33] hover:bg-[#171C24] text-[#A6AEB8]" : "border-[#DDE1E7] hover:bg-[#E8EBF0] text-[#4E565E]"}`}
                      title="Decrease font size"
                    >
                      -
                    </button>
                    <span className="px-1 text-[#737D89]">{fontSize}px</span>
                    <button
                      onClick={() => setFontSize(Math.min(16, fontSize + 1))}
                      className={`px-1.5 py-0.5 rounded border ${isDark ? "border-[#242A33] hover:bg-[#171C24] text-[#A6AEB8]" : "border-[#DDE1E7] hover:bg-[#E8EBF0] text-[#4E565E]"}`}
                      title="Increase font size"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Inner Terminal Surface */}
                <div
                  className={`flex-1 p-2.5 rounded-lg border space-y-2 overflow-y-auto ${
                    isDark ? "bg-[#07090C] border-[#1F252E]" : "bg-[#F8F9FB] border-[#DDE1E7]"
                  }`}
                >
                  {/* Terminal Logs */}
                  {terminalLogs.map((log, idx) => {
                    const isDone = log.startsWith("✓") || log.includes("success") || log.includes("Done");
                    const isPrompt = log.startsWith(">");
                    const isInfo = log.startsWith("*") || log.startsWith("•");
                    const isErr = log.toLowerCase().includes("err") || log.startsWith("!");
                    const isWarn = log.toLowerCase().includes("warn");
                    const isInteractiveRating = log.includes("1: Bad");

                    if (isInteractiveRating) {
                      return (
                        <div key={idx} className="space-y-1.5 py-1">
                          <div className={`text-[11px] font-semibold ${isDark ? "text-[#4BA982]" : "text-[#287B5B]"}`}>
                            • How is Claude doing this session? (optional)
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            {[
                              { key: "1", label: "Bad" },
                              { key: "2", label: "Fine" },
                              { key: "3", label: "Good" },
                              { key: "0", label: "Dismiss" },
                            ].map((opt) => (
                              <button
                                key={opt.key}
                                onClick={() => {
                                  const st = useStore.getState();
                                  st.pushFeed(selectedAgent.id, `* Feedback recorded: ${opt.label}`);
                                }}
                                className={`px-2 py-0.5 rounded border transition-colors ${
                                  isDark
                                    ? "bg-[#151A21] border-[#2A323D] text-[#A6AEB8] hover:bg-[#202731] hover:text-[#F2F0EB]"
                                    : "bg-[#FFFFFF] border-[#DDE1E7] text-[#4E565E] hover:bg-[#E8EBF0] hover:text-[#20242A]"
                                }`}
                              >
                                <span className={isDark ? "text-[#4BA982]" : "text-[#287B5B]"}>{opt.key}: </span>
                                <span>{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className={`break-words transition-all duration-200 ${
                          isDone
                            ? isDark ? "text-[#4BA982] font-semibold" : "text-[#287B5B] font-semibold"
                            : isPrompt
                            ? isDark ? "text-[#F2F0EB] font-medium" : "text-[#252A30] font-medium"
                            : isErr
                            ? isDark ? "text-[#D9585F] font-semibold" : "text-[#B83D47] font-semibold"
                            : isWarn
                            ? isDark ? "text-[#E5B566]" : "text-[#9A6A1F]"
                            : isInfo
                            ? isDark ? "text-[#A6AEB8]" : "text-[#4E565E]"
                            : isDark ? "text-[#8A939E]" : "text-[#626A73]"
                        }`}
                      >
                        {log}
                      </div>
                    );
                  })}

                  {/* Context stats footer matching Image 4 */}
                  <div className={`pt-2 border-t mt-3 text-[10px] flex flex-col gap-1 font-mono ${
                    isDark ? "border-[#1F252E] text-[#737D89]" : "border-[#E2DED5] text-[#858C94]"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span>ctx 65k/1000k (7%)</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#C99A45]">
                      <span>▶▶ auto mode {autoMode ? "on" : "off"} (shift+tab to cycle)</span>
                      <span>· ← for agents</span>
                    </div>
                  </div>

                  <div ref={terminalEndRef} />
                </div>
              </div>
            )}

            {/* 2. TASKS VIEW */}
            {activeTab === "tasks" && (
              <div className="flex-1 overflow-auto flex flex-col min-h-0 bg-crew-bg">
                <div className="px-3 py-1.5 border-b border-crew-border flex items-center justify-between bg-crew-surface-secondary text-[11px] font-mono shrink-0">
                  <span className="font-semibold text-crew-text">Tasks Overview</span>
                  <button
                    type="button"
                    onClick={() => setIsFocusMode(true)}
                    className="flex items-center gap-1 text-crew-primary hover:underline cursor-pointer"
                  >
                    <span>Expand Full Screen</span>
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <Tasks />
                </div>
              </div>
            )}

            {/* 3. MONITOR VIEW */}
            {activeTab === "monitor" && (
              <div className="flex-1 overflow-auto flex flex-col min-h-0 bg-crew-bg">
                <div className="px-3 py-1.5 border-b border-crew-border flex items-center justify-between bg-crew-surface-secondary text-[11px] font-mono shrink-0">
                  <span className="font-semibold text-crew-text">Monitor & Telemetry</span>
                  <button
                    type="button"
                    onClick={() => setIsFocusMode(true)}
                    className="flex items-center gap-1 text-crew-primary hover:underline cursor-pointer"
                  >
                    <span>Expand Full Screen</span>
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <Monitor />
                </div>
              </div>
            )}

            {/* 4. ASK ME VIEW */}
            {activeTab === "ask-me" && (
              <div className="flex-1 overflow-auto flex flex-col min-h-0 bg-crew-bg">
                <div className="px-3 py-1.5 border-b border-crew-border flex items-center justify-between bg-crew-surface-secondary text-[11px] font-mono shrink-0">
                  <span className="font-semibold text-crew-text">Ask Me</span>
                  <button
                    type="button"
                    onClick={() => setIsFocusMode(true)}
                    className="flex items-center gap-1 text-crew-primary hover:underline cursor-pointer"
                  >
                    <span>Expand Full Screen</span>
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <AskMe />
                </div>
              </div>
            )}

            {/* 5. TRIGGERS VIEW */}
            {activeTab === "triggers" && (
              <div className="flex-1 overflow-auto flex flex-col min-h-0 bg-crew-bg">
                <div className="px-3 py-1.5 border-b border-crew-border flex items-center justify-between bg-crew-surface-secondary text-[11px] font-mono shrink-0">
                  <span className="font-semibold text-crew-text">Triggers</span>
                  <button
                    type="button"
                    onClick={() => setIsFocusMode(true)}
                    className="flex items-center gap-1 text-crew-primary hover:underline cursor-pointer"
                  >
                    <span>Expand Full Screen</span>
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <Triggers />
                </div>
              </div>
            )}

            {/* 6. MEMORY VIEW */}
            {activeTab === "memory" && (
              <div className="flex-1 overflow-auto flex flex-col min-h-0 bg-crew-bg">
                <div className="px-3 py-1.5 border-b border-crew-border flex items-center justify-between bg-crew-surface-secondary text-[11px] font-mono shrink-0">
                  <span className="font-semibold text-crew-text">Memory</span>
                  <button
                    type="button"
                    onClick={() => setIsFocusMode(true)}
                    className="flex items-center gap-1 text-crew-primary hover:underline cursor-pointer"
                  >
                    <span>Expand Full Screen</span>
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <Memory />
                </div>
              </div>
            )}

            {/* 7. GRAPH VIEW */}
            {activeTab === "graph" && (
              <div className="flex-1 overflow-auto flex flex-col min-h-0 bg-crew-bg">
                <div className="px-3 py-1.5 border-b border-crew-border flex items-center justify-between bg-crew-surface-secondary text-[11px] font-mono shrink-0">
                  <span className="font-semibold text-crew-text">Knowledge Graph</span>
                  <button
                    type="button"
                    onClick={() => setIsFocusMode(true)}
                    className="flex items-center gap-1 text-crew-primary hover:underline cursor-pointer"
                  >
                    <span>Expand Full Screen</span>
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <Graph agents={agents} isDark={isDark} />
                </div>
              </div>
            )}

            {/* 8. ACTIVITY VIEW */}
            {activeTab === "activity" && (
              <div className="flex-1 overflow-auto flex flex-col min-h-0 bg-crew-bg">
                <div className="px-3 py-1.5 border-b border-crew-border flex items-center justify-between bg-crew-surface-secondary text-[11px] font-mono shrink-0">
                  <span className="font-semibold text-crew-text">Activity Stream</span>
                  <button
                    type="button"
                    onClick={() => setIsFocusMode(true)}
                    className="flex items-center gap-1 text-crew-primary hover:underline cursor-pointer"
                  >
                    <span>Expand Full Screen</span>
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <Activity />
                </div>
              </div>
            )}

            {/* 9. SKILLS VIEW */}
            {activeTab === "skills" && (
              <div className="flex-1 overflow-auto flex flex-col min-h-0 bg-crew-bg">
                <div className="px-3 py-1.5 border-b border-crew-border flex items-center justify-between bg-crew-surface-secondary text-[11px] font-mono shrink-0">
                  <span className="font-semibold text-crew-text">Agent Skills</span>
                  <button
                    type="button"
                    onClick={() => setIsFocusMode(true)}
                    className="flex items-center gap-1 text-crew-primary hover:underline cursor-pointer"
                  >
                    <span>Expand Full Screen</span>
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <Skills />
                </div>
              </div>
            )}

            {/* 10. TEMPS VIEW */}
            {activeTab === "temps" && (
              <div className="flex-1 overflow-auto flex flex-col min-h-0 bg-crew-bg">
                <div className="px-3 py-1.5 border-b border-crew-border flex items-center justify-between bg-crew-surface-secondary text-[11px] font-mono shrink-0">
                  <span className="font-semibold text-crew-text">Temps & Settings</span>
                  <button
                    type="button"
                    onClick={() => setIsFocusMode(true)}
                    className="flex items-center gap-1 text-crew-primary hover:underline cursor-pointer"
                  >
                    <span>Expand Full Screen</span>
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <Temps />
                </div>
              </div>
            )}

            {/* 11. ULTRON IDE & CLI */}
            {activeTab === "ide" && (
              <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-crew-bg">
                <UltronIDE isDark={isDark} />
              </div>
            )}
          </div>

          {/* Bottom Queue Composer (Matching Image 4) */}
          <div
            className={`p-3 border-t shrink-0 ${
              isDark
                ? "bg-[#0B0E12] border-[#242A33]"
                : "bg-[#F8F4EE] border-[#DDD5CA]"
            }`}
          >
            <div className={`text-[11px] font-mono mb-1.5 font-bold uppercase tracking-wider ${isDark ? "text-[#F2F0EB]" : "text-[#20242A]"}`}>
              QUEUE
            </div>

            <div
              className={`rounded-lg border p-2.5 transition-colors ${
                isDark
                  ? "bg-[#12161D] border-[#2B333E] focus-within:border-[#D64B55]"
                  : "bg-[#FFFFFF] border-[#D8D3CB] focus-within:border-[#B83D47]"
              }`}
            >
              <textarea
                rows={2}
                placeholder={
                  selectedAgent.isGod
                    ? "Ultron is orchestrating — queue a mission directive for the swarm..."
                    : `Message ${selectedAgent.name}...`
                }
                value={queueMessage}
                onChange={(e) => setQueueMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className={`w-full bg-transparent text-xs resize-none focus:outline-none leading-relaxed font-mono ${
                  isDark
                    ? "text-[#F2F0EB] placeholder-[#626A73]"
                    : "text-[#20242A] placeholder-[#8A9198]"
                }`}
              />

              <div
                className={`flex items-center justify-end gap-2 pt-2 border-t mt-1.5 ${
                  isDark ? "border-[#242A33]" : "border-[#E2DED5]"
                }`}
              >
                <button
                  type="button"
                  className={`flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded border transition-colors ${
                    isDark
                      ? "border-[#2B333E] bg-[#171C24] hover:bg-[#202731] text-[#A6AEB8]"
                      : "border-[#D8D3CB] bg-[#FBFAF7] hover:bg-[#F1EEE7] text-[#626A73]"
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  <span>files</span>
                </button>
                <button
                  type="button"
                  className={`flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded border transition-colors ${
                    isDark
                      ? "border-[#2B333E] bg-[#171C24] hover:bg-[#202731] text-[#A6AEB8]"
                      : "border-[#D8D3CB] bg-[#FBFAF7] hover:bg-[#F1EEE7] text-[#626A73]"
                  }`}
                >
                  <Mic className="w-3 h-3" />
                  <span>voice</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  className={`px-3 py-1 rounded font-mono text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isDark
                      ? "bg-[#D64B55] hover:bg-[#E25B64] text-white shadow-xs"
                      : "bg-[#E6C387] hover:bg-[#D4AF6E] text-[#20242A] border border-[#CCA765] shadow-xs"
                  }`}
                >
                  <span>send</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ================================================== */}
      {/* 3. CONNECTED DEVICES SECTION (Sits below workspace) */}
      {/* ================================================== */}
      <section
        className={`office-devices shrink-0 border-t flex flex-col transition-colors ${
          isDark
            ? "bg-[#10141A] border-[#2B333E]"
            : "bg-[#EEF5F0] border-[#D8E5DB]"
        }`}
      >
        {/* Devices Header */}
        <div
          className={`h-8 px-4 border-b flex items-center justify-between text-xs font-mono select-none shrink-0 ${
            isDark
              ? "bg-[#0B0E12] border-[#242A33] text-[#F2F0EB]"
              : "bg-[#EEF5F0] border-[#D8E5DB] text-[#20242A]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Radio className={`w-3.5 h-3.5 animate-pulse ${isDark ? "text-[#4BA982]" : "text-[#287B5B]"}`} />
            <span className={`font-bold text-xs uppercase tracking-wider ${isDark ? "text-[#F2F0EB]" : "text-[#20242A]"}`}>
              CONNECTED DEVICES
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold font-mono ${
                isDark
                  ? "bg-[#1E2B24] text-[#4BA982] border border-[#4BA982]/30"
                  : "bg-[#EBF5F0] text-[#287B5B] border border-[#287B5B]/30"
              }`}
            >
              {devices.length} LIVE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddDeviceOpen(true)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all border ${
                isDark
                  ? "bg-[#171C24] border-[#2B333E] text-[#F2F0EB] hover:bg-[#202731] hover:border-[#394350]"
                  : "bg-[#FFFFFF] border-[#E0E1DE] text-[#20242A] hover:bg-[#F7FAF8] hover:border-[#CAD2CB]"
              }`}
              title="Connect new device or microVM"
            >
              <Plus className="w-3 h-3" />
              <span>Add Device</span>
            </button>

            <div className={`flex items-center gap-1 text-xs font-mono ${isDark ? "text-[#4BA982]" : "text-[#287B5B]"}`}>
              <Wifi className="w-3.5 h-3.5" />
              <span>{telemetry.ping}ms</span>
            </div>
          </div>
        </div>

        {/* Devices Horizontal Grid - 4 columns with consistent cards */}
        <div className="p-2.5 grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
          {devices.slice(0, 4).map((dev) => {
            const isOnline = dev.badgeType === "online" || dev.badgeType === "pty";
            const m1Val = dev.metric1Value || (
              dev.metric1Key === "cpu" ? `${telemetry.cpuHost}%` :
              dev.metric1Key === "vcpu" ? telemetry.vCpu :
              dev.metric1Key === "ctx" ? `${telemetry.ctx} / 1M` :
              dev.metric1Key === "buffer" ? `${telemetry.buffer} lines` : "Active"
            );
            const m2Val = dev.metric2Value || (
              dev.metric2Key === "ram" ? `${telemetry.ramHost} / 32 GB` :
              dev.metric2Key === "policy" ? telemetry.policy :
              dev.metric2Key === "latency" ? `${telemetry.latency}ms` :
              dev.metric2Key === "port" ? String(telemetry.port) : "Active"
            );

            return (
              <div
                key={dev.id}
                className={`h-[72px] p-2.5 rounded-lg border text-left transition-all duration-150 flex flex-col justify-between ${
                  isDark
                    ? "bg-[#171C24] border-[#2B333E] hover:bg-[#1E242E] hover:border-[#394350]"
                    : "bg-[#FFFFFF] border-[#E0E1DE] hover:bg-[#F7FAF8] hover:border-[#CAD2CB] hover:-translate-y-[1px] hover:shadow-xs"
                }`}
              >
                {/* Row 1: Name + Status */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`font-mono font-bold text-xs truncate ${
                        isDark ? "text-[#EDEBE6]" : "text-[#20242A]"
                      }`}
                    >
                      {dev.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${dev.dotColor} ${
                        isOnline ? "animate-pulse" : ""
                      }`}
                    />
                    <span className={`text-[9px] font-mono font-medium ${isDark ? "text-[#A6AEB8]" : "text-[#626A73]"}`}>
                      {isOnline ? "Online" : "Active"}
                    </span>
                  </div>
                </div>

                {/* Row 2: Subtitle */}
                <div className={`text-[10px] font-mono truncate ${isDark ? "text-[#737D89]" : "text-[#707881]"}`}>
                  {dev.subtitle}
                </div>

                {/* Row 3: Metrics */}
                <div
                  className={`flex items-center justify-between text-[10px] font-mono pt-1 border-t ${
                    isDark ? "border-[#242A33] text-[#A6AEB8]" : "border-[#E8EFE9] text-[#707881]"
                  }`}
                >
                  <div className="truncate mr-2">
                    <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>{dev.metric1Label} </span>
                    <span className={`font-semibold ${isDark ? "text-[#F2F0EB]" : "text-[#20242A]"}`}>{m1Val}</span>
                  </div>
                  <div className="truncate text-right">
                    <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>{dev.metric2Label} </span>
                    <span className={`font-semibold ${isDark ? "text-[#F2F0EB]" : "text-[#20242A]"}`}>{m2Val}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================================================== */}
      {/* 4. ADD AGENT MODAL */}
      {/* ================================================== */}
      {/* 4-STEP ADD AGENT WIZARD MODAL */}
      {/* ================================================== */}
      <AddAgentModal
        isOpen={isAddAgentOpen}
        onClose={() => setIsAddAgentOpen(false)}
        onSpawn={handleSpawnAgent}
        isDark={isDark}
      />

      {/* ================================================== */}
      {/* 5. ADD CONNECTED DEVICE MODAL */}
      {/* ================================================== */}
      {isAddDeviceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-xl border p-5 shadow-2xl font-mono ${
              isDark
                ? "bg-[#12161D] border-[#2B333E] text-[#F2F0EB]"
                : "bg-[#FBFAF7] border-[#E2DED5] text-[#20242A]"
            }`}
          >
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isDark ? "border-[#2B333E]" : "border-[#E2DED5]"}`}>
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${isDark ? "text-[#4BA982]" : "text-[#287B5B]"}`} />
                <span className="font-bold text-sm uppercase tracking-wider">
                  CONNECT NEW DEVICE / POD
                </span>
              </div>
              <button
                onClick={() => setIsAddDeviceOpen(false)}
                className={`text-lg font-bold transition-colors ${isDark ? "text-[#737D89] hover:text-[#F2F0EB]" : "text-[#858C94] hover:text-[#20242A]"}`}
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className={`block mb-1 text-[11px] uppercase font-bold ${isDark ? "text-[#A6AEB8]" : "text-[#626A73]"}`}>
                  Device Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. AWS MicroVM #05, Local GPU Pod"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${
                    isDark
                      ? "bg-[#0F1318] border-[#303743] text-[#F2F0EB] focus:border-[#D64B55]"
                      : "bg-[#FFFFFF] border-[#D8D4CB] text-[#20242A] focus:border-[#B83D47]"
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 text-[11px] uppercase font-bold ${isDark ? "text-[#A6AEB8]" : "text-[#626A73]"}`}>
                  Device Type & Architecture
                </label>
                <select
                  value={newDeviceType}
                  onChange={(e) => setNewDeviceType(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${
                    isDark
                      ? "bg-[#0F1318] border-[#303743] text-[#F2F0EB] focus:border-[#D64B55]"
                      : "bg-[#FFFFFF] border-[#D8D4CB] text-[#20242A] focus:border-[#B83D47]"
                  }`}
                >
                  <option value="microvm">AWS MicroVM (Firecracker Sandbox)</option>
                  <option value="gateway">Bedrock Gateway / LLM Proxy</option>
                  <option value="pty">pty-god Bridge / Unix Socket</option>
                  <option value="workstation">Host Workstation (macOS / Linux)</option>
                  <option value="gpu">GPU Inference Cluster (A100 / H100)</option>
                </select>
              </div>

              <div>
                <label className={`block mb-1 text-[11px] uppercase font-bold ${isDark ? "text-[#A6AEB8]" : "text-[#626A73]"}`}>
                  Region & Network
                </label>
                <select
                  value={newDeviceRegion}
                  onChange={(e) => setNewDeviceRegion(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${
                    isDark
                      ? "bg-[#0F1318] border-[#303743] text-[#F2F0EB] focus:border-[#D64B55]"
                      : "bg-[#FFFFFF] border-[#D8D4CB] text-[#20242A] focus:border-[#B83D47]"
                  }`}
                >
                  <option value="us-east-1">us-east-1 (N. Virginia)</option>
                  <option value="us-west-2">us-west-2 (Oregon)</option>
                  <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
                  <option value="localhost">localhost (IPC Domain Socket)</option>
                </select>
              </div>

              <div>
                <label className={`block mb-1 text-[11px] uppercase font-bold ${isDark ? "text-[#A6AEB8]" : "text-[#626A73]"}`}>
                  Security Boundary
                </label>
                <select
                  value={newDevicePolicy}
                  onChange={(e) => setNewDevicePolicy(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${
                    isDark
                      ? "bg-[#0F1318] border-[#303743] text-[#F2F0EB] focus:border-[#D64B55]"
                      : "bg-[#FFFFFF] border-[#D8D4CB] text-[#20242A] focus:border-[#B83D47]"
                  }`}
                >
                  <option value="Cedar Bound">Cedar Bound (Zero Trust)</option>
                  <option value="Strict Sandbox">Strict Sandbox (Isolated cgroup)</option>
                  <option value="Audit Only">Audit Only (Monitored Log Stream)</option>
                </select>
              </div>

              <div className={`pt-2 text-[10px] ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                • Telemetry and health checks will automatically stream to the Ultron dashboard.
              </div>
            </div>

            <div className={`flex items-center justify-end gap-2 mt-5 pt-3 border-t ${isDark ? "border-[#2B333E]" : "border-[#E2DED5]"}`}>
              <button
                type="button"
                onClick={() => setIsAddDeviceOpen(false)}
                className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                  isDark
                    ? "border-[#2B333E] text-[#A6AEB8] hover:bg-[#171C24]"
                    : "border-[#E2DED5] text-[#626A73] hover:bg-[#F1EEE7]"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddDevice}
                className={`px-4 py-1.5 rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all ${
                  isDark
                    ? "bg-[#D64B55] hover:bg-[#E25B64] text-white"
                    : "bg-[#B83D47] hover:bg-[#C94A54] text-white"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Connect Device</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
