import React from 'react';
import type { InsightId } from '../../shared/types';

interface MasteryBarProps {
  insights: InsightId[];
  unlockedInsights: InsightId[];
}

export default function MasteryBar({ insights, unlockedInsights }: MasteryBarProps) {
  return (
    <div className="flex gap-1.5">
      {insights.map((id, i) => {
        const unlocked = unlockedInsights.includes(id);
        return (
          <div
            key={id}
            className={`h-3 flex-1 rounded-full transition-all duration-500 ${
              unlocked
                ? 'bg-primary-500 insight-glow'
                : 'bg-slate-200'
            }`}
            style={{
              transitionDelay: `${i * 100}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
