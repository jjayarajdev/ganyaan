import React, { useEffect, useState } from 'react';
import type { StreakData, DailyProgressData } from '../../shared/types';
import { useT } from '../hooks/useLanguage';
import ConfettiOverlay from './ConfettiOverlay';

export default function StreakBanner() {
  const t = useT();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [daily, setDaily] = useState<DailyProgressData | null>(null);
  const [showMilestone, setShowMilestone] = useState(false);

  useEffect(() => {
    Promise.all([
      window.electronAPI.getStreak(),
      window.electronAPI.getDailyProgress(),
    ]).then(([s, d]) => {
      setStreak(s);
      setDaily(d);
      if (s.currentStreak > 0 && [7, 14, 30, 50, 100].includes(s.currentStreak)) {
        setShowMilestone(true);
        setTimeout(() => setShowMilestone(false), 3000);
      }
    }).catch(() => {});
  }, []);

  if (!streak || !daily) return null;
  if (streak.currentStreak === 0 && daily.messagesSent === 0) return null;

  const goalPct = daily.dailyGoal > 0 ? Math.min(100, Math.round((daily.messagesSent / daily.dailyGoal) * 100)) : 0;

  return (
    <div className="flex items-center gap-4 bg-white/60 rounded-lg px-4 py-2.5 mb-4 shadow-notebook">
      {/* Streak */}
      <div className="flex items-center gap-1.5">
        <span className={`text-lg ${streak.currentStreak > 0 ? 'streak-glow' : ''}`}>
          {streak.currentStreak > 0 ? '\uD83D\uDD25' : '\u26A1'}
        </span>
        <span className="text-sm font-extrabold text-ink font-display tabular-nums">
          {streak.currentStreak}
        </span>
        <span className="text-xs text-ink-muted font-body">{t('streak.days')}</span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-paper-400/40" />

      {/* Daily progress — simple bar */}
      <div className="flex items-center gap-2 flex-1">
        <span className="text-xs text-ink-muted font-body">{t('streak.dailyGoal')}</span>
        <div className="flex-1 h-1.5 bg-paper-300/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${daily.goalMet ? 'bg-emerald-400' : 'bg-amber-400'}`}
            style={{ width: `${goalPct}%` }}
          />
        </div>
        <span className="text-[10px] font-bold text-ink-muted font-body tabular-nums">
          {daily.messagesSent}/{daily.dailyGoal}
        </span>
      </div>

      {showMilestone && <ConfettiOverlay type="mastery" />}
    </div>
  );
}
