/**
 * Contact / interest form handler. No backend: when the form's data-endpoint is empty the
 * submission opens a mailto: with the fields in the body and shows an inline note. When an
 * endpoint is set (VITE_FORM_ENDPOINT at build time) the fields are POSTed as JSON.
 *
 * Without JavaScript the markup still works safely: the form posts to a mailto: action as
 * text/plain (never a GET that would put the fields in a URL), and native required-field
 * validation applies because novalidate is set here, after the script has mounted.
 *
 * Markup contract (contact.html):
 *   <form class="form" data-form="pilot" data-endpoint="" data-mailto="hello@hellonestwell.com"
 *         data-subject="Pilot conversation" action="mailto:..." method="post" enctype="text/plain">
 *     <p class="form__legend">All fields are required unless marked optional.</p>
 *     .field > label.field__label[for] + .field__input[name][data-label] (+ .field__hint[id])
 *     <p class="form__note" data-form-note role="status" aria-live="polite" hidden></p>
 *   </form>
 */

/** Keeps the mailto: URL under the ~2,000-character limit some mail handlers enforce. */
export const MAILTO_LIMIT = 1800;

export function mountForms(): void {
  const endpointFromEnv = (import.meta.env.VITE_FORM_ENDPOINT as string | undefined) ?? '';
  document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach((form) => {
    if (!form.dataset.endpoint || form.dataset.endpoint.startsWith('%')) {
      form.dataset.endpoint = endpointFromEnv;
    }
    form.noValidate = true;
    linkHints(form);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      void submit(form);
    });
    form.addEventListener('input', (event) => clearError(event.target));
    form.addEventListener('change', (event) => clearError(event.target));
  });
}

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function isControl(node: EventTarget | Element | null): node is Control {
  return node instanceof HTMLInputElement || node instanceof HTMLSelectElement || node instanceof HTMLTextAreaElement;
}

function controls(form: HTMLFormElement): Control[] {
  return Array.from(form.elements).filter(isControl);
}

/** Point each control's aria-describedby at its hint, so the hint is read with the field. */
function linkHints(form: HTMLFormElement): void {
  controls(form).forEach((control) => {
    const hint = control.closest('.field')?.querySelector<HTMLElement>('.field__hint');
    if (!hint || !control.id) return;
    if (!hint.id) hint.id = `${control.id}-hint`;
    addDescribedBy(control, hint.id);
  });
}

function addDescribedBy(control: Control, id: string): void {
  const ids = new Set((control.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean));
  ids.add(id);
  control.setAttribute('aria-describedby', Array.from(ids).join(' '));
}

function removeDescribedBy(control: Control, id: string): void {
  const ids = (control.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((x) => x && x !== id);
  if (ids.length) control.setAttribute('aria-describedby', ids.join(' '));
  else control.removeAttribute('aria-describedby');
}

function errorMessage(control: Control): string {
  if (control instanceof HTMLInputElement && control.type === 'checkbox') return 'Please tick this box to confirm.';
  if (control.validity.valueMissing) {
    return control instanceof HTMLSelectElement ? 'Please choose one.' : 'Please fill in this field.';
  }
  if (control.validity.typeMismatch) return 'Please enter an email address, like name@practice.org.';
  return control.validationMessage || 'Please check this field.';
}

function showError(control: Control): void {
  const id = `${control.id}-error`;
  control.setAttribute('aria-invalid', 'true');
  const field = control.closest('.field');
  let error = field?.querySelector<HTMLElement>('.field__error') ?? null;
  if (!error && field) {
    error = document.createElement('span');
    error.className = 'field__error';
    error.id = id;
    field.append(error);
  }
  if (error) {
    error.textContent = errorMessage(control);
    addDescribedBy(control, error.id);
  }
}

function clearError(target: EventTarget | null): void {
  if (!isControl(target) || target.getAttribute('aria-invalid') !== 'true') return;
  if (!target.checkValidity()) return;
  target.removeAttribute('aria-invalid');
  const error = target.closest('.field')?.querySelector<HTMLElement>('.field__error');
  if (error) {
    removeDescribedBy(target, error.id);
    error.remove();
  }
}

async function submit(form: HTMLFormElement): Promise<void> {
  const note = form.querySelector<HTMLElement>('[data-form-note]');
  const setNote = (text: string, isError = false): void => {
    if (!note) return;
    note.setAttribute('role', isError ? 'alert' : 'status');
    note.textContent = text;
    note.hidden = false;
    note.classList.toggle('form__note--error', isError);
  };

  const invalid = controls(form).filter((control) => !control.checkValidity());
  controls(form).forEach((control) => clearError(control));
  if (invalid.length > 0) {
    invalid.forEach(showError);
    setNote(
      invalid.length === 1
        ? 'One field needs attention. All fields are required unless marked optional.'
        : `${invalid.length} fields need attention. All fields are required unless marked optional.`,
      true,
    );
    invalid[0]!.focus();
    return;
  }

  const fields = collect(form);
  const endpoint = form.dataset.endpoint ?? '';
  const subject = form.dataset.subject ?? 'NestWell website message';
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');

  if (endpoint) {
    button?.setAttribute('disabled', '');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ subject, ...fields }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.reset();
      setNote('Thank you. We read every message and reply from hello@hellonestwell.com within a few business days.');
    } catch {
      setNote('The message could not be sent. Please email hello@hellonestwell.com directly.', true);
    } finally {
      button?.removeAttribute('disabled');
    }
    return;
  }

  const to = form.dataset.mailto ?? 'hello@hellonestwell.com';
  const { href, truncated } = buildMailto(to, subject, fields);
  window.location.href = href;
  setNote(
    truncated
      ? `Your email app should open with this message addressed to ${to}. The message was shortened to fit; please paste the rest into the email before sending. Please do not include health information.`
      : `Your email app should open with this message addressed to ${to}. If it did not, copy the fields into an email to that address. Please do not include health information.`,
  );
}

/** Builds the mailto: URL, shortening the longest free-text value until it fits the limit. */
export function buildMailto(
  to: string,
  subject: string,
  fields: Record<string, string>,
  limit = MAILTO_LIMIT,
): { href: string; truncated: boolean } {
  const entries = Object.entries(fields);
  const make = (list: [string, string][]): string => {
    const body = list.map(([key, value]) => `${key}: ${value}`).join('\n');
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const originals = entries.map(([, value]) => value);
  const lengths = originals.map((value) => value.length);
  let href = make(entries);
  let truncated = false;
  while (href.length > limit) {
    let longest = 0;
    lengths.forEach((length, i) => {
      if (length > lengths[longest]!) longest = i;
    });
    if (lengths[longest]! <= 20) break;
    // Encoded characters can take several bytes each; cut at least 10 characters per pass.
    const overshoot = href.length - limit;
    lengths[longest] = Math.max(20, lengths[longest]! - Math.max(10, Math.ceil(overshoot / 3)));
    entries[longest] = [entries[longest]![0], `${originals[longest]!.slice(0, lengths[longest]).trimEnd()} [shortened]`];
    truncated = true;
    href = make(entries);
  }
  return { href, truncated };
}

function collect(form: HTMLFormElement): Record<string, string> {
  const out: Record<string, string> = {};
  controls(form).forEach((control) => {
    if (!control.name) return;
    if (control instanceof HTMLInputElement && control.type === 'checkbox') {
      if (control.checked) out[labelFor(control)] = 'yes';
      return;
    }
    const value = control.value.trim();
    if (value) out[labelFor(control)] = value;
  });
  return out;
}

/** A short data-label wins over the visible label text, which can be a full sentence. */
function labelFor(control: Control): string {
  if (control.dataset.label) return control.dataset.label;
  const label = control.id ? control.ownerDocument.querySelector<HTMLLabelElement>(`label[for="${control.id}"]`) : null;
  return label?.textContent?.replace(/\s+/g, ' ').replace(/\(optional\)/i, '').trim() || control.name;
}
