import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useProgressStore } from '../stores/progress-store';
import { useT } from '../hooks/useLanguage';
import { CHAPTERS } from '../../shared/constants';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import LoadingDots from './LoadingDots';
import MasteryBar from './MasteryBar';
import ConfettiOverlay from './ConfettiOverlay';

interface ChatInterfaceProps {
  chapterId: string;
}

export default function ChatInterface({ chapterId }: ChatInterfaceProps) {
  const { messages, streamingText, isStreaming, error, sendMessage } = useChat(chapterId);
  const getChapterProgress = useProgressStore(s => s.getChapterProgress);
  const t = useT();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [confettiType, setConfettiType] = useState<'insight' | 'mastery' | null>(null);
  const prevInsightCountRef = useRef(0);

  const chapter = CHAPTERS.find(c => c.id === chapterId)!;
  const progress = getChapterProgress(chapterId);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Watch for new insight unlocks
  useEffect(() => {
    const currentCount = progress.unlockedInsights.length;
    if (currentCount > prevInsightCountRef.current && prevInsightCountRef.current > 0) {
      if (progress.mastered) {
        setConfettiType('mastery');
      } else {
        setConfettiType('insight');
      }
      setTimeout(() => setConfettiType(null), 3000);
    }
    prevInsightCountRef.current = currentCount;
  }, [progress.unlockedInsights.length, progress.mastered]);

  return (
    <div className="flex flex-col h-full">
      {/* Mastery bar at top */}
      <div className="px-6 py-3 bg-white border-b border-slate-100">
        <MasteryBar insights={chapter.insights} unlockedInsights={progress.unlockedInsights} />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-base max-w-md mx-auto">
              {t('app.welcome')}
            </p>
          </div>
        )}

        {messages.map(msg => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming bubble */}
        {isStreaming && streamingText && (
          <ChatBubble
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingText,
              timestamp: Date.now(),
            }}
          />
        )}

        {/* Loading indicator */}
        {isStreaming && !streamingText && <LoadingDots />}

        {/* Error message */}
        {error && (
          <div className="text-center py-2">
            <p className="text-red-500 text-sm bg-red-50 inline-block px-4 py-2 rounded-lg">
              {error}
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isStreaming} />

      {/* Confetti */}
      {confettiType && <ConfettiOverlay type={confettiType} />}
    </div>
  );
}
