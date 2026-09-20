import React, { useState } from 'react';

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('All');
  const [selectedState, setSelectedState] = useState('All');

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] w-full mx-auto flex-1 flex flex-col">
      {/* 1. Tool Strip & Filtering */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-crew-card p-3.5 rounded-panel border border-crew-border shadow-subtle">
        {/* Left: Title & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[13px] font-bold tracking-wider uppercase text-crew-text">
              TASKS
            </h1>
            <span className="px-2 py-0.5 rounded-control bg-crew-surface-secondary text-crew-text-secondary font-mono text-[11px] border border-crew-border">
              2 active · 2 done
            </span>
          </div>

          <div className="h-4 w-px bg-crew-border hidden sm:block" />

          {/* Search */}
          <div className="relative flex items-center">
            <span className="material-symbols-outlined text-[15px] text-crew-text-muted absolute left-2.5 pointer-events-none">
              search
            </span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or filter..."
              className="h-8 w-44 lg:w-56 pl-8 pr-7 rounded-control bg-crew-surface-secondary border border-crew-border text-[12px] text-crew-text placeholder:text-crew-text-muted focus:outline-none focus:border-crew-primary focus:ring-1 focus:ring-crew-primary/20 transition-all"
            />
            <span className="absolute right-2 font-mono text-[10px] text-crew-text-muted pointer-events-none bg-crew-card px-1 py-0.2 rounded border border-crew-border">
              ⌘K
            </span>
          </div>

          {/* Agent Filter */}
          <select 
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="h-8 pl-2.5 pr-7 rounded-control bg-crew-surface-secondary border border-crew-border text-[12px] text-crew-text hover:bg-crew-hover transition-colors focus:outline-none focus:border-crew-primary"
          >
            <option value="All">Agent: All</option>
            <option value="Ultron">Agent: Ultron</option>
            <option value="Sarah">Agent: Sarah</option>
            <option value="Vector">Agent: Vector</option>
            <option value="Sentinel">Agent: Sentinel</option>
          </select>

          {/* State Filter */}
          <select 
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="h-8 pl-2.5 pr-7 rounded-control bg-crew-surface-secondary border border-crew-border text-[12px] text-crew-text hover:bg-crew-hover transition-colors focus:outline-none focus:border-crew-primary"
          >
            <option value="All">State: All</option>
            <option value="Doing">State: Doing</option>
            <option value="Blocked">State: Blocked</option>
            <option value="Done">State: Done</option>
          </select>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button 
            className="h-8 px-3 rounded-control bg-crew-primary hover:bg-crew-primary-hover text-white text-[12px] font-medium transition-colors flex items-center gap-1.5 shadow-subtle"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* 2. TASK BOARD COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 flex-1 items-start">
        {/* COLUMN 1: TODO */}
        <div className="flex flex-col bg-crew-surface-secondary rounded-panel border border-crew-border p-3 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-crew-text-muted" />
              <span className="font-mono text-[11px] font-semibold text-crew-text uppercase tracking-wider">
                TODO
              </span>
            </div>
            <span className="font-mono text-[10px] text-crew-text-muted bg-crew-card px-1.5 py-0.2 rounded-control border border-crew-border">
              0
            </span>
          </div>

          <div className="p-4 rounded-card border border-dashed border-crew-border text-center text-crew-text-muted text-[11px] font-mono">
            No queued tasks
          </div>
        </div>

        {/* COLUMN 2: DOING */}
        <div className="flex flex-col bg-crew-surface-secondary rounded-panel border border-crew-border p-3 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-crew-info animate-pulse" />
              <span className="font-mono text-[11px] font-semibold text-crew-text uppercase tracking-wider">
                DOING
              </span>
            </div>
            <span className="font-mono text-[10px] text-crew-info bg-crew-info-soft px-1.5 py-0.2 rounded-control border border-crew-info/20 font-medium">
              1
            </span>
          </div>

          {/* Task Card 1 */}
          <div className="p-3.5 rounded-card bg-crew-card border border-crew-border shadow-subtle space-y-2.5 hover:border-crew-border-strong transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-crew-text-muted">#CRW-8812</span>
              <span className="px-1.5 py-0.2 rounded-control bg-crew-surface-secondary text-crew-text-secondary font-mono text-[10px] border border-crew-border">
                NETWORK
              </span>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold text-crew-text leading-snug">
                Routing mesh sync
              </h3>
              <p className="text-[11px] text-crew-text-secondary mt-1 leading-relaxed line-clamp-2">
                Re-route packet dispatch across worker nodes to minimize latency spikes on auth flow.
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] font-mono text-crew-text-muted">
                <span>Progress</span>
                <span className="text-crew-text font-medium">65%</span>
              </div>
              <div className="w-full h-1 bg-crew-surface-secondary rounded-full overflow-hidden">
                <div className="h-full bg-crew-primary rounded-full" style={{ width: '65%' }} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-crew-border/60">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-control bg-crew-primary-soft text-crew-primary flex items-center justify-center font-bold text-[10px]">
                  U
                </div>
                <span className="text-[11px] font-mono text-crew-text-secondary">Ultron</span>
              </div>
              <button 
                className="text-[11px] font-mono text-crew-text-muted hover:text-crew-text px-1.5 py-0.5 rounded hover:bg-crew-hover transition-colors"
                type="button"
              >
                Inspect
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 3: BLOCKED */}
        <div className="flex flex-col bg-crew-surface-secondary rounded-panel border border-crew-border p-3 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-crew-warning" />
              <span className="font-mono text-[11px] font-semibold text-crew-text uppercase tracking-wider">
                BLOCKED
              </span>
            </div>
            <span className="font-mono text-[10px] text-crew-warning bg-crew-warning-soft px-1.5 py-0.2 rounded-control border border-crew-warning/30 font-medium">
              1
            </span>
          </div>

          {/* Task Card 2: Blocked / Human in the loop */}
          <div className="p-3.5 rounded-card bg-crew-card border border-crew-warning/40 shadow-subtle space-y-2.5 hover:border-crew-warning transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-crew-text-muted">#CRW-8815</span>
              <span className="px-1.5 py-0.2 rounded-control bg-crew-warning-soft text-crew-warning font-mono text-[10px] border border-crew-warning/30 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-crew-warning animate-pulse" />
                NEEDS YOU
              </span>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold text-crew-text leading-snug">
                Staging schema migration
              </h3>
              <p className="text-[11px] text-crew-text-secondary mt-1 leading-relaxed">
                Waiting for human confirmation to stage the token refresh schema migration to prod branch.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-crew-border/60">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-control bg-crew-primary-soft text-crew-primary flex items-center justify-center font-bold text-[10px]">
                  U
                </div>
                <span className="text-[11px] font-mono text-crew-text-secondary">Ultron</span>
              </div>
              <button 
                className="text-[11px] font-mono text-crew-warning hover:text-crew-warning font-medium px-2 py-0.5 rounded bg-crew-warning-soft border border-crew-warning/20 transition-colors"
                type="button"
              >
                Review
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 4: DONE */}
        <div className="flex flex-col bg-crew-surface-secondary rounded-panel border border-crew-border p-3 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-crew-success" />
              <span className="font-mono text-[11px] font-semibold text-crew-text uppercase tracking-wider">
                DONE
              </span>
            </div>
            <span className="font-mono text-[10px] text-crew-success bg-crew-success-soft px-1.5 py-0.2 rounded-control border border-crew-success/20 font-medium">
              2
            </span>
          </div>

          {/* Task Card 3: Done */}
          <div className="p-3.5 rounded-card bg-crew-card border border-crew-border shadow-subtle space-y-2 opacity-85 hover:opacity-100 transition-opacity cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-crew-text-muted">#CRW-8810</span>
              <span className="px-1.5 py-0.2 rounded-control bg-crew-surface-secondary text-crew-text-secondary font-mono text-[10px] border border-crew-border">
                SECURITY
              </span>
            </div>

            <h3 className="text-[13px] font-semibold text-crew-text leading-snug">
              Cedar policy validation
            </h3>

            <div className="flex items-center justify-between pt-2 border-t border-crew-border/60 text-[11px] font-mono text-crew-text-muted">
              <span>Sentinel</span>
              <span className="text-crew-success">Exit 0 · 14ms</span>
            </div>
          </div>

          {/* Task Card 4: Done */}
          <div className="p-3.5 rounded-card bg-crew-card border border-crew-border shadow-subtle space-y-2 opacity-85 hover:opacity-100 transition-opacity cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-crew-text-muted">#CRW-8809</span>
              <span className="px-1.5 py-0.2 rounded-control bg-crew-surface-secondary text-crew-text-secondary font-mono text-[10px] border border-crew-border">
                QA
              </span>
            </div>

            <h3 className="text-[13px] font-semibold text-crew-text leading-snug">
              Haiku auth smoke tests
            </h3>

            <div className="flex items-center justify-between pt-2 border-t border-crew-border/60 text-[11px] font-mono text-crew-text-muted">
              <span>Vector</span>
              <span className="text-crew-success">Passed 12/12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
