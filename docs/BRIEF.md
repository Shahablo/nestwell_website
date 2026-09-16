# NestWell website — build brief

This is the brief for building NestWell's marketing website. It is the contract between the
people (and agents) building the site. Read it fully before writing anything.

## 1. What NestWell is (and how to talk about it)

NestWell is a postpartum follow-through program for OB practices, being developed in Ohio by
two founders. In the twelve weeks after birth it gives each patient short check-ins, a care plan
she can understand, a named person at her practice she can reach, mental-health screening that
connects to real follow-up, verified completion of the next step in her care (a referral counts
only when the appointment was kept), and a concise summary for her clinician. AI is used only to
explain approved material, draft summaries for a human to review, and organize a patient's
questions — never to triage, diagnose, reassure, or replace a clinician.

The one-line promise, which every page should reinforce:
**"Women complete the next step in their care — and their practice can verify it happened."**

Status, stated honestly everywhere it matters: the program is in development and recruiting
pilot practices in Ohio. There are no outcomes to cite yet. Improved access and reduced staff
workload are **goals until measured**. Use the language of a defined program and a practical
promise, not of a product that has proven anything.

Audiences, in priority order:
1. **OB practices, groups, and health systems** — the buyer. They need to see: what the program
   does week by week, what it asks of their staff (and what it takes off their plate), how
   accountability works (owners, coverage hours, what happens when nobody answers), how it fits
   with tools they already have, and how a pilot is structured (fixed pilot fee or
   per-enrolled-episode price; clinical services stay with the practice).
2. **Women and families** — reassurance about what to expect, who sees what, control over
   sharing, what happens after a loss, and that a real person is always reachable.
3. **Partners, advisors, investors** — the founders, the approach, and the evidence base for the
   direction (ACOG postpartum care guidance; text-based follow-up evidence).

## 2. Hard rules on copy (non-negotiable)

Never use, anywhere on the site: "first-of-its-kind", "first", "only", "better than a clinician",
"replaces", "guaranteed", "proven", "proven outcomes", "clinically validated", "HIPAA compliant",
"HIPAA certified", "FDA cleared", "FDA approved", "non-device", "the app decides nothing", "just
shows information", "24/7 monitoring", "always watching", "we'll know", "AI triage", "AI therapy",
"AI diagnosis", "reduces maternal mortality", "prevents complications", "saves lives", any
statistic about NestWell's own results, and any description of a competitor.

Do use: "a defined postpartum follow-through program", "connected to your practice", "verified
follow-through", "a named person you can reach", "goals we will measure in the pilot", "in
development", "recruiting pilot practices", "clinician-approved", "human review",
"AI explains approved material and drafts summaries for a clinician to review".

Emergency guidance may appear on the For families page exactly as: "If you are in danger or
having thoughts of harming yourself, call 911 or call or text 988." Nothing on the site is
medical advice; say so in the footer.

Founder facts (confirm with the founders before launch; anything not listed here is marked
"to confirm" in the copy with a visible `[confirm]` marker in the source):
- **Amber Siddiqui** — Co-founder. Background: supply-chain transformation and large-scale
  planning programs at Deloitte; Greater Chicago area; Northern Illinois University; fluent in
  Spanish. Role on NestWell: operations, partnerships, and the practice workflow (operations
  owner). Title to confirm.
- **Sarah Nazir, MD** — Co-founder. OB-GYN (board certification and practice affiliation to
  confirm). Role on NestWell: clinical safety owner — every check-in question, screening
  threshold, escalation rule, and patient-facing sentence is hers to approve.
Do not invent credentials, awards, patient numbers, or affiliations.

## 3. Site map

| Page | File | Purpose | Primary CTA |
|---|---|---|---|
| Home | `index.html` | The promise, the twelve weeks at a glance, who it is for, how AI is bounded, founders teaser, pilot CTA | "Partner on a pilot" (practices) + "Join the interest list" (families) |
| How it works | `how-it-works.html` | The 12-week program as an interactive timeline; the five things a patient gets; the accountability loop (check-in → owner → verified step → summary); what "verified" means | "See the practice workflow" |
| For practices | `for-practices.html` | Staff workflow, queues and coverage, what the practice controls (thresholds, owners, wording), staff minutes, how a pilot is structured, what we ask of a partner, FAQ | "Request a pilot conversation" |
| For families | `for-families.html` | What to expect week by week, who sees what and your control over sharing, after a loss, languages, a real person to reach, emergency line | "Join the interest list" |
| About | `about.html` | Why NestWell; the founders; principles (safety, privacy, AI boundaries, honesty about evidence); the evidence base; Ohio | "Talk to the founders" |
| Contact | `contact.html` | Pilot inquiry form (practice name, role, city, current tools, message) and general contact; explicit "please do not include health information" | Submit |
| Privacy | `privacy.html` | Plain-language site privacy note (no trackers, what the form collects) | — |

Shared: header with logo + nav + primary CTA; footer with the not-medical-advice line, the
emergency line, contact email placeholder `hello@[domain]`, and © NestWell 2026.

## 4. Design direction

Treatment: **editorial**. This site has to feel like a considered brand, not a template. One
real aesthetic risk, executed precisely, and everything around it quiet.

The subject's world, which the design should draw from: the "fourth trimester" as a
**twelve-week timeline**; the nest (layered arcs, holding); 3 a.m. feeds (a dark "night"
section is fair game); the clinic (clean, precise, typed forms, timestamps); the phone in one
hand. Real units and document conventions belong in the content: day 3, day 21, week 6,
week 12; "acknowledged 14 min"; "referral: appointment kept".

Palette (CSS custom properties; light-first, but the site may choose a deliberate dark hero):
- ground `#FBF9F4` (warm off-white), surface `#FFFFFF`, ink `#16221F`, muted `#5A6763`,
  line `#DCD8CE`
- spruce `#1F5F5B` (primary; matches the app icon), spruce-deep `#0F2E2C`, spruce-soft `#E1EEEB`
- dawn `#E9A24B` (accent for CTAs and highlights — spend it in one place per view)
- night `#0E1B1A` for a dark section; on it, text `#EAF1EF` and dawn for emphasis
Avoid: cream + terracotta, purple gradients, glassmorphism, emoji as icons, everything centered.

Type (Google Fonts are allowed on the website — this is not an artifact): display
**Bricolage Grotesque** (opsz, weights 500–800) for headlines with tight tracking; body
**Source Sans 3** at 18px/1.6; **JetBrains Mono** for timestamps, day markers, and small data
labels. Set a real scale; `text-wrap: balance` on headings; running text ≤ 68ch.

Signature devices (build at least the first three, well):
1. **The twelve-week band**: a horizontal timeline that spans the hero and drives the page —
   day 3 · 7 · 14 · 21 · week 6 · 9 · 12 — with the ACOG markers ("first contact by 3 weeks",
   "comprehensive visit by 12 weeks") and animated dots that light as you scroll (scroll-linked
   with `animation-timeline: scroll()` where supported, IntersectionObserver fallback).
2. **A live check-in mock**: a phone-sized panel that cycles through a real check-in (five taps,
   the closing statement that never reassures, the "I need help now" button) — CSS/JS only.
3. **The accountability loop**: an SVG diagram — check-in → owner → verified step → clinician
   summary — where each node shows a real timestamp-style label ("acknowledged 14 min").
4. **Nest motif**: a generative canvas of layered arcs in the hero/night section, subtle,
   respecting `prefers-reduced-motion`.
No stock photography (none is licensed for this build). Illustration is inline SVG and CSS.

## 5. Technical

- Vite multi-page (each page is an `.html` at the repo root, sharing `src/styles/*.css` and
  `src/scripts/*.ts`). No framework. TypeScript for scripts. Zero runtime dependencies.
- `vite.config.ts`: `base` from `process.env.BASE_PATH ?? '/nestwell_website/'` (GitHub Pages
  project path until a custom domain is attached; then set `BASE_PATH=/`), and every page
  listed in `build.rollupOptions.input`.
- Links between pages must be relative (`./how-it-works.html`), never root-absolute.
- Performance: no layout shift; fonts with `display=swap`; images as SVG; lazy canvas.
- Accessibility: semantic landmarks, skip link, visible focus, contrast AA on both light and
  dark sections, `prefers-reduced-motion` disables scroll animations, all interactive mocks
  keyboard-operable, form labels.
- Contact form: no backend. Use a `data-endpoint` attribute on the form read from
  `VITE_FORM_ENDPOINT` (empty by default); when empty, the form falls back to opening a
  `mailto:` with the fields in the body and shows an inline note. Never collect health data;
  say so above the form.
- SEO: unique `<title>` and `<meta name="description">` per page; Open Graph tags; an SVG
  favicon + PNG apple-touch-icon; `sitemap.xml` and `robots.txt` in `public/`.
- Deploy: `.github/workflows/deploy.yml` builds on push to `main` and deploys `dist/` with
  `actions/deploy-pages`. Pages will be enabled with the Actions source.
- Tests: `vitest` with a `copy.test.ts` that scans every `.html` and `.ts` for the prohibited
  phrases in section 2 (case-insensitive, word boundaries) and fails on a match; and a
  `links.test.ts` that checks every internal link resolves to a file.

## 6. Definition of done

`npm run check`, `npm test`, and `npm run build` pass; every page renders at 360px and 1440px
with no horizontal scroll; the timeline, check-in mock and loop diagram work with the keyboard
and with reduced motion; no prohibited phrase anywhere; founder facts carry `[confirm]` markers
where unconfirmed; basics (labels, alt text, contrast) are met.
