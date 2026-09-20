"use client";

import React from "react";
import HeroScroll from "@/components/HeroScroll";
import HeroScrollDemo from "@/components/HeroScrollDemo";
import ZoneReveal from "@/components/ZoneReveal";
import CommandHubClimax from "@/components/CommandHubClimax";
import AgentRoster from "@/components/AgentRoster";
import ClosingCTA from "@/components/ClosingCTA";
import HeroSection6 from "@/components/ui/hero-section-6";

export default function Home() {
  return (
    <div className="relative w-full bg-crew-bg">
      {/* 01. Hero Sequence: Team Assemble -> Office Materialize */}
      <HeroScroll />

      {/* 02. Zone Reveal 1: The Living Office (Container Scroll Tablet with Light Gate Transition) */}
      <div id="zones">
        <HeroScrollDemo />

        {/* 04. Zone Reveal 2: Verification (Section 06) */}
        <ZoneReveal
          id="design-qa"
          sequencePath="/sequence-4/"
          zoneNumber="02"
          eyebrow="VERIFY BEFORE YOU TRUST"
          zoneLabel="AUTONOMY WITH CHECKPOINTS."
          subtitle="Agents don't simply produce output and disappear. Ultron tracks what was requested, what was executed, what was verified and where human input is required."
          accentColor="purple"
          featureBullets={[
            {
              title: "TASK CONTRACTS",
              desc: "Every task has a clear objective and definition of done before execution begins.",
              tag: "CONTRACTS",
            },
            {
              title: "VERIFICATION & AUDIT TRAIL",
              desc: "Outputs can be reviewed before the next stage continues. See what happened, which agent acted and what changed.",
              tag: "AUDIT TRAIL",
            },
            {
              title: "HUMAN CHECKPOINTS",
              desc: "Sensitive actions can pause until you approve them. Zero unauthorized writes to critical systems.",
              tag: "HUMAN GATES",
            },
          ]}
          bottomStatement="Autonomous doesn't have to mean uncontrolled."
          fallbackStartImage="/sequence-1/frame-045.jpg"
          fallbackEndImage="/sequence-1/frame-055.jpg"
        />

        {/* 05. Zone Reveal 3: Permissions & Budget (Sections 07 & 08) */}
        <ZoneReveal
          id="server-lounge"
          sequencePath="/sequence-6/"
          zoneNumber="03"
          eyebrow="CONTROLLED AUTONOMY & BUDGETS"
          zoneLabel="LET AGENTS ACT. NOT ACT ANYWHERE."
          subtitle="Every agent operates inside a defined permission boundary. AI work should never become an open-ended bill."
          accentColor="amber"
          featureBullets={[
            {
              title: "CEDAR PERMISSION BOUNDARIES",
              desc: "PERMISSION: What can this agent access? • ACTION: What is it trying to do? • POLICY: Is it allowed? • BLOCK: Unsafe actions stop here.",
              tag: "AWS CEDAR",
            },
            {
              title: "MISSION BUDGET: $5.00 CAP",
              desc: "Used: $2.31 • Remaining: $2.69. Continuous token monitoring with automated circuit breakers so bills never runaway.",
              tag: "BUDGET CONTROL",
            },
            {
              title: "AUTO-STOP CIRCUIT BREAKER",
              desc: "No surprise runaway execution. Automated power-down when limits are reached or when sensitive actions require human sign-off.",
              tag: "HARD LIMITS",
            },
          ]}
          bottomStatement="Give every agent a job. Give every agent a boundary. Your budget is part of the mission."
          fallbackStartImage="/sequence-1/frame-055.jpg"
          fallbackEndImage="/sequence-1/frame-060.jpg"
        />
      </div>

      {/* 06. Central Command Hub Climax & Payoff Bloom */}
      <CommandHubClimax />

      {/* 07. The 6-Agent Roster & Character Cutout Showcase */}
      <AgentRoster />

      {/* 08. Integrated UI Showcase (hero-section-6) */}
      <section className="relative w-full border-t border-crew-border/60">
        <HeroSection6 />
      </section>

      {/* 09. Closing Lounge Scene, Interactive CLI & Footer */}
      <ClosingCTA />
    </div>
  );
}
