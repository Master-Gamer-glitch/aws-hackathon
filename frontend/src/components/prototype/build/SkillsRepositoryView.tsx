"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Search,
  Plus,
  Check,
  ToggleLeft,
  ToggleRight,
  Shield,
  Bot,
  Wrench,
  Sparkles,
} from "lucide-react";
import { usePrototype } from "../PrototypeContext";

interface SkillItem {
  id: string;
  name: string;
  category: "ENGINEERING" | "VERIFICATION" | "RESEARCH" | "OPERATIONS";
  description: string;
  requiredTools: string[];
  supportedAgents: string[];
  enabled: boolean;
  version: string;
}

export default function SkillsRepositoryView() {
  const { isDark } = usePrototype();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [skills, setSkills] = useState<SkillItem[]>([
    {
      id: "skill-ast",
      name: "AST Code Synthesis & Refactor",
      category: "ENGINEERING",
      description: "Parses Abstract Syntax Trees in TypeScript and Rust to generate type-safe transformations.",
      requiredTools: ["fs:write", "ast:parse", "git:diff"],
      supportedAgents: ["Coder", "Ultron"],
      enabled: true,
      version: "v2.4.0",
    },
    {
      id: "skill-cedar",
      name: "Cedar Policy Invariant Verification",
      category: "VERIFICATION",
      description: "Verifies authorization schemas and zero-trust invariant bounds before mutations.",
      requiredTools: ["cedar:eval", "policy:read"],
      supportedAgents: ["QA Auditor", "Ultron"],
      enabled: true,
      version: "v3.1.2",
    },
    {
      id: "skill-research",
      name: "Autonomous Web & Vector Research",
      category: "RESEARCH",
      description: "Performs recursive multi-source technical documentation crawls and vector embedding synthesis.",
      requiredTools: ["web:search", "vector:search", "doc:synthesize"],
      supportedAgents: ["Research & RAG", "Ultron"],
      enabled: true,
      version: "v1.8.5",
    },
    {
      id: "skill-browser",
      name: "Browser E2E UI Flow Automation",
      category: "VERIFICATION",
      description: "Executes automated headful/headless browser flows with DOM inspection and screenshot diffs.",
      requiredTools: ["playwright:exec", "dom:query"],
      supportedAgents: ["QA Auditor", "Designer"],
      enabled: true,
      version: "v1.4.0",
    },
    {
      id: "skill-data",
      name: "Lakehouse Data Analysis & SQL",
      category: "OPERATIONS",
      description: "Formulates performant SQL transformations, inspects Iceberg schemas, and generates telemetry summaries.",
      requiredTools: ["databricks:query", "snowflake:query"],
      supportedAgents: ["Ultron", "Coder"],
      enabled: true,
      version: "v2.0.1",
    },
    {
      id: "skill-deploy",
      name: "Canary Deployment & Rollback Gate",
      category: "OPERATIONS",
      description: "Deploys containerized workloads to canary clusters with automated health-check gates.",
      requiredTools: ["k8s:deploy", "metrics:query", "gate:approve"],
      supportedAgents: ["Launch", "Ultron"],
      enabled: false,
      version: "v1.1.0",
    },
  ]);

  const toggleSkill = (id: string) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch =
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-[18px] font-display font-bold text-inherit">Skills Repository</h1>
          <p className={`text-[12px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
            Reusable agent skill definitions, tool dependency contracts, and runtime clearances.
          </p>
        </div>

        <button
          type="button"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-mono font-semibold transition-all ${
            isDark
              ? "bg-[#D64B55] hover:bg-[#C23E48] text-white"
              : "bg-[#B83D47] hover:bg-[#A3343E] text-white"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register New Skill</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div
        className={`p-2.5 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
          isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
        }`}
      >
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#737D89]" />
          <input
            type="text"
            placeholder="Search skills by name or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-3 py-1 text-[11px] font-mono rounded border focus:outline-none ${
              isDark
                ? "bg-[#171C24] border-[#2B333E] text-[#F2F0EA] placeholder-[#626A73]"
                : "bg-[#FFFFFF] border-[#E2DED5] text-[#20242A] placeholder-[#8A9198]"
            }`}
          />
        </div>

        <div className="flex items-center gap-1.5">
          {["all", "ENGINEERING", "VERIFICATION", "RESEARCH", "OPERATIONS"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[10px] font-mono rounded uppercase transition-colors ${
                selectedCategory === cat
                  ? isDark
                    ? "bg-[#171C24] text-[#D64B55] font-bold border border-[#2B333E]"
                    : "bg-[#FFFFFF] text-[#B83D47] font-bold border border-[#E2DED5] shadow-xs"
                  : isDark
                  ? "text-[#737D89] hover:text-[#F2F0EA]"
                  : "text-[#858C94] hover:text-[#20242A]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-6">
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className={`rounded-lg border p-4 flex flex-col justify-between transition-all ${
                isDark
                  ? "bg-[#12161D] border-[#2B333E] hover:border-[#3E4756]"
                  : "bg-[#FBFAF7] border-[#E2DED5] hover:border-[#CAC4B8]"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase border ${
                        skill.category === "ENGINEERING"
                          ? "text-[#38BDF8] border-[#38BDF8]/30 bg-[#38BDF8]/10"
                          : skill.category === "VERIFICATION"
                          ? "text-[#F43F5E] border-[#F43F5E]/30 bg-[#F43F5E]/10"
                          : skill.category === "RESEARCH"
                          ? "text-[#A855F7] border-[#A855F7]/30 bg-[#A855F7]/10"
                          : "text-[#EAB308] border-[#EAB308]/30 bg-[#EAB308]/10"
                      }`}
                    >
                      {skill.category}
                    </span>
                    <h3 className="font-bold text-[13px] font-mono mt-1.5">{skill.name}</h3>
                  </div>

                  {/* Toggle Button */}
                  <button
                    type="button"
                    onClick={() => toggleSkill(skill.id)}
                    className="focus:outline-none"
                    title={skill.enabled ? "Disable Skill" : "Enable Skill"}
                  >
                    {skill.enabled ? (
                      <ToggleRight className="w-5 h-5 text-[#4BA982]" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-[#737D89]" />
                    )}
                  </button>
                </div>

                <p
                  className={`text-[11px] font-sans mt-2.5 line-clamp-2 leading-relaxed ${
                    isDark ? "text-[#A6AEB8]" : "text-[#626A73]"
                  }`}
                >
                  {skill.description}
                </p>

                {/* Required Tools */}
                <div className="mt-3 pt-3 border-t border-inherit space-y-1">
                  <span className={`text-[10px] font-mono uppercase ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                    Required Tools:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {skill.requiredTools.map((t) => (
                      <code
                        key={t}
                        className={`text-[9px] font-mono px-1 py-0.2 rounded border ${
                          isDark ? "bg-[#171C24] border-[#2B333E] text-[#A6AEB8]" : "bg-[#FFFFFF] border-[#E2DED5] text-[#626A73]"
                        }`}
                      >
                        {t}
                      </code>
                    ))}
                  </div>
                </div>

                {/* Supported Agents */}
                <div className="mt-2.5 space-y-1">
                  <span className={`text-[10px] font-mono uppercase ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                    Supported Agents:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {skill.supportedAgents.map((ag) => (
                      <span
                        key={ag}
                        className="text-[10px] font-mono font-semibold text-inherit"
                      >
                        {ag} ·
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between text-[10px] font-mono">
                <span className={isDark ? "text-[#737D89]" : "text-[#858C94]"}>{skill.version}</span>
                <span className={skill.enabled ? "text-[#4BA982] font-bold" : "text-[#737D89]"}>
                  {skill.enabled ? "● Active in Swarm" : "○ Disabled"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
