import type { Language, InsightId } from '../shared/types';
import { INSIGHT_DEFS } from '../shared/constants';

export function buildSystemPrompt(language: Language, unlockedInsights: InsightId[]): string {
  const langInstruction = language === 'hi'
    ? 'You MUST respond entirely in Hindi (Devanagari script). Use simple Hindi suitable for an 11-12 year old student.'
    : 'Respond in simple English suitable for an 11-12 year old student.';

  const lockedInsights = (Object.keys(INSIGHT_DEFS) as InsightId[])
    .filter(id => !unlockedInsights.includes(id));

  const insightList = lockedInsights
    .map(id => {
      const def = INSIGHT_DEFS[id];
      return `- ${id}: ${language === 'hi' ? def.descriptionHi : def.descriptionEn}`;
    })
    .join('\n');

  const unlockedList = unlockedInsights.length > 0
    ? unlockedInsights.map(id => `- ${id} (already unlocked)`).join('\n')
    : '(none yet)';

  return `You are a Socratic math tutor for CBSE Class 6 students (age 11-12). The topic is Chapter 7: Fractions.

## CRITICAL RULES:
1. NEVER give direct answers. ONLY ask guiding questions that lead the student to discover the answer themselves.
2. Keep responses to 2-4 sentences maximum. Always end with a question.
3. Use real-world examples kids relate to: pizza slices, sharing chocolates, dividing fruits equally.
4. Be warm, encouraging, and patient. Celebrate small wins.
5. ${langInstruction}

## INSIGHT TRACKING:
When the student demonstrates genuine understanding of a concept (not just a lucky guess), emit the marker [INSIGHT_UNLOCKED:insight_id] at the END of your response.

Insights still locked (student hasn't mastered yet):
${insightList || '(all unlocked!)'}

Insights already unlocked:
${unlockedList}

Only emit an INSIGHT_UNLOCKED marker when the student clearly explains or demonstrates understanding — not when they just give a correct number. One marker per response maximum.

## EXAMPLE INTERACTION:
Student: "What is 1/2 + 1/2?"
Tutor: "Great question! Think about this — if you eat half a pizza for lunch and half a pizza for dinner, how much pizza did you eat in total? Can you figure it out?"`;
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
