import { Redis } from '@upstash/redis';

/**
 * Initialize Upstash Redis client
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Rate limiting using Redis
 * @param key - Unique identifier (e.g., "login:user@email.com" or "api:uid")
 * @param limit - Maximum number of requests allowed
 * @param window - Time window in seconds
 * @returns Object with allowed status, remaining count, and reset time
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  window: number
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const current = await redis.incr(key);

  // Set expiry on first increment
  if (current === 1) {
    await redis.expire(key, window);
  }

  const ttl = await redis.ttl(key);

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    reset: ttl > 0 ? ttl : window,
  };
}

/**
 * Rate limit configurations
 */
export const RATE_LIMITS = {
  login: { limit: 5, window: 900 }, // 5 attempts per 15 min
  register: { limit: 3, window: 3600 }, // 3 per hour
  message_send: { limit: 60, window: 60 }, // 60 per minute
  private_room_key: { limit: 5, window: 3600 }, // 5 per hour
  oracle_query: { limit: 20, window: 3600 }, // 20 per hour
  dm_create: { limit: 10, window: 3600 }, // 10 per hour
  setup_profile: { limit: 10, window: 60 }, // 10 per minute
  '2fa_enable': { limit: 3, window: 300 }, // 3 per 5 min
  '2fa_verify': { limit: 10, window: 300 }, // 10 per 5 min
  '2fa_disable': { limit: 5, window: 300 }, // 5 per 5 min
  '2fa_login_verify': { limit: 10, window: 300 }, // 10 per 5 min
  
  // Admin rate limits
  admin_ban_user: { limit: 5, window: 3600 }, // 5 per hour
  admin_unban_user: { limit: 10, window: 3600 }, // 10 per hour
  admin_delete_message: { limit: 10, window: 3600 }, // 10 per hour
  admin_view_user: { limit: 50, window: 60 }, // 50 per minute
  
  // Management rate limits (higher)
  management_suspend_admin: { limit: 10, window: 3600 }, // 10 per hour
  management_ip_ban: { limit: 20, window: 3600 }, // 20 per hour
  management_system_config: { limit: 20, window: 3600 }, // 20 per hour
} as const;

/**
 * Helper to create rate limit key
 */
export function createRateLimitKey(type: keyof typeof RATE_LIMITS, identifier: string): string {
  return `rate:${type}:${identifier}`;
}








