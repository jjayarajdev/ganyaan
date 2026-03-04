/**
 * Script to generate fractions-cache.json using OpenAI API.
 * Run manually: npx ts-node scripts/build-cache.ts
 *
 * The static cache is already pre-built at data/cache/fractions-cache.json.
 * This script can be used to regenerate or expand it.
 */

import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';

const TOPICS = [
  'What is a fraction',
  'Numerator and denominator',
  'Unit fractions',
  'Proper fractions',
  'Improper fractions',
  'Mixed numbers',
  'Equivalent fractions',
  'Comparing fractions',
  'Adding fractions same denominator',
  'Subtracting fractions same denominator',
  'Fractions on number line',
  'Fractions of a collection',
  'Simplifying fractions',
  'Like and unlike fractions',
  'Converting mixed to improper',
  'Converting improper to mixed',
  'Real life fraction examples',
  'Fractions and time',
  'Fractions and money',
  'Fraction word problems',
];

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Set OPENAI_API_KEY environment variable');
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });
  const cache: Array<{
    keywords: string[];
    question: string;
    answer: string;
    language: string;
  }> = [];

  for (const topic of TOPICS) {
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

  const outPath = path.join(__dirname, '..', 'data', 'cache', 'fractions-cache.json');
  fs.writeFileSync(outPath, JSON.stringify(cache, null, 2));
  console.log(`\nWrote ${cache.length} entries to ${outPath}`);
}

main().catch(console.error);
