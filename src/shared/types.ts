// ── IPC Channel Names ──
export const IPC_CHANNELS = {
  CHAT_SEND: 'chat:send',
  CHAT_STREAM_CHUNK: 'chat:stream-chunk',
  CHAT_STREAM_END: 'chat:stream-end',
  CHAT_STREAM_ERROR: 'chat:stream-error',
  CHAT_LOAD_HISTORY: 'chat:load-history',
  CHAT_SAVE_HISTORY: 'chat:save-history',
  PROGRESS_LOAD: 'progress:load',
  PROGRESS_SAVE: 'progress:save',
  SETTINGS_LOAD: 'settings:load',
  SETTINGS_SAVE: 'settings:save',
} as const;

// ── Language ──
export type Language = 'en' | 'hi';

// ── Insight IDs ──
export type InsightId =
  | 'fraction-as-part'
  | 'equivalent-fractions'
  | 'comparing-fractions'
  | 'adding-subtracting'
  | 'mixed-numbers';

// ── Chapter ──
export interface Chapter {
  id: string;
  number: number;
  titleEn: string;
  titleHi: string;
  insights: InsightId[];
}

// ── Insight Definition ──
export interface InsightDef {
  id: InsightId;
  labelEn: string;
  labelHi: string;
  descriptionEn: string;
  descriptionHi: string;
}

// ── Chat Message ──
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  insightsUnlocked?: InsightId[];
}

// ── Progress ──
export interface ChapterProgress {
  chapterId: string;
  unlockedInsights: InsightId[];
  mastered: boolean;
  lastActivity: number;
}

export interface ProgressData {
  chapters: Record<string, ChapterProgress>;
}

// ── Settings ──
export interface SettingsData {
  language: Language;
  apiKey: string;
}

// ── Cache ──
export interface CacheEntry {
  question: string;
  answer: string;
  language: Language;
  insights: InsightId[];
  timestamp: number;
}

export interface DynamicCache {
  entries: Record<string, CacheEntry>;
}

export interface StaticCacheEntry {
  keywords: string[];
  question: string;
  answer: string;
  language: Language;
}

// ── Chat Send Request ──
export interface ChatSendRequest {
  chapterId: string;
  message: string;
  language: Language;
  unlockedInsights: InsightId[];
  history: ChatMessage[];
}

// ── Stream End Payload ──
export interface StreamEndPayload {
  fullText: string;
  insightsUnlocked: InsightId[];
}

// ── Electron API (exposed via preload) ──
export interface ElectronAPI {
  sendMessage: (request: ChatSendRequest) => Promise<void>;
  onStreamChunk: (callback: (chunk: string) => void) => () => void;
  onStreamEnd: (callback: (payload: StreamEndPayload) => void) => () => void;
  onStreamError: (callback: (error: string) => void) => () => void;
  loadChatHistory: (chapterId: string) => Promise<ChatMessage[]>;
  saveChatHistory: (chapterId: string, messages: ChatMessage[]) => Promise<void>;
  loadProgress: () => Promise<ProgressData>;
  saveProgress: (data: ProgressData) => Promise<void>;
  loadSettings: () => Promise<SettingsData>;
  saveSettings: (data: SettingsData) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
