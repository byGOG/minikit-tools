import { decimalToFraction } from './decimal-fraction-core';

type Translator = (key: string) => string;

export function setupDecimalFraction(t: Translator) {
  if (!document.getElementById('decimal-fraction-tool')) return;
  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const input = get<HTMLInputElement>('decimal-fraction-input');
  const output = get<HTMLTextAreaElement>('decimal-fraction-output');
  const feedback = get<HTMLElement>('decimal-fraction-feedback');
  const copy = get<HTMLButtonElement>('decimal-fraction-copy');
  let revision = 0;
  function reset() {
    revision++;
    output.value = '';
    copy.disabled = true;
    feedback.textContent = '';
    feedback.classList.remove('error');
  }
  input.addEventListener('input', reset);
  get<HTMLButtonElement>('decimal-fraction-clear').addEventListener('click', () => {
    input.value = '0.125';
    reset();
  });
  get<HTMLButtonElement>('decimal-fraction-convert').addEventListener('click', () => {
    reset();
    try {
      output.value = decimalToFraction(input.value).text;
      copy.disabled = false;
      feedback.textContent = t('ready');
    } catch {
      feedback.textContent = t('decimalFractionInvalid');
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
