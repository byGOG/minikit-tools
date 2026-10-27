import { createBoxShadow } from './box-shadow-core';
import { normalizeHexColor } from './gradient-core.ts';

type Translator = (key: string) => string;

export function setupBoxShadow(t: Translator) {
  if (!document.getElementById('css-shadow-tool')) return;
  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const numeric = { x: get<HTMLInputElement>('shadow-x'), y: get<HTMLInputElement>('shadow-y'), blur: get<HTMLInputElement>('shadow-blur'), spread: get<HTMLInputElement>('shadow-spread'), opacity: get<HTMLInputElement>('shadow-opacity') };
  const color = get<HTMLInputElement>('shadow-color');
  const picker = get<HTMLInputElement>('shadow-color-picker');
  const inset = get<HTMLInputElement>('shadow-inset');
  const target = get<HTMLElement>('shadow-target');
  const output = get<HTMLTextAreaElement>('shadow-output');
  const feedback = get<HTMLElement>('shadow-feedback');
  const copy = get<HTMLButtonElement>('shadow-copy');
  let revision = 0;
  function reset() {
    revision++;
    output.value = '';
    copy.disabled = true;
    feedback.textContent = '';
    feedback.classList.remove('error');
    target.style.boxShadow = 'none';
  }
  for (const input of Object.values(numeric)) input.addEventListener('input', reset);
  inset.addEventListener('input', reset);
  inset.addEventListener('change', reset);
  color.addEventListener('input', () => {
    reset();
    try { picker.value = normalizeHexColor(color.value); } catch { /* Preserve invalid input for correction. */ }
  });
  picker.addEventListener('input', () => { color.value = picker.value; reset(); });
  picker.addEventListener('change', () => { color.value = picker.value; reset(); });
  get<HTMLButtonElement>('shadow-clear').addEventListener('click', () => {
    for (const [key, value] of Object.entries({ x: '0', y: '8', blur: '24', spread: '0', opacity: '20' })) numeric[key as keyof typeof numeric].value = value;
    color.value = picker.value = '#000000';
    inset.checked = false;
    reset();
  });
  get<HTMLButtonElement>('shadow-generate').addEventListener('click', () => {
    reset();
    const number = (input: HTMLInputElement) => input.value.trim() ? Number(input.value) : NaN;
    try {
      const result = createBoxShadow({ x: number(numeric.x), y: number(numeric.y), blur: number(numeric.blur), spread: number(numeric.spread), opacity: number(numeric.opacity), color: color.value, inset: inset.checked });
      target.style.boxShadow = result.boxShadow;
      output.value = result.css;
      copy.disabled = false;
      feedback.textContent = t('ready');
    } catch {
      feedback.textContent = t('shadowInvalid');
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
