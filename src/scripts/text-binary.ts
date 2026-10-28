import { convertBinary } from './text-binary-core';

type Translator = (key: string) => string;

export function setupTextBinary(t: Translator) {
  if (!document.getElementById('text-binary-tool')) return;
  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const mode = get<HTMLSelectElement>('binary-mode');
  const input = get<HTMLTextAreaElement>('binary-input');
  const output = get<HTMLTextAreaElement>('binary-output');
  const feedback = get<HTMLElement>('binary-feedback');
  const copy = get<HTMLButtonElement>('binary-copy');
  let revision = 0;
  function reset() {
    revision++;
    output.value = '';
    output.dir = mode.value === 'decode' ? 'auto' : 'ltr';
    input.dir = mode.value === 'decode' ? 'ltr' : 'auto';
    copy.disabled = true;
    feedback.textContent = '';
    feedback.classList.remove('error');
  }
  input.addEventListener('input', reset);
  mode.addEventListener('change', reset);
  get<HTMLButtonElement>('binary-clear').addEventListener('click', () => {
    mode.value = 'encode';
    input.value = '';
    reset();
  });
  get<HTMLButtonElement>('binary-convert').addEventListener('click', () => {
    reset();
    try {
      output.value = convertBinary(input.value, mode.value as 'encode' | 'decode');
      copy.disabled = false;
      feedback.textContent = t('ready');
    } catch {
      feedback.textContent = t('binaryInvalid');
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
