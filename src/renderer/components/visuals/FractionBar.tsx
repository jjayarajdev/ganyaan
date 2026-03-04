import React from 'react';

interface FractionBarProps {
  numerator: number;
  denominator: number;
}

export default function FractionBar({ numerator, denominator }: FractionBarProps) {
  const width = 200;
  const height = 30;
  const segmentWidth = width / denominator;

  return (
    <div className="inline-flex flex-col items-center">
      <svg width={width + 4} height={height + 4} viewBox={`0 0 ${width + 4} ${height + 4}`}>
        {Array.from({ length: denominator }, (_, i) => (
          <rect
            key={i}
            x={i * segmentWidth + 2}
            y={2}
            width={segmentWidth}
            height={height}
            fill={i < numerator ? '#3b82f6' : '#e2e8f0'}
            stroke="white"
            strokeWidth="2"
          />
        ))}
        <rect x={2} y={2} width={width} height={height} fill="none" stroke="#94a3b8" strokeWidth="1.5" rx="4" />
      </svg>
      <span className="text-xs text-slate-500 mt-1">{numerator}/{denominator}</span>
    </div>
  );
}
