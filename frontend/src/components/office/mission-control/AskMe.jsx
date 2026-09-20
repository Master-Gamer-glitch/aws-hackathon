import React, { useState } from 'react';

export default function AskMe() {
  const [activeView, setActiveView] = useState('pending'); // 'pending' | 'resolved'
  const [selectedAgent, setSelectedAgent] = useState('All');

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] w-full mx-auto flex-1 flex flex-col">
      {/* 1. Sub-Header & Live Attention Pool Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-crew-card p-4 rounded-panel border border-crew-border shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-[12px] font-bold tracking-wider uppercase text-crew-text">
              ATTENTION POOL
            </span>
            <span className="px-1.5 py-0.2 rounded-control bg-crew-surface-secondary text-crew-text-secondary font-mono text-[10px] border border-crew-border">
              HUMAN IN THE LOOP
            </span>
          </div>
          <div className="h-3 w-px bg-crew-border" />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-control bg-crew-warning-soft text-crew-warning font-mono text-[11px] font-medium border border-crew-warning/30">
            <span className="w-1.5 h-1.5 rounded-full bg-crew-warning animate-pulse" />
            <span>1 PENDING DECISION</span>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-crew-text-secondary font-mono text-[11px] bg-crew-surface-secondary px-2.5 py-1 rounded-control border border-crew-border">
            <span className="material-symbols-outlined text-[13px] text-crew-success">sensors</span>
            <span>Floor mesh live · 1 gate awaiting human</span>
          </div>

          <div className="flex items-center gap-1">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="h-7 pl-2 pr-6 rounded-control bg-crew-surface-secondary border border-crew-border text-crew-text text-[11px] font-medium hover:bg-crew-hover transition-colors focus:outline-none"
            >
              <option value="All">All Agents (4)</option>
              <option value="Ultron">Ultron (Supreme Orchestrator)</option>
              <option value="Sarah">Sarah (Code Synth)</option>
              <option value="Sentinel">Sentinel (Security)</option>
            </select>

            <button 
              onClick={() => setActiveView(prev => prev === 'pending' ? 'resolved' : 'pending')}
              className={`h-7 px-2.5 rounded-control border border-crew-border text-[11px] font-medium transition-colors flex items-center gap-1 ${
                activeView === 'resolved' 
                  ? 'bg-crew-primary-soft text-crew-primary border-crew-primary/30' 
                  : 'bg-crew-surface-secondary text-crew-text-secondary hover:text-crew-text hover:bg-crew-hover'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[13px]">history</span>
              <span>{activeView === 'resolved' ? 'Show Pending' : 'History'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Live Telemetry Strip */}
      <div className="px-4 py-2 bg-crew-surface-secondary rounded-card border border-crew-border flex items-center justify-between text-crew-text-secondary font-mono text-[11px]">
        <div className="flex items-center gap-4 sm:gap-6">
          <span>DISPATCH: <strong className="text-crew-text">Mesh v4.8.2-rt</strong></span>
          <span className="hidden sm:inline">POLL: <strong className="text-crew-text">250ms</strong></span>
          <span className="hidden md:inline">ROUTER: <strong className="text-crew-text">Ultron (Supreme Orchestrator)</strong></span>
        </div>
        <div className="flex items-center gap-1 text-crew-success font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-crew-success animate-pulse" />
          <span>SUPERVISOR READY</span>
        </div>
      </div>

      {/* 3. Attention Stage: Pending Decision or Clean Empty State */}
      {activeView === 'pending' ? (
        <div className="space-y-4">
          {/* Active Pending Decision Card */}
          <div className="bg-crew-card rounded-panel border border-crew-warning/50 p-5 shadow-panel space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-crew-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-control bg-crew-primary-soft text-crew-primary flex items-center justify-center font-bold text-[12px]">
                  U
                </div>
                <div>
                  <span className="text-[13px] font-bold text-crew-text">Ultron requests confirmation</span>
                  <span className="text-[11px] font-mono text-crew-text-muted ml-2">#CRW-8815</span>
                </div>
              </div>
              <span className="font-mono text-[11px] text-crew-warning bg-crew-warning-soft px-2 py-0.5 rounded-control border border-crew-warning/30 font-medium self-start sm:self-auto">
                BLOCKING STAGING PIPELINE
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-[14px] font-semibold text-crew-text">
                Do you want to proceed with staging the token refresh schema migration to production branch?
              </h2>
              <p className="text-[12px] text-crew-text-secondary leading-relaxed font-sans">
                Cedar validation policy <code className="px-1.5 py-0.2 rounded bg-crew-surface-secondary text-crew-primary font-mono text-[11px]">POL-CEDAR-09</code> passed with 0 errors. Migration diff impacts 2 files (<span className="font-mono text-[11px] text-crew-text">token_refresh.rs</span> and tests). Requires human authorization to apply migrations.
              </p>
            </div>

            <div className="p-3 bg-crew-surface-secondary rounded-card border border-crew-border font-mono text-[11px] text-crew-text space-y-1">
              <div className="text-crew-text-muted">Target Environment: <span className="text-crew-text font-medium">us-east-1 (staging-prod)</span></div>
              <div className="text-crew-text-muted">Impact Score: <span className="text-crew-warning font-medium">Moderate (Data Schema)</span></div>
              <div className="text-crew-text-muted">Estimated Rollback Window: <span className="text-crew-text font-medium">120 seconds</span></div>
            </div>

            {/* Decision Controls */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button 
                className="h-8 px-4 rounded-control bg-crew-primary hover:bg-crew-primary-hover text-white text-[12px] font-medium transition-colors flex items-center gap-1.5 shadow-subtle"
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                <span>Yes, approve staging</span>
              </button>
              <button 
                className="h-8 px-3.5 rounded-control bg-crew-surface-secondary hover:bg-crew-hover border border-crew-border text-crew-text text-[12px] font-medium transition-colors flex items-center gap-1.5"
                type="button"
              >
                <span className="material-symbols-outlined text-crew-warning text-[15px]">bolt</span>
                <span>Yes, and switch to auto mode</span>
              </button>
              <button 
                className="h-8 px-3.5 rounded-control bg-crew-surface-secondary hover:bg-crew-error-soft border border-crew-border text-crew-error text-[12px] font-medium transition-colors flex items-center gap-1.5"
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">cancel</span>
                <span>No, abort action</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / All Clear State */
        <div className="bg-crew-card rounded-panel border border-crew-border p-8 md:p-12 shadow-subtle flex flex-col items-center justify-center text-center flex-1 min-h-[440px]">
          <div className="w-12 h-12 rounded-panel bg-crew-surface-secondary border border-crew-border flex items-center justify-center text-crew-success mb-3 shadow-subtle">
            <span className="material-symbols-outlined text-[24px]">verified_user</span>
          </div>

          <h2 className="font-display text-[16px] font-bold text-crew-text tracking-tight mb-1">
            Nothing needs you right now. 🌱
          </h2>

          <p className="text-[13px] text-crew-text-secondary leading-relaxed max-w-[560px] mb-6">
            When the team blocks a task on your input — a question to answer or a to-do only you can perform — it shows up here (and on the ASK ME board on the floor).
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-control bg-crew-surface-secondary border border-crew-border text-[11px] font-mono text-crew-success">
            <span className="w-1.5 h-1.5 rounded-full bg-crew-success" />
            <span>Autonomous floor clear · All 4 agents running without block</span>
          </div>

          {/* Compact Agent Telemetry Chips */}
          <div className="mt-8 pt-6 border-t border-crew-border/60 flex flex-wrap items-center justify-center gap-2 max-w-xl">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-crew-surface-secondary border border-crew-border text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-crew-success" />
              <span className="text-crew-text font-medium">Ultron</span>
              <span className="text-crew-text-muted">Orchestrating</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-crew-surface-secondary border border-crew-border text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-crew-success" />
              <span className="text-crew-text font-medium">Sarah</span>
              <span className="text-crew-text-muted">Code Gen</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-crew-surface-secondary border border-crew-border text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-crew-info" />
              <span className="text-crew-text font-medium">Vector</span>
              <span className="text-crew-text-muted">QA & Tests</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-crew-surface-secondary border border-crew-border text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-crew-text-muted" />
              <span className="text-crew-text font-medium">Sentinel</span>
              <span className="text-crew-text-muted">Sec Policy</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
