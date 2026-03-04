export interface MisconceptionPattern {
  id: string;
  chapterId: string;
  insightId: string;
  description: string;
  triggerPatterns: RegExp[];
  correctionPrompt: string;
}

export const MISCONCEPTION_CATALOG: MisconceptionPattern[] = [
  // Fractions
  {
    id: 'add-denominators',
    chapterId: 'ch7-fractions',
    insightId: 'adding-subtracting',
    description: 'Student adds both numerators AND denominators when adding fractions',
    triggerPatterns: [
      /1\/2\s*\+\s*1\/3\s*=\s*2\/5/i,
      /add.*top.*and.*bottom/i,
      /add.*numerator.*denominator/i,
    ],
    correctionPrompt: 'The student may think you add denominators when adding fractions. Use a physical example (pizza slices) to show why 1/2 + 1/3 ≠ 2/5.',
  },
  {
    id: 'bigger-denominator-bigger',
    chapterId: 'ch7-fractions',
    insightId: 'comparing-fractions',
    description: 'Student thinks a larger denominator means a larger fraction',
    triggerPatterns: [
      /1\/5\s*(?:is\s*)?(?:bigger|greater|larger|more)\s*(?:than\s*)?1\/3/i,
      /bigger.*denominator.*bigger.*fraction/i,
    ],
    correctionPrompt: 'The student may think bigger denominator = bigger fraction. Use cutting a pizza into many vs few slices to show 1/3 > 1/5.',
  },
  {
    id: 'numerator-denominator-swap',
    chapterId: 'ch7-fractions',
    insightId: 'fraction-as-part',
    description: 'Student confuses which number goes on top vs bottom',
    triggerPatterns: [
      /(?:bottom|denominator).*(?:how many|part)/i,
      /(?:top|numerator).*(?:total|whole)/i,
    ],
    correctionPrompt: 'The student may have numerator and denominator mixed up. Reinforce: denominator = total parts (bottom), numerator = parts taken (top).',
  },
  // Patterns
  {
    id: 'confusing-square-triangular',
    chapterId: 'ch1-patterns',
    insightId: 'square-numbers',
    description: 'Student confuses square numbers with triangular numbers',
    triggerPatterns: [
      /square.*1.*3.*6/i,
      /triangular.*1.*4.*9/i,
    ],
    correctionPrompt: 'The student may be confusing square (1,4,9,16) and triangular (1,3,6,10) numbers. Use dot arrangements to clarify.',
  },
  {
    id: 'wrong-sequence-rule',
    chapterId: 'ch1-patterns',
    insightId: 'number-patterns',
    description: 'Student identifies the wrong rule for a number sequence',
    triggerPatterns: [
      /(?:multiply|times).*(?:when.*add)/i,
      /(?:add|plus).*(?:when.*multiply)/i,
    ],
    correctionPrompt: 'The student is applying the wrong operation to the sequence. Help them check their rule against each pair of numbers.',
  },
  // Prime Time
  {
    id: 'one-is-prime',
    chapterId: 'ch5-prime-time',
    insightId: 'prime-numbers',
    description: 'Student thinks 1 is a prime number',
    triggerPatterns: [
      /1\s*is\s*(?:a\s*)?prime/i,
      /prime.*(?:numbers?\s*(?:are|:)).*\b1\b/i,
    ],
    correctionPrompt: 'The student thinks 1 is prime. Explain: a prime has exactly 2 factors (1 and itself). 1 only has one factor (1), so it is neither prime nor composite.',
  },
  {
    id: 'confusing-factors-multiples',
    chapterId: 'ch5-prime-time',
    insightId: 'factors-multiples',
    description: 'Student confuses factors with multiples',
    triggerPatterns: [
      /factor.*of.*\d+.*(?:is|are)\s*\d+.*(?:bigger|greater|larger)/i,
      /multiple.*(?:divides|goes into)/i,
    ],
    correctionPrompt: 'The student may be confusing factors (divides into) with multiples (multiplied by). Factors are smaller, multiples are bigger.',
  },
];

export function detectMisconception(studentMessage: string, chapterId: string): MisconceptionPattern | null {
  const patterns = MISCONCEPTION_CATALOG.filter(p => p.chapterId === chapterId);
  for (const pattern of patterns) {
    for (const regex of pattern.triggerPatterns) {
      if (regex.test(studentMessage)) {
        return pattern;
      }
    }
  }
  return null;
}
