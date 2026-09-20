"use client";

import React from "react";
import dynamic from "next/dynamic";
import { usePrototype, PROTOTYPE_AGENTS, type PrototypeAgent } from "../PrototypeContext";
import { Play, ArrowRight, ExternalLink, Bot, Zap, Shield } from "lucide-react";

const OfficeFloor = dynamic(
  () => import("@office/scene/office/OfficeFloor").then((mod) => mod.OfficeFloor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center text-xs font-mono text-[#737D89]">
        Initializing Ultron Workforce Floor...
      </div>
    ),
  }
);

export default function OfficeView() {
  const { isDark, selectedAgent, setSelectedAgent, openAgentWorkspace, setPrimaryRoute } =
    usePrototype();

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Center / Left: Live Office Stage */}
      <div className={`flex-1 flex items-center justify-center p-3 sm:p-4 overflow-hidden relative ${
        isDark ? "bg-[#0D1015]" : "bg-[#F4F2ED]"
      }`}>
        <div
          className={`w-full h-full max-w-[1280px] max-h-[900px] relative rounded-lg border overflow-hidden shadow-sm flex items-center justify-center ${
            isDark ? "border-[#2B333E] bg-[#0A0D11]" : "border-[#DDD9D0] bg-[#EDE7D6]"
          }`}
        >
          <OfficeFloor />
        </div>
      </div>

      {/* Right: Compact Live Office Quick Actions & Floor Telemetry */}
      <div
        className={`w-full lg:w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l flex flex-col justify-between p-4 overflow-y-auto ${
          isDark
            ? "bg-[#10141A] border-[#2B333E] text-[#F2F0EA]"
            : "bg-[#FBFAF7] border-[#E2DED5] text-[#20242A]"
        }`}
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#737D89]">
                WORKFORCE FLOOR
              </span>
              <span className="text-[10px] font-mono text-[#4BA982] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4BA982] animate-pulse" />
                <span>6 Pods Active</span>
              </span>
            </div>
            <h2 className="text-[15px] font-display font-bold mt-1">Autonomous Floor Mesh</h2>
            <p className={`text-[11px] font-mono mt-0.5 ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
              Select an agent from the floor or roster to inspect live PTY streams and tasks.
            </p>
          </div>

          {/* Focused Agent Card */}
          <div
            className={`p-3 rounded-lg border space-y-2.5 ${
              isDark ? "bg-[#171C24] border-[#2B333E]" : "bg-[#FFFFFF] border-[#E2DED5]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedAgent.avatar}
                  alt={selectedAgent.name}
                  className="w-7 h-7 rounded-md object-cover border border-inherit"
                />
                <div>
                  <div className="font-bold text-[12px] font-mono">{selectedAgent.name}</div>
                  <div className={`text-[10px] font-mono ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
                    {selectedAgent.role}
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded text-[#4BA982] bg-[#4BA982]/10">
                {selectedAgent.status}
              </span>
            </div>

            <p className={`text-[11px] font-sans ${isDark ? "text-[#A6AEB8]" : "text-[#626A73]"}`}>
              {selectedAgent.description}
            </p>

            <button
              type="button"
              onClick={() => openAgentWorkspace(selectedAgent)}
              className={`w-full py-1.5 px-3 rounded text-[11px] font-mono font-semibold text-center border transition-all flex items-center justify-center gap-1.5 ${
                isDark
                  ? "bg-[#D64B55] hover:bg-[#C23E48] text-white border-transparent"
                  : "bg-[#B83D47] hover:bg-[#A3343E] text-white border-transparent"
              }`}
            >
              <span>Open {selectedAgent.name} Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fast Fleet Roster */}
          <div className="space-y-1.5">
            <span className={`text-[10px] font-mono uppercase font-bold ${isDark ? "text-[#737D89]" : "text-[#858C94]"}`}>
              Fleet Roster
            </span>
            <div className="space-y-1">
              {PROTOTYPE_AGENTS.map((ag) => (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => setSelectedAgent(ag)}
                  className={`w-full p-2 rounded border text-left flex items-center justify-between transition-colors ${
                    selectedAgent.id === ag.id
                      ? isDark
                        ? "bg-[#171C24] border-[#D64B55]"
                        : "bg-[#FFFFFF] border-[#B83D47]"
                      : isDark
                      ? "border-[#2B333E] hover:bg-[#151B23]"
                      : "border-[#E2DED5] hover:bg-[#FFFFFF]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ag.avatar} alt={ag.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                    <span className="font-mono text-[11px] font-bold truncate">{ag.name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#737D89] uppercase">{ag.status}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Launch IDE */}
        <div className="pt-3 border-t border-inherit">
          <button
            type="button"
            onClick={() => setPrimaryRoute("ide")}
            className={`w-full py-1.5 rounded text-[11px] font-mono font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
              isDark
                ? "border-[#2B333E] hover:bg-[#171C24] text-[#A6AEB8]"
                : "border-[#E2DED5] hover:bg-[#FFFFFF] text-[#626A73]"
            }`}
          >
            <span>Launch Ultron IDE</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#927BAA]" />
          </button>
        </div>
      </div>
    </div>
  );
}
