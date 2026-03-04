import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import type { Language, InsightId, CacheEntry, StaticCacheEntry } from '../shared/types';
import { lookupDynamicCache, saveDynamicCache } from './database';

const staticCacheByChapter: Record<string, StaticCacheEntry[]> = {};

const CACHE_FILE_MAP: Record<string, string> = {
  'ch1-patterns': 'ch1-patterns-cache.json',
  'ch5-prime-time': 'ch5-prime-time-cache.json',
  'ch7-fractions': 'fractions-cache.json',
};

function loadStaticCache(chapterId: string): StaticCacheEntry[] {
  if (staticCacheByChapter[chapterId]) return staticCacheByChapter[chapterId];

  const filename = CACHE_FILE_MAP[chapterId];
  if (!filename) {
    staticCacheByChapter[chapterId] = [];
    return [];
  }

  const possiblePaths = [
    path.join(process.resourcesPath || '', 'data', 'cache', filename),
    path.join(app.getAppPath(), 'data', 'cache', filename),
    path.join(__dirname, '..', '..', 'data', 'cache', filename),
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        staticCacheByChapter[chapterId] = JSON.parse(raw);
        return staticCacheByChapter[chapterId];
      }
    } catch {
      continue;
    }
  }

  staticCacheByChapter[chapterId] = [];
  return [];
}

function makeCacheKey(language: Language, insights: InsightId[], question: string): string {
  const normalized = question.toLowerCase().trim().replace(/\s+/g, ' ');
  const sortedInsights = [...insights].sort().join(',');
  const input = `${language}|${sortedInsights}|${normalized}`;
  return crypto.createHash('md5').update(input).digest('hex');
}

function fuzzyMatch(question: string, keywords: string[]): boolean {
  if (question.trim().split(/\s+/).length < 3) return false;
  const words = question.toLowerCase().split(/\s+/);
  const matchCount = keywords.filter(kw => words.some(w => w.includes(kw.toLowerCase())));
  return matchCount.length >= Math.ceil(keywords.length * 0.6);
}

export function lookupCache(
  language: Language,
  insights: InsightId[],
  question: string,
  chapterId?: string,
): CacheEntry | null {
  // Tier 1: Dynamic cache (exact hash match) — from SQLite
  const key = makeCacheKey(language, insights, question);
  const dynamicHit = lookupDynamicCache(key);
  if (dynamicHit) return dynamicHit;

  // Tier 2: Static cache (fuzzy match) — chapter-specific
  const cacheChapterId = chapterId || 'ch7-fractions';
  const statics = loadStaticCache(cacheChapterId);
  for (const entry of statics) {
    if (entry.language === language && fuzzyMatch(question, entry.keywords)) {
      return {
        question: entry.question,
        answer: entry.answer,
        language: entry.language,
        insights: [],
        timestamp: Date.now(),
      };
    }
  }

  return null;
}

export function cacheResponse(
  language: Language,
  insights: InsightId[],
  question: string,
  answer: string,
  insightsUnlocked: InsightId[],
  chapterId?: string,
): void {
  const key = makeCacheKey(language, insights, question);
  saveDynamicCache(key, question, answer, language, insightsUnlocked, chapterId);
}
