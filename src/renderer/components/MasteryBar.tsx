import React from 'react';
import type { InsightId } from '../../shared/types';

interface MasteryBarProps {
  insights: InsightId[];
  unlockedInsights: InsightId[];
  chapterId?: string;
}

export default function MasteryBar({ insights, unlockedInsights, chapterId }: MasteryBarProps) {
  return (
    <div className="flex gap-1">
      {insights.map((id, i) => {
        const unlocked = unlockedInsights.includes(id);
        return (
          <div
            key={id}
            className={`h-2 flex-1 rounded-full transition-all duration-500 ${
              unlocked ? 'bg-amber-400 insight-glow' : 'bg-paper-300/60'
            }`}
            style={{ transitionDelay: `${i * 100}ms` }}
          />
        );
      })}
    </div>
  );
}
