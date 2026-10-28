import { createBorderRadius } from './border-radius-core';

type Translator = (key: string) => string;

export function setupBorderRadius(t: Translator) {
  if (!document.getElementById('css-radius-tool')) return;
  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const corners = ['top-left', 'top-right', 'bottom-right', 'bottom-left'].map(corner => get<HTMLInputElement>(`radius-${corner}`));
  const target = get<HTMLElement>('radius-target');
  const output = get<HTMLTextAreaElement>('radius-output');
  const feedback = get<HTMLElement>('radius-feedback');
  const copy = get<HTMLButtonElement>('radius-copy');
  let revision = 0;
  function reset() {
    revision++;
    output.value = '';
    copy.disabled = true;
    feedback.textContent = '';
    feedback.classList.remove('error');
    target.style.borderRadius = '0px';
  }
  for (const input of corners) input.addEventListener('input', reset);
  get<HTMLButtonElement>('radius-clear').addEventListener('click', () => {
    [16, 32, 48, 0].forEach((value, index) => { corners[index].value = String(value); });
    reset();
  });
  get<HTMLButtonElement>('radius-generate').addEventListener('click', () => {
    reset();
    const values = corners.map(input => input.value.trim() ? Number(input.value) : NaN);
    try {
      const result = createBorderRadius(values[0], values[1], values[2], values[3]);
      target.style.borderRadius = result.borderRadius;
      output.value = result.css;
      copy.disabled = false;
      feedback.textContent = t('ready');
    } catch {
      feedback.textContent = t('radiusInvalid');
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
