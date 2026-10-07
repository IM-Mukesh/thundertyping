import { describe, it } from "node:test";
import assert from "node:assert/strict";

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function srgbToLinear(c: number): number {
  const norm = c / 255;
  return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(srgbToLinear);
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(parseHex(hex1));
  const l2 = relativeLuminance(parseHex(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("F16: Accessibility Contrast Compliance (WCAG AA 4.5:1)", () => {
  it("verifies dark theme error color (#f87171) has at least 4.5:1 contrast against dark background (#323437)", () => {
    const ratio = contrastRatio("#f87171", "#323437");
    assert.ok(ratio >= 4.45, `Expected contrast >= 4.45:1, got ${ratio.toFixed(2)}:1`);
  });

  it("verifies light theme accent color (#a16207) has at least 4.5:1 contrast against light background (#fafaf8)", () => {
    const ratio = contrastRatio("#a16207", "#fafaf8");
    assert.ok(ratio >= 4.5, `Expected contrast >= 4.5:1, got ${ratio.toFixed(2)}:1`);
  });

  it("verifies light theme sub text (#52524e) holds strong contrast against #fafaf8", () => {
    const ratio = contrastRatio("#52524e", "#fafaf8");
    assert.ok(ratio >= 6.5, `Expected contrast >= 6.5:1, got ${ratio.toFixed(2)}:1`);
  });

  it("verifies forest and sunset error colors (#f87171) meet WCAG AA contrast against their backgrounds", () => {
    assert.ok(contrastRatio("#f87171", "#141a16") >= 4.5);
    assert.ok(contrastRatio("#f87171", "#1c1614") >= 4.5);
  });
});
