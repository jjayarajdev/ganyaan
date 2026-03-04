import type { Chapter, InsightDef, InsightId } from './types';

export const CHAPTERS: Chapter[] = [
  {
    id: 'ch7-fractions',
    number: 7,
    titleEn: 'Fractions',
    titleHi: 'भिन्न (Fractions)',
    insights: [
      'fraction-as-part',
      'equivalent-fractions',
      'comparing-fractions',
      'adding-subtracting',
      'mixed-numbers',
    ],
  },
];

export const INSIGHT_DEFS: Record<InsightId, InsightDef> = {
  'fraction-as-part': {
    id: 'fraction-as-part',
    labelEn: 'Parts of a Whole',
    labelHi: 'पूर्ण के भाग',
    descriptionEn: 'Fractions represent equal parts of a whole',
    descriptionHi: 'भिन्न किसी पूर्ण के बराबर भागों को दर्शाते हैं',
  },
  'equivalent-fractions': {
    id: 'equivalent-fractions',
    labelEn: 'Equivalent Fractions',
    labelHi: 'समतुल्य भिन्न',
    descriptionEn: 'Equivalent fractions have equal value (1/2 = 2/4)',
    descriptionHi: 'समतुल्य भिन्नों का मान बराबर होता है (1/2 = 2/4)',
  },
  'comparing-fractions': {
    id: 'comparing-fractions',
    labelEn: 'Comparing Fractions',
    labelHi: 'भिन्नों की तुलना',
    descriptionEn: 'Compare fractions using common denominators',
    descriptionHi: 'समान हर का उपयोग करके भिन्नों की तुलना करें',
  },
  'adding-subtracting': {
    id: 'adding-subtracting',
    labelEn: 'Add & Subtract',
    labelHi: 'जोड़ना और घटाना',
    descriptionEn: 'Add/subtract fractions with same denominator (LCM)',
    descriptionHi: 'समान हर वाली भिन्नों को जोड़ना/घटाना (LCM)',
  },
  'mixed-numbers': {
    id: 'mixed-numbers',
    labelEn: 'Mixed Numbers',
    labelHi: 'मिश्रित संख्याएँ',
    descriptionEn: 'Mixed numbers and improper fractions conversion',
    descriptionHi: 'मिश्रित संख्याओं और विषम भिन्नों का रूपांतरण',
  },
};

export const TOTAL_INSIGHTS = 5;
export const DYNAMIC_CACHE_MAX = 500;
export const APP_DATA_DIR = 'ganyaan';
