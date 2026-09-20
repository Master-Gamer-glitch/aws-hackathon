import AgentTabClient from "./AgentTabClient";
import { VALID_TABS } from "./tabs";

// Pre-render every mission-control tab so the app can be exported as static files.
export const dynamicParams = false;

export function generateStaticParams() {
  return VALID_TABS.map((tab) => ({ tab }));
}

export default function AgentTabPage() {
  return <AgentTabClient />;
}
