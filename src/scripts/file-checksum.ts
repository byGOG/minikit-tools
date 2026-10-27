import { MAX_FILE_BYTES, normalizeExpectedHash, sha256File } from './file-checksum-core';

type Translator = (key: string) => string;

export function setupFileChecksum(t: Translator) {
  if (!document.getElementById('file-checksum-tool')) return;
  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const fileInput = get<HTMLInputElement>('filehash-file');
  const expectedInput = get<HTMLInputElement>('filehash-expected');
  const apply = get<HTMLButtonElement>('filehash-apply');
  const output = get<HTMLTextAreaElement>('filehash-output');
  const feedback = get<HTMLElement>('filehash-feedback');
  const copy = get<HTMLButtonElement>('filehash-copy');
  let revision = 0;

  const validFile = (file: File | undefined): file is File =>
    Boolean(file && Number.isInteger(file.size) && file.size >= 0 && file.size <= MAX_FILE_BYTES);

  function reset() {
    revision++;
    output.value = '';
    copy.disabled = true;
    feedback.textContent = '';
    feedback.classList.remove('error');
    apply.disabled = !validFile(fileInput.files?.[0]);
    return revision;
  }

  function error(key: string) {
    feedback.textContent = t(key);
    feedback.classList.add('error');
  }

  fileInput.addEventListener('change', () => {
    reset();
    const file = fileInput.files?.[0];
    if (file && !validFile(file)) error('fileHashInvalidFile');
  });
  expectedInput.addEventListener('input', reset);
  get<HTMLButtonElement>('filehash-clear').addEventListener('click', () => {
    fileInput.value = '';
    expectedInput.value = '';
    reset();
  });

  apply.addEventListener('click', async () => {
    const ticket = reset();
    const file = fileInput.files?.[0];
    if (!validFile(file)) { error('fileHashInvalidFile'); return; }
    let expected: string | null;
    try { expected = normalizeExpectedHash(expectedInput.value); }
    catch { error('fileHashInvalidExpected'); return; }
    apply.disabled = true;
    feedback.textContent = t('fileHashWorking');
    try {
      const hash = await sha256File(file);
      if (ticket !== revision) return;
      output.value = hash;
      copy.disabled = false;
      const mismatch = expected !== null && hash !== expected;
      feedback.textContent = t(expected === null ? 'ready' : mismatch ? 'fileHashMismatch' : 'fileHashMatch');
      feedback.classList.toggle('error', mismatch);
    } catch {
      if (ticket === revision) error('fileHashFailed');
    } finally {
      if (ticket === revision) apply.disabled = !validFile(fileInput.files?.[0]);
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
