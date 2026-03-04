// ── IPC Channel Names ──
export const IPC_CHANNELS = {
  CHAT_SEND: 'chat:send',
  CHAT_STREAM_CHUNK: 'chat:stream-chunk',
  CHAT_STREAM_END: 'chat:stream-end',
  CHAT_STREAM_ERROR: 'chat:stream-error',
  CHAT_LOAD_HISTORY: 'chat:load-history',
  CHAT_SAVE_HISTORY: 'chat:save-history',
  PROGRESS_LOAD: 'progress:load',
  PROGRESS_SAVE: 'progress:save',
  SETTINGS_LOAD: 'settings:load',
  SETTINGS_SAVE: 'settings:save',
  USER_LIST: 'user:list',
  USER_CREATE: 'user:create',
  USER_LOGIN: 'user:login',
  USER_GET: 'user:get',
  USER_LINK_STUDENT: 'user:link-student',
  USER_GET_LINKED_STUDENTS: 'user:get-linked-students',
  SESSION_START: 'session:start',
  SESSION_END: 'session:end',
  REPORT_STUDENT: 'report:student',
  REPORT_CLASS: 'report:class',
  // v0.3: Adaptive Difficulty
  ATTEMPT_LOG: 'attempt:log',
  ATTEMPT_GET_STATS: 'attempt:get-stats',
  // v0.3: Rate Limiting
  USAGE_CHECK: 'usage:check',
  USAGE_STATS: 'usage:stats',
  // v0.3: Misconception Detection
  MISCONCEPTION_LIST: 'misconception:list',
  MISCONCEPTION_RESOLVE: 'misconception:resolve',
  // v0.3: Spaced Repetition
  REVIEW_DUE: 'review:due',
  REVIEW_RECORD: 'review:record',
  // v0.3: Practice Problems
  PRACTICE_GENERATE: 'practice:generate',
  PRACTICE_SUBMIT: 'practice:submit',
  PRACTICE_HISTORY: 'practice:history',
  // v0.3: Streaks
  STREAK_GET: 'streak:get',
  DAILY_PROGRESS: 'daily:progress',
  // v0.3: Teacher Tools
  CHAT_STUDENT_SESSIONS: 'chat:student-sessions',
  CHAT_SESSION_MESSAGES: 'chat:session-messages',
  // v0.3: Assignments
  ASSIGNMENT_CREATE: 'assignment:create',
  ASSIGNMENT_LIST: 'assignment:list',
  ASSIGNMENT_GET: 'assignment:get',
  ASSIGNMENT_STUDENT_LIST: 'assignment:student-list',
  ASSIGNMENT_UPDATE_STATUS: 'assignment:update-status',
  // v0.3: Alerts
  ALERT_LIST: 'alert:list',
  ALERT_MARK_READ: 'alert:mark-read',
  ALERT_COUNT: 'alert:count',
} as const;

// ── Language ──
export type Language = 'en' | 'hi';

// ── User Roles ──
export type UserRole = 'student' | 'teacher' | 'parent';

// ── User ──
export interface User {
  id: number;
  name: string;
  email?: string;
  role: UserRole;
  schoolName?: string;
  avatarColor?: string;
  createdAt: number;
}

export interface CreateUserRequest {
  name: string;
  role: UserRole;
  pin?: string;
  email?: string;
  schoolName?: string;
}

export interface LoginRequest {
  userId: number;
  pin?: string;
}

// ── Insight IDs ──
export type InsightId =
  // Ch1: Patterns in Mathematics
  | 'number-patterns'
  | 'square-numbers'
  | 'triangular-numbers'
  | 'shape-patterns'
  | 'sequence-relations'
  // Ch5: Prime Time
  | 'factors-multiples'
  | 'prime-numbers'
  | 'co-primes'
  | 'prime-factorisation'
  | 'divisibility-rules'
  // Ch7: Fractions
  | 'fraction-as-part'
  | 'equivalent-fractions'
  | 'comparing-fractions'
  | 'adding-subtracting'
  | 'mixed-numbers';

// ── Chapter ──
export interface Chapter {
  id: string;
  number: number;
  titleEn: string;
  titleHi: string;
  insights: InsightId[];
}

// ── Insight Definition ──
export interface InsightDef {
  id: InsightId;
  labelEn: string;
  labelHi: string;
  descriptionEn: string;
  descriptionHi: string;
}

// ── Chat Message ──
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  insightsUnlocked?: InsightId[];
}

// ── Progress ──
export interface ChapterProgress {
  chapterId: string;
  unlockedInsights: InsightId[];
  mastered: boolean;
  lastActivity: number;
}

export interface ProgressData {
  chapters: Record<string, ChapterProgress>;
}

// ── Settings ──
export interface SettingsData {
  language: Language;
  apiKey: string;
}

// ── Cache ──
export interface CacheEntry {
  question: string;
  answer: string;
  language: Language;
  insights: InsightId[];
  timestamp: number;
}

export interface DynamicCache {
  entries: Record<string, CacheEntry>;
}

export interface StaticCacheEntry {
  keywords: string[];
  question: string;
  answer: string;
  language: Language;
}

// ── Chat Send Request ──
export interface ChatSendRequest {
  chapterId: string;
  message: string;
  language: Language;
  unlockedInsights: InsightId[];
  history: ChatMessage[];
  requestWorkedExample?: boolean;
  reviewMode?: boolean;
  reviewInsightIds?: InsightId[];
}

// ── Stream End Payload ──
export interface StreamEndPayload {
  fullText: string;
  insightsUnlocked: InsightId[];
  correctness?: 'correct' | 'wrong' | 'unclear';
  misconceptions?: string[];
  visuals?: VisualMarker[];
  tokensUsed?: number;
}

// ── Visual Markers ──
export interface VisualMarker {
  type: string;
  params: string;
}

// ── Attempt Tracking ──
export interface AttemptLogRequest {
  chapterId: string;
  insightId: string;
  attemptNumber: number;
  studentMessage: string;
  wasCorrect: boolean | null;
  scaffoldingLevel: number;
  sessionId?: number;
}

export interface AttemptStats {
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  scaffoldingLevel: number;
}

// ── Usage Stats ──
export interface UsageStats {
  messagesSent: number;
  tokensUsed: number;
  dailyLimit: number;
  isLimited: boolean;
}

// ── Misconception ──
export interface Misconception {
  id: number;
  chapterId: string;
  insightId: string;
  misconceptionType: string;
  description: string;
  occurrences: number;
  firstSeen: number;
  lastSeen: number;
  resolved: boolean;
}

// ── Review Schedule ──
export interface ReviewItem {
  chapterId: string;
  insightId: InsightId;
  reviewDate: number;
  intervalDays: number;
  reviewCount: number;
}

// ── Practice Problems ──
export interface PracticeProblem {
  id: string;
  chapterId: string;
  insightId: string;
  question: string;
  correctAnswer: string;
  difficulty: number;
  hints?: string[];
}

export interface PracticeSubmitRequest {
  chapterId: string;
  insightId: string;
  problemText: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeTakenMs: number;
}

// ── Streaks ──
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todayActive: boolean;
}

export interface DailyProgressData {
  messagesSent: number;
  insightsUnlocked: number;
  practiceCompleted: number;
  minutesActive: number;
  dailyGoal: number;
  goalMet: boolean;
}

// ── Assignments ──
export interface Assignment {
  id: number;
  teacherId: number;
  chapterId: string;
  insightIds: string[];
  title: string;
  instructions: string;
  dueDate?: number;
  createdAt: number;
}

export interface AssignmentStudent {
  assignmentId: number;
  studentId: number;
  studentName: string;
  status: 'pending' | 'in_progress' | 'completed';
  insightsUnlocked: string[];
}

export interface CreateAssignmentRequest {
  chapterId: string;
  insightIds: string[];
  title: string;
  instructions: string;
  studentIds: number[];
  dueDate?: number;
}

// ── Alerts ──
export interface Alert {
  id: number;
  userId: number;
  recipientId: number;
  alertType: string;
  chapterId?: string;
  insightId?: string;
  message: string;
  isRead: boolean;
  createdAt: number;
}

// ── Validation ──
export interface ValidationResult {
  isValid: boolean;
  violations: ValidationViolation[];
}

export interface ValidationViolation {
  type: 'direct_answer' | 'too_long' | 'missing_question' | 'off_topic';
  message: string;
  severity: 'warning' | 'error';
}

// ── Electron API (exposed via preload) ──
export interface ElectronAPI {
  sendMessage: (request: ChatSendRequest) => Promise<void>;
  onStreamChunk: (callback: (chunk: string) => void) => () => void;
  onStreamEnd: (callback: (payload: StreamEndPayload) => void) => () => void;
  onStreamError: (callback: (error: string) => void) => () => void;
  loadChatHistory: (chapterId: string) => Promise<ChatMessage[]>;
  saveChatHistory: (chapterId: string, messages: ChatMessage[]) => Promise<void>;
  loadProgress: () => Promise<ProgressData>;
  saveProgress: (data: ProgressData) => Promise<void>;
  loadSettings: () => Promise<SettingsData>;
  saveSettings: (data: SettingsData) => Promise<void>;
  // User/Profile
  listUsers: () => Promise<User[]>;
  createUser: (request: CreateUserRequest) => Promise<User>;
  loginUser: (request: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  getUser: (userId: number) => Promise<User | null>;
  linkStudent: (studentId: number, parentId: number) => Promise<void>;
  getLinkedStudents: (parentId: number) => Promise<User[]>;
  // Sessions
  startSession: (chapterId: string) => Promise<number>;
  endSession: (sessionId: number, messagesCount: number) => Promise<void>;
  // Reports
  getStudentReport: (studentId: number) => Promise<unknown>;
  getClassReport: () => Promise<unknown>;
  // v0.3: Attempts
  logAttempt: (request: AttemptLogRequest) => Promise<void>;
  getAttemptStats: (chapterId: string, insightId: string) => Promise<AttemptStats>;
  // v0.3: Usage
  checkUsage: () => Promise<UsageStats>;
  getUsageStats: () => Promise<UsageStats>;
  // v0.3: Misconceptions
  listMisconceptions: (chapterId?: string) => Promise<Misconception[]>;
  resolveMisconception: (id: number) => Promise<void>;
  // v0.3: Spaced Repetition
  getReviewsDue: (chapterId?: string) => Promise<ReviewItem[]>;
  recordReview: (chapterId: string, insightId: string, quality: number) => Promise<void>;
  // v0.3: Practice
  generatePractice: (chapterId: string, insightId: string) => Promise<PracticeProblem[]>;
  submitPractice: (request: PracticeSubmitRequest) => Promise<void>;
  getPracticeHistory: (chapterId: string, insightId: string) => Promise<unknown>;
  // v0.3: Streaks
  getStreak: () => Promise<StreakData>;
  getDailyProgress: () => Promise<DailyProgressData>;
  // v0.3: Teacher — Conversation Review
  getStudentSessions: (studentId: number) => Promise<unknown>;
  getSessionMessages: (sessionId: number) => Promise<ChatMessage[]>;
  // v0.3: Assignments
  createAssignment: (request: CreateAssignmentRequest) => Promise<Assignment>;
  listAssignments: () => Promise<Assignment[]>;
  getAssignment: (id: number) => Promise<Assignment | null>;
  getAssignmentStudents: (assignmentId: number) => Promise<AssignmentStudent[]>;
  updateAssignmentStatus: (assignmentId: number, studentId: number, status: string) => Promise<void>;
  // v0.3: Alerts
  listAlerts: () => Promise<Alert[]>;
  markAlertRead: (alertId: number) => Promise<void>;
  getAlertCount: () => Promise<number>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
