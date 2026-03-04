import React from 'react';
import type { InsightId } from '../../shared/types';
import { INSIGHT_DEFS } from '../../shared/constants';
import { useSettingsStore } from '../stores/settings-store';
import { useT } from '../hooks/useLanguage';

interface InsightCardProps {
  insightId: InsightId;
  unlocked: boolean;
  chapterId?: string;
}

export default function InsightCard({ insightId, unlocked }: InsightCardProps) {
  const language = useSettingsStore(s => s.language);
  const t = useT();
  const def = INSIGHT_DEFS[insightId];

  const label = language === 'hi' ? def.labelHi : def.labelEn;
  const description = language === 'hi' ? def.descriptionHi : def.descriptionEn;

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
        unlocked ? 'bg-amber-50/80 border border-amber-200/40' : 'bg-white/40 border border-paper-300/40'
      }`}
    >
      <span className={`text-sm ${unlocked ? 'text-amber-400' : 'text-paper-400'}`}>
        {unlocked ? '\u2605' : '\u2606'}
      </span>
      <div className="min-w-0">
        <div className={`text-xs font-bold font-display ${unlocked ? 'text-ink' : 'text-ink-muted'}`}>
          {label}
        </div>
        <div className={`text-[10px] font-body ${unlocked ? 'text-ink-light' : 'text-ink-faint'}`}>
          {unlocked ? description : t('mastery.locked')}
        </div>
      </div>
    </div>
  );
}
