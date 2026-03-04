import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { ChatMessage, InsightId } from '../../shared/types';

interface ChatStore {
  messages: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
  error: string | null;
  chapterId: string | null;

  setChapter: (chapterId: string) => void;
  loadHistory: (chapterId: string) => Promise<void>;
  addUserMessage: (content: string) => ChatMessage;
  appendStreamChunk: (chunk: string) => void;
  finalizeStream: (fullText: string, insights: InsightId[]) => void;
  setError: (error: string | null) => void;
  setStreaming: (streaming: boolean) => void;
  saveHistory: () => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  streamingText: '',
  isStreaming: false,
  error: null,
  chapterId: null,

  setChapter: (chapterId) => set({ chapterId }),

  loadHistory: async (chapterId) => {
    const messages = await window.electronAPI.loadChatHistory(chapterId);
    set({ messages, chapterId });
  },

  addUserMessage: (content) => {
    const msg: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    set(state => ({ messages: [...state.messages, msg] }));
    return msg;
  },

  appendStreamChunk: (chunk) => {
    set(state => ({ streamingText: state.streamingText + chunk }));
  },

  finalizeStream: (fullText, insights) => {
    const msg: ChatMessage = {
      id: nanoid(),
      role: 'assistant',
      content: fullText,
      timestamp: Date.now(),
      insightsUnlocked: insights.length > 0 ? insights : undefined,
    };
    set(state => ({
      messages: [...state.messages, msg],
      streamingText: '',
      isStreaming: false,
    }));
  },

  setError: (error) => set({ error, isStreaming: false, streamingText: '' }),

  setStreaming: (streaming) => set({ isStreaming: streaming, streamingText: '', error: null }),

  saveHistory: async () => {
    const { chapterId, messages } = get();
    if (chapterId) {
      await window.electronAPI.saveChatHistory(chapterId, messages);
    }
  },

  clearMessages: () => set({ messages: [], streamingText: '', error: null }),
}));
