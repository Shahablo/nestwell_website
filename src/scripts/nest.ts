/**
 * Nest motif: a bowl of layered arcs, open at the top, drawn on a canvas behind a section.
 * Lazy (created when the section approaches the viewport), subtle, redrawn at about 15 fps
 * while visible and the tab is showing, and still under reduced motion.
 *
 * Markup: <div class="nest" data-nest="night|light" aria-hidden="true"></div> as the
 * section's child, before .container. The section needs position: relative (.section has it).
 *
 * Placement keeps the whole bowl inside the canvas, and on a hero with the twelve-week band
 * the arcs are clipped to the area above the band so they never cross its rows.
 */
import { onReducedMotionChange, reducedMotion } from './motion';

interface Palette {
  strokes: string[];
  /** Fill for the egg resting in the bowl; omitted where it would compete with content. */
  egg?: string;
  /** Horizontal centre of the bowl as a fraction of the width. */
  cx: number;
  /** Rim (the bowl's open top) as a fraction of the drawable height. */
  rim: number;
  /** Below this canvas width the layout stacks and there is no free space: draw nothing. */
  minWidth?: number;
  /** Put the rim just under the section's content (in its bottom padding) instead of at `rim`. */
  belowContent?: boolean;
}

const PALETTES: Record<string, Palette> = {
  // Night: no dawn here; the section's dawn is its button. Lower-left, in the space under the
  // text column, so the bowl and its egg are never under text or a card.
  night: {
    strokes: ['rgba(234, 241, 239, 0.12)', 'rgba(47, 128, 122, 0.9)', 'rgba(234, 241, 239, 0.2)'],
    egg: 'rgba(234, 241, 239, 0.22)',
    cx: 0.5,
    rim: 0.8,
    belowContent: true,
    minWidth: 720,
  },
  light: {
    strokes: ['rgba(31, 95, 91, 0.07)', 'rgba(31, 95, 91, 0.1)', 'rgba(31, 95, 91, 0.05)'],
    cx: 0.92,
    rim: 0.3,
  },
};

const FRAME_MS = 66; // ~15 fps: the motion is a slow breath, not an animation to watch
const RINGS = 9;
const RING_STEP = 0.55; // each ring's radius grows by this fraction of the innermost radius

export function mountNest(): void {
  const hosts = document.querySelectorAll<HTMLElement>('[data-nest]');
  if (hosts.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    hosts.forEach((host) => new Nest(host));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          new Nest(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '25% 0px' },
  );
  hosts.forEach((host) => observer.observe(host));
}

class Nest {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly palette: Palette;
  private width = 0;
  private height = 0;
  /** Height the arcs may use: above the band on a hero, the whole canvas elsewhere. */
  private clipHeight = 0;
  /** Bottom edge of the section's content, relative to the canvas. */
  private contentBottom = 0;
  private frame: number | undefined;
  private lastDraw = 0;
  private visible = true;
  private readonly seed: number;

  constructor(private readonly host: HTMLElement) {
    this.palette = PALETTES[host.dataset.nest ?? 'night'] ?? PALETTES.night!;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.seed = Math.random() * 1000;
    host.replaceChildren(this.canvas);

    this.resize();
    if ('ResizeObserver' in window) new ResizeObserver(() => this.resize()).observe(host);

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        this.visible = entries.some((entry) => entry.isIntersecting);
        this.loop();
      });
      io.observe(host);
    }

    document.addEventListener('visibilitychange', this.loop);
    onReducedMotionChange(this.loop);
    this.loop();
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.host.getBoundingClientRect();
    this.width = Math.max(1, Math.round(rect.width));
    this.height = Math.max(1, Math.round(rect.height));
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

    const band = this.host.parentElement?.querySelector<HTMLElement>('[data-band]');
    const bandTop = band ? band.getBoundingClientRect().top - rect.top - 16 : this.height;
    this.clipHeight = Math.max(0, Math.min(this.height, bandTop));

    // Night: the bowl sits in the section's bottom padding, below all text and cards.
    const container = this.host.parentElement?.querySelector<HTMLElement>(':scope > .container');
    this.contentBottom = container ? container.getBoundingClientRect().bottom - rect.top : this.height * 0.8;
    this.draw(0);
  }

  private loop = (): void => {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
    if (reducedMotion() || !this.visible || document.hidden) {
      this.draw(0);
      return;
    }
    const tick = (now: number): void => {
      if (now - this.lastDraw >= FRAME_MS) {
        this.lastDraw = now;
        this.draw(now / 1000);
      }
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  };

  /** Concentric half-circles open at the top, like a bowl, breathing very slowly. */
  private draw(t: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const { width: w, height: h, clipHeight: ch } = this;
    ctx.clearRect(0, 0, w, h);
    if (ch < 80 || w < (this.palette.minWidth ?? 0)) return;

    const rimY = this.palette.belowContent ? this.contentBottom + 14 : ch * this.palette.rim;
    // Largest ring must fit below the rim (inside the clip) and not dominate the width.
    const maxR = Math.min(ch - rimY - 12, Math.max(w * 0.2, 150), 340);
    if (maxR < 40) return;
    const base = maxR / (1 + (RINGS - 1) * RING_STEP);
    const cx = w * this.palette.cx;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, ch);
    ctx.clip();

    for (let i = 0; i < RINGS; i += 1) {
      const wobble = Math.sin(t * 0.18 + i * 0.7 + this.seed) * 3;
      const r = Math.max(4, base + i * base * RING_STEP + wobble);
      const stroke = this.palette.strokes[i % 3 === 2 ? 2 : i % 2]!;
      // Lower half-circle, clockwise from the right horizon to the left, with the tips lifting
      // slightly past the rim so the arcs read as layered twigs rather than a clean semicircle.
      const lift = 0.03 + 0.02 * Math.sin(t * 0.11 + i);
      const start = -Math.PI * lift;
      const end = Math.PI * (1 + 0.03 - 0.02 * Math.cos(t * 0.13 + i * 1.3));
      ctx.beginPath();
      ctx.arc(cx, rimY, r, start, end, false);
      ctx.lineWidth = i % 3 === 2 ? 1.5 : 1.1;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }

    if (this.palette.egg) {
      const ry = base * 0.62;
      const rx = base * 0.48;
      const cy = rimY + base - ry - 2 + Math.sin(t * 0.25 + this.seed) * 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.palette.egg;
      ctx.fill();
    }
    ctx.restore();
  }
}
