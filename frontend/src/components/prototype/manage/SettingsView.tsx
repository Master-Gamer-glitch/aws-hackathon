"use client";

import React, { useState } from "react";
import {
  Settings,
  Users,
  Shield,
  Bot,
  CreditCard,
  GitBranch,
  Key,
  Palette,
  User,
  Check,
} from "lucide-react";
import { usePrototype } from "../PrototypeContext";

type SettingsSection =
  | "org"
  | "members"
  | "roles"
  | "defaults"
  | "git"
  | "identity"
  | "theme"
  | "account";

export default function SettingsView() {
  const { isDark, toggleTheme } = usePrototype();
  const [activeSection, setActiveSection] = useState<SettingsSection>("org");
  const [isSaved, setIsSaved] = useState(false);

  const sections: { id: SettingsSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "org", label: "Organization", icon: Settings },
    { id: "members", label: "Members & Team", icon: Users },
    { id: "roles", label: "Roles & RBAC", icon: Shield },
    { id: "defaults", label: "Agent Defaults", icon: Bot },
    { id: "git", label: "Git Repositories", icon: GitBranch },
    { id: "identity", label: "Workload Identity", icon: Key },
    { id: "theme", label: "Theme & Visuals", icon: Palette },
    { id: "account", label: "Account", icon: User },
  ];

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 sm:p-6 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-[18px] font-display font-bold text-inherit">Settings</h1>
          <p className={`text-[12px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
            Configure organization policies, member permissions, Git connections, and workload identity.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-mono font-semibold transition-all ${
            isSaved
              ? "bg-[#4BA982] text-white"
              : isDark
              ? "bg-[#D64B55] hover:bg-[#C23E48] text-white"
              : "bg-[#B83D47] hover:bg-[#A3343E] text-white"
          }`}
        >
          {isSaved ? <Check className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
          <span>{isSaved ? "Saved" : "Save Changes"}</span>
        </button>
      </div>

      {/* Main Settings: Left Nav Tabs + Right Details */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
        {/* Left Sub-nav */}
        <div
          className={`w-full md:w-[200px] shrink-0 rounded-lg border p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto ${
            isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
          }`}
        >
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded text-[12px] font-mono text-left transition-all shrink-0 ${
                  isActive
                    ? isDark
                      ? "bg-[#171C24] text-[#D64B55] font-semibold border border-[#2B333E]"
                      : "bg-[#FFFFFF] text-[#B83D47] font-semibold border border-[#E2DED5] shadow-xs"
                    : isDark
                    ? "text-[#A6AEB8] hover:text-[#F2F0EA] hover:bg-[#151B23]"
                    : "text-[#626A73] hover:text-[#20242A] hover:bg-[#F2EFE8]"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Settings Viewport */}
        <div
          className={`flex-1 rounded-lg border p-5 overflow-y-auto min-h-0 space-y-6 ${
            isDark ? "bg-[#12161D] border-[#2B333E]" : "bg-[#FBFAF7] border-[#E2DED5]"
          }`}
        >
          {activeSection === "org" && (
            <div className="space-y-4 max-w-2xl font-mono text-[12px]">
              <h3 className="text-[14px] font-bold">Organization Details</h3>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Organization Name</label>
                  <input
                    type="text"
                    defaultValue="Ultron Autonomous Workforce"
                    className={`w-full px-3 py-1.5 rounded border ${
                      isDark ? "bg-[#171C24] border-[#2B333E] text-white" : "bg-[#FFFFFF] border-[#E2DED5]"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Organization ID</label>
                  <input
                    type="text"
                    readOnly
                    defaultValue="org_ultron_984210"
                    className={`w-full px-3 py-1.5 rounded border opacity-60 ${
                      isDark ? "bg-[#171C24] border-[#2B333E] text-white" : "bg-[#FFFFFF] border-[#E2DED5]"
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === "members" && (
            <div className="space-y-4 max-w-2xl font-mono text-[12px]">
              <h3 className="text-[14px] font-bold">Team Members (3 Active Operators)</h3>
              <div className="space-y-2 pt-2">
                {[
                  { name: "Commander Operator", email: "operator@ultron.internal", role: "Owner" },
                  { name: "DevOps Lead", email: "devops@ultron.internal", role: "Admin" },
                  { name: "Security Auditor", email: "security@ultron.internal", role: "Auditor" },
                ].map((m) => (
                  <div
                    key={m.email}
                    className={`p-3 rounded border flex items-center justify-between text-[11px] ${
                      isDark ? "bg-[#171C24] border-[#2B333E]" : "bg-[#FFFFFF] border-[#E2DED5]"
                    }`}
                  >
                    <div>
                      <span className="font-bold block text-inherit">{m.name}</span>
                      <span className="text-[10px] text-[#737D89]">{m.email}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-inherit">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "theme" && (
            <div className="space-y-4 max-w-2xl font-mono text-[12px]">
              <h3 className="text-[14px] font-bold">Theme & Visual Identity</h3>
              <p className={`text-[11px] ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                Toggle between Ultron Cyber Dark and Ultron Classic Light.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`px-4 py-2 rounded font-bold border transition-colors ${
                    isDark
                      ? "bg-[#171C24] border-[#2B333E] text-[#F2F0EA] hover:border-[#D64B55]"
                      : "bg-[#FFFFFF] border-[#E2DED5] text-[#20242A] hover:border-[#B83D47]"
                  }`}
                >
                  Current: {isDark ? "Ultron Dark (#0D1015)" : "Ultron Light (#F4F2ED)"} — Click to Switch
                </button>
              </div>
            </div>
          )}

          {activeSection !== "org" && activeSection !== "members" && activeSection !== "theme" && (
            <div className="space-y-3 max-w-2xl font-mono text-[12px]">
              <h3 className="text-[14px] font-bold capitalize">{activeSection} Configuration</h3>
              <p className={`text-[11px] ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                All settings are enforced by AWS Cedar zero-trust boundary schemas.
              </p>
              <div
                className={`p-4 rounded border text-[11px] text-[#4BA982] ${
                  isDark ? "bg-[#171C24] border-[#2B333E]" : "bg-[#FFFFFF] border-[#E2DED5]"
                }`}
              >
                ✓ All configuration parameters synchronized with cluster daemon.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
