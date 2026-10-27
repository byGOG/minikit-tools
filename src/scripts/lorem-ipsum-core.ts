const WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');

export function generateLoremIpsum(paragraphs: number, wordsPerParagraph: number): string {
  if (!Number.isInteger(paragraphs) || paragraphs < 1 || paragraphs > 50 ||
      !Number.isInteger(wordsPerParagraph) || wordsPerParagraph < 5 || wordsPerParagraph > 200) {
    throw new RangeError('Expected 1–50 paragraphs and 5–200 words per paragraph');
  }
  return Array.from({ length: paragraphs }, (_, paragraph) => {
    const words = Array.from({ length: wordsPerParagraph }, (_, index) =>
      WORDS[(paragraph * wordsPerParagraph + index) % WORDS.length]);
    words[0] = words[0][0].toUpperCase() + words[0].slice(1);
    return words.join(' ') + '.';
  }).join('\n\n');
}
