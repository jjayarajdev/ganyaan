import React from 'react';

interface FactorTreeProps {
  number: number;
}

interface TreeNode {
  value: number;
  isPrime: boolean;
  left?: TreeNode;
  right?: TreeNode;
}

function buildTree(n: number): TreeNode {
  if (n <= 1) return { value: n, isPrime: false };
  for (let d = 2; d * d <= n; d++) {
    if (n % d === 0) {
      return {
        value: n,
        isPrime: false,
        left: buildTree(d),
        right: buildTree(n / d),
      };
    }
  }
  return { value: n, isPrime: true };
}

function getDepth(node: TreeNode): number {
  if (!node.left && !node.right) return 1;
  return 1 + Math.max(
    node.left ? getDepth(node.left) : 0,
    node.right ? getDepth(node.right) : 0,
  );
}

export default function FactorTree({ number }: FactorTreeProps) {
  const tree = buildTree(number);
  const depth = getDepth(tree);
  const width = Math.max(200, Math.pow(2, depth) * 40);
  const height = depth * 60 + 20;

  const elements: React.ReactNode[] = [];

  function renderNode(node: TreeNode, x: number, y: number, spread: number, key: string) {
    const r = 16;
    elements.push(
      <g key={key}>
        <circle cx={x} cy={y} r={r}
          fill={node.isPrime ? '#22c55e' : '#f1f5f9'}
          stroke={node.isPrime ? '#16a34a' : '#94a3b8'}
          strokeWidth="1.5"
        />
        <text x={x} y={y + 4} textAnchor="middle" fontSize="11"
          fill={node.isPrime ? 'white' : '#334155'} fontWeight="bold"
        >
          {node.value}
        </text>
      </g>
    );

    if (node.left) {
      const lx = x - spread;
      const ly = y + 50;
      elements.push(
        <line key={`${key}-ll`} x1={x} y1={y + r} x2={lx} y2={ly - r} stroke="#94a3b8" strokeWidth="1" />
      );
      renderNode(node.left, lx, ly, spread / 2, `${key}-l`);
    }
    if (node.right) {
      const rx = x + spread;
      const ry = y + 50;
      elements.push(
        <line key={`${key}-rl`} x1={x} y1={y + r} x2={rx} y2={ry - r} stroke="#94a3b8" strokeWidth="1" />
      );
      renderNode(node.right, rx, ry, spread / 2, `${key}-r`);
    }
  }

  renderNode(tree, width / 2, 25, width / 4, 'root');

  return (
    <div className="inline-flex flex-col items-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {elements}
      </svg>
      <span className="text-xs text-slate-500 mt-1">Factor tree of {number}</span>
    </div>
  );
}
