import React from 'react';

export default function LoadingDots() {
  return (
    <div className="flex justify-start gap-2">
      <div className="shrink-0 mt-1 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs">
        {'\uD83E\uDDD1\u200D\uD83C\uDFEB'}
      </div>
      <div className="bg-white/80 border border-paper-300/60 rounded-2xl rounded-bl-sm px-4 py-2.5 flex gap-1.5 items-center shadow-notebook">
        <div className="typing-dot w-1.5 h-1.5 bg-amber-400 rounded-full" />
        <div className="typing-dot w-1.5 h-1.5 bg-amber-400 rounded-full" />
        <div className="typing-dot w-1.5 h-1.5 bg-amber-400 rounded-full" />
      </div>
    </div>
  );
}
