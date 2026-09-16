/**
 * Entry point for every page. Each mount function looks for its markup and does nothing
 * when the page has none, so all seven pages load this same script.
 */
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/pages/how-it-works.css';
import '../styles/pages/for-practices.css';
import '../styles/pages/contact.css';
import '../styles/pages/families.css';
import '../styles/pages/about.css';

import { mountNav } from './nav';
import { mountTimeline } from './timeline';
import { mountCheckin } from './checkin';
import { mountLoop } from './loop';
import { mountNest } from './nest';
import { mountForms } from './form';

function boot(): void {
  mountNav();
  mountTimeline();
  mountCheckin();
  mountLoop();
  mountNest();
  mountForms();
  document.documentElement.dataset.js = 'ready';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
