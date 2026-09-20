"use client";

import React from "react";
import dynamic from "next/dynamic";
import { PrototypeProvider } from "@/components/prototype/PrototypeContext";

const PrototypeShell = dynamic(
  () => import("@/components/prototype/PrototypeShell"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-[#0D1015] flex items-center justify-center text-xs font-mono text-[#A6AEB8]">
        Loading Ultron Feature Architecture & UI Prototype...
      </div>
    ),
  }
);

export default function PrototypePage() {
  return (
    <PrototypeProvider>
      <PrototypeShell />
    </PrototypeProvider>
  );
}
