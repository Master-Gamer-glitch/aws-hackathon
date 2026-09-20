"use client";

import React from "react";
import Activity from "../../office/mission-control/Activity";

export default function ActivityView() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-auto bg-crew-bg">
      <Activity />
    </div>
  );
}
