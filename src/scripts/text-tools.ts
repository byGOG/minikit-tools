export type DuplicateOptions = { ignoreCase?: boolean; trimSpaces?: boolean; locale?: string };

export function changeCase(text: string, mode: 'upper' | 'lower', locale: string): string {
  return mode === 'upper' ? text.toLocaleUpperCase(locale) : text.toLocaleLowerCase(locale);
}

export function splitLines(text: string): string[] {
  return text === '' ? [] : text.split(/\r\n|\n|\r/);
}

export function removeDuplicateLines(text: string, options: DuplicateOptions = {}) {
  const lines = splitLines(text);
  const seen = new Set<string>();
  const unique = lines.filter((line) => {
    let key = (options.trimSpaces ? line.trim() : line).normalize('NFC');
    if (options.ignoreCase) key = key.toLocaleLowerCase(options.locale ?? 'en');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { text: unique.join('\n'), removed: lines.length - unique.length };
}

export function sortLines(text: string, locale: string, descending = false): string {
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'variant' });
  return splitLines(text).sort((a, b) => descending ? collator.compare(b, a) : collator.compare(a, b)).join('\n');
}
