"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import MissionControlView, { MissionTab } from "@/components/office/mission-control/MissionControlView";
import { VALID_TABS } from "./tabs";


export default function AgentTabClient() {
  const params = useParams();
  const router = useRouter();
  const rawTab = (params?.tab as string) || "terminal";

  const currentTab: MissionTab = VALID_TABS.includes(rawTab as MissionTab)
    ? (rawTab as MissionTab)
    : "terminal";

  return (
    <MissionControlView
      initialTab={currentTab}
      onTabChange={(newTab) => {
        router.push(`/agent/${newTab}`);
      }}
      onExitFocusMode={() => {
        router.push("/office");
      }}
    />
  );
}
