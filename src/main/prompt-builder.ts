import type { Language, InsightId } from '../shared/types';
import { CHAPTERS, INSIGHT_DEFS } from '../shared/constants';
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
} from './prompts/common';
import { getChapterPrompt } from './prompts/index';

export interface PromptOptions {
  scaffoldingLevel?: number;
  misconceptions?: Array<{ misconception_type: string; description: string; occurrences: number }>;
  requestWorkedExample?: boolean;
  reviewMode?: boolean;
  reviewInsightIds?: string[];
  storylineBlock?: string;
}

export function buildSystemPrompt(
  chapterId: string,
  language: Language,
  unlockedInsights: InsightId[],
  studentMessageCount: number,
  options: PromptOptions = {},
): string {
  const chapter = CHAPTERS.find(c => c.id === chapterId);
  const chapterTitle = chapter
    ? (language === 'hi' ? chapter.titleHi : chapter.titleEn)
    : 'Mathematics';

  // Compute locked/unlocked insights scoped to this chapter
  const chapterInsights = chapter ? chapter.insights : [];
  const lockedInsights = chapterInsights.filter(id => !unlockedInsights.includes(id));

  const insightList = lockedInsights
    .map(id => {
      const def = INSIGHT_DEFS[id];
      return `- ${id}: ${language === 'hi' ? def.descriptionHi : def.descriptionEn}`;
    })
    .join('\n');

  const unlockedList = unlockedInsights.length > 0
    ? unlockedInsights
        .filter(id => chapterInsights.includes(id))
        .map(id => `- ${id} (already unlocked)`)
        .join('\n')
    : '(none yet)';

  const totalInsights = chapterInsights.length;
  const unlockedCount = unlockedInsights.filter(id => chapterInsights.includes(id)).length;

  // Assemble prompt from modular sections
  const sections = [
    `You are a warm, patient, and encouraging Socratic math tutor for CBSE Class 6 students (age 11-12). The topic is Chapter ${chapter?.number || '?'}: ${chapterTitle}.`,
    getPersonality(),
    getCoreRules(language),
    getChapterPrompt(chapterId),
    getStudentStateHandling(),
    getConversationFlowRules(),
    getSessionPacing(studentMessageCount, totalInsights, unlockedCount),
    getInsightTrackingBlock(insightList, unlockedList),
  ];

  // v0.3: Adaptive difficulty
  if (options.scaffoldingLevel) {
    sections.push(getAdaptiveDifficultyBlock(options.scaffoldingLevel));
  }

  // v0.3: Misconception context
  if (options.misconceptions && options.misconceptions.length > 0) {
    sections.push(getMisconceptionContext(options.misconceptions));
  }

  // v0.3: Review mode
  if (options.reviewMode && options.reviewInsightIds) {
    sections.push(getReviewModeBlock(options.reviewInsightIds));
  }

  // v0.3: Worked example
  if (options.requestWorkedExample) {
    sections.push(getWorkedExampleBlock());
  }

  // v0.3: Storyline
  if (options.storylineBlock) {
    sections.push(options.storylineBlock);
  }

  // v0.3: Visual aids
  const visualBlock = getVisualAidsBlock(chapterId);
  if (visualBlock) {
    sections.push(visualBlock);
  }

  return sections.join('\n\n');
}

export function buildMessages(
  systemPrompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string,
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  // Include last 20 messages for context
  const recentHistory = history.slice(-20);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  messages.push({ role: 'user', content: userMessage });
  return messages;
}
