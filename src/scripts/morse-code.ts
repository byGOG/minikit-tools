import { convertMorse } from './morse-code-core';

type Translator = (key: string) => string;

export function setupMorseCode(t: Translator) {
  if (!document.getElementById('morse-code-tool')) return;
  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const mode = get<HTMLSelectElement>('morse-mode');
  const input = get<HTMLTextAreaElement>('morse-input');
  const output = get<HTMLTextAreaElement>('morse-output');
  const feedback = get<HTMLElement>('morse-feedback');
  const copy = get<HTMLButtonElement>('morse-copy');
  let revision = 0;
  function reset() {
    revision++;
    output.value = '';
    copy.disabled = true;
    feedback.textContent = '';
    feedback.classList.remove('error');
  }
  input.addEventListener('input', reset);
  mode.addEventListener('change', reset);
  get<HTMLButtonElement>('morse-clear').addEventListener('click', () => {
    mode.value = 'encode';
    input.value = '';
    reset();
  });
  get<HTMLButtonElement>('morse-convert').addEventListener('click', () => {
    reset();
    try {
      output.value = convertMorse(input.value, mode.value as 'encode' | 'decode');
      copy.disabled = false;
      feedback.textContent = t('ready');
    } catch {
      feedback.textContent = t('morseInvalid');
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
