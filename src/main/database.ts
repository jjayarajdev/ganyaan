import Database from 'better-sqlite3';
import { app } from 'electron';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { APP_DATA_DIR, DYNAMIC_CACHE_MAX, CHAPTERS } from '../shared/constants';
import type { Language, InsightId, ChatMessage, SettingsData, ChapterProgress, ProgressData, CacheEntry } from '../shared/types';

let db: Database.Database | null = null;

// ── DB Lifecycle ──

function getDbPath(): string {
  const dir = path.join(app.getPath('userData'), APP_DATA_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'ganyaan.db');
}

export function initDatabase(): void {
  db = new Database(getDbPath());
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  createTables();
  migrateJsonData();
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized — call initDatabase() first');
  return db;
}

function createTables(): void {
  const d = getDb();
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','teacher','parent')),
      pin_hash TEXT,
      school_name TEXT,
      avatar_color TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS settings (
      user_id INTEGER PRIMARY KEY,
      language TEXT NOT NULL DEFAULT 'en',
      api_key TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS progress (
      user_id INTEGER NOT NULL,
      chapter_id TEXT NOT NULL,
      insight_id TEXT NOT NULL,
      unlocked_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      PRIMARY KEY (user_id, chapter_id, insight_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      chapter_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user','assistant')),
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      insights_unlocked TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chapter_id TEXT NOT NULL,
      session_start INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      session_end INTEGER,
      messages_count INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dynamic_cache (
      key TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      language TEXT NOT NULL,
      insights TEXT NOT NULL DEFAULT '[]',
      chapter_id TEXT,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_parent_link (
      student_id INTEGER NOT NULL,
      parent_id INTEGER NOT NULL,
      PRIMARY KEY (student_id, parent_id),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- v0.3: Attempt Tracking
    CREATE TABLE IF NOT EXISTS attempt_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_id INTEGER,
      chapter_id TEXT NOT NULL,
      insight_id TEXT NOT NULL,
      attempt_number INTEGER NOT NULL DEFAULT 1,
      student_message TEXT NOT NULL,
      was_correct INTEGER,
      scaffolding_level INTEGER NOT NULL DEFAULT 1,
      timestamp INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_attempts_user_insight ON attempt_tracking(user_id, chapter_id, insight_id);

    -- v0.3: Usage Tracking
    CREATE TABLE IF NOT EXISTS usage_tracking (
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      messages_sent INTEGER NOT NULL DEFAULT 0,
      tokens_used INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, date)
    );

    -- v0.3: Validation Log
    CREATE TABLE IF NOT EXISTS validation_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chapter_id TEXT NOT NULL,
      response_text TEXT NOT NULL,
      violation_type TEXT NOT NULL,
      violation_message TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'warning',
      timestamp INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- v0.3: Misconceptions
    CREATE TABLE IF NOT EXISTS misconceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chapter_id TEXT NOT NULL,
      insight_id TEXT NOT NULL,
      misconception_type TEXT NOT NULL,
      description TEXT NOT NULL,
      occurrences INTEGER NOT NULL DEFAULT 1,
      first_seen INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      last_seen INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      resolved INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- v0.3: Review Schedule (Spaced Repetition)
    CREATE TABLE IF NOT EXISTS review_schedule (
      user_id INTEGER NOT NULL,
      chapter_id TEXT NOT NULL,
      insight_id TEXT NOT NULL,
      review_date INTEGER NOT NULL,
      interval_days REAL NOT NULL DEFAULT 1,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      review_count INTEGER NOT NULL DEFAULT 0,
      last_reviewed INTEGER,
      PRIMARY KEY (user_id, chapter_id, insight_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- v0.3: Practice Results
    CREATE TABLE IF NOT EXISTS practice_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chapter_id TEXT NOT NULL,
      insight_id TEXT NOT NULL,
      problem_text TEXT NOT NULL,
      student_answer TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      time_taken_ms INTEGER NOT NULL DEFAULT 0,
      timestamp INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- v0.3: Daily Activity (Streaks)
    CREATE TABLE IF NOT EXISTS daily_activity (
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      messages_sent INTEGER NOT NULL DEFAULT 0,
      insights_unlocked INTEGER NOT NULL DEFAULT 0,
      practice_completed INTEGER NOT NULL DEFAULT 0,
      minutes_active INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, date)
    );

    -- v0.3: Assignments
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      chapter_id TEXT NOT NULL,
      insight_ids TEXT NOT NULL DEFAULT '[]',
      title TEXT NOT NULL,
      instructions TEXT NOT NULL DEFAULT '',
      due_date INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assignment_students (
      assignment_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed')),
      insights_unlocked TEXT NOT NULL DEFAULT '[]',
      PRIMARY KEY (assignment_id, student_id),
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- v0.3: Alerts
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      recipient_id INTEGER NOT NULL,
      alert_type TEXT NOT NULL,
      chapter_id TEXT,
      insight_id TEXT,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Add daily_message_limit column to settings if not exists
  try {
    d.exec('ALTER TABLE settings ADD COLUMN daily_message_limit INTEGER NOT NULL DEFAULT 50');
  } catch { /* column already exists */ }
  try {
    d.exec('ALTER TABLE settings ADD COLUMN daily_goal_messages INTEGER NOT NULL DEFAULT 10');
  } catch { /* column already exists */ }
}

// ── Data Migration (JSON → SQLite) ──

function migrateJsonData(): void {
  const d = getDb();
  const dataDir = path.join(app.getPath('userData'), APP_DATA_DIR);

  // Check if migration already happened (default user exists)
  const existingUser = d.prepare('SELECT id FROM users WHERE id = 1').get();
  if (existingUser) return;

  // Create default student user
  d.prepare('INSERT INTO users (id, name, role) VALUES (1, ?, ?)').run('Student', 'student');

  // Migrate settings.json
  const settingsPath = path.join(dataDir, 'settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      // API key goes to user_id=0 (global sentinel)
      d.prepare('INSERT OR REPLACE INTO settings (user_id, language, api_key) VALUES (0, ?, ?)')
        .run(settings.language || 'en', settings.apiKey || '');
      // User-specific settings (just language for now)
      d.prepare('INSERT OR REPLACE INTO settings (user_id, language, api_key) VALUES (1, ?, ?)')
        .run(settings.language || 'en', '');
      fs.renameSync(settingsPath, settingsPath + '.bak');
    } catch { /* skip if malformed */ }
  } else {
    // Ensure global settings row exists
    d.prepare('INSERT OR IGNORE INTO settings (user_id, language, api_key) VALUES (0, ?, ?)').run('en', '');
    d.prepare('INSERT OR IGNORE INTO settings (user_id, language, api_key) VALUES (1, ?, ?)').run('en', '');
  }

  // Migrate progress.json
  const progressPath = path.join(dataDir, 'progress.json');
  if (fs.existsSync(progressPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
      const insertProgress = d.prepare(
        'INSERT OR IGNORE INTO progress (user_id, chapter_id, insight_id, unlocked_at) VALUES (1, ?, ?, ?)'
      );
      const chapters = data.chapters || {};
      for (const [chapterId, chProgress] of Object.entries(chapters)) {
        const cp = chProgress as ChapterProgress;
        for (const insightId of cp.unlockedInsights || []) {
          insertProgress.run(chapterId, insightId, cp.lastActivity || Date.now());
        }
      }
      fs.renameSync(progressPath, progressPath + '.bak');
    } catch { /* skip */ }
  }

  // Migrate chat history files
  const chatDir = path.join(dataDir, 'chat-history');
  if (fs.existsSync(chatDir)) {
    try {
      const insertMsg = d.prepare(
        'INSERT OR IGNORE INTO chat_messages (id, user_id, chapter_id, role, content, timestamp, insights_unlocked) VALUES (?, 1, ?, ?, ?, ?, ?)'
      );
      const files = fs.readdirSync(chatDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const chapterId = file.replace('.json', '');
        const messages = JSON.parse(fs.readFileSync(path.join(chatDir, file), 'utf-8')) as ChatMessage[];
        for (const msg of messages) {
          insertMsg.run(
            msg.id,
            chapterId,
            msg.role,
            msg.content,
            msg.timestamp,
            msg.insightsUnlocked ? JSON.stringify(msg.insightsUnlocked) : null,
          );
        }
        fs.renameSync(path.join(chatDir, file), path.join(chatDir, file + '.bak'));
      }
    } catch { /* skip */ }
  }

  // Migrate dynamic-cache.json
  const cachePath = path.join(dataDir, 'dynamic-cache.json');
  if (fs.existsSync(cachePath)) {
    try {
      const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      const insertCache = d.prepare(
        'INSERT OR IGNORE INTO dynamic_cache (key, question, answer, language, insights, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
      );
      for (const [key, entry] of Object.entries(cacheData.entries || {})) {
        const e = entry as CacheEntry;
        insertCache.run(key, e.question, e.answer, e.language, JSON.stringify(e.insights || []), e.timestamp);
      }
      fs.renameSync(cachePath, cachePath + '.bak');
    } catch { /* skip */ }
  }
}

// ── User CRUD ──

export interface UserRow {
  id: number;
  name: string;
  email: string | null;
  role: 'student' | 'teacher' | 'parent';
  pin_hash: string | null;
  school_name: string | null;
  avatar_color: string | null;
  created_at: number;
}

export function createUser(
  name: string,
  role: 'student' | 'teacher' | 'parent',
  pin?: string,
  email?: string,
  schoolName?: string,
  avatarColor?: string,
): UserRow {
  const d = getDb();
  const pinHash = pin ? hashPin(pin) : null;
  const result = d.prepare(
    'INSERT INTO users (name, role, pin_hash, email, school_name, avatar_color) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, role, pinHash, email || null, schoolName || null, avatarColor || null);
  // Create settings row for new user
  d.prepare('INSERT INTO settings (user_id, language, api_key) VALUES (?, ?, ?)').run(result.lastInsertRowid, 'en', '');
  return getUser(Number(result.lastInsertRowid))!;
}

export function getUser(userId: number): UserRow | undefined {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
}

export function getAllUsers(): UserRow[] {
  return getDb().prepare('SELECT * FROM users ORDER BY created_at').all() as UserRow[];
}

export function getUsersByRole(role: string): UserRow[] {
  return getDb().prepare('SELECT * FROM users WHERE role = ? ORDER BY name').all(role) as UserRow[];
}

function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pin, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPin(userId: number, pin: string): boolean {
  const user = getUser(userId);
  if (!user?.pin_hash) return false;
  const [salt, storedHash] = user.pin_hash.split(':');
  const hash = crypto.scryptSync(pin, salt, 64).toString('hex');
  return hash === storedHash;
}

export function linkStudentToParent(studentId: number, parentId: number): void {
  getDb().prepare('INSERT OR IGNORE INTO student_parent_link (student_id, parent_id) VALUES (?, ?)').run(studentId, parentId);
}

export function getLinkedStudents(parentId: number): UserRow[] {
  return getDb().prepare(
    'SELECT u.* FROM users u JOIN student_parent_link l ON u.id = l.student_id WHERE l.parent_id = ?'
  ).all(parentId) as UserRow[];
}

// ── Settings (user-scoped, API key global) ──

export function loadSettings(userId: number): SettingsData {
  const d = getDb();
  const userSettings = d.prepare('SELECT language FROM settings WHERE user_id = ?').get(userId) as { language: Language } | undefined;
  const globalSettings = d.prepare('SELECT api_key FROM settings WHERE user_id = 0').get() as { api_key: string } | undefined;
  return {
    language: userSettings?.language || 'en',
    apiKey: globalSettings?.api_key || '',
  };
}

export function saveSettings(userId: number, data: SettingsData): void {
  const d = getDb();
  d.prepare('INSERT OR REPLACE INTO settings (user_id, language, api_key) VALUES (?, ?, ?)').run(userId, data.language, '');
  // API key always stored globally under user_id=0
  if (data.apiKey !== undefined) {
    d.prepare('UPDATE settings SET api_key = ? WHERE user_id = 0').run(data.apiKey);
  }
}

// ── Progress (user-scoped) ──

export function loadProgress(userId: number): ProgressData {
  const rows = getDb().prepare(
    'SELECT chapter_id, insight_id, unlocked_at FROM progress WHERE user_id = ? ORDER BY unlocked_at'
  ).all(userId) as Array<{ chapter_id: string; insight_id: string; unlocked_at: number }>;

  const chapters: Record<string, ChapterProgress> = {};
  for (const row of rows) {
    if (!chapters[row.chapter_id]) {
      chapters[row.chapter_id] = {
        chapterId: row.chapter_id,
        unlockedInsights: [],
        mastered: false,
        lastActivity: row.unlocked_at,
      };
    }
    chapters[row.chapter_id].unlockedInsights.push(row.insight_id as InsightId);
    chapters[row.chapter_id].lastActivity = Math.max(
      chapters[row.chapter_id].lastActivity,
      row.unlocked_at,
    );
  }

  // Check mastery for each chapter
  // CHAPTERS already imported at top
  for (const ch of CHAPTERS) {
    if (chapters[ch.id] && chapters[ch.id].unlockedInsights.length >= ch.insights.length) {
      chapters[ch.id].mastered = true;
    }
  }

  return { chapters };
}

export function saveInsightUnlock(userId: number, chapterId: string, insightId: InsightId): void {
  getDb().prepare(
    'INSERT OR IGNORE INTO progress (user_id, chapter_id, insight_id, unlocked_at) VALUES (?, ?, ?, ?)'
  ).run(userId, chapterId, insightId, Date.now());
}

// ── Chat (user-scoped) ──

export function loadChatHistory(userId: number, chapterId: string): ChatMessage[] {
  const rows = getDb().prepare(
    'SELECT id, role, content, timestamp, insights_unlocked FROM chat_messages WHERE user_id = ? AND chapter_id = ? ORDER BY timestamp'
  ).all(userId, chapterId) as Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    insights_unlocked: string | null;
  }>;

  return rows.map(row => ({
    id: row.id,
    role: row.role,
    content: row.content,
    timestamp: row.timestamp,
    insightsUnlocked: row.insights_unlocked ? JSON.parse(row.insights_unlocked) : undefined,
  }));
}

export function saveChatMessage(
  userId: number,
  chapterId: string,
  message: ChatMessage,
): void {
  getDb().prepare(
    'INSERT OR REPLACE INTO chat_messages (id, user_id, chapter_id, role, content, timestamp, insights_unlocked) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    message.id,
    userId,
    chapterId,
    message.role,
    message.content,
    message.timestamp,
    message.insightsUnlocked ? JSON.stringify(message.insightsUnlocked) : null,
  );
}

export function saveChatHistory(userId: number, chapterId: string, messages: ChatMessage[]): void {
  const d = getDb();
  const deleteStmt = d.prepare('DELETE FROM chat_messages WHERE user_id = ? AND chapter_id = ?');
  const insertStmt = d.prepare(
    'INSERT INTO chat_messages (id, user_id, chapter_id, role, content, timestamp, insights_unlocked) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const tx = d.transaction(() => {
    deleteStmt.run(userId, chapterId);
    for (const msg of messages) {
      insertStmt.run(
        msg.id,
        userId,
        chapterId,
        msg.role,
        msg.content,
        msg.timestamp,
        msg.insightsUnlocked ? JSON.stringify(msg.insightsUnlocked) : null,
      );
    }
  });
  tx();
}

export function clearChatHistory(userId: number, chapterId: string): void {
  getDb().prepare('DELETE FROM chat_messages WHERE user_id = ? AND chapter_id = ?').run(userId, chapterId);
}

// ── Sessions ──

export function startSession(userId: number, chapterId: string): number {
  const result = getDb().prepare(
    'INSERT INTO sessions (user_id, chapter_id, session_start) VALUES (?, ?, ?)'
  ).run(userId, chapterId, Date.now());
  return Number(result.lastInsertRowid);
}

export function endSession(sessionId: number, messagesCount: number): void {
  getDb().prepare(
    'UPDATE sessions SET session_end = ?, messages_count = ? WHERE id = ?'
  ).run(Date.now(), messagesCount, sessionId);
}

export function getSessionsByUser(userId: number): Array<{ id: number; chapter_id: string; session_start: number; session_end: number | null; messages_count: number }> {
  return getDb().prepare(
    'SELECT id, chapter_id, session_start, session_end, messages_count FROM sessions WHERE user_id = ? ORDER BY session_start DESC'
  ).all(userId) as Array<{ id: number; chapter_id: string; session_start: number; session_end: number | null; messages_count: number }>;
}

export function getSessionsByChapter(userId: number, chapterId: string): Array<{ id: number; session_start: number; session_end: number | null; messages_count: number }> {
  return getDb().prepare(
    'SELECT id, session_start, session_end, messages_count FROM sessions WHERE user_id = ? AND chapter_id = ? ORDER BY session_start DESC'
  ).all(userId, chapterId) as Array<{ id: number; session_start: number; session_end: number | null; messages_count: number }>;
}

// ── Cache (chapter-aware) ──

export function lookupDynamicCache(key: string): CacheEntry | null {
  const row = getDb().prepare(
    'SELECT question, answer, language, insights, timestamp FROM dynamic_cache WHERE key = ?'
  ).get(key) as { question: string; answer: string; language: Language; insights: string; timestamp: number } | undefined;
  if (!row) return null;
  return {
    question: row.question,
    answer: row.answer,
    language: row.language as Language,
    insights: JSON.parse(row.insights) as InsightId[],
    timestamp: row.timestamp,
  };
}

export function saveDynamicCache(
  key: string,
  question: string,
  answer: string,
  language: Language,
  insights: InsightId[],
  chapterId?: string,
): void {
  const d = getDb();
  d.prepare(
    'INSERT OR REPLACE INTO dynamic_cache (key, question, answer, language, insights, chapter_id, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(key, question, answer, language, JSON.stringify(insights), chapterId || null, Date.now());
  evictOldCache();
}

export function evictOldCache(): void {
  const d = getDb();
  const count = (d.prepare('SELECT COUNT(*) as cnt FROM dynamic_cache').get() as { cnt: number }).cnt;
  if (count > DYNAMIC_CACHE_MAX) {
    d.prepare(
      'DELETE FROM dynamic_cache WHERE key IN (SELECT key FROM dynamic_cache ORDER BY timestamp ASC LIMIT ?)'
    ).run(count - DYNAMIC_CACHE_MAX);
  }
}

// ── Analytics ──

export function getStudentAnalytics(userId: number): {
  totalSessions: number;
  timePerChapter: Record<string, number>;
  insightsTimeline: Array<{ chapter_id: string; insight_id: string; unlocked_at: number }>;
  messagesPerSession: number;
  recentActivity: Array<{ chapter_id: string; session_start: number; messages_count: number }>;
} {
  const d = getDb();

  const totalSessions = (d.prepare('SELECT COUNT(*) as cnt FROM sessions WHERE user_id = ?').get(userId) as { cnt: number }).cnt;

  const timeRows = d.prepare(
    'SELECT chapter_id, SUM(COALESCE(session_end, ?) - session_start) as total_time FROM sessions WHERE user_id = ? GROUP BY chapter_id'
  ).all(Date.now(), userId) as Array<{ chapter_id: string; total_time: number }>;
  const timePerChapter: Record<string, number> = {};
  for (const row of timeRows) {
    timePerChapter[row.chapter_id] = row.total_time;
  }

  const insightsTimeline = d.prepare(
    'SELECT chapter_id, insight_id, unlocked_at FROM progress WHERE user_id = ? ORDER BY unlocked_at'
  ).all(userId) as Array<{ chapter_id: string; insight_id: string; unlocked_at: number }>;

  const msgStats = d.prepare(
    'SELECT AVG(messages_count) as avg_msgs FROM sessions WHERE user_id = ? AND messages_count > 0'
  ).get(userId) as { avg_msgs: number | null };

  const recentActivity = d.prepare(
    'SELECT chapter_id, session_start, messages_count FROM sessions WHERE user_id = ? ORDER BY session_start DESC LIMIT 10'
  ).all(userId) as Array<{ chapter_id: string; session_start: number; messages_count: number }>;

  return {
    totalSessions,
    timePerChapter,
    insightsTimeline,
    messagesPerSession: Math.round(msgStats.avg_msgs || 0),
    recentActivity,
  };
}

// ── Attempt Tracking (v0.3) ──

export function logAttempt(
  userId: number,
  chapterId: string,
  insightId: string,
  attemptNumber: number,
  studentMessage: string,
  wasCorrect: boolean | null,
  scaffoldingLevel: number,
  sessionId?: number,
): void {
  getDb().prepare(
    'INSERT INTO attempt_tracking (user_id, session_id, chapter_id, insight_id, attempt_number, student_message, was_correct, scaffolding_level, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, sessionId || null, chapterId, insightId, attemptNumber, studentMessage, wasCorrect === null ? null : (wasCorrect ? 1 : 0), scaffoldingLevel, Date.now());
}

export function getAttemptStats(
  userId: number,
  chapterId: string,
  insightId: string,
): { totalAttempts: number; correctCount: number; wrongCount: number; accuracy: number; scaffoldingLevel: number } {
  const d = getDb();
  const stats = d.prepare(
    'SELECT COUNT(*) as total, SUM(CASE WHEN was_correct = 1 THEN 1 ELSE 0 END) as correct, SUM(CASE WHEN was_correct = 0 THEN 1 ELSE 0 END) as wrong FROM attempt_tracking WHERE user_id = ? AND chapter_id = ? AND insight_id = ?'
  ).get(userId, chapterId, insightId) as { total: number; correct: number; wrong: number };

  const totalAttempts = stats.total || 0;
  const correctCount = stats.correct || 0;
  const wrongCount = stats.wrong || 0;
  const accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 100;

  return {
    totalAttempts,
    correctCount,
    wrongCount,
    accuracy,
    scaffoldingLevel: computeScaffoldingLevel(wrongCount, accuracy),
  };
}

export function computeScaffoldingLevel(wrongCount: number, accuracy: number): number {
  if (wrongCount > 5 || accuracy < 40) return 3;
  if (wrongCount >= 3 || accuracy < 70) return 2;
  return 1;
}

export function getScaffoldingLevelForChat(userId: number, chapterId: string): number {
  const d = getDb();
  // Aggregate across all insights in chapter for an overall scaffolding level
  const stats = d.prepare(
    'SELECT COUNT(*) as total, SUM(CASE WHEN was_correct = 1 THEN 1 ELSE 0 END) as correct, SUM(CASE WHEN was_correct = 0 THEN 1 ELSE 0 END) as wrong FROM attempt_tracking WHERE user_id = ? AND chapter_id = ?'
  ).get(userId, chapterId) as { total: number; correct: number; wrong: number };

  const totalAttempts = stats.total || 0;
  const wrongCount = stats.wrong || 0;
  const accuracy = totalAttempts > 0 ? ((stats.correct || 0) / totalAttempts) * 100 : 100;

  return computeScaffoldingLevel(wrongCount, accuracy);
}

// ── Usage Tracking (v0.3) ──

export function getUsageForToday(userId: number): { messagesSent: number; tokensUsed: number } {
  const today = new Date().toISOString().slice(0, 10);
  const row = getDb().prepare(
    'SELECT messages_sent, tokens_used FROM usage_tracking WHERE user_id = ? AND date = ?'
  ).get(userId, today) as { messages_sent: number; tokens_used: number } | undefined;
  return { messagesSent: row?.messages_sent || 0, tokensUsed: row?.tokens_used || 0 };
}

export function incrementUsage(userId: number, tokensUsed: number): void {
  const today = new Date().toISOString().slice(0, 10);
  getDb().prepare(
    'INSERT INTO usage_tracking (user_id, date, messages_sent, tokens_used) VALUES (?, ?, 1, ?) ON CONFLICT(user_id, date) DO UPDATE SET messages_sent = messages_sent + 1, tokens_used = tokens_used + ?'
  ).run(userId, today, tokensUsed, tokensUsed);
}

export function getDailyMessageLimit(userId: number): number {
  const row = getDb().prepare('SELECT daily_message_limit FROM settings WHERE user_id = ?').get(userId) as { daily_message_limit: number } | undefined;
  if (row) return row.daily_message_limit;
  const global = getDb().prepare('SELECT daily_message_limit FROM settings WHERE user_id = 0').get() as { daily_message_limit: number } | undefined;
  return global?.daily_message_limit || 50;
}

// ── Validation Log (v0.3) ──

export function logValidation(userId: number, chapterId: string, responseText: string, violationType: string, violationMessage: string, severity: string): void {
  getDb().prepare(
    'INSERT INTO validation_log (user_id, chapter_id, response_text, violation_type, violation_message, severity, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, chapterId, responseText, violationType, violationMessage, severity, Date.now());
}

// ── Misconceptions (v0.3) ──

export function logMisconception(userId: number, chapterId: string, insightId: string, misconceptionType: string, description: string): void {
  const d = getDb();
  const existing = d.prepare(
    'SELECT id, occurrences FROM misconceptions WHERE user_id = ? AND chapter_id = ? AND misconception_type = ? AND resolved = 0'
  ).get(userId, chapterId, misconceptionType) as { id: number; occurrences: number } | undefined;

  if (existing) {
    d.prepare('UPDATE misconceptions SET occurrences = ?, last_seen = ?, insight_id = ? WHERE id = ?')
      .run(existing.occurrences + 1, Date.now(), insightId, existing.id);
  } else {
    d.prepare(
      'INSERT INTO misconceptions (user_id, chapter_id, insight_id, misconception_type, description) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, chapterId, insightId, misconceptionType, description);
  }
}

export function getMisconceptions(userId: number, chapterId?: string): Array<{
  id: number; chapter_id: string; insight_id: string; misconception_type: string;
  description: string; occurrences: number; first_seen: number; last_seen: number; resolved: number;
}> {
  const d = getDb();
  if (chapterId) {
    return d.prepare(
      'SELECT * FROM misconceptions WHERE user_id = ? AND chapter_id = ? ORDER BY last_seen DESC'
    ).all(userId, chapterId) as any[];
  }
  return d.prepare(
    'SELECT * FROM misconceptions WHERE user_id = ? ORDER BY last_seen DESC'
  ).all(userId) as any[];
}

export function resolveMisconception(id: number): void {
  getDb().prepare('UPDATE misconceptions SET resolved = 1 WHERE id = ?').run(id);
}

// ── Review Schedule (v0.3) ──

export function scheduleReview(userId: number, chapterId: string, insightId: string): void {
  const reviewDate = Date.now() + 24 * 60 * 60 * 1000; // 1 day from now
  getDb().prepare(
    'INSERT OR IGNORE INTO review_schedule (user_id, chapter_id, insight_id, review_date) VALUES (?, ?, ?, ?)'
  ).run(userId, chapterId, insightId, reviewDate);
}

export function getReviewsDue(userId: number, chapterId?: string): Array<{
  chapter_id: string; insight_id: string; review_date: number; interval_days: number; review_count: number;
}> {
  const now = Date.now();
  if (chapterId) {
    return getDb().prepare(
      'SELECT chapter_id, insight_id, review_date, interval_days, review_count FROM review_schedule WHERE user_id = ? AND chapter_id = ? AND review_date <= ? ORDER BY review_date'
    ).all(userId, chapterId, now) as any[];
  }
  return getDb().prepare(
    'SELECT chapter_id, insight_id, review_date, interval_days, review_count FROM review_schedule WHERE user_id = ? AND review_date <= ? ORDER BY review_date'
  ).all(userId, now) as any[];
}

export function recordReviewResult(userId: number, chapterId: string, insightId: string, quality: number): void {
  const d = getDb();
  const row = d.prepare(
    'SELECT interval_days, ease_factor, review_count FROM review_schedule WHERE user_id = ? AND chapter_id = ? AND insight_id = ?'
  ).get(userId, chapterId, insightId) as { interval_days: number; ease_factor: number; review_count: number } | undefined;

  if (!row) return;

  // Simplified SM-2
  let { interval_days, ease_factor, review_count } = row;
  if (quality >= 3) {
    if (review_count === 0) interval_days = 1;
    else if (review_count === 1) interval_days = 6;
    else interval_days = Math.round(interval_days * ease_factor);
    ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  } else {
    interval_days = 1;
    // Don't change ease factor on fail
  }

  const nextReview = Date.now() + interval_days * 24 * 60 * 60 * 1000;
  d.prepare(
    'UPDATE review_schedule SET review_date = ?, interval_days = ?, ease_factor = ?, review_count = ?, last_reviewed = ? WHERE user_id = ? AND chapter_id = ? AND insight_id = ?'
  ).run(nextReview, interval_days, ease_factor, review_count + 1, Date.now(), userId, chapterId, insightId);
}

// ── Practice Results (v0.3) ──

export function savePracticeResult(
  userId: number, chapterId: string, insightId: string,
  problemText: string, studentAnswer: string, correctAnswer: string,
  isCorrect: boolean, timeTakenMs: number,
): void {
  getDb().prepare(
    'INSERT INTO practice_results (user_id, chapter_id, insight_id, problem_text, student_answer, correct_answer, is_correct, time_taken_ms, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, chapterId, insightId, problemText, studentAnswer, correctAnswer, isCorrect ? 1 : 0, timeTakenMs, Date.now());
}

export function getPracticeHistory(userId: number, chapterId: string, insightId: string): Array<{
  problem_text: string; student_answer: string; correct_answer: string; is_correct: number; time_taken_ms: number; timestamp: number;
}> {
  return getDb().prepare(
    'SELECT problem_text, student_answer, correct_answer, is_correct, time_taken_ms, timestamp FROM practice_results WHERE user_id = ? AND chapter_id = ? AND insight_id = ? ORDER BY timestamp DESC LIMIT 20'
  ).all(userId, chapterId, insightId) as any[];
}

// ── Daily Activity / Streaks (v0.3) ──

export function recordDailyActivity(userId: number, field: 'messages_sent' | 'insights_unlocked' | 'practice_completed', increment: number = 1): void {
  const today = new Date().toISOString().slice(0, 10);
  const d = getDb();
  d.prepare(
    `INSERT INTO daily_activity (user_id, date, ${field}) VALUES (?, ?, ?) ON CONFLICT(user_id, date) DO UPDATE SET ${field} = ${field} + ?`
  ).run(userId, today, increment, increment);
}

export function updateMinutesActive(userId: number, minutes: number): void {
  const today = new Date().toISOString().slice(0, 10);
  getDb().prepare(
    'INSERT INTO daily_activity (user_id, date, minutes_active) VALUES (?, ?, ?) ON CONFLICT(user_id, date) DO UPDATE SET minutes_active = ?'
  ).run(userId, today, minutes, minutes);
}

export function getDailyActivity(userId: number): { messages_sent: number; insights_unlocked: number; practice_completed: number; minutes_active: number } {
  const today = new Date().toISOString().slice(0, 10);
  const row = getDb().prepare(
    'SELECT messages_sent, insights_unlocked, practice_completed, minutes_active FROM daily_activity WHERE user_id = ? AND date = ?'
  ).get(userId, today) as { messages_sent: number; insights_unlocked: number; practice_completed: number; minutes_active: number } | undefined;
  return row || { messages_sent: 0, insights_unlocked: 0, practice_completed: 0, minutes_active: 0 };
}

export function getDailyGoal(userId: number): number {
  const row = getDb().prepare('SELECT daily_goal_messages FROM settings WHERE user_id = ?').get(userId) as { daily_goal_messages: number } | undefined;
  return row?.daily_goal_messages || 10;
}

export function getStreak(userId: number): { currentStreak: number; longestStreak: number; todayActive: boolean } {
  const d = getDb();
  const rows = d.prepare(
    'SELECT date FROM daily_activity WHERE user_id = ? AND messages_sent > 0 ORDER BY date DESC'
  ).all(userId) as Array<{ date: string }>;

  if (rows.length === 0) return { currentStreak: 0, longestStreak: 0, todayActive: false };

  const today = new Date().toISOString().slice(0, 10);
  const todayActive = rows[0]?.date === today;

  let currentStreak = 0;
  const startDate = new Date(todayActive ? today : rows[0]?.date);

  for (let i = 0; i < rows.length; i++) {
    const expected = new Date(startDate);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().slice(0, 10);
    if (rows[i]?.date === expectedStr) {
      currentStreak++;
    } else {
      break;
    }
  }

  // For longest streak, we do a simple scan
  let longest = 0;
  let streak = 0;
  for (let i = 0; i < rows.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      const prev = new Date(rows[i - 1].date);
      const curr = new Date(rows[i].date);
      const diffDays = (prev.getTime() - curr.getTime()) / (24 * 60 * 60 * 1000);
      if (Math.abs(diffDays - 1) < 0.5) {
        streak++;
      } else {
        longest = Math.max(longest, streak);
        streak = 1;
      }
    }
  }
  longest = Math.max(longest, streak);

  return { currentStreak, longestStreak: longest, todayActive };
}

// ── Assignments (v0.3) ──

export function createAssignment(
  teacherId: number, chapterId: string, insightIds: string[],
  title: string, instructions: string, studentIds: number[], dueDate?: number,
): number {
  const d = getDb();
  const result = d.prepare(
    'INSERT INTO assignments (teacher_id, chapter_id, insight_ids, title, instructions, due_date) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(teacherId, chapterId, JSON.stringify(insightIds), title, instructions, dueDate || null);

  const assignmentId = Number(result.lastInsertRowid);
  const insertStudent = d.prepare('INSERT INTO assignment_students (assignment_id, student_id) VALUES (?, ?)');
  for (const studentId of studentIds) {
    insertStudent.run(assignmentId, studentId);
  }
  return assignmentId;
}

export function getAssignments(teacherId?: number): Array<{
  id: number; teacher_id: number; chapter_id: string; insight_ids: string;
  title: string; instructions: string; due_date: number | null; created_at: number;
}> {
  if (teacherId) {
    return getDb().prepare('SELECT * FROM assignments WHERE teacher_id = ? ORDER BY created_at DESC').all(teacherId) as any[];
  }
  return getDb().prepare('SELECT * FROM assignments ORDER BY created_at DESC').all() as any[];
}

export function getAssignment(id: number): {
  id: number; teacher_id: number; chapter_id: string; insight_ids: string;
  title: string; instructions: string; due_date: number | null; created_at: number;
} | undefined {
  return getDb().prepare('SELECT * FROM assignments WHERE id = ?').get(id) as any;
}

export function getAssignmentStudents(assignmentId: number): Array<{
  assignment_id: number; student_id: number; status: string; insights_unlocked: string; student_name: string;
}> {
  return getDb().prepare(
    'SELECT a.*, u.name as student_name FROM assignment_students a JOIN users u ON a.student_id = u.id WHERE a.assignment_id = ?'
  ).all(assignmentId) as any[];
}

export function getStudentAssignments(studentId: number): Array<{
  id: number; chapter_id: string; insight_ids: string; title: string; instructions: string;
  due_date: number | null; status: string; teacher_name: string;
}> {
  return getDb().prepare(
    `SELECT a.id, a.chapter_id, a.insight_ids, a.title, a.instructions, a.due_date,
     s.status, u.name as teacher_name
     FROM assignments a
     JOIN assignment_students s ON a.id = s.assignment_id
     JOIN users u ON a.teacher_id = u.id
     WHERE s.student_id = ? AND s.status != 'completed'
     ORDER BY a.due_date ASC, a.created_at DESC`
  ).all(studentId) as any[];
}

export function updateAssignmentStatus(assignmentId: number, studentId: number, status: string, insightsUnlocked?: string[]): void {
  const d = getDb();
  if (insightsUnlocked) {
    d.prepare('UPDATE assignment_students SET status = ?, insights_unlocked = ? WHERE assignment_id = ? AND student_id = ?')
      .run(status, JSON.stringify(insightsUnlocked), assignmentId, studentId);
  } else {
    d.prepare('UPDATE assignment_students SET status = ? WHERE assignment_id = ? AND student_id = ?')
      .run(status, assignmentId, studentId);
  }
}

// ── Alerts (v0.3) ──

export function createAlert(userId: number, recipientId: number, alertType: string, message: string, chapterId?: string, insightId?: string): void {
  getDb().prepare(
    'INSERT INTO alerts (user_id, recipient_id, alert_type, chapter_id, insight_id, message) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(userId, recipientId, alertType, chapterId || null, insightId || null, message);
}

export function getAlerts(recipientId: number): Array<{
  id: number; user_id: number; recipient_id: number; alert_type: string;
  chapter_id: string | null; insight_id: string | null; message: string;
  is_read: number; created_at: number;
}> {
  return getDb().prepare(
    'SELECT * FROM alerts WHERE recipient_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(recipientId) as any[];
}

export function markAlertRead(alertId: number): void {
  getDb().prepare('UPDATE alerts SET is_read = 1 WHERE id = ?').run(alertId);
}

export function getUnreadAlertCount(recipientId: number): number {
  const row = getDb().prepare('SELECT COUNT(*) as cnt FROM alerts WHERE recipient_id = ? AND is_read = 0').get(recipientId) as { cnt: number };
  return row.cnt;
}

// ── Session Messages (v0.3: Teacher Conversation Review) ──

export function getStudentSessionsList(studentId: number): Array<{
  id: number; chapter_id: string; session_start: number; session_end: number | null; messages_count: number;
}> {
  return getDb().prepare(
    'SELECT id, chapter_id, session_start, session_end, messages_count FROM sessions WHERE user_id = ? ORDER BY session_start DESC LIMIT 50'
  ).all(studentId) as any[];
}

export function getSessionMessages(sessionId: number): ChatMessage[] {
  const d = getDb();
  const session = d.prepare('SELECT user_id, chapter_id, session_start, session_end FROM sessions WHERE id = ?').get(sessionId) as {
    user_id: number; chapter_id: string; session_start: number; session_end: number | null;
  } | undefined;
  if (!session) return [];

  const endTime = session.session_end || Date.now();
  const rows = d.prepare(
    'SELECT id, role, content, timestamp, insights_unlocked FROM chat_messages WHERE user_id = ? AND chapter_id = ? AND timestamp >= ? AND timestamp <= ? ORDER BY timestamp'
  ).all(session.user_id, session.chapter_id, session.session_start, endTime) as Array<{
    id: string; role: 'user' | 'assistant'; content: string; timestamp: number; insights_unlocked: string | null;
  }>;

  return rows.map(row => ({
    id: row.id,
    role: row.role,
    content: row.content,
    timestamp: row.timestamp,
    insightsUnlocked: row.insights_unlocked ? JSON.parse(row.insights_unlocked) : undefined,
  }));
}

export function getClassAnalytics(): {
  students: Array<{
    id: number;
    name: string;
    totalInsights: number;
    totalSessions: number;
    chaptersProgress: Record<string, { unlocked: number; total: number }>;
  }>;
  commonlyMissed: Array<{ chapter_id: string; insight_id: string; unlocked_count: number }>;
} {
  const d = getDb();
  // CHAPTERS already imported at top

  const students = d.prepare("SELECT id, name FROM users WHERE role = 'student' ORDER BY name").all() as Array<{ id: number; name: string }>;

  const result = students.map(student => {
    const insights = d.prepare('SELECT chapter_id, insight_id FROM progress WHERE user_id = ?').all(student.id) as Array<{ chapter_id: string; insight_id: string }>;
    const sessions = (d.prepare('SELECT COUNT(*) as cnt FROM sessions WHERE user_id = ?').get(student.id) as { cnt: number }).cnt;

    const chaptersProgress: Record<string, { unlocked: number; total: number }> = {};
    for (const ch of CHAPTERS) {
      const chInsights = insights.filter(i => i.chapter_id === ch.id);
      chaptersProgress[ch.id] = { unlocked: chInsights.length, total: ch.insights.length };
    }

    return {
      id: student.id,
      name: student.name,
      totalInsights: insights.length,
      totalSessions: sessions,
      chaptersProgress,
    };
  });

  // Find commonly missed insights
  const allInsights: Array<{ chapter_id: string; insight_id: string }> = [];
  for (const ch of CHAPTERS) {
    for (const insightId of ch.insights) {
      allInsights.push({ chapter_id: ch.id, insight_id: insightId });
    }
  }

  const studentCount = students.length || 1;
  const commonlyMissed = allInsights.map(ai => {
    const count = (d.prepare(
      'SELECT COUNT(*) as cnt FROM progress WHERE chapter_id = ? AND insight_id = ?'
    ).get(ai.chapter_id, ai.insight_id) as { cnt: number }).cnt;
    return { ...ai, unlocked_count: count };
  }).filter(item => item.unlocked_count < studentCount)
    .sort((a, b) => a.unlocked_count - b.unlocked_count);

  return { students: result, commonlyMissed };
}
