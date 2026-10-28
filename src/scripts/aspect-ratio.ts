import { calculateAspectRatio } from './aspect-ratio-core';

type Translator = (key: string) => string;

export function setupAspectRatio(t: Translator) {
  if (!document.getElementById('aspect-ratio-tool')) return;
  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const width = get<HTMLInputElement>('aspect-width');
  const height = get<HTMLInputElement>('aspect-height');
  const output = get<HTMLTextAreaElement>('aspect-output');
  const feedback = get<HTMLElement>('aspect-feedback');
  const copy = get<HTMLButtonElement>('aspect-copy');
  let revision = 0;
  function reset() {
    revision++;
    output.value = '';
    copy.disabled = true;
    feedback.textContent = '';
    feedback.classList.remove('error');
  }
  width.addEventListener('input', reset);
  height.addEventListener('input', reset);
  get<HTMLButtonElement>('aspect-clear').addEventListener('click', () => {
    width.value = '1920';
    height.value = '1080';
    reset();
  });
  get<HTMLButtonElement>('aspect-calculate').addEventListener('click', () => {
    reset();
    const number = (input: HTMLInputElement) => input.value.trim() ? Number(input.value) : NaN;
    try {
      output.value = calculateAspectRatio(number(width), number(height)).ratio;
      copy.disabled = false;
      feedback.textContent = t('ready');
    } catch {
      feedback.textContent = t('aspectInvalid');
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
