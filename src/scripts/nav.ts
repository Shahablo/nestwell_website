/**
 * Header behaviour: the mobile nav toggle and aria-current on the link for this page.
 * Markup contract: src/partials/header.html.
 */
export function mountNav(): void {
  const header = document.querySelector<HTMLElement>('.site-header');
  if (!header) return;

  markCurrentPage(header);

  const toggle = header.querySelector<HTMLButtonElement>('.nav-toggle');
  const nav = header.querySelector<HTMLElement>('.site-nav');
  if (!toggle || !nav) return;

  const setOpen = (open: boolean): void => {
    header.dataset.open = String(open);
    toggle.setAttribute('aria-expanded', String(open));
    const label = toggle.querySelector<HTMLElement>('.nav-toggle__label');
    if (label) label.textContent = open ? 'Close' : 'Menu';
  };

  setOpen(false);

  toggle.addEventListener('click', () => {
    setOpen(header.dataset.open !== 'true');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.dataset.open === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (header.dataset.open !== 'true') return;
    if (event.target instanceof Node && !header.contains(event.target)) setOpen(false);
  });

  // Close the drawer when the viewport grows past the breakpoint.
  const wide = window.matchMedia('(min-width: 56.01em)');
  wide.addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}

function markCurrentPage(scope: HTMLElement): void {
  const here = normalise(location.pathname);
  scope.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
    const target = normalise(new URL(link.getAttribute('href') ?? '', location.href).pathname);
    if (target === here && !link.classList.contains('brand') && !link.classList.contains('btn')) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

function normalise(pathname: string): string {
  // GitHub Pages also serves extensionless URLs (/how-it-works), so compare without .html.
  const trimmed = pathname.replace(/\/index(\.html)?$/, '/').replace(/\.html$/, '').replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}
