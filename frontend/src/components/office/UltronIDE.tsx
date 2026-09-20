"use client";

import React, { useState } from "react";
import {
  Folder,
  FileCode,
  FileText,
  Shield,
  Play,
  Terminal as TerminalIcon,
  Copy,
  Check,
  Save,
  ChevronRight,
  ChevronDown,
  Maximize2,
  RefreshCw,
  Zap,
} from "lucide-react";

interface UltronIDEProps {
  isDark?: boolean;
}

const SAMPLE_FILES: Record<string, { language: string; content: string }> = {
  "policies/cedar-guardrails.cedar": {
    language: "cedar",
    content: `// AWS Cedar Permission Boundaries for Ultron Swarm
// Principle of Least Privilege: default deny, explicit permit with invariants

permit (
    principal == Ultron::Role::"SupremeOrchestrator",
    action in [
        Ultron::Action::"DecomposeTask",
        Ultron::Action::"DispatchSubAgent",
        Ultron::Action::"InspectMemory",
        Ultron::Action::"SetBudgetLimit"
    ],
    resource == Ultron::Swarm::"CareFlow"
);

permit (
    principal in [Ultron::Agent::"Coder", Ultron::Agent::"Designer"],
    action in [Ultron::Action::"ReadFile", Ultron::Action::"ProposeDiff"],
    resource is Ultron::Workspace::"Filesystem"
)
when {
    resource.path.startsWith("/workspace/src") &&
    !resource.isSensitive
};

forbid (
    principal,
    action in [Ultron::Action::"DestructiveDelete", Ultron::Action::"DeployToProd"],
    resource
)
unless {
    context.humanApproved == true &&
    context.budgetRemaining > 1.00
};`,
  },
  "agents/ultron-orchestrator.ts": {
    language: "typescript",
    content: `import { AgentDAG, CedarAuditor, TokenCircuitBreaker } from "@ultron/core";

export class UltronOrchestrator {
  private breaker = new TokenCircuitBreaker({ capUsd: 5.00 });
  private auditor = new CedarAuditor("policies/cedar-guardrails.cedar");

  /**
   * Decomposes incoming user prompt into a verified DAG task contract.
   */
  async planMission(prompt: string): Promise<AgentDAG> {
    console.log(\`[ULTRON] Ingesting mission: "\${prompt}"\`);
    
    // Enforce budget invariant
    if (this.breaker.isTripped()) {
      throw new Error("Mission paused: Budget cap reached. Requires human top-up.");
    }

    const dag = await AgentDAG.synthesize({
      goal: prompt,
      roles: ["Coder", "Designer", "QA", "Research"],
    });

    // Verify Cedar policy compliance before dispatch
    const policyResult = await this.auditor.validate(dag);
    if (!policyResult.allowed) {
      throw new Error(\`Cedar Policy Violation: \${policyResult.reason}\`);
    }

    return dag;
  }
}`,
  },
  "tasks/active-contracts.json": {
    language: "json",
    content: `{
  "missionId": "MSN-9942",
  "name": "Autonomous Mesh Stabilization & Cedar Audit",
  "status": "in_flight",
  "budgetCap": 5.00,
  "budgetUsed": 1.18,
  "tasks": [
    {
      "id": "TSK-01",
      "title": "Deconstruct task contracts and route to Coder",
      "assignedTo": "Ultron (Orchestrator)",
      "status": "done"
    },
    {
      "id": "TSK-02",
      "title": "Refactor UI tokens to cyber-slate glassmorphism",
      "assignedTo": "Coder",
      "status": "doing"
    },
    {
      "id": "TSK-03",
      "title": "Audit Cedar permission boundaries for destructive writes",
      "assignedTo": "QA",
      "status": "todo"
    }
  ]
}`,
  },
  "memory/MEMORY.md": {
    language: "markdown",
    content: `# Ultron Shared Memory Index

## Swarm Topology
- **Head of Swarm:** Ultron (Claude 3.7 Sonnet · 1M Context)
- **Sub-agents:** Coder (Jim), QA (Vector), Designer (Sarah), RAG (Research)
- **Active Workspace:** ~/workspace/CareFlow

## Current Invariants
- All agent-to-agent communications must be registered in the DAG ledger.
- Zero unauthorized writes to root system directories.
- Human checkpoint required before any production deployment.`,
  },
};

export default function UltronIDE({ isDark = true }: UltronIDEProps) {
  const [selectedFile, setSelectedFile] = useState<string>("policies/cedar-guardrails.cedar");
  const [code, setCode] = useState<string>(SAMPLE_FILES["policies/cedar-guardrails.cedar"].content);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // CLI State
  const [cliInput, setCliInput] = useState("");
  const [cliLogs, setCliLogs] = useState<Array<{ text: string; type: "info" | "success" | "command" | "error" }>>([
    { text: "⚡ ULTRON DEVELOPER CLI v3.2.0 [CONNECTED]", type: "info" },
    { text: "Swarm control plane listening on socket: /tmp/ultron.sock", type: "info" },
    { text: "Type 'help' to inspect available swarm commands.", type: "info" },
  ]);

  const handleSelectFile = (fileName: string) => {
    setSelectedFile(fileName);
    setCode(SAMPLE_FILES[fileName]?.content || "");
    setSaved(false);
  };

  const handleSave = () => {
    SAMPLE_FILES[selectedFile] = {
      language: SAMPLE_FILES[selectedFile]?.language || "text",
      content: code,
    };
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setCliLogs((prev) => [
      ...prev,
      { text: `✓ Saved changes to ${selectedFile}`, type: "success" },
    ]);
  };

  const handleRunCommand = (cmdText: string) => {
    const cmd = cmdText.trim();
    if (!cmd) return;
    setCliInput("");

    const newLogs: typeof cliLogs = [
      ...cliLogs,
      { text: `ultron@mesh:~$ ${cmd}`, type: "command" },
    ];

    if (cmd === "help") {
      newLogs.push(
        { text: "Available Ultron CLI Commands:", type: "info" },
        { text: "  ultron status          - Display swarm health, active pods & token budget", type: "info" },
        { text: "  ultron audit           - Run AWS Cedar policy security evaluation", type: "info" },
        { text: "  ultron spawn <role>    - Spawn a new autonomous sub-agent", type: "info" },
        { text: "  ultron dag-plan <goal> - Synthesize execution DAG from goal", type: "info" },
        { text: "  clear                  - Clear terminal buffer", type: "info" }
      );
    } else if (cmd === "clear") {
      setCliLogs([]);
      return;
    } else if (cmd.includes("status")) {
      newLogs.push(
        { text: "✓ SWARM STATUS: NOMINAL (6/6 Pods Healthy)", type: "success" },
        { text: "• Supreme Orchestrator: Ultron (Claude 3.7 Sonnet · 1M Context)", type: "info" },
        { text: "• Token Consumption: $1.18 / $5.00 Cap (76.4% remaining)", type: "info" },
        { text: "• Cedar Boundaries: 12 Active Invariants · 0 Violations", type: "success" }
      );
    } else if (cmd.includes("audit")) {
      newLogs.push(
        { text: "⚡ Evaluating Cedar policies against current diffs...", type: "info" },
        { text: "✓ policies/cedar-guardrails.cedar: VALID", type: "success" },
        { text: "✓ 0 unauthorized write attempts detected. Security check passed.", type: "success" }
      );
    } else if (cmd.includes("spawn")) {
      newLogs.push(
        { text: "✓ Provisioned new sub-agent container in isolated microVM.", type: "success" },
        { text: "• Attached Cedar boundary: DefaultLeastPrivilege", type: "info" },
        { text: "• Registered to Ultron swarm ledger.", type: "info" }
      );
    } else {
      newLogs.push({
        text: `Command executed: '${cmd}'. Output piped to Ultron telemetry stream.`,
        type: "info",
      });
    }

    setCliLogs(newLogs);
  };

  const lineCount = code.split("\n").length;

  return (
    <div
      className={`w-full flex-1 flex flex-col font-mono select-none overflow-hidden ${
        isDark ? "bg-[#090C10] text-slate-200" : "bg-[#F3F5F9] text-slate-800"
      }`}
    >
      {/* Top IDE Toolbar */}
      <div
        className={`h-10 px-4 border-b flex items-center justify-between shrink-0 text-xs ${
          isDark
            ? "bg-[#0D1117] border-slate-800 text-slate-400"
            : "bg-white border-slate-300 text-slate-600"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-bold text-red-400">
            <Zap className="w-3.5 h-3.5 fill-red-400" />
            <span>ULTRON AGENTIC IDE</span>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-none">
            {selectedFile}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className={`px-2.5 py-1 rounded border text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              saved
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                : isDark
                ? "bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-200"
                : "bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800"
            }`}
          >
            {saved ? <Check className="w-3 h-3 text-emerald-400" /> : <Save className="w-3 h-3" />}
            <span>{saved ? "Saved" : "Save"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleRunCommand(`ultron audit ${selectedFile}`)}
            className="px-2.5 py-1 rounded bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>Audit & Run</span>
          </button>
        </div>
      </div>

      {/* Main IDE Body: Split between File Tree, Editor, and CLI */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: File Tree Explorer */}
        <aside
          className={`w-52 shrink-0 border-r flex flex-col h-full overflow-y-auto text-xs ${
            isDark ? "bg-[#0B0E14] border-slate-800/80" : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="p-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 border-b border-inherit flex items-center justify-between">
            <span>EXPLORER</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800/40 text-cyan-400 font-mono">
              CareFlow
            </span>
          </div>

          <div className="p-2 space-y-1">
            {Object.keys(SAMPLE_FILES).map((fName) => {
              const isActive = selectedFile === fName;
              const isCedar = fName.endsWith(".cedar");
              const isTs = fName.endsWith(".ts");
              const isJson = fName.endsWith(".json");

              return (
                <button
                  key={fName}
                  type="button"
                  onClick={() => handleSelectFile(fName)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] font-mono flex items-center gap-2 transition-colors cursor-pointer truncate ${
                    isActive
                      ? isDark
                        ? "bg-cyan-950/30 text-cyan-300 border border-cyan-500/40 font-semibold"
                        : "bg-cyan-50 text-cyan-950 border border-cyan-300 font-semibold"
                      : isDark
                      ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                      : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {isCedar ? (
                    <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : isTs ? (
                    <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  ) : isJson ? (
                    <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate">{fName.split("/").pop()}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-auto p-3 border-t border-inherit text-[10px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>GIT:</span>
              <span className="text-cyan-400 font-bold">main*</span>
            </div>
            <div className="flex justify-between">
              <span>WORKSPACE:</span>
              <span className="text-slate-400">Isolated MicroVM</span>
            </div>
          </div>
        </aside>

        {/* Center: Code Editor */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* File Tab */}
          <div
            className={`h-8 px-4 border-b flex items-center gap-2 text-xs shrink-0 ${
              isDark ? "bg-[#090C10] border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <span className="px-2.5 py-1 rounded-t bg-[#0D1117] border-t-2 border-t-cyan-400 text-cyan-300 font-semibold text-[11px] flex items-center gap-1.5">
              <FileCode className="w-3 h-3 text-cyan-400" />
              <span>{selectedFile.split("/").pop()}</span>
            </span>
          </div>

          {/* Editor Body with Line Numbers */}
          <div className="flex-1 flex overflow-auto font-mono text-xs select-text">
            {/* Line numbers */}
            <div
              className={`py-3 px-2 text-right select-none shrink-0 border-r ${
                isDark
                  ? "bg-[#090C10] border-slate-800 text-slate-600"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i} className="leading-6 text-[11px]">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Input Area */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className={`flex-1 p-3 leading-6 resize-none focus:outline-none text-[12px] font-mono select-text ${
                isDark
                  ? "bg-[#0D1117] text-slate-200 placeholder-slate-600"
                  : "bg-white text-slate-900 placeholder-slate-400"
              }`}
            />
          </div>

          {/* Bottom: Ultron CLI Terminal */}
          <div
            className={`h-48 border-t flex flex-col shrink-0 ${
              isDark ? "bg-[#070A0E] border-slate-800" : "bg-slate-900 border-slate-700 text-white"
            }`}
          >
            {/* Terminal Header */}
            <div
              className={`h-7 px-3 border-b flex items-center justify-between text-[11px] shrink-0 ${
                isDark ? "bg-[#0A0D12] border-slate-800/80 text-slate-400" : "bg-slate-800 border-slate-700 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                <TerminalIcon className="w-3 h-3 text-cyan-400" />
                <span className="text-white">ULTRON CLI TERMINAL</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRunCommand("ultron status")}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-cyan-400 border border-cyan-500/30 cursor-pointer"
                >
                  status
                </button>
                <button
                  type="button"
                  onClick={() => handleRunCommand("ultron audit")}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-emerald-400 border border-emerald-500/30 cursor-pointer"
                >
                  audit
                </button>
                <button
                  type="button"
                  onClick={() => handleRunCommand("clear")}
                  className="text-slate-500 hover:text-white text-[10px] cursor-pointer"
                >
                  clear
                </button>
              </div>
            </div>

            {/* Terminal Output Stream */}
            <div className="flex-1 p-2.5 overflow-y-auto font-mono text-[11px] space-y-1 select-text">
              {cliLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`${
                    log.type === "command"
                      ? "text-cyan-400 font-bold"
                      : log.type === "success"
                      ? "text-emerald-400"
                      : log.type === "error"
                      ? "text-rose-400"
                      : "text-slate-300"
                  }`}
                >
                  {log.text}
                </div>
              ))}
            </div>

            {/* Terminal Prompt Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunCommand(cliInput);
              }}
              className="h-8 px-2.5 border-t border-slate-800/80 flex items-center gap-2 bg-[#05070A]"
            >
              <span className="text-cyan-400 font-bold text-xs">ultron@mesh:~$</span>
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                placeholder="type 'help' or command (e.g. ultron status, ultron audit)..."
                className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder-slate-600"
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
