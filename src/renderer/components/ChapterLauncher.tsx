import React, { useEffect, useState } from 'react';
import { CHAPTERS, INSIGHT_DEFS } from '../../shared/constants';
import { useProgressStore } from '../stores/progress-store';
import { useSettingsStore } from '../stores/settings-store';
import { useT } from '../hooks/useLanguage';
import type { ReviewItem, InsightId } from '../../shared/types';
import StreakBanner from './StreakBanner';

interface ChapterLauncherProps {
  onStartChapter: (chapterId: string) => void;
  onStartPractice?: (chapterId: string, insightId: string) => void;
  onStartReview?: (chapterId: string, insightIds: string[]) => void;
}

const CHAPTER_THEME: Record<string, { tabColor: string; numBg: string; numText: string; icon: string; progressFill: string }> = {
  'ch1-patterns': {
    tabColor: '#7c3aed',
    numBg: 'bg-violet-100',
    numText: 'text-violet-700',
    icon: '\uD83C\uDFA8',
    progressFill: 'bg-violet-400',
  },
  'ch5-prime-time': {
    tabColor: '#2563eb',
    numBg: 'bg-blue-100',
    numText: 'text-blue-700',
    icon: '\uD83D\uDD22',
    progressFill: 'bg-blue-400',
  },
  'ch7-fractions': {
    tabColor: '#dc2626',
    numBg: 'bg-red-100',
    numText: 'text-red-700',
    icon: '\uD83C\uDF55',
    progressFill: 'bg-red-400',
  },
};

export default function ChapterLauncher({ onStartChapter, onStartPractice, onStartReview }: ChapterLauncherProps) {
  const language = useSettingsStore(s => s.language);
  const getChapterProgress = useProgressStore(s => s.getChapterProgress);
  const t = useT();
  const [reviewsDue, setReviewsDue] = useState<ReviewItem[]>([]);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Array<{
    id: number; chapterId: string; title: string; teacherName: string; insightIds: string[];
  }>>([]);

  useEffect(() => {
    window.electronAPI.getReviewsDue().then(setReviewsDue).catch(() => {});
    window.electronAPI.listAssignments().then(data => {
      const studentAssignments = (data as any[]).filter(a => a.teacherName);
      setAssignments(studentAssignments);
    }).catch(() => {});
  }, []);

  const getReviewCountForChapter = (chapterId: string) => {
    return reviewsDue.filter(r => r.chapterId === chapterId).length;
  };

  return (
    <div className="bg-notebook min-h-full">
      <div className="max-w-xl mx-auto px-6 py-6">
        {/* Title — like a notebook cover heading */}
        <div className="mb-5 notebook-margin pl-4">
          <h2 className="font-display text-2xl font-extrabold text-ink tracking-tight">
            {t('launcher.title')}
          </h2>
        </div>

        {/* Streak Banner — compact */}
        <StreakBanner />

        {/* Assignments */}
        {assignments.length > 0 && (
          <div className="mb-5">
            {assignments.map(a => (
              <button
                key={a.id}
                className="w-full text-left bg-amber-50/80 border border-amber-200/60 rounded-lg px-4 py-2.5 mb-2 hover:bg-amber-100/80 transition-colors shadow-notebook"
                onClick={() => onStartChapter(a.chapterId)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-700 bg-amber-200/80 px-2 py-0.5 rounded font-display">
                    {t('assignment.badge').replace('{name}', a.teacherName)}
                  </span>
                  <span className="text-sm font-semibold text-ink font-display">{a.title}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Chapter list — notebook table of contents */}
        <div className="space-y-3">
          {CHAPTERS.map((chapter, idx) => {
            const progress = getChapterProgress(chapter.id);
            const title = language === 'hi' ? chapter.titleHi : chapter.titleEn;
            const unlocked = progress.unlockedInsights.length;
            const total = chapter.insights.length;
            const hasStarted = unlocked > 0 || progress.lastActivity > 0;
            const reviewCount = getReviewCountForChapter(chapter.id);
            const theme = CHAPTER_THEME[chapter.id] || CHAPTER_THEME['ch7-fractions'];
            const isExpanded = expandedChapter === chapter.id;
            const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;

            return (
              <div
                key={chapter.id}
                className="bg-white/70 rounded-xl shadow-notebook overflow-hidden page-enter"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {/* Chapter row — main click target */}
                <button
                  className="w-full text-left px-4 py-3.5 bookmark-tab hover:bg-paper-200/50 transition-colors"
                  style={{ '--tab-color': theme.tabColor } as React.CSSProperties}
                  onClick={() => onStartChapter(chapter.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Chapter number badge */}
                    <div className={`w-9 h-9 rounded-lg ${theme.numBg} flex items-center justify-center shrink-0`}>
                      <span className={`text-sm font-extrabold font-display ${theme.numText}`}>{chapter.number}</span>
                    </div>

                    {/* Title + progress */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-ink font-display truncate">{title}</h3>
                        {progress.mastered && (
                          <span className="sticker text-xs shrink-0" title={t('launcher.mastered')}>
                            {'\u2B50'}
                          </span>
                        )}
                      </div>
                      {/* Mini progress bar */}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-paper-300/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${theme.progressFill} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-ink-muted font-body tabular-nums shrink-0">
                          {unlocked}/{total}
                        </span>
                      </div>
                    </div>

                    {/* Right side badges */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {reviewCount > 0 && (
                        <span
                          className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-display cursor-pointer hover:bg-amber-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            const ids = reviewsDue.filter(r => r.chapterId === chapter.id).map(r => r.insightId);
                            onStartReview?.(chapter.id, ids);
                          }}
                        >
                          {t('review.badge').replace('{count}', String(reviewCount))}
                        </span>
                      )}
                      {/* Expand/collapse toggle */}
                      <span
                        className="text-ink-faint hover:text-ink-muted transition-colors cursor-pointer text-xs px-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedChapter(isExpanded ? null : chapter.id);
                        }}
                        title={t('launcher.insights')}
                      >
                        {isExpanded ? '\u25B2' : '\u25BC'}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Expandable insight details */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-1 border-t border-paper-300/40 animate-slide-up">
                    <div className="space-y-1 ml-12">
                      {chapter.insights.map(insightId => {
                        const isUnlocked = progress.unlockedInsights.includes(insightId);
                        const def = INSIGHT_DEFS[insightId as InsightId];
                        const label = language === 'hi' ? def.labelHi : def.labelEn;

                        return (
                          <div key={insightId} className="flex items-center gap-2 py-1">
                            <span className={`text-xs ${isUnlocked ? 'text-amber-500' : 'text-paper-400'}`}>
                              {isUnlocked ? '\u2605' : '\u2606'}
                            </span>
                            <span className={`text-xs font-body ${isUnlocked ? 'text-ink font-semibold' : 'text-ink-muted'}`}>
                              {label}
                            </span>
                            {isUnlocked && onStartPractice && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStartPractice(chapter.id, insightId);
                                }}
                                className="text-[10px] font-bold text-primary-600 hover:text-primary-700 font-display ml-auto transition-colors"
                              >
                                {t('practice.button')}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Start button inside expanded area */}
                    <button
                      onClick={() => onStartChapter(chapter.id)}
                      className="mt-2 ml-12 px-4 py-2 text-xs font-bold text-white rounded-lg font-display transition-all active:scale-[0.97] shadow-sm hover:shadow-md"
                      style={{ backgroundColor: theme.tabColor }}
                    >
                      {hasStarted ? t('launcher.continue') : t('launcher.start')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
