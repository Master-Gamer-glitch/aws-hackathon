"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Save,
  Bot,
  Shield,
  CreditCard,
  Database,
  Brain,
  Wrench,
  Check,
  AlertTriangle,
  Play,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { usePrototype, PROTOTYPE_AGENTS, PrototypeAgent } from "../PrototypeContext";

type StudioSection = "identity" | "instructions" | "capabilities" | "permissions" | "budget" | "memory";

export default function AgentStudioView() {
  const { isDark, selectedAgent, setSelectedAgent, setSecondaryRoute, openAgentWorkspace } =
    usePrototype();

  const [activeSection, setActiveSection] = useState<StudioSection>("identity");
  const [isSaved, setIsSaved] = useState(false);

  // Editable local state based on selectedAgent
  const [agentName, setAgentName] = useState(selectedAgent.name);
  const [agentRole, setAgentRole] = useState(selectedAgent.role);
  const [agentModel, setAgentModel] = useState(selectedAgent.model);
  const [agentMission, setAgentMission] = useState(selectedAgent.description);
  const [agentBudgetCap, setAgentBudgetCap] = useState(selectedAgent.budget.cap.toString());
  const [instructions, setInstructions] = useState(
    `You are ${selectedAgent.name}, operating within the Ultron Autonomous Swarm.\nEnforce all AWS Cedar zero-trust security policies.\nDo not execute unvalidated shell commands or destructive mutations without human authorization.\nReport telemetry and execution state back to Ultron Master on pty-ultron-master.`
  );

  const sections: { id: StudioSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "identity", label: "Identity & Mission", icon: Bot },
    { id: "instructions", label: "System Instructions", icon: Brain },
    { id: "capabilities", label: "Tools & Skills", icon: Wrench },
    { id: "permissions", label: "Cedar Governance", icon: Shield },
    { id: "budget", label: "AI Budget & Limits", icon: CreditCard },
    { id: "memory", label: "Memory & Context", icon: Database },
  ];

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 sm:p-6 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSecondaryRoute("agents-repo")}
            className={`p-1.5 rounded border transition-colors ${
              isDark
                ? "border-[#2B333E] hover:bg-[#171C24] text-[#A6AEB8]"
                : "border-[#E2DED5] hover:bg-[#FFFFFF] text-[#626A73]"
            }`}
            title="Back to Agents Repository"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-display font-bold text-inherit">Agent Studio</h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-[#927BAA]/40 text-[#927BAA] bg-[#927BAA]/10 font-semibold">
                CONFIGURING: {selectedAgent.name}
              </span>
            </div>
            <p className={`text-[12px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
              Define agent persona, behavioral boundaries, tool clearance, and spending invariants.
            </p>
          </div>
        </div>

        {/* Actions: Save & Open Workspace */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openAgentWorkspace(selectedAgent)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-mono border transition-all ${
              isDark
                ? "bg-[#171C24] border-[#2B333E] hover:border-[#D64B55] text-[#F2F0EA]"
                : "bg-[#FFFFFF] border-[#E2DED5] hover:border-[#B83D47] text-[#20242A]"
            }`}
          >
            <Play className="w-3 h-3 text-[#4BA982]" />
            <span>Launch Workspace</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-[12px] font-mono font-semibold transition-all ${
              isSaved
                ? "bg-[#4BA982] text-white"
                : isDark
                ? "bg-[#D64B55] hover:bg-[#C23E48] text-white"
                : "bg-[#B83D47] hover:bg-[#A3343E] text-white"
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? "Saved & Synced" : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body: Left Nav Tabs + Right Content Panel */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
        {/* Left Section Tabs */}
        <div
          className={`w-full md:w-[210px] shrink-0 rounded-lg border p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto ${
            isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
          }`}
        >
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded text-[12px] font-mono text-left transition-all shrink-0 ${
                  isActive
                    ? isDark
                      ? "bg-[#171C24] text-[#D64B55] font-semibold border border-[#2B333E]"
                      : "bg-[#FFFFFF] text-[#B83D47] font-semibold border border-[#E2DED5] shadow-xs"
                    : isDark
                    ? "text-[#A6AEB8] hover:text-[#F2F0EA] hover:bg-[#151B23]"
                    : "text-[#626A73] hover:text-[#20242A] hover:bg-[#F2EFE8]"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Viewport */}
        <div
          className={`flex-1 rounded-lg border p-5 overflow-y-auto min-h-0 space-y-6 ${
            isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
          }`}
        >
          {/* 1. IDENTITY & MISSION */}
          {activeSection === "identity" && (
            <div className="space-y-4 max-w-3xl">
              <div>
                <h3 className="text-[14px] font-bold font-mono">Who is this Agent?</h3>
                <p className={`text-[11px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                  Identity credentials, role taxonomy, and high-level autonomous directives.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-mono font-semibold mb-1">Agent Name</label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded border text-[12px] font-mono ${
                      isDark ? "bg-[#171C24] border-[#2B333E] text-white" : "bg-[#FFFFFF] border-[#E2DED5]"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-semibold mb-1">Role Title</label>
                  <input
                    type="text"
                    value={agentRole}
                    onChange={(e) => setAgentRole(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded border text-[12px] font-mono ${
                      isDark ? "bg-[#171C24] border-[#2B333E] text-white" : "bg-[#FFFFFF] border-[#E2DED5]"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-semibold mb-1">Assigned Foundation Model</label>
                <select
                  value={agentModel}
                  onChange={(e) => setAgentModel(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded border text-[12px] font-mono ${
                    isDark ? "bg-[#171C24] border-[#2B333E] text-white" : "bg-[#FFFFFF] border-[#E2DED5]"
                  }`}
                >
                  <option value="Claude 3.7 Sonnet">Claude 3.7 Sonnet (Hybrid Reasoning · 1M Ctx)</option>
                  <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet (Fast · 200k Ctx)</option>
                  <option value="Claude 3.5 Haiku">Claude 3.5 Haiku (Low Latency · 200k Ctx)</option>
                  <option value="AWS Bedrock Titan">AWS Bedrock Titan Express</option>
                  <option value="GPT-4o">GPT-4o Omnimodal</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-semibold mb-1">Mission Directive</label>
                <textarea
                  rows={3}
                  value={agentMission}
                  onChange={(e) => setAgentMission(e.target.value)}
                  className={`w-full px-3 py-2 rounded border text-[12px] font-mono resize-none ${
                    isDark ? "bg-[#171C24] border-[#2B333E] text-white" : "bg-[#FFFFFF] border-[#E2DED5]"
                  }`}
                />
              </div>
            </div>
          )}

          {/* 2. SYSTEM INSTRUCTIONS */}
          {activeSection === "instructions" && (
            <div className="space-y-4 max-w-3xl">
              <div>
                <h3 className="text-[14px] font-bold font-mono">System Instructions & Invariants</h3>
                <p className={`text-[11px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                  Direct behavioral prompts, operational constraints, and tone formatting.
                </p>
              </div>

              <div>
                <textarea
                  rows={12}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className={`w-full p-3 rounded border text-[12px] font-mono leading-relaxed resize-y ${
                    isDark ? "bg-[#171C24] border-[#2B333E] text-white" : "bg-[#FFFFFF] border-[#E2DED5]"
                  }`}
                />
              </div>
            </div>
          )}

          {/* 3. CAPABILITIES: TOOLS & SKILLS */}
          {activeSection === "capabilities" && (
            <div className="space-y-4 max-w-3xl">
              <div>
                <h3 className="text-[14px] font-bold font-mono">What can this Agent do?</h3>
                <p className={`text-[11px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                  Manage access to sandbox tools and operational skill repositories.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#737D89]">
                  Verified Tools ({selectedAgent.toolCount} Enabled)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Terminal Shell (`exec:sh`)",
                    "Git Version Control (`git:*`)",
                    "AWS Cedar Evaluator (`cedar:eval`)",
                    "Filesystem Read/Write (`fs:*`)",
                    "Browser Automation (`playwright:*`)",
                    "Vector DB Query (`vector:search`)",
                  ].map((tool, idx) => (
                    <div
                      key={tool}
                      className={`p-2.5 rounded border flex items-center justify-between text-[11px] font-mono ${
                        isDark ? "bg-[#171C24] border-[#2B333E]" : "bg-[#FFFFFF] border-[#E2DED5]"
                      }`}
                    >
                      <span>{tool}</span>
                      <span className="text-[#4BA982] text-[10px] font-bold">ACTIVE</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#737D89]">
                  Assigned Skills ({selectedAgent.skills.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.skills.map((skill) => (
                    <span
                      key={skill}
                      className={`px-2.5 py-1 rounded border text-[11px] font-mono font-semibold ${
                        isDark
                          ? "bg-[#171C24] border-[#2B333E] text-[#F2F0EA]"
                          : "bg-[#FFFFFF] border-[#E2DED5] text-[#20242A]"
                      }`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. CEDAR GOVERNANCE & PERMISSIONS */}
          {activeSection === "permissions" && (
            <div className="space-y-4 max-w-3xl">
              <div>
                <h3 className="text-[14px] font-bold font-mono">What is it allowed to do?</h3>
                <p className={`text-[11px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                  AWS Cedar policies enforce zero-trust execution boundaries before any tool call.
                </p>
              </div>

              <div
                className={`p-3.5 rounded-lg border font-mono text-[11px] space-y-2 ${
                  isDark ? "bg-[#171C24] border-[#2B333E]" : "bg-[#FFFFFF] border-[#E2DED5]"
                }`}
              >
                <div className="text-[#927BAA] font-semibold">// Cedar Policy: POL-CEDAR-SWARM-01</div>
                <pre className="text-[11px] leading-relaxed overflow-x-auto text-[#4BA982]">
{`permit(
    principal == Ultron::Agent::"${selectedAgent.id}",
    action in [
        Ultron::Action::"ReadWorkspace",
        Ultron::Action::"ProposeDiff",
        Ultron::Action::"ExecuteTest"
    ],
    resource == Ultron::Mesh::"Sandboxed"
);

forbid(
    principal == Ultron::Agent::"${selectedAgent.id}",
    action == Ultron::Action::"ApplyProductionMigration",
    resource
) unless {
    context.human_approval == true
};`}
                </pre>
              </div>
            </div>
          )}

          {/* 5. BUDGET & CIRCUIT BREAKER */}
          {activeSection === "budget" && (
            <div className="space-y-4 max-w-3xl">
              <div>
                <h3 className="text-[14px] font-bold font-mono">How much can it spend?</h3>
                <p className={`text-[11px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                  Budget caps and circuit breakers automatically halt agent execution on overrun.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div
                  className={`p-3.5 rounded-lg border space-y-2 ${
                    isDark ? "bg-[#171C24] border-[#2B333E]" : "bg-[#FFFFFF] border-[#E2DED5]"
                  }`}
                >
                  <span className="text-[11px] font-mono text-[#737D89] block">Total Monthly Budget Cap</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-mono font-bold">$</span>
                    <input
                      type="number"
                      value={agentBudgetCap}
                      onChange={(e) => setAgentBudgetCap(e.target.value)}
                      className="w-24 px-2 py-1 text-[13px] font-mono font-bold rounded border bg-transparent"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#4BA982]">
                    ${selectedAgent.budget.used.toFixed(2)} consumed this cycle
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-lg border space-y-2 ${
                    isDark ? "bg-[#171C24] border-[#2B333E]" : "bg-[#FFFFFF] border-[#E2DED5]"
                  }`}
                >
                  <span className="text-[11px] font-mono text-[#737D89] block">Circuit Breaker Policy</span>
                  <div className="text-[12px] font-mono font-bold text-[#C99A45] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Auto-trip at 90% saturation</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#737D89]">
                    Execution automatically suspends for human review
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 6. MEMORY & CONTEXT */}
          {activeSection === "memory" && (
            <div className="space-y-4 max-w-3xl">
              <div>
                <h3 className="text-[14px] font-bold font-mono">What does it remember?</h3>
                <p className={`text-[11px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                  Episodic session history, long-term vector embeddings, and workspace scratchpads.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                {[
                  { name: "MEMORY.md", size: "4.2 KB", updated: "12m ago", desc: "Long-term architecture memory" },
                  { name: "SOUL.md", size: "1.8 KB", updated: "2h ago", desc: "Agent persona and voice invariants" },
                  { name: "SCRATCHPAD.md", size: "840 B", updated: "4m ago", desc: "Active task execution buffer" },
                ].map((doc) => (
                  <div
                    key={doc.name}
                    className={`p-3 rounded-lg border flex items-center justify-between text-[11px] font-mono ${
                      isDark ? "bg-[#171C24] border-[#2B333E]" : "bg-[#FFFFFF] border-[#E2DED5]"
                    }`}
                  >
                    <div>
                      <span className="font-bold block text-inherit">{doc.name}</span>
                      <span className={`text-[10px] ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                        {doc.desc} · {doc.size}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#737D89]">{doc.updated}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
