import React from 'react';

export default function AgentSidebar({ agents = [], selectedAgentId, onSelectAgent, onAddAgent }) {
  const defaultAgents = [
    { id: 'ultron', name: 'Ultron', role: 'Supreme Orchestrator', model: 'Claude 3.7', status: 'Orchestrating', statusColor: 'warning', initial: 'U' },
    { id: 'sarah', name: 'Sarah', role: 'Code Gen', model: 'Sonnet 3.5', status: '3 tasks', statusColor: 'success', initial: 'S' },
    { id: 'vector', name: 'Vector', role: 'QA & Tests', model: 'Haiku', status: '24ms', statusColor: 'info', initial: 'V' },
    { id: 'sentinel', name: 'Sentinel', role: 'Sec Policy', model: 'GPT-4o', status: 'Standby', statusColor: 'muted', initial: 'S' },
  ];

  const displayAgents = agents.length > 0 ? agents : defaultAgents;

  return (
    <aside data-lenis-prevent="true" className="w-[260px] shrink-0 flex flex-col justify-between bg-crew-surface border-r border-crew-border select-none h-full overflow-hidden transition-colors">
      {/* Upper: Actions & List */}
      <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
        {/* Add Agent Button */}
        <div className="p-3 pb-2 shrink-0">
          <button 
            onClick={onAddAgent}
            className="w-full h-8 flex items-center justify-center gap-1.5 rounded-control bg-crew-card hover:bg-crew-hover border border-crew-border text-crew-text hover:text-crew-primary transition-colors text-[12px] font-medium shadow-subtle" 
            type="button"
          >
            <span className="material-symbols-outlined text-[15px] text-crew-primary">add</span>
            <span>Add Agent</span>
          </button>
        </div>

        {/* Header with Count Pill */}
        <div className="px-3 py-1.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold tracking-wider text-crew-text-muted uppercase font-mono">
              Agents
            </span>
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-control bg-crew-surface-secondary text-crew-text-secondary font-mono text-[10px] font-medium border border-crew-border">
              {displayAgents.length} active
            </span>
          </div>
          <span className="material-symbols-outlined text-crew-text-muted hover:text-crew-text cursor-pointer text-[15px]">
            filter_list
          </span>
        </div>

        {/* Agent Rows */}
        <div data-lenis-prevent="true" className="flex flex-col space-y-1 px-2 overflow-y-auto flex-1">
          {displayAgents.map((ag) => {
            const isSelected = selectedAgentId === ag.id || (!selectedAgentId && (ag.id === 'ultron' || ag.id === 'lead'));
            return (
              <div 
                key={ag.id}
                onClick={() => onSelectAgent?.(ag.id)}
                className={`group relative flex items-center gap-2.5 p-2 rounded-card border shadow-subtle cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-crew-card border-crew-border'
                    : 'hover:bg-crew-hover border-transparent hover:border-crew-border'
                }`}
              >
                {isSelected && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-crew-primary rounded-r" />
                )}
                <div className="relative flex-shrink-0 ml-1">
                  <div className={`w-8 h-8 rounded-control flex items-center justify-center font-display font-bold text-[13px] ${
                    ag.statusColor === 'warning' ? 'bg-crew-primary-soft text-crew-primary' :
                    ag.statusColor === 'success' ? 'bg-crew-success-soft text-crew-success' :
                    ag.statusColor === 'info' ? 'bg-crew-info-soft text-crew-info' :
                    'bg-crew-surface-secondary text-crew-text-muted'
                  }`}>
                    {ag.initial || ag.name?.[0] || 'A'}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-crew-card ${
                    ag.statusColor === 'warning' ? 'bg-crew-warning' :
                    ag.statusColor === 'success' ? 'bg-crew-success' :
                    ag.statusColor === 'info' ? 'bg-crew-info' :
                    'bg-crew-text-muted'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-crew-text font-semibold truncate">{ag.name}</span>
                    <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-control font-medium ${
                      ag.statusColor === 'warning' ? 'text-crew-warning bg-crew-warning-soft' :
                      ag.statusColor === 'success' ? 'text-crew-success bg-crew-success-soft' :
                      ag.statusColor === 'info' ? 'text-crew-info' :
                      'text-crew-text-muted'
                    }`}>
                      {ag.status || 'Active'}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-crew-text-muted truncate">
                    {ag.model || 'Claude'} · {ag.role || ag.area || 'Agent'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Agent Telemetry */}
      <div className="p-3 bg-crew-surface-secondary m-2 rounded-card border border-crew-border space-y-2 shrink-0">
        <div className="flex items-center justify-between text-[11px] text-crew-text-secondary">
          <span className="flex items-center gap-1 font-mono">
            <span className="material-symbols-outlined text-[13px]">memory</span> Cluster Load
          </span>
          <span className="font-mono text-crew-text font-semibold">42%</span>
        </div>
        <div className="w-full h-1.5 bg-crew-border rounded-full overflow-hidden">
          <div className="h-full bg-crew-primary rounded-full" style={{ width: '42%' }} />
        </div>
        <div className="flex items-center justify-between text-[11px] text-crew-text-secondary pt-0.5">
          <span className="flex items-center gap-1 font-mono">
            <span className="material-symbols-outlined text-[13px]">storage</span> Memory
          </span>
          <span className="font-mono text-crew-text">3.8 / 16 GB</span>
        </div>
      </div>
    </aside>
  );
}

