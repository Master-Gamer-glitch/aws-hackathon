"use client";

import React from "react";
import Tasks from "../../office/mission-control/Tasks";

export default function TasksView() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-auto bg-crew-bg">
      <Tasks />
    </div>
  );
}
