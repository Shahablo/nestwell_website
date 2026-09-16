/** Shared motion preferences. Everything animated on the site asks here before moving. */

const query = typeof window !== 'undefined' && 'matchMedia' in window
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;

export function reducedMotion(): boolean {
  return query?.matches ?? false;
}

export function onReducedMotionChange(handler: (reduced: boolean) => void): void {
  query?.addEventListener('change', (event) => handler(event.matches));
}

/** True when the browser can drive an animation from scroll position in CSS alone. */
export function supportsScrollTimeline(): boolean {
  return typeof CSS !== 'undefined' && CSS.supports('animation-timeline: scroll()');
}
