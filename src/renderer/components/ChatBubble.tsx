import React from 'react';
import type { ChatMessage } from '../../shared/types';
import VisualRenderer from './visuals/VisualRenderer';

interface ChatBubbleProps {
  message: ChatMessage;
}

const VISUAL_REGEX = /\[VISUAL:([a-z-]+):([^\]]+)\]/g;

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  const renderContent = () => {
    if (isUser) return message.content;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    VISUAL_REGEX.lastIndex = 0;

    while ((match = VISUAL_REGEX.exec(message.content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>{message.content.slice(lastIndex, match.index)}</span>
        );
      }
      parts.push(
        <div key={`visual-${match.index}`} className="my-2">
          <VisualRenderer type={match[1]} params={match[2]} />
        </div>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < message.content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{message.content.slice(lastIndex)}</span>
      );
    }

    return parts.length > 0 ? parts : message.content;
  };

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-primary-600 text-white text-sm leading-relaxed font-body shadow-sm">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-2 animate-slide-up">
      {/* Small tutor marker */}
      <div className="shrink-0 mt-1 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs shadow-sm">
        {'\uD83E\uDDD1\u200D\uD83C\uDFEB'}
      </div>
      <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white/80 border border-paper-300/60 text-ink text-sm leading-relaxed font-body shadow-notebook">
        {renderContent()}
      </div>
    </div>
  );
}
