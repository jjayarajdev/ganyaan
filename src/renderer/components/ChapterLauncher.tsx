import React from 'react';
import { CHAPTERS } from '../../shared/constants';
import { useProgressStore } from '../stores/progress-store';
import { useSettingsStore } from '../stores/settings-store';
import { useT } from '../hooks/useLanguage';
import MasteryBar from './MasteryBar';
import InsightCard from './InsightCard';

interface ChapterLauncherProps {
  onStartChapter: (chapterId: string) => void;
}

export default function ChapterLauncher({ onStartChapter }: ChapterLauncherProps) {
  const language = useSettingsStore(s => s.language);
  const getChapterProgress = useProgressStore(s => s.getChapterProgress);
  const t = useT();

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('launcher.title')}</h2>

      {CHAPTERS.map(chapter => {
        const progress = getChapterProgress(chapter.id);
        const title = language === 'hi' ? chapter.titleHi : chapter.titleEn;
        const unlocked = progress.unlockedInsights.length;
        const total = chapter.insights.length;
        const hasStarted = unlocked > 0 || progress.lastActivity > 0;

        return (
          <div
            key={chapter.id}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6"
          >
            {/* Chapter header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm font-medium text-primary-500 mb-1">
                  {t('launcher.chapter')} {chapter.number}
                </div>
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
              </div>
              {progress.mastered && (
                <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  {t('launcher.mastered')}
                </span>
              )}
            </div>

            {/* Mastery bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">{t('launcher.progress')}</span>
                <span className="text-xs text-slate-400">
                  {t('launcher.insightsCount')
                    .replace('{unlocked}', String(unlocked))
                    .replace('{total}', String(total))}
                </span>
              </div>
              <MasteryBar
                insights={chapter.insights}
                unlockedInsights={progress.unlockedInsights}
              />
            </div>

            {/* Insight cards */}
            <div className="mb-5">
              <h4 className="text-sm font-medium text-slate-600 mb-2">{t('launcher.insights')}</h4>
              <div className="grid grid-cols-1 gap-2">
                {chapter.insights.map(insightId => (
                  <InsightCard
                    key={insightId}
                    insightId={insightId}
                    unlocked={progress.unlockedInsights.includes(insightId)}
                  />
                ))}
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={() => onStartChapter(chapter.id)}
              className="w-full py-3 px-4 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 active:bg-primary-700 transition-colors text-base"
            >
              {hasStarted ? t('launcher.continue') : t('launcher.start')}
            </button>
          </div>
        );
      })}
    </div>
  );
}
