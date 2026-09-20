"use client";

import React, { useState } from "react";
import { Sun, Moon, PanelLeftClose, PanelLeft, Bot } from "lucide-react";
import { usePrototype, PrimaryRoute } from "../PrototypeContext";

export default function PrimaryNavbar() {
  const {
    primaryRoute,
    setPrimaryRoute,
    secondaryRoute,
    isDark,
    toggleTheme,
    isSidebarCollapsed,
    toggleSidebar,
    isAutoMode,
    setIsAutoMode,
    selectedAgent,
  } = usePrototype();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navItems: { id: PrimaryRoute; label: string }[] = [
    { id: "office", label: "OFFICE" },
    { id: "tasks", label: "TASKS" },
    { id: "agents", label: "AGENTS" },
    { id: "activity", label: "ACTIVITY" },
  ];

  return (
    <header
      className={`h-[46px] border-b px-3 flex items-center justify-between shrink-0 select-none transition-colors z-40 ${
        isDark
          ? "bg-[#0D1015] border-[#2B333E] text-[#F2F0EA]"
          : "bg-[#F4F2ED] border-[#E2DED5] text-[#20242A]"
      }`}
    >
      {/* Left: Brand + Primary Navigation */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Sidebar Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? "Expand Advanced Navigation" : "Collapse Advanced Navigation"}
          className={`w-7 h-7 rounded flex items-center justify-center border transition-colors ${
            isDark
              ? "border-[#2B333E] hover:border-[#3E4756] text-[#A6AEB8] hover:text-[#F2F0EA] bg-[#12161D]"
              : "border-[#E2DED5] hover:border-[#CAC4B8] text-[#626A73] hover:text-[#20242A] bg-[#FBFAF7]"
          }`}
        >
          {isSidebarCollapsed ? <PanelLeft className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
        </button>

        {/* Ultron Logo */}
        <button
          type="button"
          onClick={() => setPrimaryRoute("office")}
          className="flex items-center gap-2 pl-1 pr-3 border-r border-inherit hover:opacity-90 transition-opacity"
        >
          <div className="w-5 h-5 relative flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ultron-logo.png" alt="Ultron" className="w-5 h-5 object-contain" />
          </div>
          <span className="font-display font-bold tracking-wider text-[13px] text-inherit">
            ULTRON
          </span>
        </button>

        {/* Primary Links */}
        <nav className="flex items-center gap-0.5 ml-1">
          {navItems.map((item) => {
            const isActive = !secondaryRoute && primaryRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPrimaryRoute(item.id)}
                className={`px-3 py-1 text-[12px] font-mono font-medium tracking-wide transition-colors rounded ${
                  isActive
                    ? isDark
                      ? "bg-[#171C24] text-[#D64B55] border border-[#2B333E] font-semibold"
                      : "bg-[#FFFFFF] text-[#B83D47] border border-[#E2DED5] font-semibold shadow-xs"
                    : isDark
                    ? "text-[#A6AEB8] hover:text-[#F2F0EA] hover:bg-[#12161D]"
                    : "text-[#626A73] hover:text-[#20242A] hover:bg-[#FBFAF7]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: Auto Mode Toggle, Theme Toggle, Avatar */}
      <div className="flex items-center gap-2">
        {/* AUTO Mode Pill */}
        <button
          type="button"
          onClick={() => setIsAutoMode(!isAutoMode)}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono border transition-all ${
            isAutoMode
              ? isDark
                ? "bg-[#14231E] border-[#1D3D32] text-[#4BA982]"
                : "bg-[#EAF5F0] border-[#B7DFCE] text-[#287B5B]"
              : isDark
              ? "bg-[#171C24] border-[#2B333E] text-[#A6AEB8]"
              : "bg-[#FFFFFF] border-[#E2DED5] text-[#626A73]"
          }`}
          title="Toggle Autonomous Swarm Execution"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isAutoMode ? "bg-[#4BA982] animate-pulse" : isDark ? "bg-[#555E6B]" : "bg-[#9AA0A6]"
            }`}
          />
          <span className="font-semibold">{isAutoMode ? "AUTO" : "MANUAL"}</span>
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? "Switch to Classic Light" : "Switch to Ultron Dark"}
          className={`w-7 h-7 rounded flex items-center justify-center border transition-colors ${
            isDark
              ? "border-[#2B333E] hover:border-[#3E4756] text-[#A6AEB8] hover:text-[#F2F0EA] bg-[#12161D]"
              : "border-[#E2DED5] hover:border-[#CAC4B8] text-[#626A73] hover:text-[#20242A] bg-[#FBFAF7]"
          }`}
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Avatar & Minimal Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`w-7 h-7 rounded-full overflow-hidden border transition-all ${
              isProfileOpen
                ? isDark
                  ? "border-[#D64B55] ring-2 ring-[#D64B55]/20"
                  : "border-[#B83D47] ring-2 ring-[#B83D47]/20"
                : isDark
                ? "border-[#2B333E] hover:border-[#3E4756]"
                : "border-[#E2DED5] hover:border-[#CAC4B8]"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ultron-logo.png"
              alt="Operator"
              className="w-full h-full object-cover"
            />
          </button>

          {isProfileOpen && (
            <div
              className={`absolute right-0 top-full mt-1.5 w-64 rounded-lg border shadow-xl p-3 z-50 font-mono text-[11px] ${
                isDark
                  ? "bg-[#12161D] border-[#2B333E] text-[#F2F0EA]"
                  : "bg-[#FBFAF7] border-[#E2DED5] text-[#20242A]"
              }`}
            >
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-inherit">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-inherit shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/ultron-logo.png" alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">Ultron Commander</div>
                  <div className={`text-[10px] truncate ${isDark ? "text-[#A6AEB8]" : "text-[#626A73]"}`}>
                    operator@ultron.internal
                  </div>
                </div>
              </div>
              <div className="py-2 border-b border-inherit space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className={isDark ? "text-[#A6AEB8]" : "text-[#626A73]"}>Focused Agent:</span>
                  <span className="font-bold text-[#D64B55]">{selectedAgent.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-[#A6AEB8]" : "text-[#626A73]"}>Cluster State:</span>
                  <span className="font-semibold text-[#4BA982]">Nominal</span>
                </div>
              </div>
              <div className="pt-2">
                <a
                  href="/start"
                  className={`block text-center py-1 rounded border text-[10px] font-bold ${
                    isDark
                      ? "border-[#2B333E] hover:bg-[#171C24] text-[#A6AEB8]"
                      : "border-[#E2DED5] hover:bg-[#FFFFFF] text-[#626A73]"
                  }`}
                >
                  Switch Workspace / Cluster
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
