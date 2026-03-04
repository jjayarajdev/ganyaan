import React, { useState, useEffect } from 'react';
import type { User, Alert } from '../../shared/types';
import { CHAPTERS, INSIGHT_DEFS } from '../../shared/constants';
import { useSettingsStore } from '../stores/settings-store';
import { useT } from '../hooks/useLanguage';
import type { InsightId } from '../../shared/types';

interface StudentReport {
  totalSessions: number;
  timePerChapter: Record<string, number>;
  insightsTimeline: Array<{ chapter_id: string; insight_id: string; unlocked_at: number }>;
  messagesPerSession: number;
  recentActivity: Array<{ chapter_id: string; session_start: number; messages_count: number }>;
}

interface ParentReportCardProps {
  linkedStudents: User[];
}

export default function ParentReportCard({ linkedStudents }: ParentReportCardProps) {
  const t = useT();
  const language = useSettingsStore(s => s.language);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(
    linkedStudents.length > 0 ? linkedStudents[0] : null
  );
  const [report, setReport] = useState<StudentReport | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!selectedStudent) return;
    window.electronAPI.getStudentReport(selectedStudent.id).then(data => {
      setReport(data as StudentReport);
    });
  }, [selectedStudent]);

  useEffect(() => {
    window.electronAPI.listAlerts().then(setAlerts).catch(() => {});
  }, []);

  const handleMarkAlertRead = async (alertId: number) => {
    await window.electronAPI.markAlertRead(alertId);
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
  };

  if (linkedStudents.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('report.title')}</h2>
        <p className="text-slate-500">{t('report.noStudents')}</p>
      </div>
    );
  }

  // Group insights by chapter
  const chapterInsights: Record<string, string[]> = {};
  if (report) {
    for (const item of report.insightsTimeline) {
      if (!chapterInsights[item.chapter_id]) chapterInsights[item.chapter_id] = [];
      chapterInsights[item.chapter_id].push(item.insight_id);
    }
  }

  const unreadAlerts = alerts.filter(a => !a.isRead);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('report.title')}</h2>

      {/* Student selector if multiple */}
      {linkedStudents.length > 1 && (
        <div className="flex gap-2 mb-6">
          {linkedStudents.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedStudent(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStudent?.id === s.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {selectedStudent && (
        <p className="text-slate-500 mb-6">
          {t('report.studentProgress').replace('{name}', selectedStudent.name)}
        </p>
      )}

      {/* Alerts panel */}
      {unreadAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-amber-800 mb-3">
            {t('alerts.title')} ({unreadAlerts.length})
          </h3>
          <div className="space-y-2">
            {unreadAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="flex items-start justify-between bg-white rounded-lg p-3 border border-amber-100">
                <p className="text-sm text-slate-700 flex-1">{alert.message}</p>
                <button
                  onClick={() => handleMarkAlertRead(alert.id)}
                  className="text-xs text-primary-500 hover:text-primary-700 font-medium ml-2 shrink-0"
                >
                  {t('alerts.markRead')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Overall stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
              <div className="text-3xl font-bold text-primary-600">{report.totalSessions}</div>
              <div className="text-sm text-slate-500 mt-1">{t('report.totalSessions')}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
              <div className="text-3xl font-bold text-primary-600">
                {report.insightsTimeline.length}
              </div>
              <div className="text-sm text-slate-500 mt-1">{t('report.insightsEarned')}</div>
            </div>
          </div>

          {/* Per-chapter progress */}
          {CHAPTERS.map(ch => {
            const unlocked = chapterInsights[ch.id] || [];
            const total = ch.insights.length;
            const pct = Math.round((unlocked.length / total) * 100);
            const title = language === 'hi' ? ch.titleHi : ch.titleEn;

            return (
              <div key={ch.id} className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm text-primary-500 font-medium">
                      {t('launcher.chapter')} {ch.number}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">{pct}%</div>
                    <div className="text-xs text-slate-400">{unlocked.length}/{total} {t('report.concepts')}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3">
                  <div
                    className="bg-primary-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Insight badges */}
                <div className="flex flex-wrap gap-2">
                  {ch.insights.map(insightId => {
                    const isUnlocked = unlocked.includes(insightId);
                    const def = INSIGHT_DEFS[insightId as InsightId];
                    const label = language === 'hi' ? def.labelHi : def.labelEn;
                    return (
                      <span
                        key={insightId}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          isUnlocked
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isUnlocked ? '\u2713 ' : ''}{label}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Recent activity */}
          {report.recentActivity.length > 0 && (
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('report.recentActivity')}</h3>
              <div className="space-y-2">
                {report.recentActivity.slice(0, 5).map((activity, i) => {
                  const ch = CHAPTERS.find(c => c.id === activity.chapter_id);
                  const title = ch ? (language === 'hi' ? ch.titleHi : ch.titleEn) : activity.chapter_id;
                  const date = new Date(activity.session_start).toLocaleDateString();
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{title}</span>
                      <span className="text-slate-400">{date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
