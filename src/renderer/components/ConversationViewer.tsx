import React, { useState, useEffect } from 'react';
import type { ChatMessage } from '../../shared/types';
import { CHAPTERS } from '../../shared/constants';
import { useSettingsStore } from '../stores/settings-store';
import { useT } from '../hooks/useLanguage';
import ChatBubble from './ChatBubble';

interface SessionInfo {
  id: number;
  chapter_id: string;
  session_start: number;
  session_end: number | null;
  messages_count: number;
}

interface ConversationViewerProps {
  studentId: number;
  studentName: string;
  onBack: () => void;
}

export default function ConversationViewer({ studentId, studentName, onBack }: ConversationViewerProps) {
  const t = useT();
  const language = useSettingsStore(s => s.language);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.electronAPI.getStudentSessions(studentId).then(data => {
      setSessions(data as SessionInfo[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [studentId]);

  const handleSelectSession = async (session: SessionInfo) => {
    setSelectedSession(session);
    setLoading(true);
    try {
      const msgs = await window.electronAPI.getSessionMessages(session.id);
      setMessages(msgs);
    } catch {
      setMessages([]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <div className="text-slate-400">{t('chat.thinking')}</div>
      </div>
    );
  }

  // Session list view
  if (!selectedSession) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-sm text-primary-500 hover:text-primary-700 font-medium">
            {t('chat.back')}
          </button>
          <h2 className="text-xl font-bold text-slate-800">
            {t('conversation.sessionsFor').replace('{name}', studentName)}
          </h2>
        </div>

        {sessions.length === 0 ? (
          <p className="text-slate-500">{t('conversation.noSessions')}</p>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => {
              const ch = CHAPTERS.find(c => c.id === session.chapter_id);
              const chTitle = ch ? (language === 'hi' ? ch.titleHi : ch.titleEn) : session.chapter_id;
              const date = new Date(session.session_start).toLocaleDateString();
              const time = new Date(session.session_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-700">{chTitle}</div>
                      <div className="text-xs text-slate-400 mt-1">{date} {time}</div>
                    </div>
                    <div className="text-sm text-slate-500">
                      {session.messages_count} {t('conversation.messages')}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Transcript view
  const ch = CHAPTERS.find(c => c.id === selectedSession.chapter_id);
  const chTitle = ch ? (language === 'hi' ? ch.titleHi : ch.titleEn) : selectedSession.chapter_id;
  const date = new Date(selectedSession.session_start).toLocaleDateString();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-3 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedSession(null); setMessages([]); }}
            className="text-sm text-primary-500 hover:text-primary-700 font-medium"
          >
            {t('chat.back')}
          </button>
          <div>
            <span className="text-sm font-semibold text-slate-700">{studentName}</span>
            <span className="text-xs text-slate-400 ml-2">{chTitle} — {date}</span>
          </div>
        </div>
      </div>

      {/* Messages (read-only) */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-slate-400 py-8">{t('conversation.noMessages')}</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id}>
              <ChatBubble message={msg} />
              {msg.insightsUnlocked && msg.insightsUnlocked.length > 0 && (
                <div className="flex justify-start mt-1 ml-2">
                  {msg.insightsUnlocked.map(id => (
                    <span key={id} className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium mr-1">
                      Insight: {id}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
