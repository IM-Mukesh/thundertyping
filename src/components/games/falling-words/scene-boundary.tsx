"use client";

import { Component, type ReactNode } from "react";

/** Scene downloads/driver failures must not take the words, controls or records down. */
export class SkyfallSceneBoundary extends Component<{ children: ReactNode; onFallback: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFallback(); }
  render() {
    return this.state.failed ? <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 90%, #17434a, #080f22 70%)" }} /> : this.props.children;
  }
}
