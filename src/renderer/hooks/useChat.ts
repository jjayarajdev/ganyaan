import { useEffect, useCallback } from 'react';
import { useChatStore } from '../stores/chat-store';
import { useProgressStore } from '../stores/progress-store';
import { useSettingsStore } from '../stores/settings-store';
import type { StreamEndPayload } from '../../shared/types';

export function useChat(chapterId: string) {
  const {
    messages,
    streamingText,
    isStreaming,
    error,
    loadHistory,
    addUserMessage,
    appendStreamChunk,
    finalizeStream,
    setError,
    setStreaming,
    saveHistory,
    setChapter,
  } = useChatStore();

  const { getChapterProgress, unlockInsight } = useProgressStore();
  const language = useSettingsStore(s => s.language);

  useEffect(() => {
    setChapter(chapterId);
    loadHistory(chapterId);
  }, [chapterId, setChapter, loadHistory]);

  // Subscribe to stream events
  useEffect(() => {
    const unsubChunk = window.electronAPI.onStreamChunk((chunk: string) => {
      appendStreamChunk(chunk);
    });

    const unsubEnd = window.electronAPI.onStreamEnd(async (payload: StreamEndPayload) => {
      finalizeStream(payload.fullText, payload.insightsUnlocked);

      // Unlock insights
      for (const insightId of payload.insightsUnlocked) {
        await unlockInsight(chapterId, insightId);
      }

      // Save history after stream completes
      setTimeout(() => {
        useChatStore.getState().saveHistory();
      }, 100);
    });

    const unsubError = window.electronAPI.onStreamError((err: string) => {
      setError(err);
    });

    return () => {
      unsubChunk();
      unsubEnd();
      unsubError();
    };
  }, [chapterId, appendStreamChunk, finalizeStream, setError, unlockInsight]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    addUserMessage(content);
    setStreaming(true);

    const progress = getChapterProgress(chapterId);

    await window.electronAPI.sendMessage({
      chapterId,
      message: content,
      language,
      unlockedInsights: progress.unlockedInsights,
      history: useChatStore.getState().messages,
    });
  }, [chapterId, language, isStreaming, addUserMessage, setStreaming, getChapterProgress]);

  return { messages, streamingText, isStreaming, error, sendMessage, saveHistory };
}
