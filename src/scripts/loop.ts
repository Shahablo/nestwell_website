/**
 * The accountability loop: check-in -> owner -> verified step -> clinician summary.
 * The SVG nodes (data-loop-node="1..4") carry their timestamp-style labels in the markup;
 * this module keeps the active node in sync with the step list beside the diagram, moves a
 * dot along the loop path, and cycles the active node while the loop is in view.
 *
 * Autoplay can always be stopped: hover or focus holds it, the pause button stops it for good
 * (WCAG 2.2.2), clicking a step stops it, and reduced motion (at load or switched on later)
 * turns it off and hides the moving dot.
 *
 * Markup contract (index.html / how-it-works.html):
 *   <div class="loop" data-loop>
 *     <figure> <svg data-loop-svg> <path data-loop-path/> <g data-loop-node="1"> ... <circle data-loop-dot/> </svg> </figure>
 *     <div> <ol class="loop__steps"> <li><button class="loop__step" data-loop-step="1">...</button></li> ... </ol>
 *       <div class="loop__controls"><button data-loop-toggle>Pause the loop</button></div> </div>
 *   </div>
 */
import { onReducedMotionChange, reducedMotion } from './motion';

const CYCLE_MS = 3200;

export function mountLoop(): void {
  document.querySelectorAll<HTMLElement>('[data-loop]').forEach((root) => new Loop(root));
}

class Loop {
  private readonly nodes: Map<string, SVGGElement[]> = new Map();
  private readonly steps: HTMLButtonElement[];
  private readonly keys: string[];
  private readonly dots: SVGCircleElement[];
  private readonly toggle: HTMLButtonElement | null;
  private index = 0;
  private dotPos = 0;
  private timer: number | undefined;
  private inView = false;
  private held = false;
  /** Stopped by the visitor (pause button or a step click); the button alone restarts it. */
  private stopped = false;

  constructor(private readonly root: HTMLElement) {
    root.querySelectorAll<SVGGElement>('[data-loop-node]').forEach((node) => {
      const key = node.dataset.loopNode ?? '';
      const list = this.nodes.get(key) ?? [];
      list.push(node);
      this.nodes.set(key, list);
    });
    this.steps = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-loop-step]'));
    this.keys = this.steps.map((step) => step.dataset.loopStep ?? '');
    this.dots = Array.from(root.querySelectorAll<SVGCircleElement>('[data-loop-dot]'));
    this.toggle = root.querySelector<HTMLButtonElement>('[data-loop-toggle]');

    this.steps.forEach((step, i) => {
      step.addEventListener('click', () => {
        this.setStopped(true);
        this.activate(i);
      });
      step.addEventListener('focus', () => {
        this.held = true;
        this.stop();
        this.activate(i);
      });
    });

    this.toggle?.addEventListener('click', () => this.setStopped(!this.stopped));

    root.addEventListener('pointerenter', () => {
      this.held = true;
      this.stop();
    });
    root.addEventListener('pointerleave', () => {
      this.held = false;
      this.start();
    });
    root.addEventListener('focusout', (event) => {
      if (!(event.relatedTarget instanceof Node) || !root.contains(event.relatedTarget)) {
        this.held = false;
        this.start();
      }
    });

    this.activate(0);
    this.applyMotionPreference();
    onReducedMotionChange(() => this.applyMotionPreference());

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            this.inView = entry.isIntersecting;
            if (this.inView) this.start();
            else this.stop();
          }
        },
        { threshold: 0.35 },
      );
      observer.observe(root);
    } else {
      this.inView = true;
      this.start();
    }
  }

  private applyMotionPreference(): void {
    const reduced = reducedMotion();
    this.dots.forEach((dot) => dot.toggleAttribute('hidden', reduced));
    if (reduced) {
      this.stop();
      if (this.toggle) this.toggle.hidden = true;
    } else {
      if (this.toggle) this.toggle.hidden = false;
      this.start();
    }
  }

  private setStopped(stopped: boolean): void {
    this.stopped = stopped;
    if (this.toggle) this.toggle.textContent = stopped ? 'Play the loop' : 'Pause the loop';
    this.root.dataset.loopStopped = String(stopped);
    if (stopped) this.stop();
    else {
      this.held = false;
      this.start();
    }
  }

  private activate(i: number): void {
    this.index = i;
    const key = this.keys[i] ?? '';
    this.nodes.forEach((list, nodeKey) => {
      list.forEach((node) => node.classList.toggle('is-active', nodeKey === key));
    });
    this.steps.forEach((step, j) => {
      if (j === i) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    this.root.dataset.loopActive = key;
    this.moveDot((i / this.keys.length) * 100);
  }

  /** Slide the dot forward along the closed path to `target` (percent), wrapping past 100. */
  private moveDot(target: number): void {
    const from = this.dotPos;
    const end = target < from ? target + 100 : target;
    this.dotPos = target;
    this.dots.forEach((dot) => {
      dot.style.offsetDistance = `${target}%`;
      if (reducedMotion() || typeof dot.animate !== 'function' || from === target) return;
      dot.animate(
        [{ offsetDistance: `${from}%` }, { offsetDistance: `${end}%` }],
        { duration: 900, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
      );
    });
  }

  private start(): void {
    if (this.timer !== undefined || !this.inView || this.held || this.stopped || reducedMotion()) return;
    this.timer = window.setInterval(() => {
      this.activate((this.index + 1) % this.keys.length);
    }, CYCLE_MS);
  }

  private stop(): void {
    if (this.timer !== undefined) {
      window.clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
