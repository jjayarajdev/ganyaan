import React, { useState, useEffect } from 'react';
import { CHAPTERS, INSIGHT_DEFS } from '../../shared/constants';
import { useSettingsStore } from '../stores/settings-store';
import { useT } from '../hooks/useLanguage';
import type { InsightId, Alert, Assignment, AssignmentStudent, CreateAssignmentRequest } from '../../shared/types';
import ConversationViewer from './ConversationViewer';

interface ClassReport {
  students: Array<{
    id: number;
    name: string;
    totalInsights: number;
    totalSessions: number;
    chaptersProgress: Record<string, { unlocked: number; total: number }>;
  }>;
  commonlyMissed: Array<{ chapter_id: string; insight_id: string; unlocked_count: number }>;
}

type Tab = 'overview' | 'assignments' | 'alerts';

export default function TeacherDashboard() {
  const t = useT();
  const language = useSettingsStore(s => s.language);
  const [report, setReport] = useState<ClassReport | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<{ id: number; name: string } | null>(null);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);

  useEffect(() => {
    window.electronAPI.getClassReport().then(data => setReport(data as ClassReport));
    window.electronAPI.listAlerts().then(setAlerts).catch(() => {});
    window.electronAPI.getAlertCount().then(setAlertCount).catch(() => {});
    window.electronAPI.listAssignments().then(setAssignments).catch(() => {});
  }, []);

  const handleMarkAlertRead = async (alertId: number) => {
    await window.electronAPI.markAlertRead(alertId);
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
    setAlertCount(prev => Math.max(0, prev - 1));
  };

  if (selectedStudent) {
    return (
      <ConversationViewer
        studentId={selectedStudent.id}
        studentName={selectedStudent.name}
        onBack={() => setSelectedStudent(null)}
      />
    );
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="text-slate-400">{t('chat.thinking')}</div>
      </div>
    );
  }

  if (report.students.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('dashboard.title')}</h2>
        <p className="text-slate-500">{t('dashboard.noStudents')}</p>
      </div>
    );
  }

  const totalPossibleInsights = CHAPTERS.reduce((sum, ch) => sum + ch.insights.length, 0);
  const avgCompletion = Math.round(
    (report.students.reduce((sum, s) => sum + s.totalInsights, 0) /
      (report.students.length * totalPossibleInsights)) * 100
  );

  const handleExportCsv = () => {
    const headers = ['Student', 'Total Sessions', 'Total Insights',
      ...CHAPTERS.map(ch => language === 'hi' ? ch.titleHi : ch.titleEn)
    ];
    const rows = report.students.map(s => [
      s.name, s.totalSessions, s.totalInsights,
      ...CHAPTERS.map(ch => {
        const p = s.chaptersProgress[ch.id];
        return p ? `${p.unlocked}/${p.total}` : '0/0';
      })
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ganyaan-class-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{t('dashboard.title')}</h2>
        <button onClick={handleExportCsv} className="text-sm px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
          {t('dashboard.exportCsv')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['overview', 'assignments', 'alerts'] as Tab[]).map(tabName => (
          <button
            key={tabName}
            onClick={() => setTab(tabName)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === tabName ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t(`dashboard.tab.${tabName}`)}
            {tabName === 'alerts' && alertCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {alertCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
              <div className="text-3xl font-bold text-primary-600">{report.students.length}</div>
              <div className="text-sm text-slate-500 mt-1">{t('dashboard.students')}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
              <div className="text-3xl font-bold text-primary-600">{avgCompletion}%</div>
              <div className="text-sm text-slate-500 mt-1">{t('dashboard.avgCompletion')}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
              <div className="text-3xl font-bold text-primary-600">
                {report.students.reduce((s, st) => s + st.totalSessions, 0)}
              </div>
              <div className="text-sm text-slate-500 mt-1">{t('dashboard.sessions')}</div>
            </div>
          </div>

          {/* Student roster */}
          <div className="bg-white rounded-xl border border-slate-200 mb-6 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">{t('dashboard.students')}</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {report.students.map(student => (
                <div
                  key={student.id}
                  className="px-5 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setSelectedStudent({ id: student.id, name: student.name })}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-700">{student.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {student.totalSessions} {t('dashboard.sessions')} | {student.totalInsights} {t('dashboard.insights')}
                      </span>
                      <span className="text-xs text-primary-500">{t('conversation.viewSessions')}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {CHAPTERS.map(ch => {
                      const p = student.chaptersProgress[ch.id] || { unlocked: 0, total: ch.insights.length };
                      const pct = Math.round((p.unlocked / p.total) * 100);
                      const title = language === 'hi' ? ch.titleHi : ch.titleEn;
                      return (
                        <div key={ch.id} className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-32 truncate">{title}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-2">
                            <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-400 w-12 text-right">{p.unlocked}/{p.total}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Commonly missed concepts */}
          {report.commonlyMissed.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700">{t('dashboard.commonlyMissed')}</h3>
              </div>
              <div className="px-5 py-3 space-y-2">
                {report.commonlyMissed.slice(0, 10).map((item, i) => {
                  const ch = CHAPTERS.find(c => c.id === item.chapter_id);
                  const chTitle = ch ? (language === 'hi' ? ch.titleHi : ch.titleEn) : item.chapter_id;
                  const def = INSIGHT_DEFS[item.insight_id as InsightId];
                  const insightLabel = def ? (language === 'hi' ? def.labelHi : def.labelEn) : item.insight_id;
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-slate-600">{insightLabel}</span>
                        <span className="text-xs text-slate-400 ml-2">({chTitle})</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {item.unlocked_count}/{report.students.length} {t('dashboard.students').toLowerCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'assignments' && (
        <AssignmentsTab
          assignments={assignments}
          students={report.students}
          onRefresh={() => window.electronAPI.listAssignments().then(setAssignments).catch(() => {})}
        />
      )}

      {tab === 'alerts' && (
        <AlertsTab alerts={alerts} onMarkRead={handleMarkAlertRead} />
      )}
    </div>
  );
}

// ── Assignments Sub-tab ──

function AssignmentsTab({ assignments, students, onRefresh }: {
  assignments: Assignment[];
  students: Array<{ id: number; name: string }>;
  onRefresh: () => void;
}) {
  const t = useT();
  const language = useSettingsStore(s => s.language);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedStudents, setExpandedStudents] = useState<AssignmentStudent[]>([]);

  const handleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    const students = await window.electronAPI.getAssignmentStudents(id);
    setExpandedStudents(students);
  };

  const handleCreate = async (req: CreateAssignmentRequest) => {
    await window.electronAPI.createAssignment(req);
    setShowCreate(false);
    onRefresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">{t('assignment.title')}</h3>
        <button
          onClick={() => setShowCreate(true)}
          className="text-sm px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          {t('assignment.create')}
        </button>
      </div>

      {assignments.length === 0 ? (
        <p className="text-slate-500 text-sm">{t('assignment.none')}</p>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            const ch = CHAPTERS.find(c => c.id === a.chapterId);
            const chTitle = ch ? (language === 'hi' ? ch.titleHi : ch.titleEn) : a.chapterId;
            return (
              <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => handleExpand(a.id)}>
                  <div>
                    <div className="font-medium text-slate-700">{a.title}</div>
                    <div className="text-xs text-slate-400 mt-1">{chTitle} — {a.insightIds.length} {t('dashboard.insights')}</div>
                  </div>
                  <span className="text-xs text-primary-500">{expandedId === a.id ? t('assignment.collapse') : t('assignment.expand')}</span>
                </div>
                {expandedId === a.id && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    {expandedStudents.map(s => (
                      <div key={s.studentId} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{s.studentName}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          s.status === 'completed' ? 'bg-green-100 text-green-700' :
                          s.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {t(`assignment.status.${s.status}`)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateAssignmentDialog
          students={students}
          onCancel={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

// ── Create Assignment Dialog ──

function CreateAssignmentDialog({ students, onCancel, onCreate }: {
  students: Array<{ id: number; name: string }>;
  onCancel: () => void;
  onCreate: (req: CreateAssignmentRequest) => void;
}) {
  const t = useT();
  const language = useSettingsStore(s => s.language);
  const [title, setTitle] = useState('');
  const [chapterId, setChapterId] = useState(CHAPTERS[0].id);
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [instructions, setInstructions] = useState('');

  const chapter = CHAPTERS.find(c => c.id === chapterId)!;

  const toggleInsight = (id: string) => {
    setSelectedInsights(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleStudent = (id: number) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleCreate = () => {
    if (!title.trim() || selectedInsights.length === 0 || selectedStudents.length === 0) return;
    onCreate({
      chapterId,
      insightIds: selectedInsights,
      title: title.trim(),
      instructions: instructions.trim(),
      studentIds: selectedStudents,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-slate-800 mb-4">{t('assignment.create')}</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">{t('assignment.titleLabel')}</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={t('assignment.titlePlaceholder')}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">{t('launcher.chapter')}</label>
            <select
              value={chapterId} onChange={e => { setChapterId(e.target.value); setSelectedInsights([]); }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {CHAPTERS.map(ch => (
                <option key={ch.id} value={ch.id}>{language === 'hi' ? ch.titleHi : ch.titleEn}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">{t('launcher.insights')}</label>
            <div className="space-y-1">
              {chapter.insights.map(id => {
                const def = INSIGHT_DEFS[id as InsightId];
                const label = language === 'hi' ? def.labelHi : def.labelEn;
                return (
                  <label key={id} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedInsights.includes(id)}
                      onChange={() => toggleInsight(id)}
                      className="rounded"
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">{t('dashboard.students')}</label>
            <div className="space-y-1">
              {students.map(s => (
                <label key={s.id} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(s.id)}
                    onChange={() => toggleStudent(s.id)}
                    className="rounded"
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">{t('assignment.instructions')}</label>
            <textarea
              value={instructions} onChange={e => setInstructions(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 h-20 resize-none"
              placeholder={t('assignment.instructionsPlaceholder')}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
            {t('chat.clearCancel')}
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || selectedInsights.length === 0 || selectedStudents.length === 0}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {t('assignment.create')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Alerts Sub-tab ──

function AlertsTab({ alerts, onMarkRead }: { alerts: Alert[]; onMarkRead: (id: number) => void }) {
  const t = useT();

  if (alerts.length === 0) {
    return <p className="text-slate-500 text-sm">{t('alerts.none')}</p>;
  }

  const alertTypeLabels: Record<string, string> = {
    'consecutive_wrong': 'Struggling',
    'persistent_struggle': 'Persistent Struggle',
    'repeated_misconception': 'Repeated Misconception',
    'inactivity': 'Inactive',
  };

  const alertTypeColors: Record<string, string> = {
    'consecutive_wrong': 'bg-red-100 text-red-700',
    'persistent_struggle': 'bg-amber-100 text-amber-700',
    'repeated_misconception': 'bg-orange-100 text-orange-700',
    'inactivity': 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="space-y-3">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`bg-white rounded-xl border p-4 ${alert.isRead ? 'border-slate-200' : 'border-amber-300 bg-amber-50/50'}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${alertTypeColors[alert.alertType] || 'bg-slate-100 text-slate-600'}`}>
                {alertTypeLabels[alert.alertType] || alert.alertType}
              </span>
              <p className="text-sm text-slate-700 mt-2">{alert.message}</p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(alert.createdAt).toLocaleDateString()} {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {!alert.isRead && (
              <button
                onClick={() => onMarkRead(alert.id)}
                className="text-xs text-primary-500 hover:text-primary-700 font-medium ml-3 shrink-0"
              >
                {t('alerts.markRead')}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
