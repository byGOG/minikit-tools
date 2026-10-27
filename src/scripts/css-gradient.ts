import { createGradient, normalizeHexColor } from './gradient-core';

type Translator = (key: string) => string;

export function setupCSSGradient(t: Translator) {
  if (!document.getElementById('css-gradient-tool')) return;
  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const start = get<HTMLInputElement>('gradient-start');
  const end = get<HTMLInputElement>('gradient-end');
  const startPicker = get<HTMLInputElement>('gradient-start-picker');
  const endPicker = get<HTMLInputElement>('gradient-end-picker');
  const angle = get<HTMLInputElement>('gradient-angle');
  const preview = get<HTMLElement>('gradient-preview');
  const output = get<HTMLTextAreaElement>('gradient-output');
  const feedback = get<HTMLElement>('gradient-feedback');
  const copy = get<HTMLButtonElement>('gradient-copy');
  let revision = 0;
  function reset() {
    revision++;
    output.value = '';
    copy.disabled = true;
    feedback.textContent = '';
    feedback.classList.remove('error');
    preview.style.backgroundImage = 'none';
  }
  for (const [text, picker] of [[start, startPicker], [end, endPicker]]) {
    text.addEventListener('input', () => {
      reset();
      try { picker.value = normalizeHexColor(text.value); } catch { /* Keep invalid text visible for correction. */ }
    });
    picker.addEventListener('input', () => { text.value = picker.value; reset(); });
    picker.addEventListener('change', () => { text.value = picker.value; reset(); });
  }
  angle.addEventListener('input', reset);
  get<HTMLButtonElement>('gradient-clear').addEventListener('click', () => {
    start.value = startPicker.value = '#155c42';
    end.value = endPicker.value = '#c7f36b';
    angle.value = '90';
    reset();
  });
  get<HTMLButtonElement>('gradient-generate').addEventListener('click', () => {
    reset();
    try {
      const degrees = angle.value.trim() ? Number(angle.value) : NaN;
      const result = createGradient(start.value, end.value, degrees);
      preview.style.backgroundImage = result.backgroundImage;
      output.value = result.css;
      copy.disabled = false;
      feedback.textContent = t('ready');
    } catch {
      feedback.textContent = t('gradientInvalid');
      feedback.classList.add('error');
    }
  });
  copy.addEventListener('click', async () => {
    const value = output.value, ticket = revision;
    if (copy.disabled || !value) return;
    try {
      await navigator.clipboard.writeText(value);
      if (ticket !== revision) return;
      feedback.textContent = t('copied');
      feedback.classList.remove('error');
    } catch {
      if (ticket !== revision) return;
      output.focus(); output.select();
      feedback.textContent = t('devExtraCopyFailed');
      feedback.classList.remove('error');
    }
  });
  reset();
}
