"use client";

import { useEffect, useRef } from "react";
import {
  createRacerFrameSnapshot,
  advanceRacerRoadOffset,
  projectRacerRivals,
  projectRacerRoad,
  RACER_PLAYER_DEPTH,
  RACER_VIEW_DISTANCE,
  RACER_WORLD_LENGTH,
  type RacerFrameInput,
  type RacerFrameSnapshot,
  type RoadProjection,
} from "@/lib/games/racer/presentation";

export interface GhostRacerSceneProps extends RacerFrameInput {
  className?: string;
}

type Point = readonly [number, number];
type Context = CanvasRenderingContext2D;

interface SceneMotion {
  time: number;
  speed: number;
  energy: number;
  spark: number;
  roadOffset: number;
}

const IDLE_FRAME: RacerFrameInput = {
  phase: "idle", progress: 0, ghostProgress: 0, elapsedMs: 0,
  rivals: [], wpm: 0, errors: 0, reducedMotion: false,
};

function polygon(ctx: Context, points: readonly Point[], fill: string, stroke?: string) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function line(ctx: Context, points: readonly Point[], color: string, width = 1) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function ellipse(ctx: Context, x: number, y: number, rx: number, ry: number, color: string) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function glow(ctx: Context, x: number, y: number, radius: number, color: string) {
  if (radius <= 0) return;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "transparent");
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

/** Fixed arithmetic noise keeps scenery stable across renders and hydration. */
function noise(index: number) {
  const n = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function drawSky(ctx: Context, w: number, h: number, frame: RacerFrameSnapshot) {
  const { sector } = frame;
  const horizon = projectRacerRoad(frame.progress, 1, w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.65);
  sky.addColorStop(0, sector.sky);
  sky.addColorStop(0.62, sector.horizon);
  sky.addColorStop(1, "#070f20");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  if (sector.id === "tunnel") {
    // An enclosed vault, with the light well pointing into the next bend.
    glow(ctx, horizon.x, horizon.y, w * 0.26, "#7669b53d");
    polygon(ctx, [[0, 0], [w, 0], [w, h * 0.12], [horizon.x, horizon.y], [0, h * 0.12]], "#0b1020");
    polygon(ctx, [[0, h * 0.12], [horizon.x, horizon.y], [0, h]], "#151a30");
    polygon(ctx, [[w, h * 0.12], [horizon.x, horizon.y], [w, h]], "#111a2d");
    line(ctx, [[0, h * 0.08], [horizon.x, horizon.y], [w, h * 0.08]], "#292d48", 2);
    return;
  }

  // Most contrast sits below the HUD's upper quarter.
  const moonX = w * 0.78 - horizon.bend * w * 0.025;
  const moonY = h * 0.25;
  const moonRadius = Math.min(w, h) * 0.032;
  glow(ctx, moonX, moonY, moonRadius * 4.5, "#b0d2ff16");
  ellipse(ctx, moonX, moonY, moonRadius, moonRadius, "#d5e5ffb3");
  ellipse(ctx, moonX - moonRadius * 0.32, moonY - moonRadius * 0.2, moonRadius * 0.92, moonRadius * 0.92, sector.sky);

  for (let i = 0; i < 32; i++) {
    const x = noise(i + 40) * w;
    const y = (0.1 + noise(i + 80) * 0.23) * h;
    ctx.fillStyle = `rgba(174, 208, 245, ${0.1 + noise(i) * 0.28})`;
    ctx.fillRect(x, y, i % 5 === 0 ? 1.5 : 1, 1);
  }

  const bridge = sector.id === "bridge";
  const skylineY = h * (bridge ? 0.425 : 0.435);
  glow(ctx, horizon.x, skylineY, w * 0.35, bridge ? "#2de3d71b" : "#ff6be41a");

  for (let layer = 0; layer < 2; layer++) {
    const count = layer === 0 ? 36 : 23;
    for (let i = -1; i <= count; i++) {
      const n = i + layer * 91;
      const bw = w / count * (0.68 + noise(n + 6) * 0.55);
      const x = (i / count) * w - horizon.bend * w * (layer ? 0.022 : 0.01);
      const bh = h * (0.035 + noise(n + 11) * (bridge ? 0.095 : 0.21)) * (layer ? 1 : 0.72);
      const y = skylineY - bh;
      ctx.fillStyle = layer ? "#080f22" : "#162036";
      ctx.fillRect(x, y, bw, bh);
      if (!bridge && i % 4 === 0) {
        line(ctx, [[x + bw * 0.58, y], [x + bw * 0.58, y - h * 0.026]], "#664872", 1);
        ellipse(ctx, x + bw * 0.58, y - h * 0.026, 1.2, 1.2, "#f796d4");
      }
      if (layer === 0) continue;
      // Small, irregular lit windows rather than a flat skyline silhouette.
      for (let row = 0; row < 11; row++) {
        for (let col = 0; col < 4; col++) {
          if (noise(n * 31 + row * 7 + col) < 0.52) continue;
          ctx.fillStyle = row % 4 === 0 ? "#96619465" : bridge ? "#68b4c245" : "#85c8dd50";
          ctx.fillRect(x + bw * (0.15 + col * 0.2), y + 5 + row * bh / 12, Math.max(1, bw * 0.055), Math.max(1, h * 0.002));
        }
      }
      if (!bridge && i % 5 === 1) {
        ctx.fillStyle = "#df7fc484";
        ctx.fillRect(x + bw - 3, y + bh * 0.15, 2, bh * 0.57);
      }
    }
  }

  const ground = ctx.createLinearGradient(0, skylineY, 0, h);
  ground.addColorStop(0, bridge ? "#0a2635" : "#121629");
  ground.addColorStop(1, "#040a14");
  ctx.fillStyle = ground;
  ctx.fillRect(0, skylineY, w, h - skylineY);

  if (bridge) {
    // Horizontal reflections make the open-water bridge read differently.
    for (let i = 0; i < 50; i++) {
      const y = skylineY + noise(i + 320) * h * 0.5;
      const x = noise(i + 160) * w;
      ctx.fillStyle = i % 3 === 0 ? "#58c5d015" : "#998dcb12";
      ctx.fillRect(x, y, w * (0.012 + noise(i) * 0.06), 1 + (y / h) * 2);
    }
  }
}

function roadBand(ctx: Context, far: RoadProjection, near: RoadProjection, left: number, right: number, color: string) {
  polygon(ctx, [
    [far.x + far.halfWidth * left, far.y], [far.x + far.halfWidth * right, far.y],
    [near.x + near.halfWidth * right, near.y], [near.x + near.halfWidth * left, near.y],
  ], color);
}

function drawRoad(ctx: Context, w: number, h: number, frame: RacerFrameSnapshot, roadOffset: number) {
  const project = (depth: number) => projectRacerRoad(frame.progress, depth, w, h);
  const count = 96;
  let far = project(1);
  for (let i = count - 1; i >= 0; i--) {
    const z = i / count;
    const near = project(z);
    const alternating = Math.floor((roadOffset + z * RACER_VIEW_DISTANCE) / 90) % 2 === 0;
    roadBand(ctx, far, near, -1.13, 1.13, alternating ? "#374559" : "#1b273b");
    roadBand(ctx, far, near, -1, 1, alternating ? "#111b2c" : "#101a2a");
    roadBand(ctx, far, near, -0.997, -0.98, "#9af0ee8a");
    roadBand(ctx, far, near, 0.98, 0.997, "#9af0ee8a");
    // A broad, faint reflection down the center of the rain-dark asphalt.
    roadBand(ctx, far, near, -0.17, 0.17, "#70bfff05");
    roadBand(ctx, far, near, -0.052, 0.052, "#99d5ff04");
    far = near;
  }

  const firstDash = Math.floor(roadOffset / 155) * 155;
  for (let world = firstDash; world < roadOffset + RACER_VIEW_DISTANCE; world += 155) {
    const nearZ = Math.max(0, (world - roadOffset) / RACER_VIEW_DISTANCE);
    const farZ = Math.min(1, (world + 79 - roadOffset) / RACER_VIEW_DISTANCE);
    if (farZ <= 0) continue;
    const near = project(nearZ);
    const far = project(farZ);
    for (const lane of [-1 / 3, 1 / 3]) {
      roadBand(ctx, far, near, lane - 0.009, lane + 0.009, "#c0cedb9a");
      roadBand(ctx, far, near, lane - 0.016, lane + 0.016, "#a2f2ff07");
    }
  }

  // Double guardrails follow exactly the same projection as the road surface.
  for (const side of [-1, 1]) {
    const upper: Point[] = [];
    const lower: Point[] = [];
    for (let i = 0; i <= 64; i++) {
      const p = project(i / 64);
      upper.push([p.x + p.halfWidth * side * 1.09, p.y - p.halfWidth * 0.055]);
      lower.push([p.x + p.halfWidth * side * 1.09, p.y - p.halfWidth * 0.025]);
    }
    line(ctx, upper, "#000815", Math.max(3, w * 0.008));
    line(ctx, upper, frame.sector.accent + "b0", Math.max(1, w * 0.002));
    line(ctx, lower, "#7997b64d", Math.max(1, w * 0.003));
  }
}

function drawLamp(ctx: Context, p: RoadProjection, side: number, accent: string, w: number) {
  if (p.scale < 0.008) return;
  const x = p.x + side * p.halfWidth * 1.23;
  const top = p.y - p.halfWidth * 0.77;
  const arm = p.halfWidth * 0.2;
  line(ctx, [[x, p.y], [x, top], [x - side * arm, top - p.halfWidth * 0.018]], "#050d1c", Math.max(1, w * p.scale * 0.006));
  line(ctx, [[x - side * 2 * p.scale, p.y], [x - side * 2 * p.scale, top]], "#7387ab70", Math.max(0.6, w * p.scale * 0.0015));
  line(ctx, [[x - side * arm, top], [x - side * arm * 0.35, top]], accent, Math.max(1, w * p.scale * 0.004));
  glow(ctx, x - side * arm * 0.75, top, p.halfWidth * 0.17, accent + "20");
  ellipse(ctx, x - side * p.halfWidth * 0.25, p.y + 1, p.halfWidth * 0.18, p.halfWidth * 0.022, accent + "0a");
}

function drawBridgeTower(ctx: Context, p: RoadProjection) {
  if (p.scale < 0.01) return;
  const half = p.halfWidth * 1.26;
  const top = p.y - half * 1.25;
  const beam = half * 0.035;
  const color = "#344363";
  for (const side of [-1, 1]) {
    polygon(ctx, [[p.x + side * half - beam, p.y], [p.x + side * half - beam, top], [p.x + side * half + beam, top], [p.x + side * half + beam, p.y]], color, "#788baf55");
    line(ctx, [[p.x + side * half, p.y], [p.x + side * half, top]], "#bdabff99", Math.max(0.7, p.scale * 3));
    // Suspension cables fan into the deck; their parabolic profile reads at speed.
    for (let cable = 1; cable <= 4; cable++) {
      const cx = p.x + side * half * (1 + cable * 0.36);
      ctx.beginPath();
      ctx.moveTo(p.x + side * half, top + half * 0.13);
      ctx.quadraticCurveTo(cx, top + half * 0.85, cx + side * half * 0.2, p.y + half * 0.27);
      ctx.strokeStyle = "#879ebf65";
      ctx.lineWidth = Math.max(0.5, p.scale * 2);
      ctx.stroke();
    }
  }
  ctx.fillStyle = color;
  ctx.fillRect(p.x - half, top, half * 2, beam * 2);
  line(ctx, [[p.x - half, top + beam * 2], [p.x + half, top + beam * 2]], "#a5a0fbbb", Math.max(1, p.scale * 3));
}

function drawTunnelRib(ctx: Context, p: RoadProjection, index: number) {
  if (p.scale < 0.009) return;
  const radius = p.halfWidth * 1.19;
  const points: Point[] = [
    [p.x - radius, p.y], [p.x - radius, p.y - radius * 0.6],
    [p.x - radius * 0.64, p.y - radius * 1.14], [p.x + radius * 0.64, p.y - radius * 1.14],
    [p.x + radius, p.y - radius * 0.6], [p.x + radius, p.y],
  ];
  line(ctx, points, "#020815", Math.max(2, radius * 0.055));
  line(ctx, points, "#59638470", Math.max(1, radius * 0.035));
  const light = index % 3 === 0 ? "#d193fb" : "#84dbff";
  for (const side of [-1, 1]) {
    line(ctx, [
      [p.x + side * radius * 0.992, p.y - radius * 0.34],
      [p.x + side * radius * 0.992, p.y - radius * 0.6],
      [p.x + side * radius * 0.68, p.y - radius * 1.08],
    ], light + "a6", Math.max(1, radius * 0.016));
  }
  line(ctx, [[p.x - radius * 0.3, p.y - radius * 1.127], [p.x + radius * 0.3, p.y - radius * 1.127]], "#dceaffd0", Math.max(1, radius * 0.018));
}

function drawCitySign(ctx: Context, p: RoadProjection, index: number) {
  if (p.scale < 0.07) return;
  const side = index % 2 ? -1 : 1;
  const x = p.x + side * p.halfWidth * 1.42;
  const y = p.y - p.halfWidth * 0.3;
  const bw = p.halfWidth * 0.29;
  const bh = p.halfWidth * 0.18;
  ctx.fillStyle = "#11152a";
  ctx.fillRect(x - bw / 2, y - bh, bw, bh);
  ctx.strokeStyle = "#d577c78a";
  ctx.lineWidth = Math.max(1, p.scale * 2);
  ctx.strokeRect(x - bw / 2, y - bh, bw, bh);
  ctx.font = `700 ${Math.max(5, bw * 0.14)}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#f4bbdf";
  ctx.fillText(index % 2 ? "NIGHT RUN" : "NEON / 01", x, y - bh * 0.53, bw * 0.9);
  line(ctx, [[x - bw * 0.32, y - bh * 0.26], [x + bw * 0.32, y - bh * 0.26]], "#b6b0ff", Math.max(1, p.scale * 2));
}

function drawTrackside(ctx: Context, w: number, h: number, frame: RacerFrameSnapshot, roadOffset: number) {
  const spacing = frame.sector.id === "tunnel" ? 190 : 265;
  const first = Math.floor(roadOffset / spacing);
  const last = Math.ceil((roadOffset + RACER_VIEW_DISTANCE) / spacing);
  for (let i = last; i >= first; i--) {
    const z = (i * spacing - roadOffset) / RACER_VIEW_DISTANCE;
    if (z <= 0 || z >= 1) continue;
    const p = projectRacerRoad(frame.progress, z, w, h);
    if (frame.sector.id === "tunnel") {
      drawTunnelRib(ctx, p, i);
    } else {
      if (frame.sector.id === "bridge" && i % 3 === 0) drawBridgeTower(ctx, p);
      drawLamp(ctx, p, -1, frame.sector.accent, w);
      drawLamp(ctx, p, 1, frame.sector.secondary, w);
      if (frame.sector.id === "city" && i % 3 === 0) drawCitySign(ctx, p, i);
    }
    for (const side of [-1, 1]) {
      const x = p.x + side * p.halfWidth * 1.09;
      line(ctx, [[x, p.y], [x, p.y - p.halfWidth * 0.063]], "#88a9c978", Math.max(1, p.scale * w * 0.003));
    }
  }
}

function drawFinish(ctx: Context, w: number, h: number, frame: RacerFrameSnapshot) {
  const z = RACER_PLAYER_DEPTH + (1 - frame.progress) * RACER_WORLD_LENGTH / RACER_VIEW_DISTANCE;
  if (z >= 0.86) return;
  const p = projectRacerRoad(frame.progress, z, w, h);
  const left = p.x - p.halfWidth * 1.02;
  const right = p.x + p.halfWidth * 1.02;
  const top = p.y - p.halfWidth * 0.91;
  const bar = Math.max(10, p.halfWidth * 0.2);
  ctx.fillStyle = "#10162b";
  ctx.fillRect(left - p.halfWidth * 0.035, top, p.halfWidth * 0.045, p.y - top);
  ctx.fillRect(right - p.halfWidth * 0.01, top, p.halfWidth * 0.045, p.y - top);
  ctx.fillRect(left, top, right - left, bar);
  ctx.strokeStyle = "#b6ffd5";
  ctx.lineWidth = Math.max(1, p.scale * 2.5);
  ctx.strokeRect(left, top, right - left, bar);
  line(ctx, [[left, top], [left, p.y]], "#6ef7c8", Math.max(1, p.scale * 3));
  line(ctx, [[right, top], [right, p.y]], "#6ef7c8", Math.max(1, p.scale * 3));
  ctx.fillStyle = "#effff8";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${Math.max(9, bar * 0.59)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText("F I N I S H", p.x, top + bar * 0.52, p.halfWidth * 1.15);
  ctx.textBaseline = "alphabetic";
  const tile = bar * 0.23;
  for (const side of [-1, 1]) {
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 3; row++) {
        if ((col + row) % 2) continue;
        ctx.fillRect(p.x + side * p.halfWidth * 0.77 + col * tile - tile * 1.5, top + bar * 0.15 + row * tile, tile, tile);
      }
    }
  }
  const near = projectRacerRoad(frame.progress, Math.max(0, z - 0.01), w, h);
  for (let i = 0; i < 14; i++) {
    roadBand(ctx, p, near, -1 + i / 7, -1 + (i + 1) / 7, i % 2 ? "#141c2b" : "#e5f9f3b0");
  }
}

/** A rear-view sport bike: tire, swingarm, fairing, rider and taillight. */
function drawBike(
  ctx: Context,
  x: number,
  y: number,
  size: number,
  lean: number,
  color: string,
  ghost: boolean,
  speed: number,
  name?: string,
  finished = false,
) {
  if (size < 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.rotate(lean);
  if (ghost) ctx.globalAlpha = 0.58;
  const light = ghost ? "#c7b1ff" : color;
  ellipse(ctx, 0, 0, 40, 9, ghost ? "#bea8fc18" : "#00030bc9");
  glow(ctx, 0, -4, 53, ghost ? "#b18bff36" : "#23e6d321");
  ellipse(ctx, 0, -3, 34, 5, ghost ? "#b998ff22" : "#57f5df18");

  // A narrow glimpse of the front tire below the steering column.
  ellipse(ctx, 0, -84, 7, 20, "#070c19");
  // Rear tire is intentionally substantial, with a lit rim and diagonal tread.
  ellipse(ctx, 0, -24, 14, 28, ghost ? "#302746" : "#050914");
  ctx.strokeStyle = ghost ? "#bba8e688" : "#475265";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  line(ctx, [[-6, -46], [-7, -26], [-5, -5]], "#8293aa70", 2);
  for (let i = 0; i < 5; i++) {
    line(ctx, [[-7, -39 + i * 7], [-1, -36 + i * 7], [6, -40 + i * 7]], "#7c8a9a35", 1.1);
  }
  polygon(ctx, [[-21, -52], [-16, -13], [-8, -12], [-10, -51]], "#354155", "#647891");
  polygon(ctx, [[21, -52], [16, -13], [8, -12], [10, -51]], "#1b2c43", "#647891");

  // Boots, bent knees and arms wrap around the machine rather than floating.
  for (const side of [-1, 1]) {
    polygon(ctx, [[side * 12, -92], [side * 26, -80], [side * 22, -44], [side * 14, -39], [side * 11, -62]], ghost ? "#777694" : "#172638", "#819cb747");
    polygon(ctx, [[side * 16, -47], [side * 26, -47], [side * 28, -34], [side * 17, -33]], "#080f1d", "#566980");
    line(ctx, [[side * 19, -111], [side * 30, -96], [side * 33, -83]], ghost ? "#b7afd2" : "#34435c", 10);
    line(ctx, [[side * 29, -87], [side * 38, -85]], "#b5c4d2", 3);
    ellipse(ctx, side * 35, -83, 5, 4, "#101a29");
  }

  const paint = ctx.createLinearGradient(-28, 0, 28, 0);
  paint.addColorStop(0, ghost ? "#706395" : color);
  paint.addColorStop(0.28, ghost ? "#dfd5ff" : "#f2fbff");
  paint.addColorStop(0.48, ghost ? "#918ab1" : color);
  paint.addColorStop(0.73, ghost ? "#c0a9e4" : "#176177");
  paint.addColorStop(1, ghost ? "#5a5379" : "#08192d");
  ctx.beginPath();
  ctx.moveTo(-17, -88);
  ctx.lineTo(-27, -68);
  ctx.lineTo(-23, -42);
  ctx.quadraticCurveTo(0, -22, 23, -42);
  ctx.lineTo(27, -68);
  ctx.lineTo(17, -88);
  ctx.closePath();
  ctx.fillStyle = paint;
  ctx.fill();
  ctx.strokeStyle = ghost ? "#e3d7ff" : "#9eeee8";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  polygon(ctx, [[-7, -85], [-9, -54], [0, -38], [9, -54], [7, -85]], "#102032");
  line(ctx, [[-24, -67], [-19, -45], [-9, -38]], light, 2);
  line(ctx, [[24, -67], [19, -45], [9, -38]], light, 2);
  if (ghost) {
    // Split luminous fins distinguish the apparition even without color.
    polygon(ctx, [[-22, -74], [-37, -67], [-31, -48], [-24, -54]], "#bda8f329", "#d5c1ff");
    polygon(ctx, [[22, -74], [37, -67], [31, -48], [24, -54]], "#bda8f329", "#d5c1ff");
  } else {
    ellipse(ctx, -25, -37, 5, 8, "#64768c");
    ellipse(ctx, -25, -36, 3, 5, "#080e1c");
    ellipse(ctx, 25, -37, 5, 8, "#64768c");
    ellipse(ctx, 25, -36, 3, 5, "#080e1c");
  }

  const tuck = speed * 2;
  const suit = ctx.createLinearGradient(-24, -114, 22, -70);
  suit.addColorStop(0, ghost ? "#aaa2c7" : "#45647b");
  suit.addColorStop(0.48, ghost ? "#635778" : "#192d42");
  suit.addColorStop(1, ghost ? "#8e7caa" : "#0a192c");
  ctx.beginPath();
  ctx.moveTo(-11, -118 + tuck);
  ctx.quadraticCurveTo(-25, -116 + tuck, -24, -105);
  ctx.lineTo(-14, -74);
  ctx.quadraticCurveTo(0, -65, 14, -74);
  ctx.lineTo(24, -105);
  ctx.quadraticCurveTo(25, -116 + tuck, 11, -118 + tuck);
  ctx.closePath();
  ctx.fillStyle = suit;
  ctx.fill();
  ctx.strokeStyle = "#b1d6df69";
  ctx.lineWidth = 1;
  ctx.stroke();
  line(ctx, [[-20, -109], [-14, -98], [-11, -80]], light + "ac", 2.3);
  line(ctx, [[20, -109], [14, -98], [11, -80]], light + "ac", 2.3);
  polygon(ctx, [[0, -111], [-5, -102], [0, -88], [5, -102]], ghost ? "#eee5ff" : "#90fff0");

  // Helmet dome and rear visor trim, above a short dark collar.
  ellipse(ctx, 0, -118 + tuck, 10, 6, "#08101e");
  const helmet = ctx.createLinearGradient(-14, -144, 15, -113);
  helmet.addColorStop(0, ghost ? "#e6e1ff" : "#bdd6e8");
  helmet.addColorStop(0.27, ghost ? "#aca2d2" : "#586d88");
  helmet.addColorStop(0.72, ghost ? "#685777" : "#101d31");
  helmet.addColorStop(1, ghost ? "#ad95d7" : "#2d455d");
  ctx.beginPath();
  ctx.ellipse(0, -131 + tuck, 15, 16, 0, 0, Math.PI * 2);
  ctx.fillStyle = helmet;
  ctx.fill();
  ctx.strokeStyle = ghost ? "#ecddff" : "#94c4d3";
  ctx.stroke();
  line(ctx, [[-13, -127 + tuck], [-8, -124 + tuck], [8, -124 + tuck], [13, -127 + tuck]], light, 2.2);
  line(ctx, [[-5, -143 + tuck], [0, -146 + tuck], [6, -142 + tuck]], "#effeff80", 1.4);

  const tail = ghost ? "#e3c5ff" : color;
  glow(ctx, 0, -48, 32, ghost ? "#c494ff25" : "#ff47782d");
  line(ctx, [[-21, -53], [-13, -48], [-4, -49]], tail, 3.2);
  line(ctx, [[21, -53], [13, -48], [4, -49]], tail, 3.2);
  ctx.fillStyle = "#dceefc";
  ctx.fillRect(-7, -33, 14, 5);

  if (ghost && size > 0.19) {
    ctx.globalAlpha = 0.8;
    ctx.font = "600 10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#e0d5ff";
    ctx.fillText("G H O S T", 0, -163);
    line(ctx, [[-18, -155], [18, -155]], "#d2b8ff88", 1);
  }
  if (!ghost && name && size > 0.2) {
    ctx.globalAlpha = 0.86;
    ctx.font = `700 ${Math.max(7, 10 / Math.max(0.55, size))}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillStyle = color;
    ctx.fillText(name.toUpperCase(), 0, -163, 100);
    line(ctx, [[-19, -155], [19, -155]], `${color}99`, 1);
  }
  if (finished && size > 0.18) {
    ctx.globalAlpha = 0.95;
    ctx.font = `800 ${Math.max(7, 9 / Math.max(0.55, size))}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#f7fff8";
    ctx.fillText("FINISHED", 0, -173, 100);
    ctx.strokeStyle = "#f7fff8";
    ctx.lineWidth = 2;
    ctx.strokeRect(-18, -158, 36, 5);
    for (let i = 0; i < 6; i++) {
      if (i % 2 === 0) ctx.fillRect(-18 + i * 6, -158, 6, 2.5);
    }
  }
  ctx.restore();
}

function drawSpeed(ctx: Context, w: number, h: number, frame: RacerFrameSnapshot, motion: SceneMotion) {
  const intensity = motion.speed * Math.min(1, motion.energy * 2.5);
  if (frame.reducedMotion || intensity < 0.05 || frame.phase !== "racing") return;
  const vanishing = projectRacerRoad(frame.progress, 1, w, h);
  ctx.save();
  ctx.globalAlpha = intensity * 0.18;
  for (let i = 0; i < 12; i++) {
    const t = (noise(i + 91) + motion.time * (0.25 + intensity * 0.4)) % 1;
    const side = i % 2 ? 1 : -1;
    const ex = w * 0.5 + side * w * (0.65 + noise(i) * 0.25);
    const ey = h * (0.69 + noise(i + 20) * 0.7);
    const far = 0.26 + t * 0.74;
    const near = Math.min(1.15, far + 0.02 + intensity * 0.055);
    line(ctx, [
      [vanishing.x + (ex - vanishing.x) * far, vanishing.y + (ey - vanishing.y) * far],
      [vanishing.x + (ex - vanishing.x) * near, vanishing.y + (ey - vanishing.y) * near],
    ], "#b5e6ff", 0.8 + t);
  }
  ctx.restore();
}

function drawSparks(ctx: Context, x: number, y: number, size: number, remaining: number) {
  if (remaining <= 0) return;
  const t = 1 - remaining / 0.34;
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - t);
  for (let i = 0; i < 13; i++) {
    const direction = i % 2 ? 1 : -1;
    const dx = direction * (8 + t * (25 + noise(i) * 75)) * size;
    const dy = (-15 - Math.sin(t * Math.PI) * (15 + noise(i + 90) * 35) + t * 34) * size;
    line(ctx, [[x + dx, y + dy], [x + dx + direction * (3 + t * 8) * size, y + dy + 3 * size]], i % 3 ? "#ffc374" : "#fff2cf", 1.4 * size);
  }
  ctx.restore();
}

interface RenderBike {
  projection: RoadProjection;
  depth: number;
  color: string;
  ghost: boolean;
  name?: string;
  finished?: boolean;
  player?: boolean;
}

function paintScene(ctx: Context, w: number, h: number, frame: RacerFrameSnapshot, motion: SceneMotion) {
  ctx.clearRect(0, 0, w, h);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  drawSky(ctx, w, h, frame);
  drawRoad(ctx, w, h, frame, motion.roadOffset);
  drawTrackside(ctx, w, h, frame, motion.roadOffset);
  drawFinish(ctx, w, h, frame);
  drawSpeed(ctx, w, h, frame, motion);

  const player = projectRacerRoad(frame.progress, RACER_PLAYER_DEPTH, w, h, -0.23);
  const rivals = projectRacerRivals(frame.progress, frame.rivals, w, h);
  const bikeSize = Math.min(h * 0.258, w * 0.35) / 150;
  const intensity = frame.reducedMotion ? 0 : motion.speed * Math.min(1, motion.energy * 2.5);
  const bob = Math.sin(motion.time * (8 + intensity * 9)) * intensity * 0.75;
  const renderBikes: RenderBike[] = [
    { projection: player, depth: player.depth, color: "#69f7e4", ghost: false, player: true },
    ...rivals.filter((rival) => rival.visible).map((rival): RenderBike => ({
      projection: rival,
      depth: rival.depth,
      color: rival.color,
      ghost: rival.kind === "ghost",
      name: rival.name,
      finished: rival.finished,
    })),
  ];
  // Farther bikes paint first. Sorting from actual progress/depth makes an overtake
  // visible without changing any race distance or timing state.
  renderBikes.sort((a, b) => b.depth - a.depth || (a.player ? 1 : 0) - (b.player ? 1 : 0));
  for (const bike of renderBikes) {
    const scale = bike.player ? bikeSize : bikeSize * bike.projection.scale / Math.max(0.001, player.scale);
    const bikeBob = bike.player ? bob : 0;
    drawBike(
      ctx,
      bike.projection.x,
      bike.projection.y + bikeBob,
      scale,
      -bike.projection.bend * 0.105,
      bike.color,
      bike.ghost,
      intensity,
      bike.name,
      bike.finished,
    );
  }
  if (!frame.reducedMotion) drawSparks(ctx, player.x, player.y, bikeSize, motion.spark);

  // Quiet upper edge for the separate HUD; a soft lens vignette anchors the bike.
  const shade = ctx.createLinearGradient(0, 0, 0, h);
  shade.addColorStop(0, "#020612a6");
  shade.addColorStop(0.25, "#02061200");
  shade.addColorStop(0.72, "#02061200");
  shade.addColorStop(1, "#0206128c");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
}

/** Decorative world only. The parent owns all race state, input and accessible HUD. */
export function GhostRacerScene({ className, ...input }: GhostRacerSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<{ update: (frame: RacerFrameInput) => void } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    let frame = createRacerFrameSnapshot(IDLE_FRAME);
    const motion: SceneMotion = { time: 0, speed: 0, energy: 0, spark: 0, roadOffset: 0 };
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let lastTime: number | null = null;
    let disposed = false;

    const shouldAnimate = () => !disposed && !document.hidden && frame.phase === "racing" && !frame.reducedMotion && width > 0 && height > 0;
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      lastTime = null;
    };
    const render = (now: number) => {
      raf = 0;
      if (disposed || document.hidden || width <= 0 || height <= 0) { lastTime = null; return; }
      const animate = shouldAnimate();
      const dt = animate && lastTime !== null ? Math.min(0.05, Math.max(0, (now - lastTime) / 1000)) : 0;
      lastTime = animate ? now : null;
      if (animate) {
        motion.time += dt;
        motion.speed += (frame.speed - motion.speed) * (1 - Math.exp(-dt * 7));
        motion.energy = Math.max(0, motion.energy - dt * 1.7);
        motion.spark = Math.max(0, motion.spark - dt);
        // The road keeps coasting at the live pace even during a typing lull.
        // This is presentation-only: bikes, standings and replay distance still
        // use the exact strict-prefix progress supplied by the race controller.
        motion.roadOffset = advanceRacerRoadOffset(motion.roadOffset, frame.roadOffset, frame.wpm, dt);
        if (frame.roadOffset - motion.roadOffset > RACER_WORLD_LENGTH * 0.08) {
          motion.roadOffset = frame.roadOffset;
        }
      } else if (frame.phase !== "paused" || frame.reducedMotion) {
        motion.roadOffset = frame.roadOffset;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintScene(ctx, width, height, frame, motion);
      if (animate) raf = requestAnimationFrame(render);
    };
    const requestPaint = () => {
      if (!raf && !disposed && !document.hidden) render(performance.now());
    };

    controllerRef.current = {
      update: (nextInput) => {
        const next = createRacerFrameSnapshot(nextInput);
        if (next.progress < frame.progress || next.elapsedMs < frame.elapsedMs || next.phase === "idle") {
          motion.time = 0;
          motion.energy = 0;
          motion.spark = 0;
          motion.speed = 0;
          motion.roadOffset = next.roadOffset;
        }
        if (next.phase === "racing" && next.progress > frame.progress) motion.energy = 1;
        if (next.errors > frame.errors && next.phase === "racing" && !next.reducedMotion && !document.hidden) motion.spark = 0.34;
        if (next.reducedMotion) { motion.spark = 0; motion.energy = 0; }
        frame = next;
        if (!shouldAnimate()) stop();
        requestPaint();
      },
    };

    const resize = () => {
      if (disposed) return;
      const rect = canvas.getBoundingClientRect();
      width = Math.max(0, rect.width);
      height = Math.max(0, rect.height);
      dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      const pixelWidth = Math.max(1, Math.round(width * dpr));
      const pixelHeight = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      if (!shouldAnimate()) stop();
      requestPaint();
    };
    const visibility = () => {
      stop();
      if (!document.hidden) requestPaint();
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(canvas);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", visibility);
    resize();

    return () => {
      disposed = true;
      stop();
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.update({
      phase: input.phase, progress: input.progress, ghostProgress: input.ghostProgress,
      rivals: input.rivals,
      elapsedMs: input.elapsedMs, wpm: input.wpm, errors: input.errors, reducedMotion: input.reducedMotion,
    });
  }, [input.phase, input.progress, input.ghostProgress, input.rivals, input.elapsedMs, input.wpm, input.errors, input.reducedMotion]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none h-full w-full overflow-hidden bg-[#080d20] ${className ?? ""}`}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
