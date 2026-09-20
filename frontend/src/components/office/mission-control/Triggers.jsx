import React, { useState } from 'react';

export default function Triggers() {
  // Trigger state toggles
  const [triggers, setTriggers] = useState([
    {
      id: 'trg-1',
      name: 'GitHub Webhook Dispatch',
      type: 'WEBHOOK',
      endpoint: 'https://api.ultron.internal/hooks/github-pr',
      schedule: 'On push / PR open',
      status: 'ACTIVE',
      lastRun: '12m ago',
      agent: 'Ultron',
      enabled: true,
      description: 'Trigger autonomous test suites and dispatch task cards upon incoming pull request webhook.'
    },
    {
      id: 'trg-2',
      name: 'Hourly Mesh Memory Compact',
      type: 'SCHEDULE',
      endpoint: 'Internal Daemon',
      schedule: '0 * * * * (Hourly)',
      status: 'ACTIVE',
      lastRun: '44m ago',
      agent: 'Ultron',
      enabled: true,
      description: 'Compact vector memory embeddings and flush expired session cache for floor agents.'
    },
    {
      id: 'trg-3',
      name: 'Cedar Policy Invariant Guard',
      type: 'NETWORK',
      endpoint: 'Network Filter (Port 8443)',
      schedule: 'Real-time packet inspection',
      status: 'ACTIVE',
      lastRun: '14ms ago',
      agent: 'Sentinel',
      enabled: true,
      description: 'Block outbound network requests failing zero-trust Cedar authorization invariants.'
    },
    {
      id: 'trg-4',
      name: 'Context Saturation Auto-Roll',
      type: 'CONTEXT',
      endpoint: 'LLM Context Monitor',
      schedule: 'When agent ctx > 80%',
      status: 'STANDBY',
      lastRun: '6h ago',
      agent: 'Ultron',
      enabled: false,
      description: 'Automatically summarize conversation buffer and spin up a warm replica when token usage exceeds 80%.'
    },
    {
      id: 'trg-5',
      name: 'Test Failure Auto-Escalation',
      type: 'AUTONOMOUS',
      endpoint: 'CI/CD Event Bus',
      schedule: 'On test failure > 2x',
      status: 'ACTIVE',
      lastRun: '1h ago',
      agent: 'Vector',
      enabled: true,
      description: 'Escalate repeated regression test failures to human attention pool in Ask Me.'
    }
  ]);

  const toggleTrigger = (id) => {
    setTriggers(prev =>
      prev.map(t => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] w-full mx-auto flex-1 flex flex-col">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-crew-card p-4 rounded-panel border border-crew-border shadow-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[13px] font-bold tracking-wider uppercase text-crew-text">
              AUTONOMOUS TRIGGERS
            </h1>
            <span className="px-2 py-0.5 rounded-control bg-crew-surface-secondary text-crew-text-secondary font-mono text-[11px] border border-crew-border">
              4 Active · 1 Standby
            </span>
          </div>
          <p className="text-[12px] text-crew-text-secondary mt-0.5">
            Network listeners, schedules, and event-driven automation rules for the agent mesh
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            className="h-8 px-3 rounded-control bg-crew-primary hover:bg-crew-primary-hover text-white text-[12px] font-medium transition-colors flex items-center gap-1.5 shadow-subtle"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span>New Trigger</span>
          </button>
        </div>
      </div>

      {/* 2. Triggers List / Table Cards */}
      <div className="space-y-3">
        {triggers.map((item) => (
          <div 
            key={item.id}
            className="bg-crew-card rounded-panel border border-crew-border p-4 shadow-subtle space-y-3 hover:border-crew-border-strong transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                {/* Switch Toggle */}
                <button
                  onClick={() => toggleTrigger(item.id)}
                  type="button"
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    item.enabled ? 'bg-crew-primary' : 'bg-crew-border-strong'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      item.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[13px] text-crew-text">{item.name}</span>
                    <span className="px-1.5 py-0.2 rounded-control bg-crew-surface-secondary text-crew-text-secondary font-mono text-[10px] border border-crew-border">
                      {item.type}
                    </span>
                    <span className="text-[11px] font-mono text-crew-text-muted">
                      ({item.schedule})
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge & Agent */}
              <div className="flex items-center gap-3 self-start sm:self-auto pl-12 sm:pl-0">
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="text-crew-text-muted">Agent:</span>
                  <span className="text-crew-text font-medium">{item.agent}</span>
                </div>

                <span className={`px-2 py-0.5 rounded-control font-mono text-[10.5px] font-semibold flex items-center gap-1 ${
                  item.enabled 
                    ? 'bg-crew-success-soft text-crew-success border border-crew-success/20' 
                    : 'bg-crew-surface-secondary text-crew-text-muted border border-crew-border'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${item.enabled ? 'bg-crew-success' : 'bg-crew-text-muted'}`} />
                  {item.enabled ? 'LISTENING' : 'DISABLED'}
                </span>
              </div>
            </div>

            <p className="text-[12px] text-crew-text-secondary pl-12">
              {item.description}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-crew-border/60 pl-12 text-[11px] font-mono text-crew-text-muted">
              <div className="flex items-center gap-4">
                <span>Target: <span className="text-crew-text">{item.endpoint}</span></span>
                <span>Last fired: <span className="text-crew-text">{item.lastRun}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  className="text-crew-text-secondary hover:text-crew-text px-2 py-0.5 rounded hover:bg-crew-hover transition-colors"
                  type="button"
                >
                  Edit
                </button>
                <button 
                  className="text-crew-text-secondary hover:text-crew-primary px-2 py-0.5 rounded hover:bg-crew-hover transition-colors"
                  type="button"
                >
                  Test Run
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
