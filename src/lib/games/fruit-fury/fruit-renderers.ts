import { ActiveFruit, FruitHalf } from "./fruit-fury-types";

/**
 * Premium Arcade Canvas Vector Renderers for Fruit Fury.
 * Renders photorealistic volumetric silhouettes, botanical textures, glossy highlights,
 * authentic cross-sections, seeds, stems, and multi-layered sliced halves.
 */

// Draw Integrated Sleek Letter Token Badge
export function drawLetterBadge(
  ctx: CanvasRenderingContext2D,
  letter: string,
  isBomb: boolean,
  isSpecial: boolean,
): void {
  ctx.save();
  const radius = 16;

  // Outer Token Ring Glow
  ctx.shadowColor = isBomb
    ? "rgba(239, 68, 68, 0.75)"
    : isSpecial
      ? "rgba(250, 204, 21, 0.75)"
      : "rgba(0, 0, 0, 0.65)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;

  // Translucent frosted glass backing disc so the fruit's rich texture shines through!
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = isBomb
    ? "rgba(69, 10, 10, 0.88)"
    : isSpecial
      ? "rgba(30, 27, 75, 0.88)"
      : "rgba(15, 23, 42, 0.72)";
  ctx.fill();

  ctx.shadowColor = "transparent";

  // Metallic Specular Bevel
  const bevelGrad = ctx.createLinearGradient(0, -radius, 0, radius);
  if (isBomb) {
    bevelGrad.addColorStop(0, "#f87171");
    bevelGrad.addColorStop(1, "#991b1b");
  } else if (isSpecial) {
    bevelGrad.addColorStop(0, "#fef08a");
    bevelGrad.addColorStop(1, "#ca8a04");
  } else {
    bevelGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    bevelGrad.addColorStop(1, "rgba(148, 163, 184, 0.6)");
  }
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = bevelGrad;
  ctx.stroke();

  // Crisp High-Contrast Letter Glyph
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 18px 'Inter', system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;
  ctx.fillText(letter, 0, 1);

  ctx.restore();
}

/** WATERMELON: Striped green sphere with specular gloss */
export function drawWatermelon(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.save();

  // Base 3D rind with ambient curvature
  const baseGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.08, 0, 0, r);
  baseGrad.addColorStop(0, "#86efac");
  baseGrad.addColorStop(0.35, "#22c55e");
  baseGrad.addColorStop(0.75, "#15803d");
  baseGrad.addColorStop(1, "#052e16");
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = baseGrad;
  ctx.fill();

  // Wavy dark green branching tiger stripes
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = "#022c22";
  ctx.lineWidth = r * 0.20;
  ctx.lineCap = "round";

  [-0.65, -0.22, 0.22, 0.65].forEach((offset) => {
    ctx.beginPath();
    ctx.moveTo(offset * r, -r);
    ctx.bezierCurveTo(
      (offset - 0.18) * r,
      -r * 0.35,
      (offset + 0.18) * r,
      r * 0.35,
      offset * r,
      r,
    );
    ctx.stroke();
  });
  ctx.restore();

  // Woody curved stem button at top
  ctx.fillStyle = "#78350f";
  ctx.beginPath();
  ctx.arc(0, -r * 0.88, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 2-Layer Specular Gloss Sheen
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.32, r * 0.16, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.38)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(-r * 0.38, -r * 0.38, r * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.fill();

  ctx.restore();
}

/** BANANA: Curved golden crescent with 3D longitudinal facets */
export function drawBanana(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.save();
  const scale = r / 32;
  ctx.scale(scale, scale);

  // Curved banana crescent body
  ctx.beginPath();
  ctx.moveTo(-36, 16);
  ctx.bezierCurveTo(-16, -26, 20, -26, 38, 12);
  ctx.bezierCurveTo(22, -12, -10, -12, -36, 16);
  ctx.closePath();

  const banGrad = ctx.createLinearGradient(-36, 0, 38, 0);
  banGrad.addColorStop(0, "#a16207");
  banGrad.addColorStop(0.15, "#eab308");
  banGrad.addColorStop(0.5, "#fde047");
  banGrad.addColorStop(0.85, "#fef08a");
  banGrad.addColorStop(1, "#854d0e");
  ctx.fillStyle = banGrad;
  ctx.fill();

  // Longitudinal Ridge highlight line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-32, 14);
  ctx.bezierCurveTo(-14, -20, 18, -20, 34, 10);
  ctx.stroke();

  // Green stem end
  ctx.fillStyle = "#65a30d";
  ctx.beginPath();
  ctx.arc(-36, 16, 4, 0, Math.PI * 2);
  ctx.fill();

  // Dark brown tip end
  ctx.fillStyle = "#451a03";
  ctx.beginPath();
  ctx.arc(38, 12, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** STRAWBERRY: Realistic heart cone, golden achenes, leafy calyx */
export function drawStrawberry(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.save();
  const scale = r / 30;
  ctx.scale(scale, scale);

  // Tapered Heart Silhouette
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.bezierCurveTo(-30, 12, -28, -20, 0, -16);
  ctx.bezierCurveTo(28, -20, 30, 12, 0, 30);
  ctx.closePath();

  const strawGrad = ctx.createRadialGradient(-6, -6, 4, 0, 0, 34);
  strawGrad.addColorStop(0, "#f87171");
  strawGrad.addColorStop(0.4, "#ef4444");
  strawGrad.addColorStop(0.8, "#b91c1c");
  strawGrad.addColorStop(1, "#7f1d1d");
  ctx.fillStyle = strawGrad;
  ctx.fill();

  // Golden achene seeds with tiny depth shadows
  const seeds = [
    [-12, -6], [0, -7], [12, -6],
    [-17, 4], [-6, 3], [6, 3], [17, 4],
    [-11, 14], [0, 13], [11, 14],
    [-5, 22], [5, 22],
    [0, 27],
  ];

  seeds.forEach(([sx, sy]) => {
    // Drop shadow under seed
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(sx!, sy! + 0.8, 1.3, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Golden seed pip
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.ellipse(sx!, sy!, 1.2, 1.7, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Green leafy Calyx cap
  ctx.fillStyle = "#15803d";
  ctx.beginPath();
  ctx.moveTo(0, -20);
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const ax = Math.cos(a) * 16;
    const ay = Math.sin(a) * 8 - 16;
    ctx.lineTo(ax, ay);
    ctx.lineTo(0, -16);
  }
  ctx.fill();

  // Tiny woody stem
  ctx.strokeStyle = "#713f12";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(1, -26);
  ctx.stroke();

  // Specular sheen
  ctx.beginPath();
  ctx.ellipse(-10, -6, 7, 3, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.fill();

  ctx.restore();
}

/** PINEAPPLE: 3D Diamond scales with orange eyes and serrated crown */
export function drawPineapple(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.save();
  const scale = r / 38;
  ctx.scale(scale, scale);

  // Barrel Body
  ctx.beginPath();
  ctx.ellipse(0, 6, 26, 30, 0, 0, Math.PI * 2);
  const pineGrad = ctx.createRadialGradient(-8, -4, 4, 0, 6, 32);
  pineGrad.addColorStop(0, "#fef08a");
  pineGrad.addColorStop(0.3, "#facc15");
  pineGrad.addColorStop(0.7, "#d97706");
  pineGrad.addColorStop(1, "#78350f");
  ctx.fillStyle = pineGrad;
  ctx.fill();

  // 3D Diamond Scale Pattern with amber facets
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = "rgba(120, 53, 15, 0.8)";
  ctx.lineWidth = 1.6;
  for (let d = -40; d <= 40; d += 11) {
    ctx.beginPath();
    ctx.moveTo(d - 30, -30);
    ctx.lineTo(d + 30, 40);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(d + 30, -30);
    ctx.lineTo(d - 30, 40);
    ctx.stroke();
  }
  ctx.restore();

  // Spiky Crown Leaves
  ctx.fillStyle = "#15803d";
  [-14, -7, 0, 7, 14].forEach((lx) => {
    ctx.beginPath();
    ctx.moveTo(lx, -20);
    ctx.quadraticCurveTo(lx * 1.5, -42, lx * 1.8, -46);
    ctx.quadraticCurveTo(lx * 0.8, -32, lx + 4, -20);
    ctx.fill();
  });

  ctx.restore();
}

/** APPLE: Honeycrisp cleft silhouette, multi-stop crimson with blush */
export function drawApple(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.save();
  const scale = r / 34;
  ctx.scale(scale, scale);

  // Apple cleft silhouette
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.bezierCurveTo(24, -34, 34, 0, 18, 26);
  ctx.bezierCurveTo(8, 33, -8, 33, -18, 26);
  ctx.bezierCurveTo(-34, 0, -24, -34, 0, -22);
  ctx.closePath();

  const appleGrad = ctx.createRadialGradient(-10, -10, 6, 0, 0, 36);
  appleGrad.addColorStop(0, "#fca5a5");
  appleGrad.addColorStop(0.3, "#ef4444");
  appleGrad.addColorStop(0.7, "#b91c1c");
  appleGrad.addColorStop(1, "#450a0a");
  ctx.fillStyle = appleGrad;
  ctx.fill();

  // Specular sheen
  ctx.beginPath();
  ctx.ellipse(-12, -12, 10, 4.5, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
  ctx.fill();

  // Stem & Leaf
  ctx.strokeStyle = "#713f12";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.quadraticCurveTo(4, -34, 2, -38);
  ctx.stroke();

  ctx.fillStyle = "#16a34a";
  ctx.beginPath();
  ctx.ellipse(8, -32, 7, 3.5, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** ORANGE: Textured citrus orb with pores and stem button */
export function drawOrange(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.save();

  const orgGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.08, 0, 0, r);
  orgGrad.addColorStop(0, "#ffedd5");
  orgGrad.addColorStop(0.25, "#fb923c");
  orgGrad.addColorStop(0.7, "#ea580c");
  orgGrad.addColorStop(1, "#9a3412");
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = orgGrad;
  ctx.fill();

  // Green stem star button
  ctx.fillStyle = "#15803d";
  ctx.beginPath();
  ctx.arc(0, -r * 0.85, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Specular sheen
  ctx.beginPath();
  ctx.ellipse(-r * 0.32, -r * 0.32, r * 0.28, r * 0.14, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fill();

  ctx.restore();
}

/** KIWI: Fuzzy brown textured skin with micro-bristles */
export function drawKiwi(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.save();
  const kiwiGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.08, 0, 0, r);
  kiwiGrad.addColorStop(0, "#b45309");
  kiwiGrad.addColorStop(0.5, "#78350f");
  kiwiGrad.addColorStop(1, "#451a03");
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = kiwiGrad;
  ctx.fill();

  // Micro-bristle outer fuzz
  ctx.lineWidth = 2.5;
  ctx.setLineDash([2, 3]);
  ctx.strokeStyle = "#451a03";
  ctx.stroke();
  ctx.setLineDash([]);

  // Specular sheen
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, -r * 0.3, r * 0.24, r * 0.12, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
  ctx.fill();

  ctx.restore();
}

/** DRAGON FRUIT: Curled flame scales with lime-green tips */
export function drawDragonfruit(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.save();

  // Oval body
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.85, r, 0, 0, Math.PI * 2);
  const dragGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.08, 0, 0, r);
  dragGrad.addColorStop(0, "#f472b6");
  dragGrad.addColorStop(0.5, "#db2777");
  dragGrad.addColorStop(1, "#831843");
  ctx.fillStyle = dragGrad;
  ctx.fill();

  // Curled flame-like scales with lime tips
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const sx = Math.cos(angle) * (r * 0.85);
    const sy = Math.sin(angle) * r;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.quadraticCurveTo(12, 0, 16, 4);
    ctx.quadraticCurveTo(6, 6, 0, 6);
    ctx.fillStyle = "#ec4899";
    ctx.fill();

    // Lime tip
    ctx.beginPath();
    ctx.arc(14, 2, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#84cc16";
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

/** BOMB: Heavy cast-iron sphere with metallic gleam, brass cap, and spark */
export function drawBomb(
  ctx: CanvasRenderingContext2D,
  r: number,
  fusePhase: number,
): void {
  ctx.save();

  // 3D Cast-iron metallic sphere
  const ironGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.05, 0, 0, r);
  ironGrad.addColorStop(0, "#cbd5e1");
  ironGrad.addColorStop(0.2, "#64748b");
  ironGrad.addColorStop(0.6, "#1e293b");
  ironGrad.addColorStop(1, "#020617");
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = ironGrad;
  ctx.fill();

  // Yellow and black hazard warning stripe equator
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r - 3, 0, Math.PI * 2);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = "#eab308";
  ctx.setLineDash([7, 7]);
  ctx.stroke();
  ctx.restore();

  // Brass collar neck
  ctx.fillStyle = "#b45309";
  ctx.fillRect(-6, -r - 5, 12, 6);
  ctx.strokeStyle = "#fef08a";
  ctx.lineWidth = 1;
  ctx.strokeRect(-6, -r - 5, 12, 6);

  // Sinuous braided rope fuse
  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, -r - 5);
  ctx.quadraticCurveTo(10, -r - 18, 16, -r - 22);
  ctx.stroke();

  // Animated burning spark ember
  const sparkX = 16;
  const sparkY = -r - 22;
  const sparkSize = 5 + Math.sin(fusePhase * Math.PI * 2) * 3;

  ctx.shadowColor = "#f97316";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
  ctx.fill();

  // Flying spark particles
  for (let i = 0; i < 3; i++) {
    const sa = fusePhase * Math.PI * 2 + (i * Math.PI * 2) / 3;
    const sDist = 6 + (i * 4);
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(sparkX + Math.cos(sa) * sDist, sparkY + Math.sin(sa) * sDist, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Intense specular glint
  ctx.beginPath();
  ctx.ellipse(-r * 0.38, -r * 0.38, r * 0.24, r * 0.12, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.fill();

  ctx.restore();
}

/** GOLDEN DRAGON FRUIT: Shimmering gold orb with coronal flare */
export function drawGoldenFruit(
  ctx: CanvasRenderingContext2D,
  r: number,
  time: number,
): void {
  ctx.save();

  ctx.shadowColor = "#eab308";
  ctx.shadowBlur = 24;

  const goldGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  goldGrad.addColorStop(0, "#ffffff");
  goldGrad.addColorStop(0.3, "#fde047");
  goldGrad.addColorStop(0.7, "#ca8a04");
  goldGrad.addColorStop(1, "#713f12");

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = goldGrad;
  ctx.fill();

  // Rotating solar rays
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + time * 0.0015;
    ctx.strokeStyle = "rgba(254, 240, 138, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * (r * 1.3), Math.sin(a) * (r * 1.3));
    ctx.stroke();
  }

  ctx.restore();
}

/** FROST BERRY: Translucent crystalline ice with frost facets */
export function drawFrozenFruit(
  ctx: CanvasRenderingContext2D,
  r: number,
  time: number,
): void {
  ctx.save();

  ctx.shadowColor = "#38bdf8";
  ctx.shadowBlur = 18;

  const iceGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  iceGrad.addColorStop(0, "#e0f2fe");
  iceGrad.addColorStop(0.5, "#38bdf8");
  iceGrad.addColorStop(1, "#0369a1");

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = iceGrad;
  ctx.fill();

  // Frost crystal facets
  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
  ctx.lineWidth = 2;
  [0, 1, 2, 3, 4, 5].forEach((i) => {
    const a = (i * Math.PI) / 3 + time * 0.001;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  });

  ctx.restore();
}

/** Master whole fruit renderer dispatcher */
export function renderFruit(
  ctx: CanvasRenderingContext2D,
  fruit: ActiveFruit,
  time: number,
): void {
  ctx.save();
  ctx.translate(fruit.x, fruit.y);
  ctx.rotate(fruit.rotation);

  switch (fruit.type) {
    case "watermelon":
      drawWatermelon(ctx, fruit.radius);
      break;
    case "banana":
      drawBanana(ctx, fruit.radius);
      break;
    case "strawberry":
      drawStrawberry(ctx, fruit.radius);
      break;
    case "pineapple":
      drawPineapple(ctx, fruit.radius);
      break;
    case "apple":
      drawApple(ctx, fruit.radius);
      break;
    case "orange":
      drawOrange(ctx, fruit.radius);
      break;
    case "kiwi":
      drawKiwi(ctx, fruit.radius);
      break;
    case "dragonfruit":
      drawDragonfruit(ctx, fruit.radius);
      break;
    case "bomb":
      drawBomb(ctx, fruit.radius, fruit.fusePhase ?? 0);
      break;
    case "golden":
      drawGoldenFruit(ctx, fruit.radius, time);
      break;
    case "frozen":
      drawFrozenFruit(ctx, fruit.radius, time);
      break;
  }

  // Draw Letter Badge over fruit
  drawLetterBadge(
    ctx,
    fruit.letter,
    fruit.type === "bomb",
    fruit.type === "golden" || fruit.type === "frozen",
  );

  ctx.restore();
}

/** Master sliced half renderer: realistic internal anatomical flesh, seeds, pulp, and wet gloss */
export function renderSlicedHalf(
  ctx: CanvasRenderingContext2D,
  fruit: ActiveFruit,
  half: FruitHalf,
): void {
  ctx.save();
  ctx.globalAlpha = half.opacity;
  ctx.translate(half.x, half.y);
  ctx.rotate(half.angle);

  const r = fruit.radius;

  // Clip to half circle along sliceAngle
  ctx.beginPath();
  if (half.isLeft) {
    ctx.arc(0, 0, r, half.sliceAngle + Math.PI / 2, half.sliceAngle - Math.PI / 2);
  } else {
    ctx.arc(0, 0, r, half.sliceAngle - Math.PI / 2, half.sliceAngle + Math.PI / 2);
  }
  ctx.closePath();

  // Internal flesh coloring and anatomical detail for EVERY fruit
  switch (fruit.type) {
    case "watermelon": {
      // 1. Pale white-green inner rind margin (albedo)
      ctx.fillStyle = "#ecfdf5";
      ctx.fill();

      // 2. Succulent ruby red pulp
      ctx.beginPath();
      if (half.isLeft) {
        ctx.arc(0, 0, r - 5, half.sliceAngle + Math.PI / 2, half.sliceAngle - Math.PI / 2);
      } else {
        ctx.arc(0, 0, r - 5, half.sliceAngle - Math.PI / 2, half.sliceAngle + Math.PI / 2);
      }
      ctx.closePath();
      ctx.fillStyle = "#e11d48";
      ctx.fill();

      // 3. Realistic black teardrop seeds with white specular highlights
      ctx.fillStyle = "#09090b";
      [-12, -4, 4, 12].forEach((ox, idx) => {
        const seedY = (half.isLeft ? -1 : 1) * (8 + (idx % 2) * 5);
        ctx.beginPath();
        ctx.ellipse(ox, seedY, 2.2, 3.8, 0, 0, Math.PI * 2);
        ctx.fill();
        // White gloss dot
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.fillRect(ox - 0.5, seedY - 1.5, 1, 1);
        ctx.fillStyle = "#09090b";
      });
      break;
    }

    case "apple": {
      // 1. Crimson peel outer margin
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "#dc2626";
      ctx.stroke();

      // 2. Crisp creamy-white flesh with central core glow
      ctx.fillStyle = "#fefce8";
      ctx.fill();

      // 3. Central star-shaped seed chamber
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. Dark brown pointed apple pip
      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.ellipse(0, half.isLeft ? -3 : 3, 2, 4, half.isLeft ? -0.3 : 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "orange": {
      // 1. White inner pith rim
      ctx.fillStyle = "#ffedd5";
      ctx.fill();

      // 2. Translucent wedge pulp segments
      ctx.beginPath();
      if (half.isLeft) {
        ctx.arc(0, 0, r - 4, half.sliceAngle + Math.PI / 2, half.sliceAngle - Math.PI / 2);
      } else {
        ctx.arc(0, 0, r - 4, half.sliceAngle - Math.PI / 2, half.sliceAngle + Math.PI / 2);
      }
      ctx.closePath();
      ctx.fillStyle = "#f97316";
      ctx.fill();

      // 3. Radial segment divider lines (membranes)
      ctx.strokeStyle = "rgba(255, 237, 213, 0.85)";
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 6; i++) {
        const a = half.sliceAngle + (i * Math.PI) / 5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * (r - 4), Math.sin(a) * (r - 4));
        ctx.stroke();
      }

      // 4. Central pale core
      ctx.fillStyle = "#ffedd5";
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "kiwi": {
      // 1. Brown fuzzy skin edge
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "#78350f";
      ctx.stroke();

      // 2. Radiant emerald lime-green pulp
      ctx.fillStyle = "#65a30d";
      ctx.fill();

      // 3. Creamy pale sunburst core
      ctx.fillStyle = "#ecfccb";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
      ctx.fill();

      // 4. Radial white fiber rays
      ctx.strokeStyle = "rgba(236, 252, 203, 0.6)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI * 2) / 12;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * (r * 0.65), Math.sin(a) * (r * 0.65));
        ctx.stroke();
      }

      // 5. Ring of shiny black micro-seeds
      ctx.fillStyle = "#09090b";
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI * 2) / 8 + 0.2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * (r * 0.48), Math.sin(a) * (r * 0.48), 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case "strawberry": {
      // 1. Crimson skin margin
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#dc2626";
      ctx.stroke();

      // 2. Ruby flesh
      ctx.fillStyle = "#ef4444";
      ctx.fill();

      // 3. Pale radiating fibrous heart center
      ctx.fillStyle = "#fee2e2";
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.25, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. Subtle red fiber spokes
      ctx.strokeStyle = "#fca5a5";
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * (r * 0.7), Math.sin(a) * (r * 0.7));
        ctx.stroke();
      }
      break;
    }

    case "banana": {
      // 1. Yellow peel ring
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "#eab308";
      ctx.stroke();

      // 2. Creamy ivory banana flesh
      ctx.fillStyle = "#fefce8";
      ctx.fill();

      // 3. Soft yellow center zone
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // 4. Iconic tripartite seed speckles
      ctx.fillStyle = "#713f12";
      [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].forEach((a) => {
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 4, Math.sin(a) * 4, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case "pineapple": {
      // 1. Golden diamond rind edge
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "#b45309";
      ctx.stroke();

      // 2. Fibrous golden-yellow flesh
      ctx.fillStyle = "#facc15";
      ctx.fill();

      // 3. Circular fibrous central core
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // 4. Radiating fiber lines
      ctx.strokeStyle = "rgba(180, 83, 9, 0.35)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r * 0.35), Math.sin(a) * (r * 0.35));
        ctx.lineTo(Math.cos(a) * (r * 0.85), Math.sin(a) * (r * 0.85));
        ctx.stroke();
      }
      break;
    }

    case "dragonfruit": {
      // 1. Magenta peel edge
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "#db2777";
      ctx.stroke();

      // 2. Snowy-white pulp
      ctx.fillStyle = "#f8fafc";
      ctx.fill();

      // 3. Densely speckled black seeds
      ctx.fillStyle = "#09090b";
      [
        [-10, -5], [-3, -9], [6, -7], [11, -3],
        [-8, 3], [-1, 2], [7, 4],
        [-6, 9], [3, 8], [9, 10],
      ].forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(px!, py!, 1.4, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case "golden": {
      // Golden dragon fruit core
      ctx.fillStyle = "#fef08a";
      ctx.fill();
      ctx.strokeStyle = "#ca8a04";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "frozen": {
      // Glacial crystal cross-section
      ctx.fillStyle = "#bae6fd";
      ctx.fill();
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1.5;
      [0, Math.PI / 3, (2 * Math.PI) / 3].forEach((a) => {
        ctx.beginPath();
        ctx.moveTo(-Math.cos(a) * r, -Math.sin(a) * r);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.stroke();
      });
      break;
    }

    default: {
      ctx.fillStyle = "#fef08a";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      break;
    }
  }

  // Glistening wet surface sheen across the flat cut plane
  ctx.beginPath();
  const cutL = r * 1.05;
  ctx.moveTo(-Math.cos(half.sliceAngle) * cutL, -Math.sin(half.sliceAngle) * cutL);
  ctx.lineTo(Math.cos(half.sliceAngle) * cutL, Math.sin(half.sliceAngle) * cutL);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.restore();
}
