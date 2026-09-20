"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SpritePortrait } from '../SpritePortrait';
import { Plus, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const EDGE_TYPES = {
  request: { label: 'request', color: '#38BDF8', dash: 'none' },
  query: { label: 'query', color: '#818CF8', dash: 'none' },
  propose: { label: 'propose', color: '#FBBF24', dash: '4 4' },
  agree: { label: 'agree/done', color: '#34D399', dash: 'none' },
  refuse: { label: 'refuse', color: '#F43F5E', dash: 'none' },
  inform: { label: 'inform/topic', color: '#94A3B8', dash: '2 2' },
};

export default function Graph(props) {
  const propAgents = props.agents || [];
  const isDark = props.isDark || false;
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [showTopics, setShowTopics] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);

  // Dynamic agent nodes mapping
  const nodes = useMemo(() => {
    if (propAgents && propAgents.length > 0) {
      // Calculate responsive layout positions
      return propAgents.map((ag, idx) => {
        let x = 50;
        let y = 50;
        const total = propAgents.length;
        if (total === 1) {
          x = 50; y = 50;
        } else if (idx === 0) {
          x = 80; y = 25; // Top right like in screenshot
        } else if (idx === 1) {
          x = 22; y = 72; // Bottom left like in screenshot
        } else {
          // Circular distribution for additional agents
          const angle = ((idx - 1) / (total - 1)) * Math.PI * 1.6 + 0.3;
          x = Math.round(50 + 32 * Math.cos(angle));
          y = Math.round(50 + 30 * Math.sin(angle));
        }

        return {
          id: ag.id,
          name: ag.name,
          character: ag.character || 'ultron',
          role: ag.description || 'Specialist',
          status: ag.status || 'working',
          action: ag.action || 'processing task',
          x,
          y,
          color: ag.accent === 'lemon' ? '#EAB308' : ag.accent === 'sky' ? '#38BDF8' : '#A855F7',
          activeTopic: ag.recentAssistantText || 'Core Mesh',
        };
      });
    }

    // Default mock nodes matching Image 5
    return [
      {
        id: 'ultron',
        name: 'Ultron',
        character: 'ultron',
        role: 'Supreme Orchestrator · Head of Swarm',
        status: 'working',
        action: 'delegating task contracts to crew',
        x: 82,
        y: 24,
        color: '#EAB308',
        activeTopic: '#task-orchestration',
      },
      {
        id: 'jim',
        name: 'Jim',
        character: 'jim',
        role: 'Full-Stack Coder · Client UI',
        status: 'working',
        action: 'synthesizing React components',
        x: 22,
        y: 72,
        color: '#38BDF8',
        activeTopic: '#ui-synthesis',
      },
      {
        id: 'sarah',
        name: 'Sarah',
        character: 'pam',
        role: 'Design Coordinator',
        status: 'idle',
        action: 'verifying pastel tokens',
        x: 35,
        y: 30,
        color: '#4BA982',
        activeTopic: '#design-tokens',
      },
      {
        id: 'vector',
        name: 'Vector',
        character: 'dwight',
        role: 'QA & Cedar Security Auditor',
        status: 'working',
        action: 'running invariant test suite',
        x: 68,
        y: 75,
        color: '#F43F5E',
        activeTopic: '#cedar-verification',
      },
    ];
  }, [propAgents]);

  // Dynamic live edges between agents
  const [edges, setEdges] = useState([
    {
      id: 'e1',
      from: 'ultron',
      to: 'jim',
      type: 'request',
      label: 'DecomposeTask(#ULT-8815)',
      timestamp: 'just now',
    },
    {
      id: 'e2',
      from: 'jim',
      to: 'vector',
      type: 'propose',
      label: 'SubmitDiffForAudit(src/components)',
      timestamp: '2m ago',
    },
    {
      id: 'e3',
      from: 'vector',
      to: 'ultron',
      type: 'agree',
      label: 'VerifyPolicyClean(exit 0)',
      timestamp: '1m ago',
    },
    {
      id: 'e4',
      from: 'ultron',
      to: 'sarah',
      type: 'query',
      label: 'QueryDesignSpec(Tokens)',
      timestamp: '4m ago',
    },
  ]);

  // Simulate active pulse traffic
  const handleRefresh = () => {
    setEdges(prev => [
      ...prev.slice(1),
      {
        id: `e-${Date.now()}`,
        from: nodes[Math.floor(Math.random() * nodes.length)]?.id || 'ultron',
        to: nodes[Math.floor(Math.random() * nodes.length)]?.id || 'jim',
        type: (['request', 'query', 'propose', 'agree', 'inform'][Math.floor(Math.random() * 5)]),
        label: 'Synchronizing mesh telemetry',
        timestamp: 'just now',
      },
    ]);
  };

  // Canvas pan & drag handlers
  const handleMouseDown = (e) => {
    if (e.target.closest && e.target.closest('.graph-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const zoomIn = () => setZoom(prev => Math.min(200, prev + 15));
  const zoomOut = () => setZoom(prev => Math.max(50, prev - 15));
  const zoomFit = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  const selectedNode = nodes.find(n => n.id === selectedAgentId);

  return (
    <div className="p-3 md:p-5 w-full flex-1 flex flex-col font-mono select-none">
      {/* Interactive Graph Canvas Card */}
      <div 
        className={`relative w-full rounded-xl border shadow-xl overflow-hidden flex flex-col flex-1 min-h-[640px] transition-colors ${
          isDark ? 'bg-[#0E1217] border-[#2A3340]' : 'bg-[#FAF8F4] border-[#DED8CE]'
        }`}
      >
        {/* Top Control Toolbar */}
        <div 
          className={`h-11 px-4 border-b flex items-center justify-between z-20 shrink-0 ${
            isDark ? 'bg-[#151921] border-[#2A3340]' : 'bg-[#F4EFE5] border-[#DED8CE]'
          }`}
        >
          {/* Left Actions: + topics, refresh */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowTopics(!showTopics)}
              className={`h-7 px-2.5 rounded border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showTopics
                  ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                  : isDark
                  ? 'bg-[#1E2533] border-[#2A3340] text-white hover:bg-[#283244]'
                  : 'bg-white border-[#DED8CE] text-[#1E232A] hover:bg-[#EAE4D9]'
              }`}
              type="button"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>topics</span>
            </button>

            <button 
              onClick={handleRefresh}
              className={`h-7 px-2.5 rounded border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-[#1E2533] border-[#2A3340] text-[#E6EDF3] hover:bg-[#283244]'
                  : 'bg-white border-[#DED8CE] text-[#1E232A] hover:bg-[#EAE4D9]'
              }`}
              type="button"
            >
              <RefreshCw className="w-3 h-3" />
              <span>refresh</span>
            </button>

            <div className="h-3.5 w-px bg-inherit opacity-40 mx-1" />

            {/* Mesh Status Text */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] opacity-75">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
              <span>{nodes.length} agents active in mesh</span>
            </div>
          </div>

          {/* Right: Zoom Controller */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center rounded border p-0.5 ${isDark ? 'bg-[#12161E] border-[#2A3340]' : 'bg-white border-[#DED8CE]'}`}>
              <button 
                onClick={zoomOut}
                className="w-6 h-6 rounded flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                title="Zoom Out" 
                type="button"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-[11px] font-bold w-11 text-center">
                {zoom}%
              </span>
              <button 
                onClick={zoomIn}
                className="w-6 h-6 rounded flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                title="Zoom In" 
                type="button"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <div className="h-3 w-px bg-inherit opacity-40 mx-0.5" />
              <button 
                onClick={zoomFit}
                className="h-6 px-1.5 rounded flex items-center gap-1 opacity-70 hover:opacity-100 text-[10.5px] cursor-pointer"
                title="Fit to Viewport" 
                type="button"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Fit</span>
              </button>
            </div>
          </div>
        </div>

        {/* MAIN GRAPH CANVAS (Infinite Dot-Grid Area) */}
        <div 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`relative flex-1 w-full h-full overflow-hidden ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            backgroundImage: isDark 
              ? 'radial-gradient(circle, #2A3340 1px, transparent 1px)' 
              : 'radial-gradient(circle, #D8D2C5 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Top Banner Notice (Matching Image 5) */}
          <div className="absolute left-1/2 top-4 -translate-x-1/2 z-10 pointer-events-none text-center">
            <span className="text-[11px] opacity-65 font-mono px-3 py-1 rounded bg-black/5 dark:bg-white/5 backdrop-blur-xs">
              {edges.length > 0 
                ? `Live agent telemetry stream · ${edges.length} active communication channels` 
                : 'No messages logged yet — the hive is quiet. Agents shown as roster.'}
            </span>
          </div>

          {/* Pannable / Zoomable World Container */}
          <div 
            className="absolute inset-0 w-full h-full transition-transform duration-75 origin-center"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`
            }}
          >
            {/* SVG Interactive Edge Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {edges.map(edge => {
                const source = nodes.find(n => n.id === edge.from);
                const target = nodes.find(n => n.id === edge.to);
                if (!source || !target) return null;
                if (activeFilter && edge.type !== activeFilter) return null;

                const edgeMeta = EDGE_TYPES[edge.type] || EDGE_TYPES.inform;

                return (
                  <g key={edge.id} className="transition-all duration-300">
                    <line
                      x1={`${source.x}%`}
                      y1={`${source.y}%`}
                      x2={`${target.x}%`}
                      y2={`${target.y}%`}
                      stroke={edgeMeta.color}
                      strokeWidth={1.5}
                      strokeDasharray={edgeMeta.dash}
                      opacity={0.65}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Render Agent Nodes */}
            {nodes.map(node => {
              const isSelected = selectedAgentId === node.id;

              return (
                <div 
                  key={node.id}
                  onClick={() => setSelectedAgentId(isSelected ? null : node.id)}
                  className="graph-node absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all duration-200 hover:scale-105"
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  {/* Square Avatar Card (Matching Image 5) */}
                  <div 
                    className={`p-1.5 rounded-lg border shadow-lg flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'ring-2 ring-[#38BDF8] shadow-2xl scale-110'
                        : ''
                    } ${
                      isDark 
                        ? 'bg-[#151921] border-[#2A3340] text-white hover:border-[#38BDF8]' 
                        : 'bg-[#FAF8F4] border-[#DED8CE] text-[#1E232A] hover:border-[#38BDF8]'
                    }`}
                    style={{ minWidth: '76px' }}
                  >
                    {/* Pixel Character Frame */}
                    <div 
                      className="w-12 h-14 rounded border flex items-center justify-center overflow-hidden"
                      style={{ 
                        backgroundColor: isDark ? '#0E1217' : '#F2ECE1',
                        borderColor: isDark ? '#2A3340' : '#DED8CE',
                      }}
                    >
                      <SpritePortrait character={node.character} scale={2} />
                    </div>

                    {/* Node Name */}
                    <span className="text-[11px] font-bold tracking-wider truncate max-w-[80px]">
                      {node.name}
                    </span>

                    {/* Status Pill */}
                    <div className="flex items-center gap-1 text-[9px] opacity-75">
                      <span 
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: node.status === 'working' ? '#34D399' : '#FBBF24' }} 
                      />
                      <span className="capitalize">{node.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BOTTOM-LEFT INTERACTIVE LEGEND (Exact match to Image 5) */}
          <div 
            className={`absolute bottom-4 left-4 z-20 p-2.5 rounded-lg border shadow-lg text-[10px] space-y-1 transition-colors ${
              isDark 
                ? 'bg-[#151921]/90 border-[#2A3340] text-[#E6EDF3] backdrop-blur-md' 
                : 'bg-[#FAF8F4]/90 border-[#DED8CE] text-[#1E232A] backdrop-blur-md'
            }`}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
              {Object.entries(EDGE_TYPES).map(([typeKey, meta]) => {
                const isActive = activeFilter === typeKey;
                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setActiveFilter(isActive ? null : typeKey)}
                    className={`flex items-center gap-1.5 cursor-pointer text-left transition-opacity hover:opacity-100 ${
                      activeFilter && !isActive ? 'opacity-30' : 'opacity-85'
                    }`}
                  >
                    <span 
                      className="inline-block w-3 h-0.5 rounded-full" 
                      style={{ backgroundColor: meta.color }} 
                    />
                    <span className="truncate">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT-SIDE AGENT INSPECTION DRAWER (When a node is clicked) */}
          {selectedNode && (
            <div 
              className={`absolute top-4 right-4 z-30 w-72 p-4 rounded-xl border shadow-2xl space-y-3 animate-in fade-in slide-in-from-right-2 duration-150 ${
                isDark 
                  ? 'bg-[#151921] border-[#2A3340] text-[#E6EDF3]' 
                  : 'bg-[#FAF8F4] border-[#DED8CE] text-[#1E232A]'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-inherit">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-9 rounded border overflow-hidden flex items-center justify-center bg-black/5">
                    <SpritePortrait character={selectedNode.character} scale={1.5} />
                  </div>
                  <div>
                    <div className="font-bold text-xs">{selectedNode.name}</div>
                    <div className="text-[10px] opacity-70">{selectedNode.role}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAgentId(null)}
                  className="text-sm font-bold opacity-60 hover:opacity-100 p-1 cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2 text-[11px]">
                <div>
                  <span className="opacity-60 block text-[10px] uppercase font-bold">Current Action:</span>
                  <span className="text-[#38BDF8] font-bold">{selectedNode.action}</span>
                </div>
                <div>
                  <span className="opacity-60 block text-[10px] uppercase font-bold">Active Topic:</span>
                  <span className="text-[#818CF8]">{selectedNode.activeTopic}</span>
                </div>
                <div className="pt-2 border-t border-inherit">
                  <span className="opacity-60 block text-[10px] uppercase font-bold mb-1">Incoming / Outgoing:</span>
                  <div className="space-y-1">
                    {edges.filter(e => e.from === selectedNode.id || e.to === selectedNode.id).map(e => (
                      <div key={e.id} className="p-1.5 rounded bg-black/5 dark:bg-white/5 flex items-center justify-between text-[10px]">
                        <span style={{ color: EDGE_TYPES[e.type]?.color }}>{e.type}</span>
                        <span className="truncate max-w-[120px] opacity-75">{e.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TOPICS OVERLAY (When + topics is toggled) */}
          {showTopics && (
            <div 
              className={`absolute top-12 left-4 z-30 p-3 rounded-lg border shadow-xl text-xs space-y-2 max-w-xs animate-in fade-in duration-100 ${
                isDark ? 'bg-[#151921] border-[#2A3340] text-white' : 'bg-[#FAF8F4] border-[#DED8CE] text-[#1E232A]'
              }`}
            >
              <div className="font-bold text-[11px] uppercase tracking-wider pb-1 border-b border-inherit">
                Active Topic Channels
              </div>
              <div className="space-y-1 text-[11px]">
                {['#task-orchestration', '#ui-synthesis', '#cedar-verification', '#design-tokens', '#codebase-refactor'].map(t => (
                  <div key={t} className="px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between cursor-pointer">
                    <span>{t}</span>
                    <span className="text-[10px] opacity-60">2 agents</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
