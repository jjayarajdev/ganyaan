import React from 'react';

interface DotArrayProps {
  rows: number;
  cols: number;
}

export default function DotArray({ rows, cols }: DotArrayProps) {
  const dotR = 6;
  const gap = 20;
  const padding = 12;
  const width = cols * gap + padding;
  const height = rows * gap + padding;

  return (
    <div className="inline-flex flex-col items-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => (
            <circle
              key={`${r}-${c}`}
              cx={padding / 2 + c * gap + gap / 2}
              cy={padding / 2 + r * gap + gap / 2}
              r={dotR}
              fill="#3b82f6"
            />
          ))
        )}
      </svg>
      <span className="text-xs text-slate-500 mt-1">{rows} x {cols} = {rows * cols}</span>
    </div>
  );
}
