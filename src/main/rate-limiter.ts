import { getUsageForToday, getDailyMessageLimit, incrementUsage } from './database';

export interface RateLimitResult {
  allowed: boolean;
  messagesSent: number;
  dailyLimit: number;
  message?: string;
}

export function checkRateLimit(userId: number): RateLimitResult {
  const usage = getUsageForToday(userId);
  const limit = getDailyMessageLimit(userId);

  if (usage.messagesSent >= limit) {
    return {
      allowed: false,
      messagesSent: usage.messagesSent,
      dailyLimit: limit,
      message: "You've been learning a lot today! Take a break and come back tomorrow. Your brain needs time to process everything you've learned!",
    };
  }

  return {
    allowed: true,
    messagesSent: usage.messagesSent,
    dailyLimit: limit,
  };
}

export function recordUsage(userId: number, tokensUsed: number): void {
  incrementUsage(userId, tokensUsed);
}

export function getUsageStats(userId: number): {
  messagesSent: number;
  tokensUsed: number;
  dailyLimit: number;
  isLimited: boolean;
} {
  const usage = getUsageForToday(userId);
  const limit = getDailyMessageLimit(userId);
  return {
    messagesSent: usage.messagesSent,
    tokensUsed: usage.tokensUsed,
    dailyLimit: limit,
    isLimited: usage.messagesSent >= limit,
  };
}
