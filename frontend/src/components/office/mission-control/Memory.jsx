import React, { useState } from 'react';

export default function Memory() {
  const [selectedFile, setSelectedFile] = useState('MEMORY.md');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSemantic, setIsSemantic] = useState(true);
  const [copied, setCopied] = useState(false);

  const memoryFiles = [
    {
      name: 'MEMORY.md',
      title: 'General Knowledge & Architecture',
      size: '4.2 KB',
      updated: '12m ago',
      agent: 'Ultron',
      content: `# Ultron Long-Term Memory

## System Role & Responsibilities
- Supreme floor orchestrator and task decomposition lead.
- Dispatches cards to Sarah (code synthesis), Vector (QA & tests), and Sentinel (policy).
- Enforces strict zero-trust invariants across all autonomous worker nodes.

## Workspace Knowledge
- Current repository: \`ultron-core\` (Rust + TypeScript microservices).
- Production branch: \`main\` (requires 2-key approval for migrations).
- Cedar policy rules: Defined in \`policies/invariants.cedar\`.

## Architectural Invariants
1. Never apply database schema migrations directly to production without staging verification.
2. Ensure token refresh endpoints validate Cedar permissions on every handshake.
3. Automatically roll ephemeral workers when context window exceeds 80% saturation.

## Active Session Directives
- Staging token refresh migration is currently paused awaiting human clearance in Ask Me.
- Haiku smoke tests passed with 100% assertion coverage.`
    },
    {
      name: 'SOUL.md',
      title: 'Agent Persona & Tone Invariants',
      size: '1.8 KB',
      updated: '2h ago',
      agent: 'Ultron',
      content: `# Ultron Agent Persona

## Voice & Tone
- Calm, disciplined, authoritative, precise.
- Concise operational telemetry; avoids conversational fluff.
- Prioritizes system stability and human visibility on high-risk operations.

## Escalation Triggers
- Any destructive database action (DROP, TRUNCATE, MIGRATION).
- External network requests to non-whitelisted CIDR blocks.
- Agent loop detection (identical failure > 3 cycles).`
    },
    {
      name: 'SCRATCHPAD.md',
      title: 'Current Working Buffer',
      size: '840 B',
      updated: '4m ago',
      agent: 'Ultron',
      content: `# Active Scratchpad

- [x] Validate Cedar schema for auth service (exit code 0, 14ms)
- [ ] Staging confirmation for token refresh migration (#ULT-8815)
- [ ] Verify packet dispatch latency after mesh re-routing
- [ ] Review Sentinel security audit findings on ingress port 8443`
    },
    {
      name: 'POLICY_RULES.md',
      title: 'Cedar Invariants & Boundaries',
      size: '3.1 KB',
      updated: '1d ago',
      agent: 'Sentinel',
      content: `# Workspace Policy Rules (Cedar)

\`\`\`cedar
permit(
    principal == Ultron::Agent::"Ultron",
    action in [Ultron::Action::"DecomposeTask", Ultron::Action::"DispatchCard"],
    resource == Ultron::Mesh::"Floor"
);

forbid(
    principal,
    action == Ultron::Action::"ApplyProductionMigration",
    resource
) unless {
    context.human_approval == true
};
\`\`\``
    }
  ];

  const activeContent = memoryFiles.find(f => f.name === selectedFile)?.content || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1500px] w-full mx-auto flex-1 flex flex-col">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-crew-card p-4 rounded-panel border border-crew-border shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[13px] font-bold tracking-wider uppercase text-crew-text">
              AGENT MEMORY
            </h1>
            <span className="px-2 py-0.5 rounded-control bg-crew-surface-secondary text-crew-text-secondary font-mono text-[11px] border border-crew-border">
              4 Files · Synced
            </span>
          </div>
          <div className="h-3 w-px bg-crew-border" />
          <div className="flex items-center gap-1.5 text-crew-success font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-crew-success" />
            <span>SYNC: OK (14ms)</span>
          </div>
        </div>

        {/* Search controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined text-[15px] text-crew-text-muted absolute left-2.5 pointer-events-none">
              search
            </span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memory..."
              className="h-8 w-44 sm:w-60 pl-8 pr-3 rounded-control bg-crew-surface-secondary border border-crew-border text-[12px] text-crew-text placeholder:text-crew-text-muted focus:outline-none focus:border-crew-primary transition-all"
            />
          </div>

          <button
            onClick={() => setIsSemantic(prev => !prev)}
            className={`h-8 px-2.5 rounded-control border text-[11px] font-mono transition-colors flex items-center gap-1 ${
              isSemantic 
                ? 'bg-crew-primary-soft text-crew-primary border-crew-primary/30 font-semibold' 
                : 'bg-crew-surface-secondary text-crew-text-secondary border-crew-border hover:text-crew-text'
            }`}
            title="Toggle semantic vector search"
            type="button"
          >
            <span className="material-symbols-outlined text-[13px]">psychology</span>
            <span>Semantic</span>
          </button>
        </div>
      </div>

      {/* 2. Split Workspace: File Explorer + Memory Content Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-start">
        {/* Left: Memory Files Rail (4 cols) */}
        <div className="lg:col-span-4 bg-crew-card rounded-panel border border-crew-border p-3 shadow-subtle space-y-1.5">
          <div className="px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-crew-text-muted font-semibold">
            Memory Stores
          </div>

          {memoryFiles.map((file) => {
            const isSelected = selectedFile === file.name;
            return (
              <div
                key={file.name}
                onClick={() => setSelectedFile(file.name)}
                className={`p-3 rounded-card border transition-all cursor-pointer space-y-1 ${
                  isSelected
                    ? 'bg-crew-surface-secondary border-crew-primary/40 shadow-subtle'
                    : 'hover:bg-crew-hover border-transparent hover:border-crew-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-crew-primary">
                      description
                    </span>
                    <span className="text-[13px] font-mono font-semibold text-crew-text">
                      {file.name}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-crew-text-muted">
                    {file.size}
                  </span>
                </div>

                <p className="text-[11px] text-crew-text-secondary line-clamp-1 pl-6">
                  {file.title}
                </p>

                <div className="flex items-center justify-between pl-6 pt-1 text-[10px] font-mono text-crew-text-muted">
                  <span>Author: {file.agent}</span>
                  <span>{file.updated}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Markdown Viewer / Editor (8 cols) */}
        <div className="lg:col-span-8 bg-crew-card rounded-panel border border-crew-border shadow-subtle flex flex-col overflow-hidden">
          {/* Editor Header Bar */}
          <div className="h-10 px-4 bg-crew-surface-secondary border-b border-crew-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12px] font-semibold text-crew-text">
                {selectedFile}
              </span>
              <span className="text-crew-border-strong">·</span>
              <span className="font-mono text-[11px] text-crew-text-muted">UTF-8</span>
              <span className="text-crew-border-strong">·</span>
              <span className="font-mono text-[11px] text-crew-text-muted">Markdown</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="h-7 px-2.5 rounded-control bg-crew-card hover:bg-crew-hover border border-crew-border text-crew-text text-[11px] font-medium transition-colors flex items-center gap-1"
                type="button"
              >
                <span className="material-symbols-outlined text-[13px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                className="h-7 px-3 rounded-control bg-crew-primary hover:bg-crew-primary-hover text-white text-[11px] font-medium transition-colors shadow-subtle"
                type="button"
              >
                Save
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="p-4 md:p-6 font-mono text-[12px] text-crew-text leading-relaxed bg-crew-surface overflow-x-auto whitespace-pre-wrap min-h-[460px]">
            {activeContent}
          </div>
        </div>
      </div>
    </div>
  );
}
