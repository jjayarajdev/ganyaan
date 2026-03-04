import { nanoid } from 'nanoid';
import type { PracticeProblem } from '../shared/types';

export function generateProblems(chapterId: string, insightId: string, scaffoldingLevel: number): PracticeProblem[] {
  const generators = PROBLEM_GENERATORS[chapterId];
  if (!generators) return [];
  const generator = generators[insightId];
  if (!generator) return [];

  return generator(scaffoldingLevel);
}

type ProblemGenerator = (scaffoldingLevel: number) => PracticeProblem[];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeProblem(chapterId: string, insightId: string, question: string, correctAnswer: string, difficulty: number, hints?: string[]): PracticeProblem {
  return { id: nanoid(), chapterId, insightId, question, correctAnswer, difficulty, hints };
}

// Scale number ranges by scaffolding level (higher scaffolding = easier numbers)
function numRange(scaffoldingLevel: number): [number, number] {
  if (scaffoldingLevel >= 3) return [2, 10];
  if (scaffoldingLevel >= 2) return [2, 20];
  return [2, 50];
}

const PROBLEM_GENERATORS: Record<string, Record<string, ProblemGenerator>> = {
  'ch7-fractions': {
    'fraction-as-part': (level) => {
      const problems: PracticeProblem[] = [];
      const [, max] = numRange(level);
      for (let i = 0; i < 5; i++) {
        const whole = randInt(4, Math.min(max, 12));
        const part = randInt(1, whole - 1);
        problems.push(makeProblem('ch7-fractions', 'fraction-as-part',
          `What fraction of ${whole} is ${part}?`,
          `${part}/${whole}`, level,
          [`A fraction shows part out of whole`, `The bottom number (denominator) is the total: ${whole}`]
        ));
      }
      return problems;
    },
    'equivalent-fractions': (level) => {
      const problems: PracticeProblem[] = [];
      const pairs = [[1, 2, 2, 4], [1, 3, 2, 6], [2, 3, 4, 6], [3, 4, 6, 8], [1, 5, 2, 10]];
      for (let i = 0; i < Math.min(5, pairs.length); i++) {
        const [n1, d1, n2, d2] = pairs[i];
        problems.push(makeProblem('ch7-fractions', 'equivalent-fractions',
          `Is ${n1}/${d1} equal to ${n2}/${d2}? (yes/no)`,
          'yes', level,
          [`Multiply both numerator and denominator by the same number`]
        ));
      }
      return problems;
    },
    'comparing-fractions': (level) => {
      const problems: PracticeProblem[] = [];
      const comparisons = [
        ['1/3', '1/5', '1/3'], ['2/3', '3/4', '3/4'], ['1/2', '2/5', '1/2'],
        ['3/5', '2/3', '2/3'], ['1/4', '1/6', '1/4'],
      ];
      for (let i = 0; i < 5; i++) {
        const [a, b, answer] = comparisons[i % comparisons.length];
        problems.push(makeProblem('ch7-fractions', 'comparing-fractions',
          `Which is bigger: ${a} or ${b}?`,
          answer, level,
          [`To compare fractions, find a common denominator`]
        ));
      }
      return problems;
    },
    'adding-subtracting': (level) => {
      const problems: PracticeProblem[] = [];
      const sums = [
        ['1/4', '1/4', '2/4'], ['1/3', '1/3', '2/3'], ['1/6', '2/6', '3/6'],
        ['2/5', '1/5', '3/5'], ['1/8', '3/8', '4/8'],
      ];
      for (let i = 0; i < 5; i++) {
        const [a, b, answer] = sums[i % sums.length];
        problems.push(makeProblem('ch7-fractions', 'adding-subtracting',
          `What is ${a} + ${b}?`,
          answer, level,
          [`When denominators are the same, just add the numerators`]
        ));
      }
      return problems;
    },
    'mixed-numbers': (level) => {
      const problems: PracticeProblem[] = [];
      const conversions = [
        ['5/3', '1 2/3'], ['7/4', '1 3/4'], ['9/5', '1 4/5'],
        ['11/6', '1 5/6'], ['7/2', '3 1/2'],
      ];
      for (let i = 0; i < 5; i++) {
        const [improper, mixed] = conversions[i % conversions.length];
        problems.push(makeProblem('ch7-fractions', 'mixed-numbers',
          `Convert ${improper} to a mixed number.`,
          mixed, level,
          [`Divide the numerator by the denominator`, `The quotient is the whole number, remainder is the new numerator`]
        ));
      }
      return problems;
    },
  },
  'ch1-patterns': {
    'number-patterns': (level) => {
      const problems: PracticeProblem[] = [];
      const sequences = [
        { seq: '2, 4, 6, 8, ?', answer: '10', rule: 'add 2' },
        { seq: '5, 10, 15, 20, ?', answer: '25', rule: 'add 5' },
        { seq: '3, 6, 9, 12, ?', answer: '15', rule: 'add 3' },
        { seq: '1, 3, 5, 7, ?', answer: '9', rule: 'add 2 (odd numbers)' },
        { seq: '10, 20, 30, 40, ?', answer: '50', rule: 'add 10' },
      ];
      for (let i = 0; i < 5; i++) {
        const s = sequences[i % sequences.length];
        problems.push(makeProblem('ch1-patterns', 'number-patterns',
          `What comes next: ${s.seq}`,
          s.answer, level,
          [`Find the pattern: ${s.rule}`]
        ));
      }
      return problems;
    },
    'square-numbers': (level) => {
      const problems: PracticeProblem[] = [];
      const nums = level >= 3 ? [2, 3, 4, 5, 6] : [3, 5, 7, 8, 9];
      for (const n of nums) {
        problems.push(makeProblem('ch1-patterns', 'square-numbers',
          `What is ${n} x ${n}? (${n} squared)`,
          String(n * n), level,
          [`A square number is a number multiplied by itself`]
        ));
      }
      return problems;
    },
    'triangular-numbers': (level) => {
      const problems: PracticeProblem[] = [];
      const seq = [1, 3, 6, 10, 15, 21, 28];
      for (let i = 0; i < 5; i++) {
        problems.push(makeProblem('ch1-patterns', 'triangular-numbers',
          `What is the ${i + 3}rd triangular number? (The sequence starts: 1, 3, 6, ...)`,
          String(seq[i + 2]), level,
          [`Each triangular number adds the next counting number`, `T(n) = 1 + 2 + 3 + ... + n`]
        ));
      }
      return problems;
    },
    'shape-patterns': (level) => {
      const problems: PracticeProblem[] = [];
      const shapes = ['circle, square, circle, square, ?', 'triangle, triangle, square, triangle, triangle, ?', 'star, circle, star, circle, ?'];
      const answers = ['circle', 'square', 'star'];
      for (let i = 0; i < Math.min(5, shapes.length); i++) {
        problems.push(makeProblem('ch1-patterns', 'shape-patterns',
          `What comes next: ${shapes[i % shapes.length]}`,
          answers[i % answers.length], level,
          [`Look for repeating groups of shapes`]
        ));
      }
      return problems;
    },
    'sequence-relations': (level) => {
      const problems: PracticeProblem[] = [];
      problems.push(makeProblem('ch1-patterns', 'sequence-relations',
        `The 4th square number is 16 and the 4th triangular number is 10. What is their sum?`,
        '26', level,
        [`Square numbers: 1, 4, 9, 16...`, `Triangular numbers: 1, 3, 6, 10...`]
      ));
      problems.push(makeProblem('ch1-patterns', 'sequence-relations',
        `Is 36 both a square number and a triangular number? (yes/no)`,
        'yes', level,
        [`6 x 6 = 36 (square)`, `1+2+3+4+5+6+7+8 = 36 (triangular)`]
      ));
      return problems;
    },
  },
  'ch5-prime-time': {
    'factors-multiples': (level) => {
      const problems: PracticeProblem[] = [];
      const [, max] = numRange(level);
      for (let i = 0; i < 5; i++) {
        const n = randInt(6, Math.min(max, 24));
        const factors: number[] = [];
        for (let f = 1; f <= n; f++) { if (n % f === 0) factors.push(f); }
        problems.push(makeProblem('ch5-prime-time', 'factors-multiples',
          `List all factors of ${n}.`,
          factors.join(', '), level,
          [`A factor divides the number exactly`, `Start from 1 and check each number`]
        ));
      }
      return problems;
    },
    'prime-numbers': (level) => {
      const problems: PracticeProblem[] = [];
      const nums = level >= 3 ? [7, 9, 11, 15, 4] : [23, 27, 31, 33, 37];
      for (const n of nums) {
        const isPrime = isPrimeNum(n);
        problems.push(makeProblem('ch5-prime-time', 'prime-numbers',
          `Is ${n} prime or composite?`,
          isPrime ? 'prime' : 'composite', level,
          [`A prime number has exactly 2 factors: 1 and itself`]
        ));
      }
      return problems;
    },
    'co-primes': (level) => {
      const problems: PracticeProblem[] = [];
      const pairs: [number, number, string][] = [[8, 15, 'yes'], [6, 9, 'no'], [4, 9, 'yes'], [10, 21, 'yes'], [12, 18, 'no']];
      for (let i = 0; i < 5; i++) {
        const [a, b, answer] = pairs[i % pairs.length];
        problems.push(makeProblem('ch5-prime-time', 'co-primes',
          `Are ${a} and ${b} co-prime? (yes/no)`,
          answer, level,
          [`Two numbers are co-prime if their only common factor is 1`]
        ));
      }
      return problems;
    },
    'prime-factorisation': (level) => {
      const problems: PracticeProblem[] = [];
      const nums = level >= 3 ? [12, 18, 20, 24, 30] : [36, 48, 56, 60, 72];
      for (const n of nums) {
        const factors = primeFactors(n);
        problems.push(makeProblem('ch5-prime-time', 'prime-factorisation',
          `Find the prime factorisation of ${n}.`,
          factors.join(' x '), level,
          [`Divide by the smallest prime factor first`, `Keep dividing until you reach 1`]
        ));
      }
      return problems;
    },
    'divisibility-rules': (level) => {
      const problems: PracticeProblem[] = [];
      const tests: [number, number, string][] = [[124, 2, 'yes'], [135, 5, 'yes'], [246, 3, 'yes'], [130, 9, 'no'], [250, 10, 'no']];
      for (let i = 0; i < 5; i++) {
        const [num, div, answer] = tests[i % tests.length];
        problems.push(makeProblem('ch5-prime-time', 'divisibility-rules',
          `Is ${num} divisible by ${div}? (yes/no)`,
          answer, level,
          [`Divisibility by ${div}: check the quick rule`]
        ));
      }
      return problems;
    },
  },
};

function isPrimeNum(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function primeFactors(n: number): number[] {
  const factors: number[] = [];
  let d = 2;
  while (n > 1) {
    while (n % d === 0) {
      factors.push(d);
      n /= d;
    }
    d++;
  }
  return factors;
}
