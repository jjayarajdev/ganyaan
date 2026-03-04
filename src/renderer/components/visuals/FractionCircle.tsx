import React from 'react';

interface FractionCircleProps {
  numerator: number;
  denominator: number;
}

export default function FractionCircle({ numerator, denominator }: FractionCircleProps) {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const r = 50;

  const slices: React.ReactNode[] = [];
  for (let i = 0; i < denominator; i++) {
    const startAngle = (i / denominator) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((i + 1) / denominator) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = (1 / denominator) > 0.5 ? 1 : 0;
    const filled = i < numerator;

    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    slices.push(
      <path
        key={i}
        d={d}
        fill={filled ? '#3b82f6' : '#e2e8f0'}
        stroke="white"
        strokeWidth="2"
      />
    );
  }

  return (
    <div className="inline-flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#94a3b8" strokeWidth="1.5" />
      </svg>
      <span className="text-xs text-slate-500 mt-1">{numerator}/{denominator}</span>
    </div>
  );
}
