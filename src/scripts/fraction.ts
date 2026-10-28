import { calculateFraction } from './fraction-core';

type Translator = (key: string) => string;

export function setupFractionCalculator(t: Translator) {
  if (!document.getElementById('fraction-tool')) return;
  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const inputs = ['a', 'b', 'c', 'd'].map(id => get<HTMLInputElement>(`fraction-${id}`));
  const operation = get<HTMLSelectElement>('fraction-operation');
  const output = get<HTMLTextAreaElement>('fraction-output');
  const feedback = get<HTMLElement>('fraction-feedback');
  const copy = get<HTMLButtonElement>('fraction-copy');
  let revision = 0;
  function reset() {
    revision++;
    output.value = '';
    copy.disabled = true;
    feedback.textContent = '';
    feedback.classList.remove('error');
  }
  for (const input of inputs) input.addEventListener('input', reset);
  operation.addEventListener('change', reset);
  get<HTMLButtonElement>('fraction-clear').addEventListener('click', () => {
    [1, 2, 1, 3].forEach((value, index) => { inputs[index].value = String(value); });
    operation.value = 'add';
    reset();
  });
  get<HTMLButtonElement>('fraction-calculate').addEventListener('click', () => {
    reset();
    const values = inputs.map(input => /^[+-]?\d+$/.test(input.value) ? Number(input.value) : NaN);
    try {
      output.value = calculateFraction(values[0], values[1], values[2], values[3], operation.value as 'add' | 'subtract' | 'multiply' | 'divide').text;
      copy.disabled = false;
      feedback.textContent = t('ready');
    } catch {
      feedback.textContent = t('fractionInvalid');
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
