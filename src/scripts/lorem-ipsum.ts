import { generateLoremIpsum } from './lorem-ipsum-core';

type Translator = (key: string) => string;

export function setupLoremIpsum(t: Translator) {
  if (!document.getElementById('lorem-ipsum-tool')) return;
  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const paragraphs = get<HTMLInputElement>('lorem-paragraphs');
  const words = get<HTMLInputElement>('lorem-words');
  const output = get<HTMLTextAreaElement>('lorem-output');
  const feedback = get<HTMLElement>('lorem-feedback');
  const copy = get<HTMLButtonElement>('lorem-copy');
  let revision = 0;

  function reset() {
    revision++;
    output.value = '';
    copy.disabled = true;
    feedback.textContent = '';
    feedback.classList.remove('error');
  }
  paragraphs.addEventListener('input', reset);
  words.addEventListener('input', reset);
  get<HTMLButtonElement>('lorem-clear').addEventListener('click', () => {
    paragraphs.value = '3';
    words.value = '50';
    reset();
  });
  get<HTMLButtonElement>('lorem-generate').addEventListener('click', () => {
    reset();
    try {
      const count = paragraphs.value.trim() ? Number(paragraphs.value) : NaN;
      const length = words.value.trim() ? Number(words.value) : NaN;
      output.value = generateLoremIpsum(count, length);
      copy.disabled = false;
      feedback.textContent = t('ready');
    } catch {
      feedback.textContent = t('loremInvalid');
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
