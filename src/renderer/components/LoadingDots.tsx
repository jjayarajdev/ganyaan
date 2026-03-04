import React from 'react';

export default function LoadingDots() {
  return (
    <div className="flex justify-start">
      <div className="bg-primary-50 border border-primary-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5 items-center">
        <div className="typing-dot w-2 h-2 bg-primary-400 rounded-full" />
        <div className="typing-dot w-2 h-2 bg-primary-400 rounded-full" />
        <div className="typing-dot w-2 h-2 bg-primary-400 rounded-full" />
      </div>
    </div>
  );
}
