"use client";

import React from "react";
import UltronIDE from "../../office/UltronIDE";
import { usePrototype } from "../PrototypeContext";

export default function UltronIDEView() {
  const { isDark } = usePrototype();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-crew-bg">
      <UltronIDE isDark={isDark} />
    </div>
  );
}
