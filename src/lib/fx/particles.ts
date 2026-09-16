/**
 * Pooled 2D particles, screen shake and floating numbers.
 *
 * Everything here is allocated once and reused. An unbounded particle system is
 * the standard way a browser game degrades over a long session: each burst
 * allocates, the collector runs mid-fight, and the frame time spikes exactly
 * when the screen is busiest. A fixed pool cannot do that -- at worst the
 * oldest particle is recycled early.
 *
 * Rendering is canvas, not DOM. A hundred DOM nodes with transforms will force
 * layout and style recalculation every frame; a hundred canvas draws will not.
 */

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  drag: number;
  shape: "circle" | "square" | "spark";
}

export interface BurstOptions {
  count?: number;
  color?: string;
  speed?: number;
  spread?: number;
  /** Direction in radians; omit for a full circle. */
  angle?: number;
  size?: number;
  life?: number;
  gravity?: number;
  drag?: number;
  shape?: Particle["shape"];
}

export interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
  size: number;
}

const MAX_PARTICLES = 600;
const MAX_TEXTS = 40;

export class FxSystem {
  private particles: Particle[] = [];
  private texts: FloatingText[] = [];
  private cursor = 0;
  private textCursor = 0;

  private shakeAmount = 0;
  private shakeDecay = 0;
  shakeX = 0;
  shakeY = 0;

  private flashAlpha = 0;
  private flashColor = "#ffffff";

  constructor() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1,
        size: 2, color: "#fff", gravity: 0, drag: 1, shape: "circle",
      });
    }
    for (let i = 0; i < MAX_TEXTS; i++) {
      this.texts.push({
        active: false, x: 0, y: 0, vy: 0, life: 0, maxLife: 1,
        text: "", color: "#fff", size: 16,
      });
    }
  }

  /**
   * Take the next slot, recycling the oldest if the pool is saturated. Never
   * grows, never allocates, and never refuses to show an effect.
   */
  private claim(): Particle {
    const p = this.particles[this.cursor];
    this.cursor = (this.cursor + 1) % MAX_PARTICLES;
    return p;
  }

  burst(x: number, y: number, opts: BurstOptions = {}): void {
    const count = opts.count ?? 12;
    const speed = opts.speed ?? 140;
    const spread = opts.spread ?? Math.PI * 2;
    const base = opts.angle ?? 0;
    const life = opts.life ?? 0.5;

    for (let i = 0; i < count; i++) {
      const p = this.claim();
      const a =
        opts.angle === undefined
          ? Math.random() * Math.PI * 2
          : base + (Math.random() - 0.5) * spread;
      const v = speed * (0.5 + Math.random() * 0.5);
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * v;
      p.vy = Math.sin(a) * v;
      p.maxLife = life * (0.7 + Math.random() * 0.6);
      p.life = p.maxLife;
      p.size = opts.size ?? 3;
      p.color = opts.color ?? "#ffffff";
      p.gravity = opts.gravity ?? 0;
      p.drag = opts.drag ?? 0.92;
      p.shape = opts.shape ?? "circle";
    }
  }

  floatText(
    x: number,
    y: number,
    text: string,
    color = "#ffffff",
    size = 16,
  ): void {
    const t = this.texts[this.textCursor];
    this.textCursor = (this.textCursor + 1) % MAX_TEXTS;
    t.active = true;
    t.x = x;
    t.y = y;
    t.vy = -46;
    t.maxLife = 0.9;
    t.life = t.maxLife;
    t.text = text;
    t.color = color;
    t.size = size;
  }

  /**
   * Shake is additive but capped. Uncapped, a chain of simultaneous hits turns
   * the screen unreadable, which is the usual reason shake gets a bad name.
   */
  shake(amount: number, decay = 5): void {
    this.shakeAmount = Math.min(18, this.shakeAmount + amount);
    this.shakeDecay = decay;
  }

  flash(color = "#ffffff", alpha = 0.35): void {
    this.flashColor = color;
    this.flashAlpha = Math.max(this.flashAlpha, alpha);
  }

  update(dt: number): void {
    const clamped = Math.min(dt, 0.05); // a backgrounded tab must not teleport

    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= clamped;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vy += p.gravity * clamped;
      p.vx *= Math.pow(p.drag, clamped * 60);
      p.vy *= Math.pow(p.drag, clamped * 60);
      p.x += p.vx * clamped;
      p.y += p.vy * clamped;
    }

    for (const t of this.texts) {
      if (!t.active) continue;
      t.life -= clamped;
      if (t.life <= 0) {
        t.active = false;
        continue;
      }
      t.y += t.vy * clamped;
      t.vy *= 0.92;
    }

    if (this.shakeAmount > 0.05) {
      this.shakeAmount -= this.shakeAmount * this.shakeDecay * clamped;
      this.shakeX = (Math.random() - 0.5) * 2 * this.shakeAmount;
      this.shakeY = (Math.random() - 0.5) * 2 * this.shakeAmount;
    } else {
      this.shakeAmount = 0;
      this.shakeX = 0;
      this.shakeY = 0;
    }

    if (this.flashAlpha > 0.001) {
      this.flashAlpha -= this.flashAlpha * 8 * clamped;
    } else {
      this.flashAlpha = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    for (const p of this.particles) {
      if (!p.active) continue;
      const t = p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, Math.min(1, t));
      ctx.fillStyle = p.color;
      const s = p.size * (p.shape === "spark" ? t : 1);
      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === "spark") {
        ctx.fillRect(p.x - s / 2, p.y - s * 2, s, s * 4);
      } else {
        ctx.fillRect(p.x - s, p.y - s, s * 2, s * 2);
      }
    }

    for (const t of this.texts) {
      if (!t.active) continue;
      const k = t.life / t.maxLife;
      ctx.globalAlpha = Math.max(0, Math.min(1, k));
      ctx.fillStyle = t.color;
      ctx.font = `600 ${t.size}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.fillText(t.text, t.x, t.y);
    }

    ctx.restore();

    if (this.flashAlpha > 0) {
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.globalAlpha = 1;
  }

  /** Drop everything immediately, e.g. on restart. */
  clear(): void {
    for (const p of this.particles) p.active = false;
    for (const t of this.texts) t.active = false;
    this.shakeAmount = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.flashAlpha = 0;
  }

  get activeCount(): number {
    return this.particles.reduce((n, p) => n + (p.active ? 1 : 0), 0);
  }
}
