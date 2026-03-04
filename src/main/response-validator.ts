import type { ValidationResult, ValidationViolation } from '../shared/types';

const DIRECT_ANSWER_PATTERNS = [
  /the answer is\s+\d/i,
  /=\s*\d+\s*$/m,
  /let me tell you the answer/i,
  /the correct answer is/i,
  /it equals?\s+\d/i,
  /the result is\s+\d/i,
  /so it's\s+\d+\s*\./i,
];

const OFF_TOPIC_PATTERNS = [
  /algebra/i,
  /quadratic/i,
  /calculus/i,
  /trigonometry/i,
  /logarithm/i,
  /differential/i,
  /integral/i,
  /polynomial of degree [3-9]/i,
];

export function validateResponse(text: string, _chapterId: string): ValidationResult {
  const violations: ValidationViolation[] = [];

  // Check for direct answers
  for (const pattern of DIRECT_ANSWER_PATTERNS) {
    if (pattern.test(text)) {
      violations.push({
        type: 'direct_answer',
        message: `Response may contain a direct answer (matched: ${pattern.source})`,
        severity: 'warning',
      });
      break;
    }
  }

  // Check response length (count sentences by period/question mark/exclamation)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 6) {
    violations.push({
      type: 'too_long',
      message: `Response has ${sentences.length} sentences (max recommended: 6)`,
      severity: 'warning',
    });
  }

  // Check if response ends with a question (Socratic method)
  const trimmed = text.trim();
  if (trimmed.length > 50 && !trimmed.endsWith('?') && !trimmed.match(/\?\s*$/)) {
    // Check if last sentence-like chunk ends with ?
    const lastChunk = trimmed.split('\n').pop()?.trim() || '';
    if (!lastChunk.endsWith('?')) {
      violations.push({
        type: 'missing_question',
        message: 'Response does not end with a question (Socratic method requires guiding questions)',
        severity: 'warning',
      });
    }
  }

  // Check for off-topic content beyond Class 6 scope
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(text)) {
      violations.push({
        type: 'off_topic',
        message: `Response mentions advanced topic beyond Class 6 scope (matched: ${pattern.source})`,
        severity: 'warning',
      });
      break;
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}
