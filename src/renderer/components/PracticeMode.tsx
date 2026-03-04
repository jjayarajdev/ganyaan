import React, { useState, useEffect, useRef } from 'react';
import type { PracticeProblem } from '../../shared/types';
import { INSIGHT_DEFS } from '../../shared/constants';
import { useSettingsStore } from '../stores/settings-store';
import { useT } from '../hooks/useLanguage';
import type { InsightId } from '../../shared/types';

interface PracticeModeProps {
  chapterId: string;
  insightId: string;
  onBack: () => void;
}

export default function PracticeMode({ chapterId, insightId, onBack }: PracticeModeProps) {
  const t = useT();
  const language = useSettingsStore(s => s.language);
  const [problems, setProblems] = useState<PracticeProblem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);
  const startTimeRef = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const def = INSIGHT_DEFS[insightId as InsightId];
  const insightLabel = def ? (language === 'hi' ? def.labelHi : def.labelEn) : insightId;

  useEffect(() => {
    window.electronAPI.generatePractice(chapterId, insightId).then(p => {
      setProblems(p);
      startTimeRef.current = Date.now();
    }).catch(() => {});
  }, [chapterId, insightId]);

  const currentProblem = problems[currentIdx];

  const handleSubmit = async () => {
    if (!answer.trim() || !currentProblem || result !== null) return;

    const timeTaken = Date.now() - startTimeRef.current;
    const isCorrect = normalizeAnswer(answer.trim()) === normalizeAnswer(currentProblem.correctAnswer);

    setResult(isCorrect ? 'correct' : 'wrong');
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    try {
      await window.electronAPI.submitPractice({
        chapterId, insightId,
        problemText: currentProblem.question,
        studentAnswer: answer.trim(),
        correctAnswer: currentProblem.correctAnswer,
        isCorrect, timeTakenMs: timeTaken,
      });
    } catch { /* non-critical */ }
  };

  const handleNext = () => {
    if (currentIdx < problems.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setAnswer('');
      setResult(null);
      setShowHint(false);
      startTimeRef.current = Date.now();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setDone(true);
    }
  };

  if (problems.length === 0) {
    return (
      <div className="bg-notebook min-h-full flex items-center justify-center p-8">
        <div className="text-ink-muted text-sm font-display">{t('chat.thinking')}</div>
      </div>
    );
  }

  if (done) {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    const emoji = pct >= 80 ? '\u2B50' : pct >= 50 ? '\uD83D\uDC4D' : '\uD83D\uDCAA';
    return (
      <div className="bg-notebook min-h-full flex items-center justify-center p-8">
        <div className="max-w-sm w-full bg-white/70 rounded-xl shadow-notebook p-6 text-center animate-pop">
          <div className="text-4xl mb-3">{emoji}</div>
          <h2 className="text-xl font-extrabold text-ink mb-1 font-display">{t('practice.complete')}</h2>
          <p className="text-ink-muted text-sm mb-3 font-body">
            {t('practice.score').replace('{correct}', String(score.correct)).replace('{total}', String(score.total))}
          </p>
          <div className="text-3xl font-extrabold text-amber-600 mb-5 font-display tabular-nums">{pct}%</div>
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-colors font-display text-sm shadow-sm"
          >
            {t('chat.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-notebook min-h-full">
      <div className="max-w-md mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="text-xs text-amber-700 hover:text-amber-800 font-bold font-display transition-colors">
            {'\u2190'} {t('chat.back')}
          </button>
          <div className="text-xs text-ink-muted font-body font-bold tabular-nums">
            {currentIdx + 1} / {problems.length}
          </div>
          <div className="text-xs font-bold text-amber-700 font-display tabular-nums bg-amber-50 px-2 py-0.5 rounded">
            {score.correct}/{score.total}
          </div>
        </div>

        {/* Problem card — notebook style */}
        <div className="bg-white/70 rounded-xl shadow-notebook p-5 page-enter">
          <div className="text-[10px] text-amber-600 font-bold mb-1 font-display uppercase tracking-wide">{insightLabel}</div>
          <h3 className="text-base font-bold text-ink mb-4 font-display leading-snug">{currentProblem.question}</h3>

          {/* Answer */}
          <div className="flex gap-2 mb-3">
            <input
              ref={inputRef}
              type="text"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (result === null) handleSubmit();
                  else handleNext();
                }
              }}
              placeholder={t('practice.answerPlaceholder')}
              disabled={result !== null}
              className="flex-1 px-4 py-2.5 bg-paper-100 border border-paper-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300/50 text-sm font-body text-ink disabled:opacity-50 transition-all"
              autoFocus
            />
            {result === null ? (
              <button
                onClick={handleSubmit}
                disabled={!answer.trim()}
                className="px-4 py-2.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors font-display text-sm"
              >
                {t('practice.check')}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-4 py-2.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-colors font-display text-sm"
              >
                {currentIdx < problems.length - 1 ? t('practice.next') : t('practice.finish')}
              </button>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className={`p-3 rounded-lg mb-2 text-sm font-display font-bold animate-pop ${
              result === 'correct'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {result === 'correct'
                ? `${'\\u2713'} ${t('practice.correct')}`
                : `${t('practice.wrong')} ${currentProblem.correctAnswer}`
              }
            </div>
          )}

          {/* Hint */}
          {!showHint && result === null && currentProblem.hints && currentProblem.hints.length > 0 && (
            <button
              onClick={() => setShowHint(true)}
              className="text-[10px] text-amber-600 hover:text-amber-700 font-bold font-display transition-colors"
            >
              {'\uD83D\uDCA1'} {t('practice.showHint')}
            </button>
          )}
          {showHint && currentProblem.hints && (
            <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 font-body animate-slide-up">
              {currentProblem.hints[0]}
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-5">
          {problems.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i < currentIdx ? 'bg-emerald-400'
                  : i === currentIdx ? 'bg-amber-500 scale-125'
                  : 'bg-paper-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function normalizeAnswer(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}
