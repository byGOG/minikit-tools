import { convertRoman } from './roman-numerals-core';

type Translator = (key: string) => string;

export function setupRomanNumerals(t: Translator) {
  if (!document.getElementById('roman-numeral-tool')) return;
  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const mode = get<HTMLSelectElement>('roman-mode');
  const input = get<HTMLInputElement>('roman-input');
  const output = get<HTMLTextAreaElement>('roman-output');
  const feedback = get<HTMLElement>('roman-feedback');
  const copy = get<HTMLButtonElement>('roman-copy');
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
  get<HTMLButtonElement>('roman-clear').addEventListener('click', () => {
    mode.value = 'to-roman';
    input.value = '';
    reset();
  });
  get<HTMLButtonElement>('roman-convert').addEventListener('click', () => {
    reset();
    try {
      output.value = convertRoman(input.value, mode.value as 'to-roman' | 'to-decimal');
      copy.disabled = false;
      feedback.textContent = t('ready');
    } catch {
      feedback.textContent = t('romanInvalid');
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
