import { describe, it, expect } from 'vitest';
import {
  getPersonality,
  getCoreRules,
  getStudentStateHandling,
  getConversationFlowRules,
  getSessionPacing,
  getInsightTrackingBlock,
  getAdaptiveDifficultyBlock,
  getMisconceptionContext,
  getReviewModeBlock,
  getWorkedExampleBlock,
  getVisualAidsBlock,
} from '../src/main/prompts/common';
import { getStorylineBlock } from '../src/main/prompts/storylines';
import { validateResponse } from '../src/main/response-validator';
import { generateProblems } from '../src/main/practice-generator';

// ── Prompt Assembly Tests ──

describe('Prompt Assembly', () => {
  it('personality block contains core traits', () => {
    const p = getPersonality();
    expect(p).toContain('warmly');
    expect(p).toContain('uncle');
    expect(p).toContain('fun');
    expect(p).toContain('celebrate');
  });

  it('core rules enforce Socratic method', () => {
    const rules = getCoreRules('en');
    expect(rules).toContain('NEVER give direct answers');
    expect(rules).toContain('Respond in simple English');
  });

  it('core rules switch to Hindi when language is hi', () => {
    const rules = getCoreRules('hi');
    expect(rules).toContain('Hindi');
    expect(rules).toContain('Devanagari');
  });

  it('student state handling covers all states', () => {
    const h = getStudentStateHandling();
    expect(h).toContain("don't know");
    expect(h).toContain('short answer');
    expect(h).toContain('wrong answer');
    expect(h).toContain('correct answer');
    expect(h).toContain('frustrated');
    expect(h).toContain('confused');
    expect(h).toContain('off-topic');
  });

  it('conversation flow rules prevent repetition', () => {
    const r = getConversationFlowRules();
    expect(r).toContain('NEVER repeat');
    expect(r).toContain('natural flow');
  });

  it('session pacing wraps up at 20+ messages', () => {
    const p = getSessionPacing(25, 5, 2);
    expect(p).toContain('wrap up');
    expect(p).toContain('break');
  });

  it('session pacing stays fresh at low count', () => {
    const p = getSessionPacing(3, 5, 0);
    expect(p).toContain('still fresh');
  });

  it('session pacing celebrates mastery when all unlocked', () => {
    const p = getSessionPacing(10, 5, 5);
    expect(p).toContain('ALL INSIGHTS ARE UNLOCKED');
  });

  it('insight tracking block includes STUDENT_RESPONSE marker', () => {
    const b = getInsightTrackingBlock('- test-insight: description', '(none yet)');
    expect(b).toContain('[STUDENT_RESPONSE:correct]');
    expect(b).toContain('[STUDENT_RESPONSE:wrong]');
    expect(b).toContain('[STUDENT_RESPONSE:unclear]');
    expect(b).toContain('[MISCONCEPTION:');
  });
});

// ── Adaptive Difficulty Tests ──

describe('Adaptive Difficulty', () => {
  it('level 1 uses minimal scaffolding', () => {
    const b = getAdaptiveDifficultyBlock(1);
    expect(b).toContain('MINIMAL');
    expect(b).toContain('open-ended');
  });

  it('level 2 uses guided scaffolding', () => {
    const b = getAdaptiveDifficultyBlock(2);
    expect(b).toContain('GUIDED');
    expect(b).toContain('2-3 clear steps');
  });

  it('level 3 uses heavy scaffolding', () => {
    const b = getAdaptiveDifficultyBlock(3);
    expect(b).toContain('HEAVY');
    expect(b).toContain('SIMPLEST');
    expect(b).toContain('baby steps');
  });
});

// ── Misconception Context Tests ──

describe('Misconception Context', () => {
  it('returns empty string when no misconceptions', () => {
    expect(getMisconceptionContext([])).toBe('');
  });

  it('includes misconception details when present', () => {
    const ctx = getMisconceptionContext([
      { misconception_type: 'add-denominators', description: 'Adds denominators', occurrences: 3 },
    ]);
    expect(ctx).toContain('add-denominators');
    expect(ctx).toContain('3 times');
    expect(ctx).toContain('KNOWN STUDENT MISCONCEPTIONS');
  });
});

// ── Review Mode Tests ──

describe('Review Mode', () => {
  it('includes review instructions and quality scale', () => {
    const b = getReviewModeBlock(['fraction-as-part', 'equivalent-fractions']);
    expect(b).toContain('REVIEW MODE');
    expect(b).toContain('fraction-as-part');
    expect(b).toContain('[REVIEW_RESULT:');
    expect(b).toContain('1-5');
  });
});

// ── Worked Example Tests ──

describe('Worked Example', () => {
  it('includes worked example instructions', () => {
    const b = getWorkedExampleBlock();
    expect(b).toContain('WORKED EXAMPLE');
    expect(b).toContain('step by step');
    expect(b).toContain('SIMILAR');
  });
});

// ── Visual Aids Tests ──

describe('Visual Aids', () => {
  it('returns fraction visuals for ch7', () => {
    const b = getVisualAidsBlock('ch7-fractions');
    expect(b).toContain('fraction-circle');
    expect(b).toContain('fraction-bar');
    expect(b).toContain('number-line');
  });

  it('returns dot-array for ch1', () => {
    const b = getVisualAidsBlock('ch1-patterns');
    expect(b).toContain('dot-array');
  });

  it('returns factor-tree for ch5', () => {
    const b = getVisualAidsBlock('ch5-prime-time');
    expect(b).toContain('factor-tree');
  });

  it('returns empty string for unknown chapter', () => {
    expect(getVisualAidsBlock('ch99-unknown')).toBe('');
  });
});

// ── Storyline Tests ──

describe('Storylines', () => {
  it('returns Riya story for ch7 fractions', () => {
    const s = getStorylineBlock('ch7-fractions', 0, 5);
    expect(s).toContain('Riya');
    expect(s).toContain('birthday party');
    expect(s).toContain('Act (1 of 3)');
  });

  it('returns Act 2 when partially complete', () => {
    const s = getStorylineBlock('ch7-fractions', 2, 5);
    expect(s).toContain('Act (2 of 3)');
  });

  it('returns Act 3 when mostly complete', () => {
    const s = getStorylineBlock('ch7-fractions', 4, 5);
    expect(s).toContain('Act (3 of 3)');
  });

  it('returns Arjun story for ch1 patterns', () => {
    const s = getStorylineBlock('ch1-patterns', 0, 5);
    expect(s).toContain('Arjun');
    expect(s).toContain('tile mosaic');
  });

  it('returns Meera story for ch5 prime time', () => {
    const s = getStorylineBlock('ch5-prime-time', 0, 5);
    expect(s).toContain('Meera');
    expect(s).toContain('annual fair');
  });

  it('returns null for unknown chapter', () => {
    expect(getStorylineBlock('ch99-unknown', 0, 5)).toBeNull();
  });
});

// ── Response Validation Tests ──

describe('Response Validation', () => {
  it('detects direct answer patterns', () => {
    const result = validateResponse('The answer is 42. Now try this one.', 'ch7-fractions');
    expect(result.isValid).toBe(false);
    expect(result.violations.some(v => v.type === 'direct_answer')).toBe(true);
  });

  it('detects "the correct answer is" pattern', () => {
    const result = validateResponse('The correct answer is 5/8. Do you see why?', 'ch7-fractions');
    expect(result.violations.some(v => v.type === 'direct_answer')).toBe(true);
  });

  it('flags responses missing questions', () => {
    const result = validateResponse("That's great work! You really understand fractions now. I'm proud of you.", 'ch7-fractions');
    expect(result.violations.some(v => v.type === 'missing_question')).toBe(true);
  });

  it('passes valid Socratic response', () => {
    const result = validateResponse("That's interesting! If you cut a pizza into 8 equal slices and eat 3, what fraction have you eaten?", 'ch7-fractions');
    expect(result.isValid).toBe(true);
  });

  it('flags off-topic advanced math', () => {
    const result = validateResponse("This is like calculus where you take derivatives. What do you think?", 'ch7-fractions');
    expect(result.violations.some(v => v.type === 'off_topic')).toBe(true);
  });

  it('flags very long responses', () => {
    const longResponse = Array(10).fill('This is a sentence about fractions.').join(' ') + ' What do you think?';
    const result = validateResponse(longResponse, 'ch7-fractions');
    expect(result.violations.some(v => v.type === 'too_long')).toBe(true);
  });
});

// ── Marker Parsing Tests ──

describe('Marker Parsing', () => {
  const INSIGHT_REGEX = /\[INSIGHT_UNLOCKED:([a-z-]+)\]/g;
  const CORRECTNESS_REGEX = /\[STUDENT_RESPONSE:(correct|wrong|unclear)\]/g;
  const MISCONCEPTION_REGEX = /\[MISCONCEPTION:([a-z-]+)\]/g;
  const VISUAL_REGEX = /\[VISUAL:([a-z-]+):([^\]]+)\]/g;

  it('parses INSIGHT_UNLOCKED markers', () => {
    const text = 'Great job! [INSIGHT_UNLOCKED:fraction-as-part]';
    const matches = [...text.matchAll(INSIGHT_REGEX)];
    expect(matches.length).toBe(1);
    expect(matches[0][1]).toBe('fraction-as-part');
  });

  it('parses STUDENT_RESPONSE markers', () => {
    const text = 'Nice try! [STUDENT_RESPONSE:wrong]';
    const matches = [...text.matchAll(CORRECTNESS_REGEX)];
    expect(matches.length).toBe(1);
    expect(matches[0][1]).toBe('wrong');
  });

  it('parses MISCONCEPTION markers', () => {
    const text = 'I see. [MISCONCEPTION:add-denominators]';
    const matches = [...text.matchAll(MISCONCEPTION_REGEX)];
    expect(matches.length).toBe(1);
    expect(matches[0][1]).toBe('add-denominators');
  });

  it('parses VISUAL markers', () => {
    const text = 'Look at this: [VISUAL:fraction-circle:3/4] See?';
    const matches = [...text.matchAll(VISUAL_REGEX)];
    expect(matches.length).toBe(1);
    expect(matches[0][1]).toBe('fraction-circle');
    expect(matches[0][2]).toBe('3/4');
  });

  it('parses multiple markers in one response', () => {
    const text = 'Great! [STUDENT_RESPONSE:correct] [INSIGHT_UNLOCKED:prime-numbers]';
    const insights = [...text.matchAll(INSIGHT_REGEX)];
    const correctness = [...text.matchAll(CORRECTNESS_REGEX)];
    expect(insights.length).toBe(1);
    expect(correctness.length).toBe(1);
  });
});

// ── Practice Generator Tests ──

describe('Practice Generator', () => {
  it('generates fraction problems', () => {
    const problems = generateProblems('ch7-fractions', 'fraction-as-part', 1);
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0].chapterId).toBe('ch7-fractions');
    expect(problems[0].insightId).toBe('fraction-as-part');
    expect(problems[0].question).toBeTruthy();
    expect(problems[0].correctAnswer).toBeTruthy();
  });

  it('generates pattern problems', () => {
    const problems = generateProblems('ch1-patterns', 'number-patterns', 1);
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0].question).toContain('?');
  });

  it('generates prime time problems', () => {
    const problems = generateProblems('ch5-prime-time', 'prime-numbers', 1);
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0].question).toContain('prime');
  });

  it('returns empty for unknown chapter', () => {
    const problems = generateProblems('ch99-unknown', 'test', 1);
    expect(problems.length).toBe(0);
  });

  it('includes hints in problems', () => {
    const problems = generateProblems('ch7-fractions', 'fraction-as-part', 3);
    expect(problems[0].hints).toBeDefined();
    expect(problems[0].hints!.length).toBeGreaterThan(0);
  });
});
