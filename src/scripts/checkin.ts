/**
 * The live check-in mock: a day-14 check-in of five single-tap items, then the closing
 * statement. The statement is a process statement (who reads what, by when) and never a
 * characterisation of the answers. "I need help now" is a real button at every step.
 *
 * Markup contract (index.html): <div class="checkin" data-checkin> with children
 *   [data-checkin-body]   — the question / closing / emergency panel is rendered here
 *   [data-checkin-help]   — the "I need help now" button (static, always visible)
 *   [data-checkin-toggle] — play/pause control (outside the phone)
 *   [data-checkin-restart]
 *   [data-checkin-progress] — five <i> dots
 * Autoplay shows a visible tap, then selects, about every five seconds; it pauses on hover or
 * focus inside the phone. Under reduced motion it starts paused (and pauses if the preference
 * is switched on later); an explicit Play still runs it, because the visitor asked.
 *
 * Emergency wording in the mock is a placeholder: each practice's approved instruction goes
 * there. The emergency line the site itself states is exactly the one in BRIEF.md section 2.
 */
import { onReducedMotionChange, reducedMotion } from './motion';

interface Item {
  prompt: string;
  options: string[];
  /** index of the option the demo taps during autoplay */
  demo: number;
}

const ITEMS: Item[] = [
  {
    prompt: 'How is your recovery going today?',
    options: ['About the same as last week', 'Better', 'Harder than last week'],
    demo: 0,
  },
  {
    prompt: 'Any bleeding heavier than a period, a fever, or a headache that will not go away?',
    options: ['No', 'Yes', 'Not sure'],
    demo: 0,
  },
  {
    prompt: 'How have you been coping this week?',
    options: ['Mostly fine', 'Some hard days', 'Struggling most days'],
    demo: 1,
  },
  {
    prompt: 'Is anything getting in the way of your visit on Tuesday the 14th?',
    options: ['No, I can get there', 'I do not have a ride', 'I need to reschedule'],
    demo: 1,
  },
  {
    prompt: 'Would you like your care coordinator to call you this week?',
    options: ['Yes, please call', 'Not this time'],
    demo: 0,
  },
];

const TAP_DELAY = 3000; // ms after a step renders before the demo starts its tap
const TAP_SHOW = 600; // ms the tap animation shows before the answer is selected
const ADVANCE_DELAY = 1400; // ms the selected state shows before the next step
const CLOSING_HOLD = 7000; // ms the closing statement stays before the loop restarts

type State = { kind: 'item'; index: number } | { kind: 'closing' } | { kind: 'help' };

export function mountCheckin(): void {
  document.querySelectorAll<HTMLElement>('[data-checkin]').forEach((root) => new CheckinMock(root));
}

class CheckinMock {
  private readonly body: HTMLElement;
  private readonly help: HTMLButtonElement | null;
  private readonly toggle: HTMLButtonElement | null;
  private readonly restart: HTMLButtonElement | null;
  private readonly progress: HTMLElement[];
  private state: State = { kind: 'item', index: 0 };
  private answers: number[] = [];
  private playing = false;
  private hovered = false;
  /** Set when the visitor drove the last step, so keyboard focus follows the new panel. */
  private focusNext = false;
  private timer: number | undefined;

  constructor(private readonly root: HTMLElement) {
    this.body = must(root.querySelector<HTMLElement>('[data-checkin-body]'), 'checkin body');
    this.help = root.querySelector<HTMLButtonElement>('[data-checkin-help]');
    this.toggle = root.querySelector<HTMLButtonElement>('[data-checkin-toggle]');
    this.restart = root.querySelector<HTMLButtonElement>('[data-checkin-restart]');
    this.progress = Array.from(root.querySelectorAll<HTMLElement>('[data-checkin-progress] i'));

    this.help?.addEventListener('click', () => this.showHelp());
    this.toggle?.addEventListener('click', () => this.setPlaying(!this.playing));
    this.restart?.addEventListener('click', () => this.reset());

    const phone = root.querySelector<HTMLElement>('.phone') ?? root;
    phone.addEventListener('pointerenter', () => this.setHovered(true));
    phone.addEventListener('pointerleave', () => this.setHovered(false));
    phone.addEventListener('focusin', () => this.setHovered(true));
    phone.addEventListener('focusout', (event) => {
      if (!(event.relatedTarget instanceof Node) || !phone.contains(event.relatedTarget)) {
        this.setHovered(false);
      }
    });

    this.render();
    this.setPlaying(!reducedMotion());
    onReducedMotionChange((reduced) => {
      if (reduced) this.setPlaying(false);
    });
  }

  private setPlaying(playing: boolean): void {
    this.playing = playing;
    if (this.toggle) {
      // A changing label, not aria-pressed, so assistive tech never hears "Pause demo, pressed".
      this.toggle.removeAttribute('aria-pressed');
      this.toggle.textContent = playing ? 'Pause demo' : 'Play demo';
    }
    this.root.dataset.playing = String(playing);
    // Announce steps to assistive tech when the visitor is driving, not during autoplay.
    this.body.setAttribute('aria-live', playing ? 'off' : 'polite');
    this.schedule();
  }

  private setHovered(hovered: boolean): void {
    this.hovered = hovered;
    this.root.dataset.paused = String(hovered && this.playing);
    this.schedule();
  }

  private clearTimer(): void {
    if (this.timer !== undefined) {
      window.clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  /** Queue the next automatic action for the current state, if autoplay is running. */
  private schedule(): void {
    this.clearTimer();
    if (!this.playing || this.hovered) return;

    if (this.state.kind === 'item') {
      const index = this.state.index;
      this.timer = window.setTimeout(() => this.demoTap(index), TAP_DELAY);
    } else if (this.state.kind === 'closing') {
      this.timer = window.setTimeout(() => this.reset(), CLOSING_HOLD);
    }
  }

  /** Show the tap on the chip before selecting it, so the demo never looks as if it answered for her. */
  private demoTap(index: number): void {
    if (this.state.kind !== 'item' || this.state.index !== index) return;
    const option = ITEMS[index]!.demo;
    const chip = this.body.querySelectorAll<HTMLButtonElement>('.chip')[option];
    chip?.classList.add('is-tapping');
    this.timer = window.setTimeout(() => {
      chip?.classList.remove('is-tapping');
      this.answer(index, option);
    }, reducedMotion() ? 0 : TAP_SHOW);
  }

  private answer(index: number, option: number): void {
    if (this.state.kind !== 'item' || this.state.index !== index) return;
    this.answers[index] = option;
    const buttons = this.body.querySelectorAll<HTMLButtonElement>('.chip');
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === option)));
    this.clearTimer();
    this.timer = window.setTimeout(() => this.advance(index), ADVANCE_DELAY);
  }

  private advance(fromIndex: number): void {
    this.state = fromIndex + 1 < ITEMS.length ? { kind: 'item', index: fromIndex + 1 } : { kind: 'closing' };
    this.render();
    this.schedule();
  }

  private showHelp(): void {
    this.clearTimer();
    this.state = { kind: 'help' };
    this.render();
    this.body.querySelector<HTMLButtonElement>('[data-checkin-back]')?.focus();
  }

  private reset(): void {
    this.clearTimer();
    this.answers = [];
    this.state = { kind: 'item', index: 0 };
    this.render();
    this.schedule();
  }

  private render(): void {
    const { state } = this;
    this.root.dataset.state = state.kind;
    this.help?.setAttribute('aria-pressed', String(state.kind === 'help'));

    this.progress.forEach((dot, i) => {
      const done = state.kind !== 'item' || i < state.index;
      const current = state.kind === 'item' && i === state.index;
      dot.classList.toggle('is-done', done);
      dot.classList.toggle('is-current', current);
    });

    if (state.kind === 'item') this.renderItem(state.index);
    else if (state.kind === 'closing') this.renderClosing();
    else this.renderHelp();

    if (this.focusNext) {
      this.focusNext = false;
      const target = this.body.querySelector<HTMLElement>('.chip, [data-checkin-back], [data-checkin-focus]');
      target?.focus();
    }
  }

  private renderItem(index: number): void {
    const item = ITEMS[index]!;
    const step = el('p', 'checkin__step', `Day 14 check-in · ${index + 1} of ${ITEMS.length}`);
    const question = el('h3', 'checkin__q', item.prompt);
    question.id = `${this.root.id || 'checkin'}-q`;

    const list = document.createElement('ul');
    list.className = 'checkin__options';
    list.setAttribute('aria-labelledby', question.id);
    item.options.forEach((label, i) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chip';
      button.textContent = label;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        if (this.playing) this.setPlaying(false);
        this.focusNext = true;
        this.answer(index, i);
      });
      li.append(button);
      list.append(li);
    });

    const skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'checkin__skip';
    skip.textContent = 'Skip this one';
    skip.addEventListener('click', () => {
      this.clearTimer();
      if (this.playing) this.setPlaying(false);
      this.focusNext = true;
      this.advance(index);
    });

    const foot = el('p', 'checkin__foot', 'Skip is always available. You choose who sees your mood answers.');

    this.body.replaceChildren(step, question, list, skip, foot);
  }

  private renderClosing(): void {
    const pendingRide = this.answers[3] === 1 || this.answers[3] === 2;
    const wantsCall = this.answers[4] === 0;
    const hardDays = this.answers[2] === 2;

    const step = el('p', 'checkin__step', 'Day 14 check-in · saved');
    const panel = document.createElement('div');
    panel.className = 'checkin__close';
    panel.tabIndex = -1;
    panel.dataset.checkinFocus = '';

    const lines: string[] = ['Your answers are saved.'];
    if (hardDays) {
      lines.push('Your coping answer will be read by a clinician at your practice today by 4:30 pm.');
    }
    if (pendingRide) {
      lines.push('Your answer about the visit will be read by your care coordinator today by 4:30 pm.');
    }
    if (wantsCall) {
      lines.push('Your care coordinator will call you by Thursday at 5:00 pm.');
    }
    if (!hardDays && !pendingRide && !wantsCall) {
      lines.push('Nobody is scheduled to call you about this check-in.');
    }
    lines.push('Your next visit is Tuesday the 14th at 10:20 am.');
    lines.push(
      hardDays || pendingRide || wantsCall
        ? 'If you have not heard by then, call the practice.'
        : 'If anything changes, tap I need help now or call the practice.',
    );

    lines.forEach((line) => panel.append(el('p', '', line)));
    panel.append(el('span', 'data', 'saved 9:12 am · read by: coordinator · target 4:30 pm'));

    const foot = el(
      'p',
      'checkin__foot',
      'A closing statement says what the practice will do and by when. It never comments on the answers.',
    );

    this.body.replaceChildren(step, panel, foot);
  }

  private renderHelp(): void {
    const step = el('p', 'checkin__step', 'I need help now');
    const panel = document.createElement('div');
    panel.className = 'checkin__emergency';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Emergency instruction');

    const heavy = document.createElement('p');
    heavy.append('If you are in danger or having thoughts of harming yourself, ');
    heavy.append(bold('call 911'), ' or ', bold('call or text 988'), '.');
    panel.append(heavy);
    panel.append(el('p', 'checkin__placeholder', '[Your practice’s approved emergency instruction appears here]'));
    panel.append(
      el('p', '', 'To reach your practice now, call the number on your care plan. After hours, call the practice line; it reaches the practice’s on-call arrangement.'),
    );
    panel.append(el('span', 'data', 'urgent item created · owner: coordinator · ack target 30 min'));

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'checkin__skip';
    back.dataset.checkinBack = '';
    back.textContent = 'Back to the check-in';
    back.addEventListener('click', () => {
      this.state = { kind: 'item', index: Math.min(this.answers.length, ITEMS.length - 1) };
      this.focusNext = true;
      this.render();
      this.schedule();
    });

    const foot = el('p', 'checkin__foot', 'Sample screen. Emergency text is locked, approved by the practice, and built so no model can change it.');

    this.body.replaceChildren(step, panel, back, foot);
  }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function bold(text: string): HTMLElement {
  const node = document.createElement('strong');
  node.textContent = text;
  return node;
}

function must<T>(value: T | null, what: string): T {
  if (value === null) throw new Error(`Check-in mock: missing ${what}`);
  return value;
}
