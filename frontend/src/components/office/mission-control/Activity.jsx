import React, { useState } from 'react';

export default function Activity() {
  const [filterType, setFilterType] = useState('ALL');
  const [isStreaming, setIsStreaming] = useState(true);

  const events = [
    {
      id: 'evt-1',
      time: '12:44:35',
      type: 'HUMAN_GATE',
      agent: 'Ultron',
      title: 'Interaction Required: Token Refresh Migration Confirmation',
      detail: 'Ultron suspended staging task #CRW-8815 awaiting human clearance in Ask Me attention pool.',
      status: 'AWAITING',
      meta: 'Severity: High · Target: us-east-1'
    },
    {
      id: 'evt-2',
      time: '12:44:30',
      type: 'TOOL',
      agent: 'Ultron',
      title: 'cedar.validate_schema --strict',
      detail: 'Schema validation completed with exit code 0. No policy violations detected in token_refresh.rs.',
      status: 'SUCCESS',
      meta: 'Duration: 14ms · Memory: 24MB'
    },
    {
      id: 'evt-3',
      time: '12:44:25',
      type: 'DISPATCH',
      agent: 'Ultron',
      title: 'Dispatched task #CRW-8812 to Sarah',
      detail: 'Assigned packet routing optimization card to Sarah (Sonnet 3.5). Working directory ~/auth.',
      status: 'WORKING',
      meta: 'Decomposed: 2 sub-tasks'
    },
    {
      id: 'evt-4',
      time: '12:44:15',
      type: 'SECURITY',
      agent: 'Sentinel',
      title: 'Cedar Ingress Invariant Check',
      detail: 'Evaluated POL-CEDAR-09 on port 8443 ingress packet stream. All invariants verified.',
      status: 'SUCCESS',
      meta: '0 Violations · Filter: Zero-Trust'
    },
    {
      id: 'evt-5',
      time: '12:43:58',
      type: 'TEST',
      agent: 'Vector',
      title: 'Haiku E2E Authentication Suite',
      detail: 'Executed test runner on branch main*. 12/12 test assertions passed successfully.',
      status: 'SUCCESS',
      meta: 'Tests: 12/12 · Exit: 0'
    },
    {
      id: 'evt-6',
      time: '12:43:40',
      type: 'SYSTEM',
      agent: 'Cluster',
      title: 'Ephemeral Worker Slot Allocated',
      detail: 'Provisioned temporary runner worker-node-4 with 1.5 GB memory and 30m TTL for build compilation.',
      status: 'NOMINAL',
      meta: 'Slot: #4 · Region: US-East'
    }
  ];

  const filteredEvents = filterType === 'ALL' 
    ? events 
    : events.filter(e => e.type === filterType);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'SUCCESS':
      case 'NOMINAL':
        return 'bg-crew-success-soft text-crew-success border-crew-success/20';
      case 'AWAITING':
        return 'bg-crew-warning-soft text-crew-warning border-crew-warning/30';
      case 'WORKING':
        return 'bg-crew-info-soft text-crew-info border-crew-info/20';
      default:
        return 'bg-crew-surface-secondary text-crew-text-muted border-crew-border';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1500px] w-full mx-auto flex-1 flex flex-col">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-crew-card p-4 rounded-panel border border-crew-border shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[13px] font-bold tracking-wider uppercase text-crew-text">
              OPERATIONAL ACTIVITY
            </h1>
            <span className="px-2 py-0.5 rounded-control bg-crew-surface-secondary text-crew-text-secondary font-mono text-[11px] border border-crew-border">
              Live Audit Stream
            </span>
          </div>
          <div className="h-3 w-px bg-crew-border" />
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-crew-success">
            <span className="w-1.5 h-1.5 rounded-full bg-crew-success animate-pulse" />
            <span>{isStreaming ? 'STREAMING' : 'PAUSED'}</span>
          </div>
        </div>

        {/* Filter controls & pause */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-crew-surface-secondary p-0.5 rounded-control border border-crew-border">
            {['ALL', 'TOOL', 'DISPATCH', 'SECURITY', 'SYSTEM'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  filterType === type 
                    ? 'bg-crew-card text-crew-text font-semibold shadow-subtle' 
                    : 'text-crew-text-muted hover:text-crew-text'
                }`}
                type="button"
              >
                {type}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsStreaming(prev => !prev)}
            className="h-7 px-2.5 rounded-control bg-crew-surface-secondary hover:bg-crew-hover border border-crew-border text-crew-text text-[11px] font-mono flex items-center gap-1 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[13px]">
              {isStreaming ? 'pause' : 'play_arrow'}
            </span>
            <span>{isStreaming ? 'Pause' : 'Resume'}</span>
          </button>
        </div>
      </div>

      {/* 2. Activity Event Timeline */}
      <div className="bg-crew-card rounded-panel border border-crew-border p-4 md:p-5 shadow-subtle space-y-4">
        <div className="space-y-3">
          {filteredEvents.map((evt) => (
            <div 
              key={evt.id}
              className="p-3 rounded-card bg-crew-surface-secondary border border-crew-border/80 hover:border-crew-border transition-colors space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[11px] text-crew-text-muted">
                    [{evt.time}]
                  </span>
                  <span className="px-1.5 py-0.2 rounded-control bg-crew-card text-crew-text-secondary font-mono text-[10px] border border-crew-border font-medium">
                    {evt.type}
                  </span>
                  <span className="text-[13px] font-semibold text-crew-text">
                    {evt.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="font-mono text-[11px] text-crew-text-secondary">
                    {evt.agent}
                  </span>
                  <span className={`px-2 py-0.2 rounded-control font-mono text-[10px] font-semibold border ${getStatusBadge(evt.status)}`}>
                    {evt.status}
                  </span>
                </div>
              </div>

              <p className="text-[12px] text-crew-text-secondary leading-relaxed pl-0 sm:pl-16 font-sans">
                {evt.detail}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-crew-border/40 pl-0 sm:pl-16 text-[10.5px] font-mono text-crew-text-muted">
                <span>{evt.meta}</span>
                <span className="text-crew-primary hover:underline cursor-pointer">Inspect Trace →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
