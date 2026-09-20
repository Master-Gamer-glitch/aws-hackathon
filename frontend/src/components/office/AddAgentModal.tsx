"use client";

import React, { useState } from 'react';
import { SpritePortrait } from './SpritePortrait';
import { OFFICE_CAST, type OfficeCharacterName } from '@/live-office/scene/office/cast';
import { Sparkles, Folder, Plus, X, Terminal, Check } from 'lucide-react';

export interface NewAgentData {
  name: string;
  character: OfficeCharacterName;
  color: string;
  project: string;
  folder: string;
  gitIsolation: boolean;
  resumeSessionId?: string;
  provider: string;
  model: string;
  command: string;
  description: string;
  goal?: string;
}

interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpawn: (agent: NewAgentData) => void;
  isDark?: boolean;
}

type SectionKey = 'identity' | 'workspace' | 'engine' | 'briefing';

const COLOR_SWATCHES = [
  { id: 'coral', hex: '#D64B55', label: 'Coral' },
  { id: 'mint', hex: '#4BA982', label: 'Mint' },
  { id: 'sky', hex: '#38BDF8', label: 'Sky' },
  { id: 'lemon', hex: '#EAB308', label: 'Lemon' },
  { id: 'lilac', hex: '#A855F7', label: 'Lilac' },
  { id: 'peach', hex: '#F97316', label: 'Peach' },
];

const PROVIDERS = [
  { id: 'claude', name: 'Claude Code', cmd: 'claude' },
  { id: 'codex', name: 'Codex · GPT', cmd: 'codex' },
  { id: 'grok', name: 'Grok · xAI', cmd: 'grok' },
  { id: 'kimi', name: 'Kimi Code', cmd: 'kimi' },
  { id: 'gemini', name: 'Gemini CLI', cmd: 'gemini' },
  { id: 'antigravity', name: 'Antigravity · Gemini', cmd: 'agy' },
  { id: 'qwen', name: 'Qwen (local available)', cmd: 'qwen' },
  { id: 'opencode', name: 'OpenCode', cmd: 'opencode' },
  { id: 'crush', name: 'Crush · Charm', cmd: 'crush' },
  { id: 'pi', name: 'Pi', cmd: 'pi' },
  { id: 'copilot', name: 'Copilot', cmd: 'copilot' },
  { id: 'cursor', name: 'Cursor', cmd: 'cursor-agent' },
  { id: 'custom', name: 'Custom', cmd: 'agent' },
];

const MODELS: Record<string, string[]> = {
  claude: ['Fable 5.1', 'Fable 5', 'Opus 5 · 1M', 'Opus 4.8', 'Opus 4.8 · 1M', 'Sonnet 5', 'Sonnet 4.6', 'Sonnet 4.6 · 1M', 'Haiku 4.5'],
  codex: ['GPT-5 Codex', 'GPT-4.5', 'o3-mini', 'o1-preview'],
  grok: ['Grok-3 Code', 'Grok-2'],
  kimi: ['Kimi 2.5', 'Kimi Moonshot'],
  gemini: ['Gemini 2.0 Flash', 'Gemini 1.5 Pro', 'Gemini 1.5 Flash'],
  antigravity: ['Gemini 2.0 Pro Experimental', 'Gemini 2.0 Flash Thinking'],
  qwen: ['Qwen 2.5 Coder 32B', 'Qwen 2.5 72B'],
  opencode: ['DeepSeek R1', 'Llama 3.3 70B'],
  crush: ['Default Crush Model'],
  pi: ['Inflection Pi 3'],
  copilot: ['Copilot Claude 3.5', 'Copilot GPT-4o'],
  cursor: ['Cursor Tab Fast', 'Claude 3.5 Sonnet'],
  custom: ['Default Custom Model'],
};

const BRIEFING_TEMPLATES = [
  {
    name: 'Repo janitor',
    description: 'keeps the codebase tidy and healthy',
    goal: 'Continuously hunt for dead code, lint errors, flaky tests, and small safe refactors. Fix the safe ones and leave a note for anything risky. Never change behavior without flagging it.',
  },
  {
    name: 'Docs writer',
    description: 'keeps docs in sync with the code',
    goal: 'Watch for code changes that outdate the README and docs, then update them. Write for newcomers and prefer concrete examples over prose.',
  },
  {
    name: 'Bug triager',
    description: 'investigates and root-causes bugs',
    goal: 'For each reported issue: reproduce it, find the root cause, then propose a minimal fix with evidence. No fixes without a confirmed root cause.',
  },
  {
    name: 'Research assistant',
    description: 'gathers and summarizes information',
    goal: 'Research the questions you are given across multiple sources, verify the key claims, and return a concise, cited summary.',
  },
  {
    name: 'Release manager',
    description: 'prepares and ships releases',
    goal: 'Track what has shipped since the last release, update the changelog and version, and draft clear release notes.',
  },
];

export function AddAgentModal({ isOpen, onClose, onSpawn, isDark = false }: AddAgentModalProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>('identity');

  // Form State
  const [name, setName] = useState('Jim');
  const [selectedCharacter, setSelectedCharacter] = useState<OfficeCharacterName>('jim');
  const [selectedColor, setSelectedColor] = useState('#38BDF8');
  const [projects, setProjects] = useState<string[]>(['Ultron-dev', 'CareFlow']);
  const [selectedProject, setSelectedProject] = useState('Ultron-dev');
  const [newProjectInput, setNewProjectInput] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [folderPath, setFolderPath] = useState('/Users/codesmoker/projects/Ultron-dev');
  const [gitIsolation, setGitIsolation] = useState(false);
  const [resumeSessionId, setResumeSessionId] = useState('');

  const [provider, setProvider] = useState('claude');
  const [model, setModel] = useState('Fable 5');
  const [customCommand, setCustomCommand] = useState('claude --model claude-fable-5');

  const [description, setDescription] = useState('a fresh harness');
  const [goal, setGoal] = useState('long-running directive injected on every prompt');

  if (!isOpen) return null;

  const handleProviderSelect = (pId: string) => {
    setProvider(pId);
    const availableModels = MODELS[pId] || ['Default'];
    const newModel = availableModels[0];
    setModel(newModel);
    const pObj = PROVIDERS.find(p => p.id === pId);
    const cmdBase = pObj ? pObj.cmd : 'agent';
    const modelFlag = newModel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setCustomCommand(`${cmdBase} --model ${modelFlag}`);
  };

  const handleModelSelect = (m: string) => {
    setModel(m);
    const pObj = PROVIDERS.find(p => p.id === provider);
    const cmdBase = pObj ? pObj.cmd : 'agent';
    const modelFlag = m.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setCustomCommand(`${cmdBase} --model ${modelFlag}`);
  };

  const handleApplyTemplate = (tmpl: typeof BRIEFING_TEMPLATES[0]) => {
    setDescription(tmpl.description);
    setGoal(tmpl.goal);
  };

  const handleAddProject = () => {
    if (newProjectInput.trim() && !projects.includes(newProjectInput.trim())) {
      setProjects([...projects, newProjectInput.trim()]);
      setSelectedProject(newProjectInput.trim());
      setFolderPath(`/Users/codesmoker/projects/${newProjectInput.trim()}`);
      setNewProjectInput('');
      setIsAddingProject(false);
    }
  };

  const handleSpawn = () => {
    onSpawn({
      name: name.trim() || 'Agent',
      character: selectedCharacter,
      color: selectedColor,
      project: selectedProject,
      folder: folderPath,
      gitIsolation,
      resumeSessionId: resumeSessionId.trim() || undefined,
      provider,
      model,
      command: customCommand,
      description: description.trim() || 'General Specialist',
      goal: goal.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150 font-mono">
      <div 
        className={`w-full max-w-4xl rounded-xl border shadow-2xl overflow-hidden flex flex-col my-8 transition-colors ${
          isDark 
            ? 'bg-[#151921] border-[#2A3340] text-[#E6EDF3]' 
            : 'bg-[#FAF8F4] border-[#DED8CE] text-[#1E232A]'
        }`}
      >
        {/* Header Title Bar */}
        <div 
          className={`px-5 py-3 border-b flex items-center justify-between select-none ${
            isDark ? 'bg-[#12161E] border-[#2A3340]' : 'bg-[#F2ECE1] border-[#DED8CE]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold tracking-widest uppercase">
              ADD AGENT
            </span>
          </div>
          <button 
            onClick={onClose}
            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
              isDark ? 'hover:bg-[#202733] text-[#8B949E]' : 'hover:bg-[#E5DFD4] text-[#69717A]'
            }`}
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left Section Tabs + Right Content Area */}
        <div className="flex flex-col md:flex-row flex-1 min-h-[480px]">
          {/* Left Navigation Rail */}
          <div 
            className={`w-full md:w-56 p-3 border-b md:border-b-0 md:border-r flex md:flex-col gap-1.5 shrink-0 ${
              isDark ? 'bg-[#10141B] border-[#2A3340]' : 'bg-[#F4EFE5] border-[#DED8CE]'
            }`}
          >
            {[
              { key: 'identity', step: '1', title: 'IDENTITY', sub: 'name · character · color' },
              { key: 'workspace', step: '2', title: 'WORKSPACE', sub: 'folder · isolation · resume' },
              { key: 'engine', step: '3', title: 'ENGINE', sub: 'provider · model · command' },
              { key: 'briefing', step: '4', title: 'BRIEFING', sub: 'description · goal' },
            ].map(sec => {
              const isActive = activeSection === sec.key;
              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => setActiveSection(sec.key as SectionKey)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col gap-0.5 cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-[#1E2533] border-[#3B82F6] shadow-sm'
                        : 'bg-[#E3EBF8] border-[#3B82F6] shadow-sm'
                      : isDark
                      ? 'bg-transparent border-transparent hover:bg-[#161B24] text-[#8B949E]'
                      : 'bg-transparent border-transparent hover:bg-[#EBE5DA] text-[#69717A]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs tracking-wider">
                    <span className={isActive ? 'text-[#3B82F6]' : 'opacity-60'}>{sec.step}</span>
                    <span className={isActive ? (isDark ? 'text-white' : 'text-[#1E232A]') : ''}>
                      {sec.title}
                    </span>
                  </div>
                  <div className={`text-[10px] truncate ${isActive ? (isDark ? 'text-[#A0AEC0]' : 'text-[#4A5568]') : 'opacity-70'}`}>
                    {sec.sub}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Content Panel */}
          <div className="flex-1 p-5 overflow-y-auto max-h-[580px] space-y-5">
            {/* ================= SECTION 1: IDENTITY ================= */}
            {activeSection === 'identity' && (
              <div className="space-y-4">
                {/* NAME */}
                <div>
                  <label className="block text-[11px] uppercase font-bold tracking-wider mb-1.5 opacity-70">
                    NAME
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Jim, Dwight, Sarah"
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${
                      isDark 
                        ? 'bg-[#0E1217] border-[#2A3340] text-white focus:border-[#3B82F6]' 
                        : 'bg-white border-[#DED8CE] text-[#1E232A] focus:border-[#3B82F6]'
                    }`}
                  />
                </div>

                {/* CHARACTER SELECTION */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] uppercase font-bold tracking-wider opacity-70">
                      CHARACTER
                    </label>
                    <span className="text-[10px] text-[#3B82F6] opacity-90">The Office</span>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 p-2 rounded-lg border border-dashed border-inherit">
                    {OFFICE_CAST.map(c => {
                      const isSel = selectedCharacter === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => {
                            setSelectedCharacter(c.name);
                            if (name === 'Jim' || !name) setName(c.displayName);
                          }}
                          className={`flex flex-col items-center p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isSel
                              ? isDark
                                ? 'bg-[#1E293B] border-[#38BDF8] ring-2 ring-[#38BDF8]/30 shadow-md'
                                : 'bg-[#E0F2FE] border-[#0284C7] ring-2 ring-[#0284C7]/20 shadow-md'
                              : isDark
                              ? 'bg-[#10141B] border-[#2A3340] hover:bg-[#161B24]'
                              : 'bg-white border-[#E2DED5] hover:bg-[#F4EFE5]'
                          }`}
                          title={`${c.displayName} — ${c.blurb}`}
                        >
                          <div className="w-9 h-11 flex items-center justify-center overflow-hidden">
                            <SpritePortrait character={c.name} scale={1.8} />
                          </div>
                          <span className="text-[10px] font-bold mt-1 truncate max-w-full">
                            {c.displayName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* COLOR SWATCHES */}
                <div>
                  <label className="block text-[11px] uppercase font-bold tracking-wider mb-2 opacity-70">
                    COLOR
                  </label>
                  <div className="flex items-center gap-2">
                    {COLOR_SWATCHES.map(swatch => {
                      const isSel = selectedColor === swatch.hex;
                      return (
                        <button
                          key={swatch.id}
                          type="button"
                          onClick={() => setSelectedColor(swatch.hex)}
                          className={`w-7 h-7 rounded-md transition-all flex items-center justify-center cursor-pointer border ${
                            isSel ? 'ring-2 ring-white scale-110 shadow-md' : 'hover:scale-105 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: swatch.hex, borderColor: isSel ? '#FFFFFF' : 'transparent' }}
                          title={swatch.label}
                        >
                          {isSel && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================= SECTION 2: WORKSPACE ================= */}
            {activeSection === 'workspace' && (
              <div className="space-y-4">
                {/* PROJECT SELECTION */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] uppercase font-bold tracking-wider opacity-70">
                      PROJECT
                    </label>
                    {!isAddingProject && (
                      <button
                        type="button"
                        onClick={() => setIsAddingProject(true)}
                        className="text-[10px] text-[#3B82F6] hover:underline flex items-center gap-1 font-bold"
                      >
                        <Plus className="w-3 h-3" />
                        <span>add project</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {projects.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setSelectedProject(p);
                          setFolderPath(`/Users/codesmoker/projects/${p}`);
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-2 ${
                          selectedProject === p
                            ? isDark
                              ? 'bg-[#1E2533] border-[#3B82F6] text-[#38BDF8] font-bold'
                              : 'bg-[#E3EBF8] border-[#3B82F6] text-[#1D4ED8] font-bold'
                            : isDark
                            ? 'bg-[#10141B] border-[#2A3340] text-[#8B949E]'
                            : 'bg-white border-[#DED8CE] text-[#69717A]'
                        }`}
                      >
                        <span>{p}</span>
                      </button>
                    ))}
                  </div>

                  {isAddingProject && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Project name"
                        value={newProjectInput}
                        onChange={e => setNewProjectInput(e.target.value)}
                        className={`flex-1 px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
                          isDark ? 'bg-[#0E1217] border-[#2A3340] text-white' : 'bg-white border-[#DED8CE] text-[#1E232A]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleAddProject}
                        className="px-3 py-1.5 rounded-lg bg-[#3B82F6] text-white text-xs font-bold"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingProject(false)}
                        className="px-2 py-1.5 text-xs opacity-70 hover:opacity-100"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* FOLDER PATH */}
                <div>
                  <label className="block text-[11px] uppercase font-bold tracking-wider mb-1.5 opacity-70">
                    WORKING DIRECTORY (CWD)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={folderPath}
                      onChange={e => setFolderPath(e.target.value)}
                      className={`flex-1 px-3 py-2 rounded-lg border text-xs focus:outline-none ${
                        isDark ? 'bg-[#0E1217] border-[#2A3340] text-white' : 'bg-white border-[#DED8CE] text-[#1E232A]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setFolderPath('/Users/codesmoker/aws-frontend')}
                      className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                        isDark ? 'bg-[#161B24] border-[#2A3340] hover:bg-[#202733]' : 'bg-white border-[#DED8CE] hover:bg-[#F4EFE5]'
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5 text-[#3B82F6]" />
                      <span>pick</span>
                    </button>
                  </div>
                </div>

                {/* GIT ISOLATION */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                    <input
                      type="checkbox"
                      checked={gitIsolation}
                      onChange={e => setGitIsolation(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-400 text-[#3B82F6] focus:ring-0 cursor-pointer"
                    />
                    <span className="font-bold">Git isolation (own worktree)</span>
                  </label>
                  <p className="text-[10px] opacity-60 ml-6 mt-0.5">
                    Clones current branch into an isolated git worktree so concurrent edits never collide.
                  </p>
                </div>

                {/* RESUME SESSION ID */}
                <div>
                  <label className="block text-[11px] uppercase font-bold tracking-wider mb-1.5 opacity-70">
                    RESUME SESSION ID (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={resumeSessionId}
                    onChange={e => setResumeSessionId(e.target.value)}
                    placeholder="paste a Claude / Agent session id to continue its conversation"
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none ${
                      isDark ? 'bg-[#0E1217] border-[#2A3340] text-white' : 'bg-white border-[#DED8CE] text-[#1E232A]'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* ================= SECTION 3: ENGINE ================= */}
            {activeSection === 'engine' && (
              <div className="space-y-4">
                {/* PROVIDER CHIPS */}
                <div>
                  <label className="block text-[11px] uppercase font-bold tracking-wider mb-2 opacity-70">
                    PROVIDER
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PROVIDERS.map(p => {
                      const isSel = provider === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleProviderSelect(p.id)}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSel
                              ? isDark
                                ? 'bg-[#1E2533] border-[#3B82F6] text-[#38BDF8] font-bold shadow-sm'
                                : 'bg-[#E3EBF8] border-[#3B82F6] text-[#1D4ED8] font-bold shadow-sm'
                              : isDark
                              ? 'bg-[#10141B] border-[#2A3340] text-[#8B949E] hover:text-white'
                              : 'bg-white border-[#DED8CE] text-[#69717A] hover:text-[#1E232A]'
                          }`}
                        >
                          <Terminal className="w-3 h-3 opacity-60" />
                          <span>{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* MODEL CHIPS */}
                <div>
                  <label className="block text-[11px] uppercase font-bold tracking-wider mb-2 opacity-70">
                    MODEL
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(MODELS[provider] || ['Default Model']).map(m => {
                      const isSel = model === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleModelSelect(m)}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
                            isSel
                              ? isDark
                                ? 'bg-[#1E293B] border-[#38BDF8] text-[#38BDF8] font-bold'
                                : 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7] font-bold'
                              : isDark
                              ? 'bg-[#10141B] border-[#2A3340] text-[#8B949E]'
                              : 'bg-white border-[#DED8CE] text-[#69717A]'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* COMMAND PREVIEW */}
                <div>
                  <label className="block text-[11px] uppercase font-bold tracking-wider mb-1.5 opacity-70">
                    COMMAND
                  </label>
                  <div className={`p-3 rounded-lg border font-mono text-xs ${
                    isDark ? 'bg-[#0E1217] border-[#2A3340] text-[#38BDF8]' : 'bg-[#F2ECE1] border-[#DED8CE] text-[#1D4ED8]'
                  }`}>
                    <code>{customCommand}</code>
                  </div>
                </div>
              </div>
            )}

            {/* ================= SECTION 4: BRIEFING ================= */}
            {activeSection === 'briefing' && (
              <div className="space-y-4">
                {/* TEMPLATES */}
                <div>
                  <label className="block text-[11px] uppercase font-bold tracking-wider mb-2 opacity-70">
                    TEMPLATES
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {BRIEFING_TEMPLATES.map(tmpl => (
                      <button
                        key={tmpl.name}
                        type="button"
                        onClick={() => handleApplyTemplate(tmpl)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
                          isDark 
                            ? 'bg-[#10141B] border-[#2A3340] text-[#8B949E] hover:text-white hover:border-[#3B82F6]' 
                            : 'bg-white border-[#DED8CE] text-[#69717A] hover:text-[#1E232A] hover:border-[#3B82F6]'
                        }`}
                      >
                        {tmpl.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="block text-[11px] uppercase font-bold tracking-wider mb-1.5 opacity-70">
                    DESCRIPTION
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="one-line role — what this agent is for"
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none ${
                      isDark ? 'bg-[#0E1217] border-[#2A3340] text-white' : 'bg-white border-[#DED8CE] text-[#1E232A]'
                    }`}
                  />
                </div>

                {/* GOAL (OPTIONAL) */}
                <div>
                  <label className="block text-[11px] uppercase font-bold tracking-wider mb-1.5 opacity-70">
                    GOAL (OPTIONAL)
                  </label>
                  <textarea
                    rows={4}
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                    placeholder="long-running directive injected on every prompt"
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none resize-none ${
                      isDark ? 'bg-[#0E1217] border-[#2A3340] text-white' : 'bg-white border-[#DED8CE] text-[#1E232A]'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* AI HIRE PROMPT BANNER */}
            <div 
              className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                isDark ? 'bg-[#10141B] border-[#2A3340]' : 'bg-[#F2ECE1] border-[#DED8CE]'
              }`}
            >
              <div className="text-[11px] opacity-80 leading-relaxed">
                Import hire loads a ready-made agent from a .json manifest — it fills in every field above for you to review. Nothing spawns until you hit spawn.
              </div>
              <button
                type="button"
                onClick={() => {
                  setName('Dwight');
                  setSelectedCharacter('dwight');
                  setSelectedColor('#EAB308');
                  setDescription('Assistant to the Regional Manager & QA Inspector');
                  setGoal('Audit every branch for protocol compliance and log security invariants.');
                }}
                className={`px-3 py-1.5 rounded border text-[10px] font-bold shrink-0 transition-colors ${
                  isDark ? 'bg-[#1E2533] border-[#3B82F6] text-[#38BDF8]' : 'bg-white border-[#3B82F6] text-[#1D4ED8]'
                }`}
              >
                generate one with AI…
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div 
          className={`px-5 py-3 border-t flex items-center justify-between select-none ${
            isDark ? 'bg-[#12161E] border-[#2A3340]' : 'bg-[#F2ECE1] border-[#DED8CE]'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setName('Pam');
              setSelectedCharacter('pam');
              setSelectedColor('#4BA982');
              setDescription('Floor Receptionist & Design Coordinator');
              setGoal('Coordinate agent communications and verify visual design tokens.');
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
              isDark ? 'border-[#2A3340] text-[#8B949E] hover:text-white' : 'border-[#DED8CE] text-[#69717A] hover:text-[#1E232A]'
            }`}
          >
            import hire…
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                isDark ? 'border-[#2A3340] text-[#8B949E] hover:text-white' : 'border-[#DED8CE] text-[#69717A] hover:text-[#1E232A]'
              }`}
            >
              cancel
            </button>
            <button
              type="button"
              onClick={handleSpawn}
              className="px-5 py-1.5 rounded-lg bg-black text-white hover:bg-slate-800 text-xs font-mono font-bold tracking-wider transition-all shadow-md active:scale-95"
            >
              spawn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
