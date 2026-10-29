import { generateRandomNumbers } from './random-number-core';

type Translator = (key: string) => string;

export function setupRandomNumber(t: Translator) {
  if (!document.getElementById('random-number-tool')) return;
  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const inputs = ['min', 'max', 'count'].map(id => get<HTMLInputElement>(`random-number-${id}`));
  const output = get<HTMLTextAreaElement>('random-number-output');
  const feedback = get<HTMLElement>('random-number-feedback');
  const copy = get<HTMLButtonElement>('random-number-copy');
  let revision = 0;
  function reset() {
    revision++;
    output.value = '';
    copy.disabled = true;
    feedback.textContent = '';
    feedback.classList.remove('error');
  }
  for (const input of inputs) input.addEventListener('input', reset);
  get<HTMLButtonElement>('random-number-clear').addEventListener('click', () => {
    [1, 100, 10].forEach((value, index) => { inputs[index].value = String(value); });
    reset();
  });
  get<HTMLButtonElement>('random-number-generate').addEventListener('click', () => {
    reset();
    const values = inputs.map(input => /^[+-]?\d+$/.test(input.value) ? Number(input.value) : NaN);
    try {
      output.value = generateRandomNumbers(values[0], values[1], values[2]).join('\n');
      copy.disabled = false;
      feedback.textContent = t('ready');
    } catch (error) {
      feedback.textContent = t(error instanceof RangeError ? 'randomNumberInvalid' : 'randomNumberUnavailable');
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
