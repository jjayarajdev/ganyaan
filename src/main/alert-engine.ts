import { getDb, createAlert, getLinkedStudents, getMisconceptions } from './database';
import type { UserRow } from './database';

export function checkForStruggles(userId: number, chapterId: string, sessionId?: number): void {
  const recipients = getAlertRecipients(userId);
  if (recipients.length === 0) return;

  // Check 1: 5+ consecutive wrong on same insight in one session
  if (sessionId) {
    checkConsecutiveWrong(userId, chapterId, sessionId, recipients);
  }

  // Check 2: Same insight attempted across 3+ sessions without unlocking
  checkPersistentStruggle(userId, chapterId, recipients);

  // Check 3: Same misconception detected 3+ times
  checkRepeatedMisconceptions(userId, chapterId, recipients);
}

export function checkInactivity(userId: number): void {
  const recipients = getAlertRecipients(userId);
  if (recipients.length === 0) return;

  const d = getDb();
  const lastSession = d.prepare(
    'SELECT MAX(session_start) as last_active FROM sessions WHERE user_id = ?'
  ).get(userId) as { last_active: number | null };

  if (lastSession.last_active) {
    const daysSinceActive = (Date.now() - lastSession.last_active) / (24 * 60 * 60 * 1000);
    if (daysSinceActive >= 7) {
      const user = d.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined;
      const studentName = user?.name || 'Student';

      for (const recipient of recipients) {
        // Check if we already sent this alert recently
        const existing = d.prepare(
          "SELECT id FROM alerts WHERE user_id = ? AND recipient_id = ? AND alert_type = 'inactivity' AND created_at > ?"
        ).get(userId, recipient.id, Date.now() - 7 * 24 * 60 * 60 * 1000);

        if (!existing) {
          createAlert(userId, recipient.id, 'inactivity',
            `${studentName} hasn't studied in ${Math.floor(daysSinceActive)} days. A gentle reminder might help!`
          );
        }
      }
    }
  }
}

function getAlertRecipients(studentId: number): UserRow[] {
  const d = getDb();
  // Get linked parents
  const parents = getLinkedStudents(studentId); // This actually gets parents for a student? No.
  // We need the reverse: who has this student linked
  const parentRows = d.prepare(
    'SELECT u.* FROM users u JOIN student_parent_link l ON u.id = l.parent_id WHERE l.student_id = ?'
  ).all(studentId) as UserRow[];

  // Get teachers
  const teachers = d.prepare("SELECT * FROM users WHERE role = 'teacher'").all() as UserRow[];

  return [...parentRows, ...teachers];
}

function checkConsecutiveWrong(userId: number, chapterId: string, sessionId: number, recipients: UserRow[]): void {
  const d = getDb();
  const rows = d.prepare(
    'SELECT insight_id, was_correct FROM attempt_tracking WHERE user_id = ? AND chapter_id = ? AND session_id = ? ORDER BY timestamp DESC'
  ).all(userId, chapterId, sessionId) as Array<{ insight_id: string; was_correct: number | null }>;

  // Group by insight and check for 5+ consecutive wrong
  const insightStreaks: Record<string, number> = {};
  for (const row of rows) {
    if (row.was_correct === 0) {
      insightStreaks[row.insight_id] = (insightStreaks[row.insight_id] || 0) + 1;
    }
  }

  for (const [insightId, wrongCount] of Object.entries(insightStreaks)) {
    if (wrongCount >= 5) {
      const user = d.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined;
      for (const recipient of recipients) {
        const existing = d.prepare(
          "SELECT id FROM alerts WHERE user_id = ? AND recipient_id = ? AND alert_type = 'consecutive_wrong' AND insight_id = ? AND created_at > ?"
        ).get(userId, recipient.id, insightId, Date.now() - 24 * 60 * 60 * 1000);

        if (!existing) {
          createAlert(userId, recipient.id, 'consecutive_wrong',
            `${user?.name || 'Student'} got ${wrongCount} wrong answers in a row on "${insightId}" in ${chapterId}. They might need extra help!`,
            chapterId, insightId
          );
        }
      }
    }
  }
}

function checkPersistentStruggle(userId: number, chapterId: string, recipients: UserRow[]): void {
  const d = getDb();
  // Check if any insight has been attempted across 3+ sessions without being unlocked
  const rows = d.prepare(
    `SELECT insight_id, COUNT(DISTINCT session_id) as session_count
     FROM attempt_tracking
     WHERE user_id = ? AND chapter_id = ? AND session_id IS NOT NULL
     GROUP BY insight_id
     HAVING session_count >= 3`
  ).all(userId, chapterId) as Array<{ insight_id: string; session_count: number }>;

  for (const row of rows) {
    // Check if this insight is unlocked
    const unlocked = d.prepare(
      'SELECT 1 FROM progress WHERE user_id = ? AND chapter_id = ? AND insight_id = ?'
    ).get(userId, chapterId, row.insight_id);

    if (!unlocked) {
      const user = d.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined;
      for (const recipient of recipients) {
        const existing = d.prepare(
          "SELECT id FROM alerts WHERE user_id = ? AND recipient_id = ? AND alert_type = 'persistent_struggle' AND insight_id = ? AND created_at > ?"
        ).get(userId, recipient.id, row.insight_id, Date.now() - 3 * 24 * 60 * 60 * 1000);

        if (!existing) {
          createAlert(userId, recipient.id, 'persistent_struggle',
            `${user?.name || 'Student'} has been struggling with "${row.insight_id}" across ${row.session_count} sessions without mastering it.`,
            chapterId, row.insight_id
          );
        }
      }
    }
  }
}

function checkRepeatedMisconceptions(userId: number, chapterId: string, recipients: UserRow[]): void {
  const misconceptions = getMisconceptions(userId, chapterId);
  const d = getDb();

  for (const m of misconceptions) {
    if (m.occurrences >= 3 && !m.resolved) {
      const user = d.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined;
      for (const recipient of recipients) {
        const existing = d.prepare(
          "SELECT id FROM alerts WHERE user_id = ? AND recipient_id = ? AND alert_type = 'repeated_misconception' AND insight_id = ? AND created_at > ?"
        ).get(userId, recipient.id, m.misconception_type, Date.now() - 3 * 24 * 60 * 60 * 1000);

        if (!existing) {
          createAlert(userId, recipient.id, 'repeated_misconception',
            `${user?.name || 'Student'} keeps making the same mistake: "${m.misconception_type}" (${m.occurrences} times). This misconception needs direct attention.`,
            chapterId, m.insight_id
          );
        }
      }
    }
  }
}
