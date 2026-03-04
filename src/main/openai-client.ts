import OpenAI from 'openai';
import type { BrowserWindow } from 'electron';
import type { InsightId, StreamEndPayload } from '../shared/types';
import { IPC_CHANNELS } from '../shared/types';

const INSIGHT_REGEX = /\[INSIGHT_UNLOCKED:([a-z-]+)\]/g;

function parseInsights(text: string): { cleanText: string; insights: InsightId[] } {
  const insights: InsightId[] = [];
  const cleanText = text.replace(INSIGHT_REGEX, (_, id) => {
    insights.push(id as InsightId);
    return '';
  }).trim();
  return { cleanText, insights };
}

export async function streamCompletion(
  apiKey: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  window: BrowserWindow,
): Promise<{ fullText: string; insights: InsightId[] }> {
  const client = new OpenAI({ apiKey });

  const stream = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 500,
  });

  let fullText = '';

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      fullText += delta;
      // Send chunk but strip any partial insight markers
      const displayChunk = delta.replace(INSIGHT_REGEX, '');
      if (displayChunk) {
        window.webContents.send(IPC_CHANNELS.CHAT_STREAM_CHUNK, displayChunk);
      }
    }
  }

  const { cleanText, insights } = parseInsights(fullText);

  const payload: StreamEndPayload = { fullText: cleanText, insightsUnlocked: insights };
  window.webContents.send(IPC_CHANNELS.CHAT_STREAM_END, payload);

  return { fullText: cleanText, insights };
}
