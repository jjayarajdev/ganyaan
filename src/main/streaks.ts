// Re-export from database — the streak logic lives in database.ts
// This module exists for organizational clarity and future extensions

export { getStreak, recordDailyActivity, getDailyActivity, getDailyGoal, updateMinutesActive } from './database';
