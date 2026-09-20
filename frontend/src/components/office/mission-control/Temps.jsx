import React, { useState } from 'react';

export default function Temps() {
  const [slots, setSlots] = useState([
    {
      id: 'worker-slot-01',
      name: 'Worker 01',
      status: 'ACTIVE',
      agent: 'Ultron',
      task: '#CRW-8812 Routing mesh sync',
      memoryUsed: '2.1 GB',
      memoryMax: '4.0 GB',
      memoryPercent: 52,
      ttl: '42m remaining',
      teardownRule: 'On idle > 15m',
      readiness: 'Executing'
    },
    {
      id: 'worker-slot-02',
      name: 'Worker 02',
      status: 'ACTIVE',
      agent: 'Sarah',
      task: 'Code synth AST analyzer',
      memoryUsed: '1.8 GB',
      memoryMax: '4.0 GB',
      memoryPercent: 45,
      ttl: '18m remaining',
      teardownRule: 'On task complete',
      readiness: 'Executing'
    },
    {
      id: 'worker-slot-03',
      name: 'Worker 03',
      status: 'WARM',
      agent: 'Unassigned',
      task: 'Warm standby replica',
      memoryUsed: '512 MB',
      memoryMax: '4.0 GB',
      memoryPercent: 12,
      ttl: '120m remaining',
      teardownRule: 'Auto-refresh on drift',
      readiness: 'Immediate (< 50ms)'
    },
    {
      id: 'worker-slot-04',
      name: 'Worker 04',
      status: 'PROVISIONING',
      agent: 'Pending',
      task: 'Allocating container runtime',
      memoryUsed: '0 MB',
      memoryMax: '4.0 GB',
      memoryPercent: 0,
      ttl: 'Initializing',
      teardownRule: 'Standard TTL',
      readiness: 'Booting'
    }
  ]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-crew-info-soft text-crew-info border-crew-info/20';
      case 'WARM':
        return 'bg-crew-success-soft text-crew-success border-crew-success/20';
      case 'PROVISIONING':
        return 'bg-crew-warning-soft text-crew-warning border-crew-warning/30';
      default:
        return 'bg-crew-surface-secondary text-crew-text-muted border-crew-border';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1500px] w-full mx-auto flex-1 flex flex-col">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-crew-card p-4 rounded-panel border border-crew-border shadow-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[13px] font-bold tracking-wider uppercase text-crew-text">
              EPHEMERAL WORKER SLOTS
            </h1>
            <span className="px-2 py-0.5 rounded-control bg-crew-surface-secondary text-crew-text-secondary font-mono text-[11px] border border-crew-border">
              2 Running · 1 Warm · 1 Booting
            </span>
          </div>
          <p className="text-[12px] text-crew-text-secondary mt-0.5">
            Dynamic worker sandboxes allocated on-demand for task decomposition and execution
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            className="h-8 px-3 rounded-control bg-crew-primary hover:bg-crew-primary-hover text-white text-[12px] font-medium transition-colors flex items-center gap-1.5 shadow-subtle"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span>Spawn Worker</span>
          </button>
        </div>
      </div>

      {/* 2. Worker Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slots.map((slot) => (
          <div 
            key={slot.id}
            className="bg-crew-card rounded-panel border border-crew-border p-4 shadow-subtle space-y-3 hover:border-crew-border-strong transition-colors"
          >
            <div className="flex items-center justify-between pb-2 border-b border-crew-border">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-crew-primary" />
                <span className="font-mono text-[13px] font-bold text-crew-text">{slot.id}</span>
                <span className="text-[11px] text-crew-text-muted">({slot.name})</span>
              </div>
              <span className={`px-2 py-0.5 rounded-control font-mono text-[10px] font-semibold border ${getStatusBadge(slot.status)}`}>
                {slot.status}
              </span>
            </div>

            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-crew-text-muted font-mono text-[11px]">Assigned Agent:</span>
                <span className="text-crew-text font-medium">{slot.agent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-crew-text-muted font-mono text-[11px]">Current Task:</span>
                <span className="text-crew-text font-mono text-[11px] truncate max-w-[260px]">{slot.task}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-crew-text-muted font-mono text-[11px]">Teardown Policy:</span>
                <span className="text-crew-text font-mono text-[11px]">{slot.teardownRule}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-crew-text-muted font-mono text-[11px]">TTL Lifecycle:</span>
                <span className="text-crew-text font-mono text-[11px] font-medium">{slot.ttl}</span>
              </div>
            </div>

            {/* Memory Usage Meter */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-mono text-crew-text-muted">
                <span>Memory Allocation</span>
                <span className="text-crew-text">{slot.memoryUsed} / {slot.memoryMax}</span>
              </div>
              <div className="w-full h-1.5 bg-crew-surface-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-crew-primary rounded-full" 
                  style={{ width: `${slot.memoryPercent}%` }} 
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-crew-border/60 text-[11px] font-mono">
              <span className="text-crew-text-muted">
                Readiness: <strong className="text-crew-text">{slot.readiness}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button 
                  className="text-crew-text-secondary hover:text-crew-text px-2 py-0.5 rounded hover:bg-crew-hover transition-colors"
                  type="button"
                >
                  Inspect
                </button>
                <button 
                  className="text-crew-error hover:text-crew-error-hover px-2 py-0.5 rounded hover:bg-crew-error-soft transition-colors"
                  type="button"
                >
                  Teardown
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Ephemeral Capacity Configuration Card */}
      <div className="bg-crew-card rounded-panel border border-crew-border p-4 shadow-subtle">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-crew-border">
          <span className="font-display text-[12px] font-bold tracking-wider uppercase text-crew-text">
            LIFECYCLE RULES & CAPACITY
          </span>
          <span className="font-mono text-[11px] text-crew-text-muted">AUTONOMOUS POOL</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
          <div className="p-3 rounded-card bg-crew-surface-secondary border border-crew-border font-mono">
            <span className="text-[10.5px] text-crew-text-muted block">MAX CAPACITY</span>
            <span className="text-[15px] font-bold text-crew-text">8 Slots</span>
            <span className="text-[10px] text-crew-text-muted block mt-0.5">4 allocated currently</span>
          </div>

          <div className="p-3 rounded-card bg-crew-surface-secondary border border-crew-border font-mono">
            <span className="text-[10.5px] text-crew-text-muted block">DEFAULT MEMORY</span>
            <span className="text-[15px] font-bold text-crew-text">4.0 GB / worker</span>
            <span className="text-[10px] text-crew-text-muted block mt-0.5">cgroup isolation</span>
          </div>

          <div className="p-3 rounded-card bg-crew-surface-secondary border border-crew-border font-mono">
            <span className="text-[10.5px] text-crew-text-muted block">IDLE AUTO-TEARDOWN</span>
            <span className="text-[15px] font-bold text-crew-text">15 Minutes</span>
            <span className="text-[10px] text-crew-text-muted block mt-0.5">Reclaims memory pool</span>
          </div>
        </div>
      </div>
    </div>
  );
}
