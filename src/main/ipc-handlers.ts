import { ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import type {
  ChatSendRequest, ChatMessage, ProgressData, SettingsData,
  CreateUserRequest, LoginRequest, AttemptLogRequest,
  PracticeSubmitRequest, CreateAssignmentRequest,
} from '../shared/types';
import {
  loadSettings, saveSettings, loadProgress, saveInsightUnlock,
  loadChatHistory, saveChatHistory,
  createUser, getUser, getAllUsers, verifyPin, linkStudentToParent, getLinkedStudents,
  startSession, endSession,
  getStudentAnalytics, getClassAnalytics,
  // v0.3
  logAttempt, getAttemptStats, getScaffoldingLevelForChat,
  logValidation, logMisconception, getMisconceptions, resolveMisconception,
  scheduleReview, getReviewsDue, recordReviewResult,
  savePracticeResult, getPracticeHistory,
  recordDailyActivity, getDailyActivity, getDailyGoal, getStreak,
  createAssignment, getAssignments, getAssignment,
  getAssignmentStudents, getStudentAssignments, updateAssignmentStatus,
  createAlert, getAlerts, markAlertRead, getUnreadAlertCount,
  getStudentSessionsList, getSessionMessages,
} from './database';
import type { UserRow } from './database';
import { buildSystemPrompt, buildMessages } from './prompt-builder';
import { streamCompletion } from './openai-client';
import { lookupCache, cacheResponse } from './cache-manager';
import { checkRateLimit, recordUsage, getUsageStats } from './rate-limiter';
import { validateResponse } from './response-validator';
import { getStorylineBlock } from './prompts/storylines';

// Current user ID — defaults to 1 (default student), updated by login
let currentUserId = 1;

export function setCurrentUserId(id: number): void {
  currentUserId = id;
}

export function getCurrentUserId(): number {
  return currentUserId;
}

function userRowToUser(row: UserRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email || undefined,
    role: row.role,
    schoolName: row.school_name || undefined,
    avatarColor: row.avatar_color || undefined,
    createdAt: row.created_at,
  };
}

export function registerIpcHandlers(window: BrowserWindow): void {
  // ── Chat Send ──
  ipcMain.handle(IPC_CHANNELS.CHAT_SEND, async (_event, request: ChatSendRequest) => {
    const { chapterId, message, language, unlockedInsights, history,
      requestWorkedExample, reviewMode, reviewInsightIds } = request;

    const isFirstMessage = history.length === 0;
    if (isFirstMessage && !reviewMode) {
      const cached = lookupCache(language, unlockedInsights, message, chapterId);
      if (cached) {
        const words = cached.answer.split(' ');
        for (let i = 0; i < words.length; i += 3) {
          const chunk = words.slice(i, i + 3).join(' ') + ' ';
          window.webContents.send(IPC_CHANNELS.CHAT_STREAM_CHUNK, chunk);
          await new Promise(r => setTimeout(r, 30));
        }
        window.webContents.send(IPC_CHANNELS.CHAT_STREAM_END, {
          fullText: cached.answer,
          insightsUnlocked: cached.insights,
        });
        // Record usage even for cached responses
        recordUsage(currentUserId, 0);
        recordDailyActivity(currentUserId, 'messages_sent');
        return;
      }
    }

    // Rate limit check
    const rateLimitResult = checkRateLimit(currentUserId);
    if (!rateLimitResult.allowed) {
      window.webContents.send(IPC_CHANNELS.CHAT_STREAM_ERROR, rateLimitResult.message);
      return;
    }

    const settings = loadSettings(currentUserId);
    if (!settings.apiKey) {
      window.webContents.send(IPC_CHANNELS.CHAT_STREAM_ERROR, 'API key not configured. Please set your OpenAI API key in settings.');
      return;
    }

    try {
      const studentMessageCount = history.filter(m => m.role === 'user').length + 1;

      // v0.3: Compute scaffolding level and gather misconceptions
      const scaffoldingLevel = getScaffoldingLevelForChat(currentUserId, chapterId);
      const activeMisconceptions = getMisconceptions(currentUserId, chapterId)
        .filter(m => !m.resolved)
        .slice(0, 5)
        .map(m => ({ misconception_type: m.misconception_type, description: m.description, occurrences: m.occurrences }));

      // v0.3: Storyline
      const unlockedCount = unlockedInsights.length;
      const totalInsights = 5; // All chapters have 5 insights
      const storylineBlock = getStorylineBlock(chapterId, unlockedCount, totalInsights);

      const systemPrompt = buildSystemPrompt(chapterId, language, unlockedInsights, studentMessageCount, {
        scaffoldingLevel,
        misconceptions: activeMisconceptions,
        requestWorkedExample,
        reviewMode,
        reviewInsightIds,
        storylineBlock: storylineBlock || undefined,
      });

      const historyForPrompt = history.map(m => ({ role: m.role, content: m.content }));
      const messages = buildMessages(systemPrompt, historyForPrompt, message);
      const result = await streamCompletion(settings.apiKey, messages, window);

      // v0.3: Record usage
      recordUsage(currentUserId, result.tokensUsed);
      recordDailyActivity(currentUserId, 'messages_sent');

      // v0.3: Log misconceptions
      for (const misconceptionType of result.misconceptions) {
        logMisconception(currentUserId, chapterId, '', misconceptionType, misconceptionType);
      }

      // v0.3: Handle review results
      for (const rr of result.reviewResults) {
        recordReviewResult(currentUserId, chapterId, rr.insightId, rr.quality);
      }

      // v0.3: Validate response (log only, don't block)
      const validation = validateResponse(result.fullText, chapterId);
      if (!validation.isValid) {
        for (const v of validation.violations) {
          logValidation(currentUserId, chapterId, result.fullText.slice(0, 500), v.type, v.message, v.severity);
        }
      }

      if (isFirstMessage && !reviewMode) {
        cacheResponse(language, unlockedInsights, message, result.fullText, result.insights, chapterId);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      window.webContents.send(IPC_CHANNELS.CHAT_STREAM_ERROR, errMsg);
    }
  });

  // ── Chat History ──
  ipcMain.handle(IPC_CHANNELS.CHAT_LOAD_HISTORY, (_event, chapterId: string) => {
    return loadChatHistory(currentUserId, chapterId);
  });

  ipcMain.handle(IPC_CHANNELS.CHAT_SAVE_HISTORY, (_event, chapterId: string, messages: ChatMessage[]) => {
    saveChatHistory(currentUserId, chapterId, messages);
  });

  // ── Progress ──
  ipcMain.handle(IPC_CHANNELS.PROGRESS_LOAD, () => {
    return loadProgress(currentUserId);
  });

  ipcMain.handle(IPC_CHANNELS.PROGRESS_SAVE, (_event, data: ProgressData) => {
    for (const [chapterId, chProgress] of Object.entries(data.chapters)) {
      for (const insightId of chProgress.unlockedInsights) {
        saveInsightUnlock(currentUserId, chapterId, insightId);
      }
    }
  });

  // ── Settings ──
  ipcMain.handle(IPC_CHANNELS.SETTINGS_LOAD, () => {
    return loadSettings(currentUserId);
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SAVE, (_event, data: SettingsData) => {
    saveSettings(currentUserId, data);
  });

  // ── User Management ──
  ipcMain.handle(IPC_CHANNELS.USER_LIST, () => {
    return getAllUsers().map(userRowToUser);
  });

  ipcMain.handle(IPC_CHANNELS.USER_CREATE, (_event, request: CreateUserRequest) => {
    const avatarColors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
    const color = avatarColors[Math.floor(Math.random() * avatarColors.length)];
    const row = createUser(request.name, request.role, request.pin, request.email, request.schoolName, color);
    return userRowToUser(row);
  });

  ipcMain.handle(IPC_CHANNELS.USER_LOGIN, (_event, request: LoginRequest) => {
    const user = getUser(request.userId);
    if (!user) return { success: false, error: 'User not found' };

    // Students don't need PIN
    if (user.role === 'student') {
      currentUserId = user.id;
      return { success: true };
    }

    // Teachers and parents need PIN
    if (!request.pin) return { success: false, error: 'PIN required' };
    if (!verifyPin(user.id, request.pin)) return { success: false, error: 'Wrong PIN' };

    currentUserId = user.id;
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.USER_GET, (_event, userId: number) => {
    const row = getUser(userId);
    return row ? userRowToUser(row) : null;
  });

  ipcMain.handle(IPC_CHANNELS.USER_LINK_STUDENT, (_event, studentId: number, parentId: number) => {
    linkStudentToParent(studentId, parentId);
  });

  ipcMain.handle(IPC_CHANNELS.USER_GET_LINKED_STUDENTS, (_event, parentId: number) => {
    return getLinkedStudents(parentId).map(userRowToUser);
  });

  // ── Sessions ──
  ipcMain.handle(IPC_CHANNELS.SESSION_START, (_event, chapterId: string) => {
    return startSession(currentUserId, chapterId);
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_END, (_event, sessionId: number, messagesCount: number) => {
    endSession(sessionId, messagesCount);
  });

  // ── Reports ──
  ipcMain.handle(IPC_CHANNELS.REPORT_STUDENT, (_event, studentId: number) => {
    return getStudentAnalytics(studentId);
  });

  ipcMain.handle(IPC_CHANNELS.REPORT_CLASS, () => {
    return getClassAnalytics();
  });

  // ── v0.3: Attempt Tracking ──
  ipcMain.handle(IPC_CHANNELS.ATTEMPT_LOG, (_event, request: AttemptLogRequest) => {
    logAttempt(
      currentUserId, request.chapterId, request.insightId,
      request.attemptNumber, request.studentMessage,
      request.wasCorrect, request.scaffoldingLevel, request.sessionId,
    );
  });

  ipcMain.handle(IPC_CHANNELS.ATTEMPT_GET_STATS, (_event, chapterId: string, insightId: string) => {
    return getAttemptStats(currentUserId, chapterId, insightId);
  });

  // ── v0.3: Usage ──
  ipcMain.handle(IPC_CHANNELS.USAGE_CHECK, () => {
    return getUsageStats(currentUserId);
  });

  ipcMain.handle(IPC_CHANNELS.USAGE_STATS, () => {
    return getUsageStats(currentUserId);
  });

  // ── v0.3: Misconceptions ──
  ipcMain.handle(IPC_CHANNELS.MISCONCEPTION_LIST, (_event, chapterId?: string) => {
    const rows = getMisconceptions(currentUserId, chapterId);
    return rows.map(r => ({
      id: r.id,
      chapterId: r.chapter_id,
      insightId: r.insight_id,
      misconceptionType: r.misconception_type,
      description: r.description,
      occurrences: r.occurrences,
      firstSeen: r.first_seen,
      lastSeen: r.last_seen,
      resolved: !!r.resolved,
    }));
  });

  ipcMain.handle(IPC_CHANNELS.MISCONCEPTION_RESOLVE, (_event, id: number) => {
    resolveMisconception(id);
  });

  // ── v0.3: Spaced Repetition ──
  ipcMain.handle(IPC_CHANNELS.REVIEW_DUE, (_event, chapterId?: string) => {
    const rows = getReviewsDue(currentUserId, chapterId);
    return rows.map(r => ({
      chapterId: r.chapter_id,
      insightId: r.insight_id,
      reviewDate: r.review_date,
      intervalDays: r.interval_days,
      reviewCount: r.review_count,
    }));
  });

  ipcMain.handle(IPC_CHANNELS.REVIEW_RECORD, (_event, chapterId: string, insightId: string, quality: number) => {
    recordReviewResult(currentUserId, chapterId, insightId, quality);
  });

  // ── v0.3: Practice ──
  ipcMain.handle(IPC_CHANNELS.PRACTICE_GENERATE, async (_event, chapterId: string, insightId: string) => {
    // Dynamic import to avoid circular deps
    const { generateProblems } = await import('./practice-generator');
    const scaffoldingLevel = getScaffoldingLevelForChat(currentUserId, chapterId);
    return generateProblems(chapterId, insightId, scaffoldingLevel);
  });

  ipcMain.handle(IPC_CHANNELS.PRACTICE_SUBMIT, (_event, request: PracticeSubmitRequest) => {
    savePracticeResult(
      currentUserId, request.chapterId, request.insightId,
      request.problemText, request.studentAnswer, request.correctAnswer,
      request.isCorrect, request.timeTakenMs,
    );
    recordDailyActivity(currentUserId, 'practice_completed');
  });

  ipcMain.handle(IPC_CHANNELS.PRACTICE_HISTORY, (_event, chapterId: string, insightId: string) => {
    return getPracticeHistory(currentUserId, chapterId, insightId);
  });

  // ── v0.3: Streaks ──
  ipcMain.handle(IPC_CHANNELS.STREAK_GET, () => {
    return getStreak(currentUserId);
  });

  ipcMain.handle(IPC_CHANNELS.DAILY_PROGRESS, () => {
    const activity = getDailyActivity(currentUserId);
    const dailyGoal = getDailyGoal(currentUserId);
    return {
      messagesSent: activity.messages_sent,
      insightsUnlocked: activity.insights_unlocked,
      practiceCompleted: activity.practice_completed,
      minutesActive: activity.minutes_active,
      dailyGoal,
      goalMet: activity.messages_sent >= dailyGoal,
    };
  });

  // ── v0.3: Teacher — Conversation Review ──
  ipcMain.handle(IPC_CHANNELS.CHAT_STUDENT_SESSIONS, (_event, studentId: number) => {
    return getStudentSessionsList(studentId);
  });

  ipcMain.handle(IPC_CHANNELS.CHAT_SESSION_MESSAGES, (_event, sessionId: number) => {
    return getSessionMessages(sessionId);
  });

  // ── v0.3: Assignments ──
  ipcMain.handle(IPC_CHANNELS.ASSIGNMENT_CREATE, (_event, request: CreateAssignmentRequest) => {
    const id = createAssignment(
      currentUserId, request.chapterId, request.insightIds,
      request.title, request.instructions, request.studentIds, request.dueDate,
    );
    return getAssignment(id);
  });

  ipcMain.handle(IPC_CHANNELS.ASSIGNMENT_LIST, () => {
    const user = getUser(currentUserId);
    if (user?.role === 'teacher') {
      const rows = getAssignments(currentUserId);
      return rows.map(r => ({
        id: r.id,
        teacherId: r.teacher_id,
        chapterId: r.chapter_id,
        insightIds: JSON.parse(r.insight_ids),
        title: r.title,
        instructions: r.instructions,
        dueDate: r.due_date,
        createdAt: r.created_at,
      }));
    }
    // Student: get assignments assigned to them
    const rows = getStudentAssignments(currentUserId);
    return rows.map(r => ({
      id: r.id,
      chapterId: r.chapter_id,
      insightIds: JSON.parse(r.insight_ids),
      title: r.title,
      instructions: r.instructions,
      dueDate: r.due_date,
      status: r.status,
      teacherName: r.teacher_name,
    }));
  });

  ipcMain.handle(IPC_CHANNELS.ASSIGNMENT_GET, (_event, id: number) => {
    const row = getAssignment(id);
    if (!row) return null;
    return {
      id: row.id,
      teacherId: row.teacher_id,
      chapterId: row.chapter_id,
      insightIds: JSON.parse(row.insight_ids),
      title: row.title,
      instructions: row.instructions,
      dueDate: row.due_date,
      createdAt: row.created_at,
    };
  });

  ipcMain.handle(IPC_CHANNELS.ASSIGNMENT_STUDENT_LIST, (_event, assignmentId: number) => {
    const rows = getAssignmentStudents(assignmentId);
    return rows.map(r => ({
      assignmentId: r.assignment_id,
      studentId: r.student_id,
      studentName: r.student_name,
      status: r.status,
      insightsUnlocked: JSON.parse(r.insights_unlocked),
    }));
  });

  ipcMain.handle(IPC_CHANNELS.ASSIGNMENT_UPDATE_STATUS, (_event, assignmentId: number, studentId: number, status: string) => {
    updateAssignmentStatus(assignmentId, studentId, status);
  });

  // ── v0.3: Alerts ──
  ipcMain.handle(IPC_CHANNELS.ALERT_LIST, () => {
    const rows = getAlerts(currentUserId);
    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      recipientId: r.recipient_id,
      alertType: r.alert_type,
      chapterId: r.chapter_id,
      insightId: r.insight_id,
      message: r.message,
      isRead: !!r.is_read,
      createdAt: r.created_at,
    }));
  });

  ipcMain.handle(IPC_CHANNELS.ALERT_MARK_READ, (_event, alertId: number) => {
    markAlertRead(alertId);
  });

  ipcMain.handle(IPC_CHANNELS.ALERT_COUNT, () => {
    return getUnreadAlertCount(currentUserId);
  });
}
