import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useProgressStore } from '../stores/progress-store';
import { useSettingsStore } from '../stores/settings-store';
import { useT } from '../hooks/useLanguage';
import { CHAPTERS, INSIGHT_DEFS } from '../../shared/constants';
import type { InsightId, UsageStats } from '../../shared/types';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import LoadingDots from './LoadingDots';
import ConfettiOverlay from './ConfettiOverlay';

interface ChatInterfaceProps {
  chapterId: string;
}

export default function ChatInterface({ chapterId }: ChatInterfaceProps) {
  const {
    messages, streamingText, isStreaming, error,
    sendMessage, clearChat, requestWorkedExample, workedExampleUsed,
  } = useChat(chapterId);
  const getChapterProgress = useProgressStore(s => s.getChapterProgress);
  const language = useSettingsStore(s => s.language);
  const t = useT();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [confettiType, setConfettiType] = useState<'insight' | 'mastery' | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const prevInsightCountRef = useRef(0);
  const [usage, setUsage] = useState<UsageStats | null>(null);

  const chapter = CHAPTERS.find(c => c.id === chapterId)!;
  const progress = getChapterProgress(chapterId);
  const unlocked = progress.unlockedInsights.length;
  const total = chapter.insights.length;

  useEffect(() => {
    window.electronAPI.getUsageStats().then(setUsage).catch(() => {});
  }, [messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  useEffect(() => {
    const currentCount = progress.unlockedInsights.length;
    if (currentCount > prevInsightCountRef.current && prevInsightCountRef.current > 0) {
      setConfettiType(progress.mastered ? 'mastery' : 'insight');
      setTimeout(() => setConfettiType(null), 3000);
    }
    prevInsightCountRef.current = currentCount;
  }, [progress.unlockedInsights.length, progress.mastered]);

  const handleClear = () => {
    clearChat();
    setShowClearConfirm(false);
  };

  const getActLabel = (): string | null => {
    const ratio = unlocked / total;
    const STORYLINE_ACTS: Record<string, string[][]> = {
      'ch7-fractions': [['Act 1', 'Cutting the Pizza'], ['Act 2', 'Comparing Portions'], ['Act 3', 'The Leftovers']],
      'ch1-patterns': [['Act 1', 'Counting Tiles'], ['Act 2', 'Arranging the Mosaic'], ['Act 3', 'Designing the Border']],
      'ch5-prime-time': [['Act 1', 'Grouping the Stalls'], ['Act 2', 'Special Numbers'], ['Act 3', 'Planning the Schedule']],
    };
    const acts = STORYLINE_ACTS[chapterId];
    if (!acts) return null;
    const actIdx = ratio < 0.33 ? 0 : ratio < 0.66 ? 1 : 2;
    return `${acts[actIdx][0]}: ${acts[actIdx][1]}`;
  };

  const actLabel = getActLabel();

  return (
    <div className="flex flex-col h-full bg-paper">
      {/* Progress panel — thin notebook header */}
      <div className="px-4 py-2.5 bg-white/80 backdrop-blur-sm border-b border-paper-300/50 shrink-0">
        {/* Header row */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold font-display text-ink">
              {language === 'hi' ? chapter.titleHi : chapter.titleEn}
            </h3>
            {actLabel && (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-display">
                {actLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {usage && (
              <span className="text-[10px] text-ink-muted font-body tabular-nums">
                {usage.messagesSent}/{usage.dailyLimit}
              </span>
            )}
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={isStreaming || messages.length === 0}
              className="text-[10px] text-ink-faint hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-1.5 py-0.5 rounded hover:bg-red-50 font-display font-bold"
              title={t('chat.clear')}
            >
              {t('chat.clear')}
            </button>
          </div>
        </div>

        {/* Progress stars — inline */}
        <div className="flex items-center gap-1">
          {chapter.insights.map((id) => {
            const isUnlocked = progress.unlockedInsights.includes(id);
            return (
              <span key={id} className={`text-xs ${isUnlocked ? 'text-amber-400' : 'text-paper-400'}`}>
                {isUnlocked ? '\u2605' : '\u2606'}
              </span>
            );
          })}
          <span className="text-[10px] text-ink-muted font-body tabular-nums ml-1">{unlocked}/{total}</span>
          {progress.mastered && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-display ml-1">
              {t('launcher.mastered')}
            </span>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 chat-bg">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-12 animate-slide-up">
            <div className="text-4xl mb-3">{'\uD83E\uDDD1\u200D\uD83C\uDFEB'}</div>
            <p className="text-ink-muted text-sm max-w-sm mx-auto font-body leading-relaxed">
              {t('app.welcome')}
            </p>
          </div>
        )}

        {messages.map(msg => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {isStreaming && streamingText && (
          <ChatBubble
            message={{ id: 'streaming', role: 'assistant', content: streamingText, timestamp: Date.now() }}
          />
        )}

        {isStreaming && !streamingText && <LoadingDots />}

        {error && (
          <div className="text-center py-2 animate-pop">
            <p className="text-red-600 text-xs bg-red-50 border border-red-200 inline-block px-3 py-2 rounded-lg font-display font-bold">
              {error}
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Mastery completion card */}
      {progress.mastered && !isStreaming && (
        <div className="px-4 py-3 bg-emerald-50/80 border-t border-emerald-200/50 shrink-0">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-sm font-bold text-emerald-700 font-display">
              {'\u2B50'} {t('mastery.complete')}
            </h3>
            <p className="text-xs text-emerald-600 mt-0.5 font-body">{t('mastery.completeSummary')}</p>
            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
              {chapter.insights.map(id => {
                const def = INSIGHT_DEFS[id as InsightId];
                const label = language === 'hi' ? def.labelHi : def.labelEn;
                return (
                  <span key={id} className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-display font-bold">
                    {'\u2713'} {label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        disabled={isStreaming}
        onRequestExample={requestWorkedExample}
        exampleUsed={workedExampleUsed}
      />

      {/* Clear confirmation dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-5 max-w-xs w-full mx-4 animate-pop">
            <h3 className="text-sm font-bold text-ink mb-1.5 font-display">{t('chat.clearTitle')}</h3>
            <p className="text-xs text-ink-muted mb-4 font-body">{t('chat.clearDescription')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-3 py-2 text-xs font-bold text-ink-light bg-paper-200 rounded-lg hover:bg-paper-300 transition-colors font-display"
              >
                {t('chat.clearCancel')}
              </button>
              <button
                onClick={handleClear}
                className="flex-1 px-3 py-2 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors font-display"
              >
                {t('chat.clearConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confettiType && <ConfettiOverlay type={confettiType} />}
    </div>
  );
}
