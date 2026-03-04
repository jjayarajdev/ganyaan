import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import type {
  ChatSendRequest, ChatMessage, ProgressData, SettingsData,
  StreamEndPayload, ElectronAPI, User, CreateUserRequest, LoginRequest,
  AttemptLogRequest, AttemptStats, UsageStats, Misconception, ReviewItem,
  PracticeProblem, PracticeSubmitRequest, StreakData, DailyProgressData,
  Assignment, AssignmentStudent, CreateAssignmentRequest, Alert,
} from '../shared/types';

const api: ElectronAPI = {
  sendMessage: (request: ChatSendRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.CHAT_SEND, request),

  onStreamChunk: (callback: (chunk: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, chunk: string) => callback(chunk);
    ipcRenderer.on(IPC_CHANNELS.CHAT_STREAM_CHUNK, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT_STREAM_CHUNK, handler);
  },

  onStreamEnd: (callback: (payload: StreamEndPayload) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: StreamEndPayload) => callback(payload);
    ipcRenderer.on(IPC_CHANNELS.CHAT_STREAM_END, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT_STREAM_END, handler);
  },

  onStreamError: (callback: (error: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, error: string) => callback(error);
    ipcRenderer.on(IPC_CHANNELS.CHAT_STREAM_ERROR, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT_STREAM_ERROR, handler);
  },

  loadChatHistory: (chapterId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.CHAT_LOAD_HISTORY, chapterId) as Promise<ChatMessage[]>,

  saveChatHistory: (chapterId: string, messages: ChatMessage[]) =>
    ipcRenderer.invoke(IPC_CHANNELS.CHAT_SAVE_HISTORY, chapterId, messages) as Promise<void>,

  loadProgress: () =>
    ipcRenderer.invoke(IPC_CHANNELS.PROGRESS_LOAD) as Promise<ProgressData>,

  saveProgress: (data: ProgressData) =>
    ipcRenderer.invoke(IPC_CHANNELS.PROGRESS_SAVE, data) as Promise<void>,

  loadSettings: () =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_LOAD) as Promise<SettingsData>,

  saveSettings: (data: SettingsData) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SAVE, data) as Promise<void>,

  // User/Profile
  listUsers: () =>
    ipcRenderer.invoke(IPC_CHANNELS.USER_LIST) as Promise<User[]>,

  createUser: (request: CreateUserRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.USER_CREATE, request) as Promise<User>,

  loginUser: (request: LoginRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.USER_LOGIN, request) as Promise<{ success: boolean; error?: string }>,

  getUser: (userId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.USER_GET, userId) as Promise<User | null>,

  linkStudent: (studentId: number, parentId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.USER_LINK_STUDENT, studentId, parentId) as Promise<void>,

  getLinkedStudents: (parentId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.USER_GET_LINKED_STUDENTS, parentId) as Promise<User[]>,

  // Sessions
  startSession: (chapterId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_START, chapterId) as Promise<number>,

  endSession: (sessionId: number, messagesCount: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_END, sessionId, messagesCount) as Promise<void>,

  // Reports
  getStudentReport: (studentId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORT_STUDENT, studentId),

  getClassReport: () =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORT_CLASS),

  // v0.3: Attempts
  logAttempt: (request: AttemptLogRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.ATTEMPT_LOG, request) as Promise<void>,

  getAttemptStats: (chapterId: string, insightId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.ATTEMPT_GET_STATS, chapterId, insightId) as Promise<AttemptStats>,

  // v0.3: Usage
  checkUsage: () =>
    ipcRenderer.invoke(IPC_CHANNELS.USAGE_CHECK) as Promise<UsageStats>,

  getUsageStats: () =>
    ipcRenderer.invoke(IPC_CHANNELS.USAGE_STATS) as Promise<UsageStats>,

  // v0.3: Misconceptions
  listMisconceptions: (chapterId?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.MISCONCEPTION_LIST, chapterId) as Promise<Misconception[]>,

  resolveMisconception: (id: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.MISCONCEPTION_RESOLVE, id) as Promise<void>,

  // v0.3: Spaced Repetition
  getReviewsDue: (chapterId?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.REVIEW_DUE, chapterId) as Promise<ReviewItem[]>,

  recordReview: (chapterId: string, insightId: string, quality: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.REVIEW_RECORD, chapterId, insightId, quality) as Promise<void>,

  // v0.3: Practice
  generatePractice: (chapterId: string, insightId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.PRACTICE_GENERATE, chapterId, insightId) as Promise<PracticeProblem[]>,

  submitPractice: (request: PracticeSubmitRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.PRACTICE_SUBMIT, request) as Promise<void>,

  getPracticeHistory: (chapterId: string, insightId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.PRACTICE_HISTORY, chapterId, insightId),

  // v0.3: Streaks
  getStreak: () =>
    ipcRenderer.invoke(IPC_CHANNELS.STREAK_GET) as Promise<StreakData>,

  getDailyProgress: () =>
    ipcRenderer.invoke(IPC_CHANNELS.DAILY_PROGRESS) as Promise<DailyProgressData>,

  // v0.3: Teacher — Conversation Review
  getStudentSessions: (studentId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.CHAT_STUDENT_SESSIONS, studentId),

  getSessionMessages: (sessionId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.CHAT_SESSION_MESSAGES, sessionId) as Promise<ChatMessage[]>,

  // v0.3: Assignments
  createAssignment: (request: CreateAssignmentRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.ASSIGNMENT_CREATE, request) as Promise<Assignment>,

  listAssignments: () =>
    ipcRenderer.invoke(IPC_CHANNELS.ASSIGNMENT_LIST) as Promise<Assignment[]>,

  getAssignment: (id: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.ASSIGNMENT_GET, id) as Promise<Assignment | null>,

  getAssignmentStudents: (assignmentId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.ASSIGNMENT_STUDENT_LIST, assignmentId) as Promise<AssignmentStudent[]>,

  updateAssignmentStatus: (assignmentId: number, studentId: number, status: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.ASSIGNMENT_UPDATE_STATUS, assignmentId, studentId, status) as Promise<void>,

  // v0.3: Alerts
  listAlerts: () =>
    ipcRenderer.invoke(IPC_CHANNELS.ALERT_LIST) as Promise<Alert[]>,

  markAlertRead: (alertId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.ALERT_MARK_READ, alertId) as Promise<void>,

  getAlertCount: () =>
    ipcRenderer.invoke(IPC_CHANNELS.ALERT_COUNT) as Promise<number>,
};

contextBridge.exposeInMainWorld('electronAPI', api);
