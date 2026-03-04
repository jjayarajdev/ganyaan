import React, { useState, useRef } from 'react';
import { useT } from '../hooks/useLanguage';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  onRequestExample?: (message: string) => void;
  exampleUsed?: boolean;
}

export default function ChatInput({ onSend, disabled, onRequestExample, exampleUsed }: ChatInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
      inputRef.current?.focus();
    }
  };

  const handleExample = () => {
    if (!disabled && onRequestExample && !exampleUsed) {
      const msg = text.trim() || t('chat.showExampleRequest');
      onRequestExample(msg);
      setText('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="px-4 py-3 bg-white/80 backdrop-blur-sm border-t border-paper-300/50 shrink-0">
      <div className="flex gap-2 max-w-3xl mx-auto">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t('chat.placeholder')}
          disabled={disabled}
          className="flex-1 px-4 py-2.5 bg-paper-100 border border-paper-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-300 text-sm font-body text-ink disabled:opacity-50 transition-all placeholder:text-paper-500"
          autoFocus
        />
        {onRequestExample && (
          <button
            onClick={handleExample}
            disabled={disabled || exampleUsed}
            className="px-2.5 py-2.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title={exampleUsed ? t('chat.exampleUsed') : t('chat.showExample')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10 1a6 6 0 0 0-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 0 0 .75.75h2.5a.75.75 0 0 0 .75-.75v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0 0 10 1ZM8.863 17.414a.75.75 0 0 0-.226 1.483 9.066 9.066 0 0 0 2.726 0 .75.75 0 0 0-.226-1.483 7.563 7.563 0 0 1-2.274 0Z" />
            </svg>
          </button>
        )}
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="px-5 py-2.5 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-display shadow-sm"
        >
          {t('chat.send')}
        </button>
      </div>
    </div>
  );
}
