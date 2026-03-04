/**
 * Script to generate static cache JSON files using OpenAI API.
 * Run manually: npx ts-node scripts/build-cache.ts --chapter ch7-fractions
 *
 * Supported chapters: ch1-patterns, ch5-prime-time, ch7-fractions
 * The static caches are already pre-built at data/cache/*.json.
 * This script can be used to regenerate or expand them.
 */

import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';

const CHAPTER_TOPICS: Record<string, { filename: string; topics: string[] }> = {
  'ch1-patterns': {
    filename: 'ch1-patterns-cache.json',
    topics: [
      'Number patterns', 'Even number patterns', 'Odd number patterns',
      'Skip counting patterns', 'Missing number in sequence',
      'What are square numbers', 'Square number dot patterns', 'Square number properties',
      'What are triangular numbers', 'Triangular number stacking', 'Triangular number properties',
      'Shape patterns repeating', 'Shape patterns growing', 'Shape patterns ABAB',
      'Colour and shape patterns', 'Pattern rules',
      'Relationship between sequences', 'Square and triangular number connection',
      'Fibonacci sequence patterns', 'Real life patterns',
    ],
  },
  'ch5-prime-time': {
    filename: 'ch5-prime-time-cache.json',
    topics: [
      'What are factors', 'What are multiples', 'Finding factors of a number',
      'Common factors', 'HCF and GCD',
      'What are prime numbers', 'What are composite numbers', 'Is 1 prime or composite',
      'Even prime number', 'Sieve of Eratosthenes', 'Prime number properties',
      'What are co-prime numbers', 'Co-prime examples', 'Twin primes',
      'Prime factorisation', 'Factor trees', 'Prime factorisation method',
      'Divisibility by 2', 'Divisibility by 3', 'Divisibility by 5',
      'Divisibility by 9', 'Divisibility by 10', 'Divisibility rules summary',
    ],
  },
  'ch7-fractions': {
    filename: 'fractions-cache.json',
    topics: [
      'What is a fraction', 'Numerator and denominator', 'Unit fractions',
      'Proper fractions', 'Improper fractions', 'Mixed numbers',
      'Equivalent fractions', 'Comparing fractions',
      'Adding fractions same denominator', 'Subtracting fractions same denominator',
      'Fractions on number line', 'Fractions of a collection',
      'Simplifying fractions', 'Like and unlike fractions',
      'Converting mixed to improper', 'Converting improper to mixed',
      'Real life fraction examples', 'Fractions and time',
      'Fractions and money', 'Fraction word problems',
    ],
  },
};

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Set OPENAI_API_KEY environment variable');
    process.exit(1);
  }

  const chapterArg = process.argv.find((_a, i) => process.argv[i - 1] === '--chapter') || 'ch7-fractions';
  const chapterConfig = CHAPTER_TOPICS[chapterArg];
  if (!chapterConfig) {
    console.error(`Unknown chapter: ${chapterArg}. Available: ${Object.keys(CHAPTER_TOPICS).join(', ')}`);
    process.exit(1);
  }

  console.log(`Building cache for: ${chapterArg} (${chapterConfig.topics.length} topics)`);

  const client = new OpenAI({ apiKey });
  const cache: Array<{
    keywords: string[];
    question: string;
    answer: string;
    language: string;
  }> = [];

  for (const topic of chapterConfig.topics) {
    for (const lang of ['en', 'hi'] as const) {
      const langPrompt = lang === 'hi' ? 'Respond in Hindi (Devanagari script).' : 'Respond in English.';

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a Socratic math tutor for CBSE Class 6 students. Generate a common student question about "${topic}" and a Socratic response (2-4 sentences ending with a guiding question). ${langPrompt} Also provide 3-5 keywords for matching.

Respond in JSON format:
{"keywords": ["word1", "word2"], "question": "...", "answer": "..."}`,
          },
          { role: 'user', content: `Generate a Q&A pair about: ${topic}` },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      });

      try {
        const parsed = JSON.parse(response.choices[0].message.content || '{}');
        cache.push({ ...parsed, language: lang });
        console.log(`Generated: ${topic} (${lang})`);
      } catch {
        console.error(`Failed to parse: ${topic} (${lang})`);
      }
    }
  }

  const outPath = path.join(__dirname, '..', 'data', 'cache', chapterConfig.filename);
  fs.writeFileSync(outPath, JSON.stringify(cache, null, 2));
  console.log(`\nWrote ${cache.length} entries to ${outPath}`);
}

main().catch(console.error);
