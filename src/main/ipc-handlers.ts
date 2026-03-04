import { ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import type { ChatSendRequest, ChatMessage, ProgressData, SettingsData } from '../shared/types';
import { readJson, writeJson, readChatHistory, writeChatHistory } from './storage';
import { buildSystemPrompt, buildMessages } from './prompt-builder';
import { streamCompletion } from './openai-client';
import { lookupCache, cacheResponse } from './cache-manager';

export function registerIpcHandlers(window: BrowserWindow): void {
  // ── Chat Send ──
  ipcMain.handle(IPC_CHANNELS.CHAT_SEND, async (_event, request: ChatSendRequest) => {
    const { message, language, unlockedInsights, history } = request;

    // Check cache first
    const cached = lookupCache(language, unlockedInsights, message);
    if (cached) {
      // Simulate streaming for cached response
      const words = cached.answer.split(' ');
      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join(' ') + ' ';
        window.webContents.send(IPC_CHANNELS.CHAT_STREAM_CHUNK, chunk);
        await new Promise(r => setTimeout(r, 30));
      }
      window.webContents.send(IPC_CHANNELS.CHAT_STREAM_END, {
        fullText: cached.answer,
        insightsUnlocked: cached.insights,
      });
      return;
    }

    // Load settings for API key
    const settings = readJson<SettingsData>('settings.json', { language: 'en', apiKey: '' });
    if (!settings.apiKey) {
      window.webContents.send(IPC_CHANNELS.CHAT_STREAM_ERROR, 'API key not configured. Please set your OpenAI API key in settings.');
      return;
    }

    try {
      const systemPrompt = buildSystemPrompt(language, unlockedInsights);
      const historyForPrompt = history.map(m => ({ role: m.role, content: m.content }));
      const messages = buildMessages(systemPrompt, historyForPrompt, message);
      const result = await streamCompletion(settings.apiKey, messages, window);

      // Cache the response
      cacheResponse(language, unlockedInsights, message, result.fullText, result.insights);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      window.webContents.send(IPC_CHANNELS.CHAT_STREAM_ERROR, errMsg);
    }
  });

  // ── Chat History ──
  ipcMain.handle(IPC_CHANNELS.CHAT_LOAD_HISTORY, (_event, chapterId: string) => {
    return readChatHistory(chapterId) as ChatMessage[];
  });

  ipcMain.handle(IPC_CHANNELS.CHAT_SAVE_HISTORY, (_event, chapterId: string, messages: ChatMessage[]) => {
    writeChatHistory(chapterId, messages);
  });

  // ── Progress ──
  ipcMain.handle(IPC_CHANNELS.PROGRESS_LOAD, () => {
    return readJson<ProgressData>('progress.json', { chapters: {} });
  });

  ipcMain.handle(IPC_CHANNELS.PROGRESS_SAVE, (_event, data: ProgressData) => {
    writeJson('progress.json', data);
  });

  // ── Settings ──
  ipcMain.handle(IPC_CHANNELS.SETTINGS_LOAD, () => {
    return readJson<SettingsData>('settings.json', { language: 'en', apiKey: '' });
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SAVE, (_event, data: SettingsData) => {
    writeJson('settings.json', data);
  });
}
