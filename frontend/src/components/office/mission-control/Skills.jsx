import React, { useState } from 'react';

export default function Skills() {
  const [skills, setSkills] = useState([
    {
      id: 'skill-1',
      name: 'Shell & Terminal Execution',
      category: 'CORE RUNTIME',
      status: 'ENABLED',
      description: 'Allows agent to execute verified shell commands, inspect directories, and manage process buffers.',
      permissions: ['read:fs', 'exec:sh'],
      runs: '1,420 calls',
      agent: 'Ultron'
    },
    {
      id: 'skill-2',
      name: 'Git Version Control Operations',
      category: 'DEVELOPMENT',
      status: 'ENABLED',
      description: 'Branch management, commit authoring, diff inspection, and conflict resolution.',
      permissions: ['git:read', 'git:commit', 'git:diff'],
      runs: '890 calls',
      agent: 'Ultron'
    },
    {
      id: 'skill-3',
      name: 'Cedar Policy Authorization',
      category: 'SECURITY',
      status: 'SANDBOXED',
      description: 'Validates schema and zero-trust invariant rules before network requests or migrations.',
      permissions: ['cedar:eval', 'policy:read'],
      runs: '342 calls',
      agent: 'Sentinel'
    },
    {
      id: 'skill-4',
      name: 'AST Code Synthesis & Refactor',
      category: 'SYNTHESIS',
      status: 'ENABLED',
      description: 'Parses Abstract Syntax Trees (AST) in Rust and TypeScript to generate type-safe transformations.',
      permissions: ['ast:parse', 'write:fs'],
      runs: '512 calls',
      agent: 'Sarah'
    }
  ]);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] w-full mx-auto flex-1 flex flex-col">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-crew-card p-4 rounded-panel border border-crew-border shadow-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[13px] font-bold tracking-wider uppercase text-crew-text">
              AGENT SKILLS & CAPABILITIES
            </h1>
            <span className="px-2 py-0.5 rounded-control bg-crew-surface-secondary text-crew-text-secondary font-mono text-[11px] border border-crew-border">
              4 Active Capabilities
            </span>
          </div>
          <p className="text-[12px] text-crew-text-secondary mt-0.5">
            Tools, system permissions, and operational capabilities provisioned to the agent workforce
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            className="h-8 px-3 rounded-control bg-crew-primary hover:bg-crew-primary-hover text-white text-[12px] font-medium transition-colors flex items-center gap-1.5 shadow-subtle"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span>Add Skill</span>
          </button>
        </div>
      </div>

      {/* 2. Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill) => (
          <div 
            key={skill.id}
            className="bg-crew-card rounded-panel border border-crew-border p-4 shadow-subtle space-y-3 hover:border-crew-border-strong transition-colors"
          >
            <div className="flex items-center justify-between pb-2 border-b border-crew-border">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-crew-primary">
                  psychology
                </span>
                <div>
                  <h3 className="text-[13px] font-semibold text-crew-text">{skill.name}</h3>
                  <span className="font-mono text-[10px] text-crew-text-muted">{skill.category}</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-control font-mono text-[10px] font-semibold border ${
                skill.status === 'ENABLED' 
                  ? 'bg-crew-success-soft text-crew-success border-crew-success/20' 
                  : 'bg-crew-warning-soft text-crew-warning border-crew-warning/30'
              }`}>
                {skill.status}
              </span>
            </div>

            <p className="text-[12px] text-crew-text-secondary leading-relaxed">
              {skill.description}
            </p>

            {/* Permissions list */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10.5px] font-mono text-crew-text-muted">Permissions:</span>
              {skill.permissions.map((perm) => (
                <span 
                  key={perm}
                  className="px-1.5 py-0.2 rounded-control bg-crew-surface-secondary text-crew-text-secondary font-mono text-[10px] border border-crew-border"
                >
                  {perm}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-crew-border/60 text-[11px] font-mono text-crew-text-muted">
              <span>Usage: <strong className="text-crew-text">{skill.runs}</strong></span>
              <div className="flex items-center gap-2">
                <button 
                  className="text-crew-text-secondary hover:text-crew-text px-2 py-0.5 rounded hover:bg-crew-hover transition-colors"
                  type="button"
                >
                  Configure
                </button>
                <button 
                  className="text-crew-error hover:text-crew-error-hover px-2 py-0.5 rounded hover:bg-crew-error-soft transition-colors"
                  type="button"
                >
                  Revoke
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Empty State Callout for Custom Skills */}
      <div className="bg-crew-card rounded-panel border border-dashed border-crew-border p-6 shadow-subtle flex flex-col items-center justify-center text-center space-y-2">
        <div className="w-10 h-10 rounded-control bg-crew-surface-secondary border border-crew-border flex items-center justify-center text-crew-text-muted">
          <span className="material-symbols-outlined text-[20px]">extension</span>
        </div>
        <h4 className="text-[13px] font-semibold text-crew-text">Need custom tool integrations?</h4>
        <p className="text-[12px] text-crew-text-secondary max-w-md">
          Add capabilities to expand what this agent can execute. Custom skills can wrap CLI binaries, internal HTTP APIs, or database queries.
        </p>
        <button 
          className="h-7 px-3 rounded-control bg-crew-surface-secondary hover:bg-crew-hover border border-crew-border text-crew-text text-[11px] font-medium transition-colors flex items-center gap-1 mt-2"
          type="button"
        >
          <span className="material-symbols-outlined text-[14px] text-crew-primary">add</span>
          <span>Register Custom Skill</span>
        </button>
      </div>
    </div>
  );
}
