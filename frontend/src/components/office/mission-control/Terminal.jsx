import React, { useState } from 'react';

export default function Terminal() {
  const [fontSize, setFontSize] = useState(12);
  const [copied, setCopied] = useState(false);
  const [commandInput, setCommandInput] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText('Terminal logs copied from Ultron');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-6 w-full flex-1 flex flex-col">
      {/* Execution Console Card */}
      <section className="bg-crew-card border border-crew-border rounded-panel shadow-panel flex flex-col flex-1 overflow-hidden">
        {/* Terminal Header Toolbar */}
        <div className="h-10 px-4 bg-crew-surface-secondary border-b border-crew-border flex items-center justify-between select-none">
          {/* Left status */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-crew-success font-medium">
              <span className="w-2 h-2 rounded-full bg-crew-success animate-pulse" />
              <span>Live · pty-py (pid 4892)</span>
            </span>
          </div>

          {/* Center active CWD */}
          <div className="hidden md:flex items-center gap-1.5 font-mono text-[11px] text-crew-text-secondary px-2 py-0.5 rounded-control bg-crew-card border border-crew-border">
            <span className="material-symbols-outlined text-[14px]">folder_open</span>
            <span>~/workspace/ultron-core <span className="text-crew-primary font-medium">(git:main*)</span></span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5">
            {/* Font size control */}
            <div className="flex items-center bg-crew-card border border-crew-border rounded-control px-1 text-crew-text-secondary">
              <button 
                onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
                className="w-5 h-5 flex items-center justify-center hover:text-crew-text text-[13px] font-mono transition-colors" 
                title="Decrease font size" 
                type="button"
              >
                −
              </button>
              <span className="font-mono text-[11px] px-1 font-medium text-crew-text">{fontSize}px</span>
              <button 
                onClick={() => setFontSize(prev => Math.min(16, prev + 1))}
                className="w-5 h-5 flex items-center justify-center hover:text-crew-text text-[13px] font-mono transition-colors" 
                title="Increase font size" 
                type="button"
              >
                +
              </button>
            </div>

            <button 
              onClick={handleCopy}
              className="p-1 rounded-control hover:bg-crew-hover text-crew-text-secondary hover:text-crew-text transition-colors" 
              title={copied ? "Copied!" : "Copy buffer"} 
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copied ? 'check' : 'content_copy'}
              </span>
            </button>

            <button 
              className="p-1 rounded-control hover:bg-crew-hover text-crew-text-secondary hover:text-crew-text transition-colors" 
              title="Clear buffer" 
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">block</span>
            </button>
          </div>
        </div>

        {/* Terminal Content View (Execution Console Surface: #F1F3F6 in light mode, #0A0D11 in dark mode) */}
        <div 
          className="p-4 font-mono space-y-2.5 bg-[#F1F3F6] text-[#20242A] dark:bg-[#0A0D11] dark:text-[#F2F0EB] leading-relaxed flex-1 overflow-x-auto overflow-y-auto min-h-[460px] border-b border-crew-border transition-colors"
          style={{ fontSize: `${fontSize}px` }}
        >
          {/* Log item 1: SYSTEM */}
          <div className="flex items-start gap-2.5">
            <span className="text-crew-text-muted select-none">[12:44:18]</span>
            <span className="px-1.5 py-0.2 rounded-control bg-white dark:bg-[#171C24] border border-crew-border font-medium text-crew-primary uppercase text-[10.5px]">
              SYSTEM
            </span>
            <span className="text-crew-text-secondary">One new item to flag in workspace policy invariants.</span>
          </div>

          {/* Log item 2: COMMAND */}
          <div className="flex items-start gap-2.5">
            <span className="text-crew-text-muted select-none">[12:44:21]</span>
            <span className="px-1.5 py-0.2 rounded-control bg-white dark:bg-[#171C24] border border-crew-border font-medium text-crew-purple uppercase text-[10.5px]">
              COMMAND
            </span>
            <span className="text-crew-text font-semibold bg-white dark:bg-[#171C24] px-1.5 py-0.5 rounded-control border border-crew-border">
              cd /Users/project/auth-service && git status --porcelain
            </span>
          </div>

          {/* Log item 3: OUTPUT */}
          <div className="flex items-start gap-2.5 pl-14">
            <span className="text-crew-text-muted select-none">[12:44:23]</span>
            <span className="px-1.5 py-0.2 rounded-control bg-white dark:bg-[#171C24] border border-crew-border font-medium text-crew-text-muted uppercase text-[10.5px]">
              OUTPUT
            </span>
            <div className="text-crew-text space-y-0.5">
              <div className="text-crew-warning font-medium">M  src/handlers/token_refresh.rs</div>
              <div className="text-crew-text-muted">?? tests/e2e_refresh_flow.spec.ts</div>
            </div>
          </div>

          {/* Log item 4: AGENT (Ultron) */}
          <div className="flex items-start gap-2.5">
            <span className="text-crew-text-muted select-none">[12:44:25]</span>
            <span className="px-1.5 py-0.2 rounded-control bg-crew-primary-soft border border-crew-primary/30 font-semibold text-crew-primary uppercase text-[10.5px]">
              AGENT (Ultron)
            </span>
            <span className="text-crew-text">
              Checking pending inbox message headers and validating Cedar policy rule <code className="px-1.5 py-0.5 bg-white dark:bg-[#171C24] border border-crew-border rounded-control text-crew-primary font-semibold">POL-CEDAR-09</code>...
            </span>
          </div>

          {/* Log item 5: TOOL */}
          <div className="flex items-start gap-2.5">
            <span className="text-crew-text-muted select-none">[12:44:30]</span>
            <span className="px-1.5 py-0.2 rounded-control bg-crew-success-soft border border-crew-success/30 text-crew-success font-semibold uppercase text-[10.5px]">
              TOOL
            </span>
            <span className="text-crew-text-secondary">
              Executed <span className="text-crew-text font-medium">`cedar.validate_schema --strict`</span> → <span className="text-crew-success font-medium">(exit code 0, 14ms)</span>
            </span>
          </div>

          {/* Log item 6: Highlighted Action Prompt Container (Human in the loop approval) */}
          <div className="mt-4 p-4 rounded-card bg-white dark:bg-[#1B212A] border border-[#C99A45]/50 shadow-panel space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded-control bg-crew-warning-soft border border-crew-warning/40 text-crew-warning font-semibold uppercase text-[10px]">
                  INTERACTION REQUIRED
                </span>
                <span className="text-[11px] text-crew-warning font-medium">
                  [12:44:35] ULTRON REQUESTS STAGING CONFIRMATION
                </span>
              </div>
              <span className="text-[11px] text-crew-text-muted">Awaiting response</span>
            </div>

            <div className="font-sans text-[13px] text-crew-text font-medium">
              Do you want to proceed with staging the token refresh schema migration to production branch?
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button 
                className="h-7 px-3 rounded-control bg-crew-primary hover:bg-crew-primary-hover text-white font-sans text-[12px] font-medium transition-colors flex items-center gap-1.5 shadow-subtle" 
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                <span>1. Yes, approve staging</span>
              </button>
              <button 
                className="h-7 px-3 rounded-control bg-white dark:bg-[#171C24] hover:bg-crew-hover border border-crew-border text-crew-text font-sans text-[12px] font-medium transition-colors flex items-center gap-1.5" 
                type="button"
              >
                <span className="material-symbols-outlined text-crew-warning text-[15px]">bolt</span>
                <span>2. Yes, and switch to auto mode</span>
              </button>
              <button 
                className="h-7 px-3 rounded-control bg-white dark:bg-[#171C24] hover:bg-crew-error-soft border border-crew-border text-crew-error font-sans text-[12px] font-medium transition-colors flex items-center gap-1.5" 
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">cancel</span>
                <span>3. No, abort action</span>
              </button>
            </div>
          </div>
        </div>

        {/* Terminal Input Bar */}
        <div className="p-3 bg-crew-surface-secondary border-t border-crew-border flex items-center gap-2 transition-colors">
          <span className="font-mono text-[13px] text-crew-primary font-bold pl-2 select-none">$</span>
          <input 
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type a command or instruction for Ultron..."
            className="flex-1 bg-white dark:bg-crew-card border border-crew-border rounded-control px-3 py-1.5 text-[12px] font-mono text-crew-text placeholder:text-crew-text-muted focus:outline-none focus:border-crew-primary focus:ring-1 focus:ring-crew-primary/20 transition-all"
          />
          <button 
            className="h-8 px-3.5 rounded-control bg-crew-primary hover:bg-crew-primary-hover text-white text-[12px] font-medium transition-colors flex items-center gap-1.5 shadow-subtle"
            type="button"
          >
            <span>Send</span>
            <span className="material-symbols-outlined text-[14px]">send</span>
            <span className="text-[10px] font-mono opacity-80 pl-0.5">⌘↵</span>
          </button>
        </div>
      </section>
    </div>
  );
}
