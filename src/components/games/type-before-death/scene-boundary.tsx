"use client";

import { Component, type ReactNode } from "react";

/** A renderer failure must leave the typing controller and results flow alive. */
export class TypeBeforeDeathSceneBoundary extends Component<{ children: ReactNode; onFallback: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(): void {
    this.props.onFallback();
  }

  render(): ReactNode {
    return this.state.failed ? <div className="flex h-full items-center justify-center bg-[#070d21] px-8 text-center text-xs text-slate-300">The city renderer failed safely. Text combat remains active; reload to retry the 3D scene.</div> : this.props.children;
  }
}
