import React, { useState } from 'react';

export default function Monitor() {
  const [taskPrompt, setTaskPrompt] = useState('');
  const [owner, setOwner] = useState('Ultron decides');

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] w-full mx-auto">
      {/* 1. DISPATCH SECTION */}
      <div className="bg-crew-card rounded-panel border border-crew-border p-4 shadow-subtle">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-crew-border">
          <div className="flex items-center gap-2">
            <span className="font-display text-[12px] font-bold tracking-wider uppercase text-crew-text">
              DISPATCH
            </span>
            <span className="px-2 py-0.5 rounded-control text-[11px] font-mono font-medium text-crew-primary bg-crew-primary-soft border border-crew-primary/20">
              → VIA ULTRON
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-crew-success font-medium">
            <span className="w-2 h-2 rounded-full bg-crew-success animate-pulse" />
            <span>ORCHESTRATOR ONLINE</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-crew-text-muted font-mono">
              SUGGESTED OWNER
            </span>
            <div className="relative inline-block">
              <select 
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1 rounded-control bg-crew-surface-secondary border border-crew-border text-crew-text text-[12px] font-medium hover:bg-crew-hover transition-colors focus:outline-none focus:border-crew-primary"
              >
                <option value="Ultron decides">Ultron decides (Supreme Orchestrator)</option>
                <option value="Sarah">Sarah (Sonnet 3.5 - Code Synth)</option>
                <option value="Vector">Vector (Haiku - QA & Tests)</option>
                <option value="Sentinel">Sentinel (GPT-4o - Sec Policy)</option>
              </select>
              <span className="material-symbols-outlined text-[16px] text-crew-text-muted absolute right-2 top-1.5 pointer-events-none">
                arrow_drop_down
              </span>
            </div>
          </div>

          <div>
            <textarea 
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              className="w-full bg-crew-surface-secondary border border-crew-border rounded-card p-3 text-crew-text placeholder:text-crew-text-muted text-[13px] font-sans focus:outline-none focus:border-crew-primary focus:ring-1 focus:ring-crew-primary/20 transition-all resize-none"
              placeholder="Describe the task... Ultron decomposes, writes the card, and assigns to the right agent" 
              rows={3} 
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-mono text-crew-text-muted">
              Hint: Ultron decomposes multi-file tasks into discrete execution cards
            </span>
            <button 
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-control bg-crew-primary hover:bg-crew-primary-hover text-white font-medium text-[12px] transition-all shadow-subtle"
              type="button"
            >
              <span>Dispatch</span>
              <span className="material-symbols-outlined text-[15px]">send</span>
              <span className="ml-1 text-[10px] font-mono text-white/80 bg-white/20 px-1.5 py-0.2 rounded">⌘↵</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. AGENTS RUNTIME SECTION */}
      <div className="bg-crew-card rounded-panel border border-crew-border p-4 shadow-subtle space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-crew-border">
          <div className="flex items-center gap-2">
            <span className="font-display text-[12px] font-bold tracking-wider uppercase text-crew-text">
              AGENTS RUNTIME
            </span>
            <span className="px-1.5 py-0.2 rounded-control bg-crew-surface-secondary text-crew-text-secondary text-[10px] font-mono border border-crew-border">
              4 TOTAL
            </span>
          </div>
          <span className="font-mono text-[11px] text-crew-text-muted">PID: 88421 // MESH ACTIVE</span>
        </div>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Ultron Card */}
          <div className="p-3.5 rounded-card bg-crew-surface-secondary border border-crew-border space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-control bg-crew-primary-soft text-crew-primary flex items-center justify-center font-display font-bold text-[13px]">
                    U
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-crew-warning ring-2 ring-crew-surface-secondary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[13px] font-bold text-crew-text">Ultron</span>
                    <span className="font-mono text-[10px] text-crew-text-muted px-1.5 py-0.2 rounded bg-crew-card border border-crew-border">
                      head / orchestrator
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-crew-text-muted">Opus 4.8 · 1M context</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-control bg-crew-warning-soft text-crew-warning font-mono text-[10.5px] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-crew-warning animate-pulse" />
                NEEDS YOU
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-crew-border/60 text-[11px] font-mono">
              <div>
                <span className="text-crew-text-muted block text-[10px]">CPU / LOAD</span>
                <span className="text-crew-text font-medium">18.4%</span>
              </div>
              <div>
                <span className="text-crew-text-muted block text-[10px]">TOKENS</span>
                <span className="text-crew-text font-medium">184k / 1M</span>
              </div>
              <div>
                <span className="text-crew-text-muted block text-[10px]">DIR</span>
                <span className="text-crew-text font-medium truncate block">~/core</span>
              </div>
            </div>
          </div>

          {/* Sarah Card */}
          <div className="p-3.5 rounded-card bg-crew-surface-secondary border border-crew-border space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-control bg-crew-purple-soft text-crew-purple flex items-center justify-center font-display font-bold text-[13px]">
                    S
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-crew-success ring-2 ring-crew-surface-secondary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[13px] font-bold text-crew-text">Sarah</span>
                    <span className="font-mono text-[10px] text-crew-text-muted px-1.5 py-0.2 rounded bg-crew-card border border-crew-border">
                      code synth
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-crew-text-muted">Sonnet 3.5 · 200k context</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-control bg-crew-success-soft text-crew-success font-mono text-[10.5px] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-crew-success" />
                WORKING (3)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-crew-border/60 text-[11px] font-mono">
              <div>
                <span className="text-crew-text-muted block text-[10px]">CPU / LOAD</span>
                <span className="text-crew-text font-medium">44.1%</span>
              </div>
              <div>
                <span className="text-crew-text-muted block text-[10px]">TOKENS</span>
                <span className="text-crew-text font-medium">92k / 200k</span>
              </div>
              <div>
                <span className="text-crew-text-muted block text-[10px]">DIR</span>
                <span className="text-crew-text font-medium truncate block">~/auth</span>
              </div>
            </div>
          </div>

          {/* Vector Card */}
          <div className="p-3.5 rounded-card bg-crew-surface-secondary border border-crew-border space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-control bg-crew-info-soft text-crew-info flex items-center justify-center font-display font-bold text-[13px]">
                    V
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-crew-info ring-2 ring-crew-surface-secondary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[13px] font-bold text-crew-text">Vector</span>
                    <span className="font-mono text-[10px] text-crew-text-muted px-1.5 py-0.2 rounded bg-crew-card border border-crew-border">
                      qa & tests
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-crew-text-muted">Haiku · 200k context</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-control bg-crew-surface text-crew-text-muted font-mono text-[10.5px] font-semibold">
                IDLE
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-crew-border/60 text-[11px] font-mono">
              <div>
                <span className="text-crew-text-muted block text-[10px]">LATENCY</span>
                <span className="text-crew-text font-medium">24ms</span>
              </div>
              <div>
                <span className="text-crew-text-muted block text-[10px]">TOKENS</span>
                <span className="text-crew-text font-medium">12k / 200k</span>
              </div>
              <div>
                <span className="text-crew-text-muted block text-[10px]">STATUS</span>
                <span className="text-crew-text font-medium">Standby</span>
              </div>
            </div>
          </div>

          {/* Sentinel Card */}
          <div className="p-3.5 rounded-card bg-crew-surface-secondary border border-crew-border space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-control bg-crew-surface text-crew-text-muted flex items-center justify-center font-display font-bold text-[13px] border border-crew-border">
                    S
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-crew-text-muted ring-2 ring-crew-surface-secondary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[13px] font-bold text-crew-text">Sentinel</span>
                    <span className="font-mono text-[10px] text-crew-text-muted px-1.5 py-0.2 rounded bg-crew-card border border-crew-border">
                      sec policy
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-crew-text-muted">GPT-4o · Policy guard</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-control bg-crew-surface text-crew-text-muted font-mono text-[10.5px] font-semibold">
                IDLE
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-crew-border/60 text-[11px] font-mono">
              <div>
                <span className="text-crew-text-muted block text-[10px]">POLICIES</span>
                <span className="text-crew-text font-medium">14 Active</span>
              </div>
              <div>
                <span className="text-crew-text-muted block text-[10px]">TOKENS</span>
                <span className="text-crew-text font-medium">35k / 128k</span>
              </div>
              <div>
                <span className="text-crew-text-muted block text-[10px]">VIOLATIONS</span>
                <span className="text-crew-success font-medium">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TELEMETRY & CLUSTER METRICS */}
      <div className="bg-crew-card rounded-panel border border-crew-border p-4 shadow-subtle">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-crew-border">
          <span className="font-display text-[12px] font-bold tracking-wider uppercase text-crew-text">
            CLUSTER TELEMETRY
          </span>
          <span className="font-mono text-[11px] text-crew-text-muted">UPTIME: 14d 06h 22m</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-card bg-crew-surface-secondary border border-crew-border">
            <span className="text-[11px] font-mono text-crew-text-muted block">CLUSTER LOAD</span>
            <span className="text-[18px] font-mono font-bold text-crew-text">42%</span>
            <div className="w-full h-1.5 bg-crew-border rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-crew-primary rounded-full" style={{ width: '42%' }} />
            </div>
          </div>

          <div className="p-3 rounded-card bg-crew-surface-secondary border border-crew-border">
            <span className="text-[11px] font-mono text-crew-text-muted block">HOST MEMORY</span>
            <span className="text-[18px] font-mono font-bold text-crew-text">3.8 / 16 GB</span>
            <div className="w-full h-1.5 bg-crew-border rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-crew-purple rounded-full" style={{ width: '24%' }} />
            </div>
          </div>

          <div className="p-3 rounded-card bg-crew-surface-secondary border border-crew-border">
            <span className="text-[11px] font-mono text-crew-text-muted block">ACTIVE TASKS</span>
            <span className="text-[18px] font-mono font-bold text-crew-text">4 / 12</span>
            <div className="w-full h-1.5 bg-crew-border rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-crew-info rounded-full" style={{ width: '33%' }} />
            </div>
          </div>

          <div className="p-3 rounded-card bg-crew-surface-secondary border border-crew-border">
            <span className="text-[11px] font-mono text-crew-text-muted block">INBOX / GATES</span>
            <span className="text-[18px] font-mono font-bold text-crew-warning">1 PENDING</span>
            <div className="w-full h-1.5 bg-crew-border rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-crew-warning rounded-full" style={{ width: '20%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
