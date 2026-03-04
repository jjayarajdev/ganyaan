import { useEffect, useCallback, useRef, useState } from 'react';
import { useChatStore } from '../stores/chat-store';
import { useProgressStore } from '../stores/progress-store';
import { useSettingsStore } from '../stores/settings-store';
import type { StreamEndPayload, InsightId } from '../../shared/types';

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
  const sessionIdRef = useRef<number | null>(null);
  const messageCountRef = useRef(0);
  const attemptCountRef = useRef(0);
  const [workedExampleUsed, setWorkedExampleUsed] = useState(false);

  useEffect(() => {
    setChapter(chapterId);
    loadHistory(chapterId);
    // Reset session tracking on chapter change
    sessionIdRef.current = null;
    messageCountRef.current = 0;
    attemptCountRef.current = 0;
    setWorkedExampleUsed(false);
  }, [chapterId, setChapter, loadHistory]);

  // End session on unmount or chapter change
  useEffect(() => {
    return () => {
      if (sessionIdRef.current !== null && messageCountRef.current > 0) {
        window.electronAPI.endSession(sessionIdRef.current, messageCountRef.current);
        sessionIdRef.current = null;
      }
    };
  }, [chapterId]);

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

      // v0.3: Log attempt with correctness
      if (payload.correctness) {
        attemptCountRef.current += 1;
        try {
          // Get the last user message from store
          const msgs = useChatStore.getState().messages;
          const lastUserMsg = [...msgs].reverse().find(m => m.role === 'user');
          if (lastUserMsg) {
            // Determine current insight being worked on (last locked insight)
            const progress = useProgressStore.getState().getChapterProgress(chapterId);
            const chapter = await import('../../shared/constants').then(m => m.CHAPTERS.find(c => c.id === chapterId));
            const lockedInsights = chapter?.insights.filter(id => !progress.unlockedInsights.includes(id)) || [];
            const currentInsight = lockedInsights[0] || chapter?.insights[chapter.insights.length - 1] || '';

            await window.electronAPI.logAttempt({
              chapterId,
              insightId: currentInsight,
              attemptNumber: attemptCountRef.current,
              studentMessage: lastUserMsg.content,
              wasCorrect: payload.correctness === 'correct' ? true : payload.correctness === 'wrong' ? false : null,
              scaffoldingLevel: 1,
              sessionId: sessionIdRef.current || undefined,
            });
          }
        } catch { /* non-critical */ }
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

  const sendMessage = useCallback(async (content: string, options?: { requestWorkedExample?: boolean; reviewMode?: boolean; reviewInsightIds?: InsightId[] }) => {
    if (!content.trim() || isStreaming) return;

    // Start session on first message
    if (sessionIdRef.current === null) {
      try {
        sessionIdRef.current = await window.electronAPI.startSession(chapterId);
      } catch {
        // Non-critical — don't block chat
      }
    }
    messageCountRef.current += 1;

    addUserMessage(content);
    setStreaming(true);

    const progress = getChapterProgress(chapterId);

    await window.electronAPI.sendMessage({
      chapterId,
      message: content,
      language,
      unlockedInsights: progress.unlockedInsights,
      history: useChatStore.getState().messages,
      requestWorkedExample: options?.requestWorkedExample,
      reviewMode: options?.reviewMode,
      reviewInsightIds: options?.reviewInsightIds,
    });
  }, [chapterId, language, isStreaming, addUserMessage, setStreaming, getChapterProgress]);

  const requestWorkedExample = useCallback(async (content: string) => {
    if (workedExampleUsed) return;
    setWorkedExampleUsed(true);
    await sendMessage(content, { requestWorkedExample: true });
  }, [workedExampleUsed, sendMessage]);

  const clearChat = useCallback(async () => {
    // End current session before clearing
    if (sessionIdRef.current !== null && messageCountRef.current > 0) {
      try {
        await window.electronAPI.endSession(sessionIdRef.current, messageCountRef.current);
      } catch { /* ignore */ }
      sessionIdRef.current = null;
      messageCountRef.current = 0;
    }
    attemptCountRef.current = 0;
    setWorkedExampleUsed(false);
    useChatStore.getState().clearMessages();
    await window.electronAPI.saveChatHistory(chapterId, []);
  }, [chapterId]);

  return {
    messages, streamingText, isStreaming, error,
    sendMessage, saveHistory, clearChat,
    requestWorkedExample, workedExampleUsed,
  };
}
