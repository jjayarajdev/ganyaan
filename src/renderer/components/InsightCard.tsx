import React from 'react';
import type { InsightId } from '../../shared/types';
import { INSIGHT_DEFS } from '../../shared/constants';
import { useSettingsStore } from '../stores/settings-store';
import { useT } from '../hooks/useLanguage';

interface InsightCardProps {
  insightId: InsightId;
  unlocked: boolean;
}

export default function InsightCard({ insightId, unlocked }: InsightCardProps) {
  const language = useSettingsStore(s => s.language);
  const t = useT();
  const def = INSIGHT_DEFS[insightId];

  const label = language === 'hi' ? def.labelHi : def.labelEn;
  const description = language === 'hi' ? def.descriptionHi : def.descriptionEn;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        unlocked
          ? 'bg-primary-50 border border-primary-200'
          : 'bg-slate-50 border border-slate-100'
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
          unlocked
            ? 'bg-primary-500 text-white'
            : 'bg-slate-200 text-slate-400'
        }`}
      >
        {unlocked ? '\u2713' : '?'}
      </div>
      <div className="min-w-0">
        <div className={`text-sm font-medium ${unlocked ? 'text-primary-700' : 'text-slate-500'}`}>
          {label}
        </div>
        <div className={`text-xs ${unlocked ? 'text-primary-500' : 'text-slate-400'}`}>
          {unlocked ? description : t('mastery.locked')}
        </div>
      </div>
    </div>
  );
}
