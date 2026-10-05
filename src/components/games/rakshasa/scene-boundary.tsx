"use client";

import { Component, type ReactNode } from "react";

/** A failed lazy scene chunk must not take the keyboard/HUD/result flow down. */
export class WarSceneBoundary extends Component<{ children: ReactNode; onFallback: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFallback(); }
  render() {
    return this.state.failed ? <div role="status" className="flex h-full items-center justify-center bg-slate-950 px-8 text-center text-xs text-slate-300">
      The 3D scene could not load. Text-combat fallback is active; the target console and all combat rules still work. Reload this page to retry the scene.
    </div> : this.props.children;
  }
}
