import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useT } from '../hooks/useLanguage';

interface ConfettiOverlayProps {
  type: 'insight' | 'mastery';
}

export default function ConfettiOverlay({ type }: ConfettiOverlayProps) {
  const t = useT();

  useEffect(() => {
    if (type === 'mastery') {
      const duration = 2000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 5, angle: 60, spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#f59e0b', '#dc2626', '#7c3aed', '#2563eb', '#10b981'],
        });
        confetti({
          particleCount: 5, angle: 120, spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#f59e0b', '#dc2626', '#7c3aed', '#2563eb', '#10b981'],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    } else {
      confetti({
        particleCount: 60, spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#b45309'],
      });
    }
  }, [type]);

  const message = type === 'mastery' ? t('confetti.mastery') : t('confetti.insight');

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-40">
      <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-xl shadow-warm animate-pop border border-amber-200/60">
        <p className={`text-sm font-extrabold font-display ${type === 'mastery' ? 'text-emerald-600' : 'text-amber-700'}`}>
          {type === 'mastery' ? '\u2B50' : '\u2728'} {message}
        </p>
      </div>
    </div>
  );
}
