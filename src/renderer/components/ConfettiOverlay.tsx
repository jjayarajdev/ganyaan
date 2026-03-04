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
      // Big celebration burst
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#3B82F6', '#FB923C', '#10B981', '#F59E0B'],
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#3B82F6', '#FB923C', '#10B981', '#F59E0B'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } else {
      // Small burst for single insight
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3B82F6', '#60A5FA', '#93C5FD'],
      });
    }
  }, [type]);

  const message = type === 'mastery' ? t('confetti.mastery') : t('confetti.insight');

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-40">
      <div className="bg-white/90 backdrop-blur-sm px-8 py-4 rounded-2xl shadow-lg animate-bounce">
        <p className={`text-lg font-bold ${type === 'mastery' ? 'text-green-600' : 'text-primary-600'}`}>
          {message}
        </p>
      </div>
    </div>
  );
}
