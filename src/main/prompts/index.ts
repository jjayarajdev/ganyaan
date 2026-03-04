import { getFractionsPrompt } from './ch7-fractions';
import { getPatternsPrompt } from './ch1-patterns';
import { getPrimeTimePrompt } from './ch5-prime-time';

export const CHAPTER_PROMPTS: Record<string, () => string> = {
  'ch7-fractions': getFractionsPrompt,
  'ch1-patterns': getPatternsPrompt,
  'ch5-prime-time': getPrimeTimePrompt,
};

export function getChapterPrompt(chapterId: string): string {
  const fn = CHAPTER_PROMPTS[chapterId];
  return fn ? fn() : '';
}
