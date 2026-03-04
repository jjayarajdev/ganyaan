import React from 'react';
import type { ChatMessage } from '../../shared/types';

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-base leading-relaxed ${
          isUser
            ? 'bg-accent-400 text-white rounded-br-md'
            : 'bg-primary-50 text-slate-800 border border-primary-100 rounded-bl-md'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
