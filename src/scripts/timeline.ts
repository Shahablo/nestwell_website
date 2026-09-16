/**
 * The twelve-week band. CSS owns the animation where scroll-driven animations exist (see .band
 * in components.css): on wide screens it follows the opening stretch of page scroll, on narrow
 * screens it follows the band crossing the viewport. Elsewhere this module writes the same
 * --band-p custom property from an IntersectionObserver, so the dots light left to right as
 * the visitor scrolls.
 *
 * Also lights the vertical `.timeline` list items as they enter the viewport.
 * Under reduced motion (including when it is switched on while the page is open) every dot is lit.
 */
import { onReducedMotionChange, reducedMotion } from './motion';

const TRACK_LENGTH = 520; // px of scroll over which the band lights on wide screens; mirrors --band-scroll
const NARROW = '(max-width: 59.99em)';

export function mountTimeline(): void {
  document.querySelectorAll<HTMLElement>('[data-band]').forEach(mountBand);
  document.querySelectorAll<HTMLElement>('.timeline').forEach(mountVerticalTimeline);
}

function supportsCssBand(narrow: boolean): boolean {
  if (typeof CSS === 'undefined') return false;
  return narrow ? CSS.supports('animation-timeline: view()') : CSS.supports('animation-timeline: scroll()');
}

function mountBand(band: HTMLElement): void {
  const lightAll = (): void => band.style.setProperty('--band-p', '1');
  let teardown: (() => void) | undefined;

  const setup = (): void => {
    teardown?.();
    teardown = undefined;
    band.style.removeProperty('--band-p');
    if (reducedMotion()) {
      lightAll();
      return;
    }
    const narrow = window.matchMedia(NARROW).matches;
    if (supportsCssBand(narrow)) return;
    if (!('IntersectionObserver' in window)) {
      lightAll();
      return;
    }
    teardown = narrow ? observeBandInView(band) : observeTopTrack(band);
  };

  setup();
  onReducedMotionChange(setup);
  window.matchMedia(NARROW).addEventListener('change', setup);
}

/** Wide screens: progress through an invisible track at the top of the document. */
function observeTopTrack(band: HTMLElement): () => void {
  const track = document.createElement('div');
  track.setAttribute('aria-hidden', 'true');
  Object.assign(track.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '1px',
    height: `${TRACK_LENGTH}px`,
    pointerEvents: 'none',
    visibility: 'hidden',
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.prepend(track);

  const thresholds = Array.from({ length: 41 }, (_, i) => i / 40);
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const progress = entry.isIntersecting ? 1 - entry.intersectionRatio : 1;
        band.style.setProperty('--band-p', progress.toFixed(3));
      }
    },
    { threshold: thresholds },
  );
  observer.observe(track);
  return () => {
    observer.disconnect();
    track.remove();
  };
}

/** Narrow screens: progress follows how far the band has risen through the viewport. */
function observeBandInView(band: HTMLElement): () => void {
  let frame: number | undefined;
  const update = (): void => {
    frame = undefined;
    const rect = band.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    // 0 when the band's top is 80% down the viewport, 1 when it reaches 30%.
    const progress = Math.min(1, Math.max(0, (vh * 0.8 - rect.top) / (vh * 0.5)));
    band.style.setProperty('--band-p', progress.toFixed(3));
  };
  const onScroll = (): void => {
    if (frame === undefined) frame = requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.some((entry) => entry.isIntersecting);
    if (visible) {
      window.addEventListener('scroll', onScroll, { passive: true });
      update();
    } else {
      window.removeEventListener('scroll', onScroll);
      update();
    }
  });
  observer.observe(band);
  update();
  return () => {
    observer.disconnect();
    window.removeEventListener('scroll', onScroll);
    if (frame !== undefined) cancelAnimationFrame(frame);
  };
}

function mountVerticalTimeline(list: HTMLElement): void {
  const items = Array.from(list.querySelectorAll<HTMLElement>(':scope > li'));
  const lightAll = (): void => items.forEach((item) => item.classList.add('is-lit'));
  if (reducedMotion() || !('IntersectionObserver' in window)) {
    lightAll();
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-lit');
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -20% 0px' },
  );
  items.forEach((item) => observer.observe(item));
  onReducedMotionChange((reduced) => {
    if (!reduced) return;
    observer.disconnect();
    lightAll();
  });
}
