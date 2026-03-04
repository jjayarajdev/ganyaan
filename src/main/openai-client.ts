import OpenAI from 'openai';
import type { BrowserWindow } from 'electron';
import type { InsightId, StreamEndPayload, VisualMarker } from '../shared/types';
import { IPC_CHANNELS } from '../shared/types';

const INSIGHT_REGEX = /\[INSIGHT_UNLOCKED:([a-z-]+)\]/g;
const CORRECTNESS_REGEX = /\[STUDENT_RESPONSE:(correct|wrong|unclear)\]/g;
const MISCONCEPTION_REGEX = /\[MISCONCEPTION:([a-z-]+)\]/g;
const VISUAL_REGEX = /\[VISUAL:([a-z-]+):([^\]]+)\]/g;
const REVIEW_RESULT_REGEX = /\[REVIEW_RESULT:([a-z-]+):(\d)\]/g;

interface ParseResult {
  cleanText: string;
  insights: InsightId[];
  correctness?: 'correct' | 'wrong' | 'unclear';
  misconceptions: string[];
  visuals: VisualMarker[];
  reviewResults: Array<{ insightId: string; quality: number }>;
}

function parseMarkers(text: string): ParseResult {
  const insights: InsightId[] = [];
  const misconceptions: string[] = [];
  const visuals: VisualMarker[] = [];
  const reviewResults: Array<{ insightId: string; quality: number }> = [];
  let correctness: 'correct' | 'wrong' | 'unclear' | undefined;

  // Extract insights
  let match: RegExpExecArray | null;
  while ((match = INSIGHT_REGEX.exec(text)) !== null) {
    insights.push(match[1] as InsightId);
  }

  // Extract correctness
  CORRECTNESS_REGEX.lastIndex = 0;
  match = CORRECTNESS_REGEX.exec(text);
  if (match) {
    correctness = match[1] as 'correct' | 'wrong' | 'unclear';
  }

  // Extract misconceptions
  MISCONCEPTION_REGEX.lastIndex = 0;
  while ((match = MISCONCEPTION_REGEX.exec(text)) !== null) {
    misconceptions.push(match[1]);
  }

  // Extract visuals
  VISUAL_REGEX.lastIndex = 0;
  while ((match = VISUAL_REGEX.exec(text)) !== null) {
    visuals.push({ type: match[1], params: match[2] });
  }

  // Extract review results
  REVIEW_RESULT_REGEX.lastIndex = 0;
  while ((match = REVIEW_RESULT_REGEX.exec(text)) !== null) {
    reviewResults.push({ insightId: match[1], quality: parseInt(match[2], 10) });
  }

  // Strip all markers from display text
  const cleanText = text
    .replace(INSIGHT_REGEX, '')
    .replace(CORRECTNESS_REGEX, '')
    .replace(MISCONCEPTION_REGEX, '')
    .replace(VISUAL_REGEX, '')
    .replace(REVIEW_RESULT_REGEX, '')
    .trim();

  return { cleanText, insights, correctness, misconceptions, visuals, reviewResults };
}

// Combined regex for stripping markers from streaming chunks
const ALL_MARKERS_REGEX = /\[(?:INSIGHT_UNLOCKED|STUDENT_RESPONSE|MISCONCEPTION|VISUAL|REVIEW_RESULT):[^\]]*\]/g;

export async function streamCompletion(
  apiKey: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  window: BrowserWindow,
): Promise<{ fullText: string; insights: InsightId[]; correctness?: 'correct' | 'wrong' | 'unclear'; misconceptions: string[]; visuals: VisualMarker[]; reviewResults: Array<{ insightId: string; quality: number }>; tokensUsed: number }> {
  const client = new OpenAI({ apiKey });

  const stream = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    stream: true,
    stream_options: { include_usage: true },
    temperature: 0.7,
    max_tokens: 500,
  });

  let fullText = '';
  let tokensUsed = 0;

  for await (const chunk of stream) {
    // Track usage from the final chunk
    if (chunk.usage) {
      tokensUsed = chunk.usage.total_tokens || 0;
    }

    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      fullText += delta;
      // Send chunk but strip any markers
      const displayChunk = delta.replace(ALL_MARKERS_REGEX, '');
      if (displayChunk) {
        window.webContents.send(IPC_CHANNELS.CHAT_STREAM_CHUNK, displayChunk);
      }
    }
  }

  const parsed = parseMarkers(fullText);

  const payload: StreamEndPayload = {
    fullText: parsed.cleanText,
    insightsUnlocked: parsed.insights,
    correctness: parsed.correctness,
    misconceptions: parsed.misconceptions,
    visuals: parsed.visuals,
    tokensUsed,
  };
  window.webContents.send(IPC_CHANNELS.CHAT_STREAM_END, payload);

  return {
    fullText: parsed.cleanText,
    insights: parsed.insights,
    correctness: parsed.correctness,
    misconceptions: parsed.misconceptions,
    visuals: parsed.visuals,
    reviewResults: parsed.reviewResults,
    tokensUsed,
  };
}
