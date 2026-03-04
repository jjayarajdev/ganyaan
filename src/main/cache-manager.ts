import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import type { Language, InsightId, CacheEntry, DynamicCache, StaticCacheEntry } from '../shared/types';
import { APP_DATA_DIR, DYNAMIC_CACHE_MAX } from '../shared/constants';
import { readJson, writeJson } from './storage';

let staticCache: StaticCacheEntry[] | null = null;

function loadStaticCache(): StaticCacheEntry[] {
  if (staticCache) return staticCache;

  // Try loading from bundled data
  const possiblePaths = [
    path.join(process.resourcesPath || '', 'data', 'cache', 'fractions-cache.json'),
    path.join(app.getAppPath(), 'data', 'cache', 'fractions-cache.json'),
    path.join(__dirname, '..', '..', 'data', 'cache', 'fractions-cache.json'),
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        staticCache = JSON.parse(raw);
        return staticCache!;
      }
    } catch {
      continue;
    }
  }

  staticCache = [];
  return staticCache;
}

function makeCacheKey(language: Language, insights: InsightId[], question: string): string {
  const normalized = question.toLowerCase().trim().replace(/\s+/g, ' ');
  const sortedInsights = [...insights].sort().join(',');
  const input = `${language}|${sortedInsights}|${normalized}`;
  return crypto.createHash('md5').update(input).digest('hex');
}

function fuzzyMatch(question: string, keywords: string[]): boolean {
  const words = question.toLowerCase().split(/\s+/);
  const matchCount = keywords.filter(kw => words.some(w => w.includes(kw.toLowerCase())));
  return matchCount.length >= Math.ceil(keywords.length * 0.5);
}

export function lookupCache(
  language: Language,
  insights: InsightId[],
  question: string,
): CacheEntry | null {
  // Tier 1: Dynamic cache (exact hash match)
  const dynamicCache = readJson<DynamicCache>('dynamic-cache.json', { entries: {} });
  const key = makeCacheKey(language, insights, question);
  if (dynamicCache.entries[key]) {
    return dynamicCache.entries[key];
  }

  // Tier 2: Static cache (fuzzy match)
  const statics = loadStaticCache();
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
): void {
  const dynamicCache = readJson<DynamicCache>('dynamic-cache.json', { entries: {} });
  const key = makeCacheKey(language, insights, question);

  dynamicCache.entries[key] = {
    question,
    answer,
    language,
    insights: insightsUnlocked,
    timestamp: Date.now(),
  };

  // LRU eviction if over limit
  const keys = Object.keys(dynamicCache.entries);
  if (keys.length > DYNAMIC_CACHE_MAX) {
    const sorted = keys.sort(
      (a, b) => dynamicCache.entries[a].timestamp - dynamicCache.entries[b].timestamp,
    );
    const toRemove = sorted.slice(0, keys.length - DYNAMIC_CACHE_MAX);
    for (const k of toRemove) {
      delete dynamicCache.entries[k];
    }
  }

  writeJson('dynamic-cache.json', dynamicCache);
}
