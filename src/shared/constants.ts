import type { Chapter, InsightDef, InsightId } from './types';

export const CHAPTERS: Chapter[] = [
  {
    id: 'ch1-patterns',
    number: 1,
    titleEn: 'Patterns in Mathematics',
    titleHi: 'गणित में पैटर्न (Patterns)',
    insights: [
      'number-patterns',
      'square-numbers',
      'triangular-numbers',
      'shape-patterns',
      'sequence-relations',
    ],
  },
  {
    id: 'ch5-prime-time',
    number: 5,
    titleEn: 'Prime Time',
    titleHi: 'अभाज्य संख्याएँ (Prime Time)',
    insights: [
      'factors-multiples',
      'prime-numbers',
      'co-primes',
      'prime-factorisation',
      'divisibility-rules',
    ],
  },
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
  // Ch1: Patterns in Mathematics
  'number-patterns': {
    id: 'number-patterns',
    labelEn: 'Number Patterns',
    labelHi: 'संख्या पैटर्न',
    descriptionEn: 'Recognise and extend number sequences (2, 4, 6, 8...)',
    descriptionHi: 'संख्या अनुक्रमों को पहचानें और आगे बढ़ाएँ (2, 4, 6, 8...)',
  },
  'square-numbers': {
    id: 'square-numbers',
    labelEn: 'Square Numbers',
    labelHi: 'वर्ग संख्याएँ',
    descriptionEn: 'Understand square numbers as dot arrays (1, 4, 9, 16, 25...)',
    descriptionHi: 'वर्ग संख्याओं को बिंदु सरणियों के रूप में समझें (1, 4, 9, 16, 25...)',
  },
  'triangular-numbers': {
    id: 'triangular-numbers',
    labelEn: 'Triangular Numbers',
    labelHi: 'त्रिकोणीय संख्याएँ',
    descriptionEn: 'Understand triangular numbers as stacked rows (1, 3, 6, 10...)',
    descriptionHi: 'त्रिकोणीय संख्याओं को पंक्तियों के रूप में समझें (1, 3, 6, 10...)',
  },
  'shape-patterns': {
    id: 'shape-patterns',
    labelEn: 'Shape Patterns',
    labelHi: 'आकार पैटर्न',
    descriptionEn: 'Identify and continue patterns using shapes and figures',
    descriptionHi: 'आकारों और चित्रों का उपयोग करके पैटर्न पहचानें',
  },
  'sequence-relations': {
    id: 'sequence-relations',
    labelEn: 'Sequence Relations',
    labelHi: 'अनुक्रम संबंध',
    descriptionEn: 'Find relationships between different sequences',
    descriptionHi: 'विभिन्न अनुक्रमों के बीच संबंध खोजें',
  },

  // Ch5: Prime Time
  'factors-multiples': {
    id: 'factors-multiples',
    labelEn: 'Factors & Multiples',
    labelHi: 'गुणनखंड और गुणज',
    descriptionEn: 'Understand factors and multiples of a number',
    descriptionHi: 'किसी संख्या के गुणनखंड और गुणज समझें',
  },
  'prime-numbers': {
    id: 'prime-numbers',
    labelEn: 'Prime Numbers',
    labelHi: 'अभाज्य संख्याएँ',
    descriptionEn: 'Identify prime and composite numbers (1 is neither)',
    descriptionHi: 'अभाज्य और भाज्य संख्याओं की पहचान करें (1 दोनों नहीं है)',
  },
  'co-primes': {
    id: 'co-primes',
    labelEn: 'Co-prime Numbers',
    labelHi: 'सह-अभाज्य संख्याएँ',
    descriptionEn: 'Numbers whose only common factor is 1',
    descriptionHi: 'वे संख्याएँ जिनका एकमात्र उभयनिष्ठ गुणनखंड 1 है',
  },
  'prime-factorisation': {
    id: 'prime-factorisation',
    labelEn: 'Prime Factorisation',
    labelHi: 'अभाज्य गुणनखंडन',
    descriptionEn: 'Break a number into its prime factors',
    descriptionHi: 'किसी संख्या को अभाज्य गुणनखंडों में विभाजित करें',
  },
  'divisibility-rules': {
    id: 'divisibility-rules',
    labelEn: 'Divisibility Rules',
    labelHi: 'विभाज्यता के नियम',
    descriptionEn: 'Quick tests for divisibility by 2, 3, 5, 9, 10',
    descriptionHi: '2, 3, 5, 9, 10 से विभाज्यता की त्वरित जाँच',
  },

  // Ch7: Fractions
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

export const DYNAMIC_CACHE_MAX = 500;
export const APP_DATA_DIR = 'ganyaan';
