import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TypingEngineDebug } from "@/components/typing-test/typing-engine-debug";

// Development-only. Guarded at the route level so the component and its
// diagnostics never ship in a production bundle.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function TypingEngineDebugPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <TypingEngineDebug />;
}
