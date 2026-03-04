import React from 'react';

interface NumberLineProps {
  values: string[];
}

function parseFraction(s: string): number {
  s = s.trim();
  if (s.includes('/')) {
    const [num, den] = s.split('/').map(Number);
    return num / den;
  }
  return parseFloat(s);
}

export default function NumberLine({ values }: NumberLineProps) {
  const nums = values.map(parseFraction).filter(n => !isNaN(n));
  if (nums.length === 0) return null;

  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min || 1;

  const width = 280;
  const height = 60;
  const margin = 30;
  const lineY = 25;

  return (
    <div className="inline-flex flex-col items-center">
      <svg width={width + margin * 2} height={height} viewBox={`0 0 ${width + margin * 2} ${height}`}>
        {/* Main line */}
        <line x1={margin} y1={lineY} x2={width + margin} y2={lineY} stroke="#94a3b8" strokeWidth="2" />
        {/* Arrow heads */}
        <polygon points={`${margin - 5},${lineY} ${margin + 3},${lineY - 4} ${margin + 3},${lineY + 4}`} fill="#94a3b8" />
        <polygon points={`${width + margin + 5},${lineY} ${width + margin - 3},${lineY - 4} ${width + margin - 3},${lineY + 4}`} fill="#94a3b8" />

        {/* Value markers */}
        {values.map((label, i) => {
          const val = parseFraction(label);
          if (isNaN(val)) return null;
          const x = margin + ((val - min) / range) * width;
          return (
            <g key={i}>
              <circle cx={x} cy={lineY} r={4} fill="#3b82f6" />
              <line x1={x} y1={lineY - 6} x2={x} y2={lineY + 6} stroke="#3b82f6" strokeWidth="1.5" />
              <text x={x} y={lineY + 20} textAnchor="middle" fontSize="10" fill="#334155">
                {label.trim()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
