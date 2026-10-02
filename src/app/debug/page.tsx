import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DebugPage() {
  notFound();
}
