import React from 'react';
import FractionCircle from './FractionCircle';
import FractionBar from './FractionBar';
import DotArray from './DotArray';
import FactorTree from './FactorTree';
import NumberLine from './NumberLine';

interface VisualRendererProps {
  type: string;
  params: string;
}

export default function VisualRenderer({ type, params }: VisualRendererProps) {
  try {
    switch (type) {
      case 'fraction-circle': {
        const [num, den] = params.split('/').map(Number);
        if (!isNaN(num) && !isNaN(den) && den > 0) {
          return <FractionCircle numerator={num} denominator={den} />;
        }
        break;
      }
      case 'fraction-bar': {
        const [num, den] = params.split('/').map(Number);
        if (!isNaN(num) && !isNaN(den) && den > 0) {
          return <FractionBar numerator={num} denominator={den} />;
        }
        break;
      }
      case 'dot-array': {
        const [rows, cols] = params.split('x').map(Number);
        if (!isNaN(rows) && !isNaN(cols) && rows > 0 && cols > 0) {
          return <DotArray rows={rows} cols={cols} />;
        }
        break;
      }
      case 'factor-tree': {
        const num = parseInt(params, 10);
        if (!isNaN(num) && num > 1) {
          return <FactorTree number={num} />;
        }
        break;
      }
      case 'number-line': {
        const values = params.split(',').map(s => s.trim());
        if (values.length >= 2) {
          return <NumberLine values={values} />;
        }
        break;
      }
    }
  } catch {
    // Fall through to null
  }

  return null;
}
