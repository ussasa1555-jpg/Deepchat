/**
 * Spam Detection & Prevention
 */

export interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Check if message is spam
 */
export function checkSpam(message: string, previousMessages: string[] = []): SpamCheckResult {
  // 1. Duplicate detection (same message 4+ times in last 10 messages)
  const recentMessages = previousMessages.slice(-10);
  const duplicateCount = recentMessages.filter(msg => msg === message).length;
  
  if (duplicateCount >= 4) {
    return {
      isSpam: true,
      reason: 'Duplicate message detected',
      severity: 'medium',
    };
  }

  // 2. CAPS LOCK spam (>85% uppercase and >20 chars)
  const uppercaseRatio = (message.match(/[A-Z]/g) || []).length / message.length;
  if (uppercaseRatio > 0.85 && message.length > 20) {
    return {
      isSpam: true,
      reason: 'Excessive caps lock usage',
      severity: 'low',
    };
  }

  // 3. Link spam (>3 links)
  const linkCount = (message.match(/https?:\/\//g) || []).length;
  if (linkCount > 3) {
    return {
      isSpam: true,
      reason: 'Too many links in message',
      severity: 'high',
    };
  }

  // 4. Repeated characters (20+ same char in a row)
  if (/(.)\1{19,}/.test(message)) {
    return {
      isSpam: true,
      reason: 'Repeated character spam',
      severity: 'low',
    };
  }

  // 5. Empty or whitespace only
  if (message.trim().length === 0) {
    return {
      isSpam: true,
      reason: 'Empty message',
      severity: 'low',
    };
  }

  return {
    isSpam: false,
    severity: 'low',
  };
}

/**
 * Rate limit for messages (flood protection)
 */
const userMessageTimestamps = new Map<string, number[]>();

export function checkFloodProtection(userId: string): {
  allowed: boolean;
  reason?: string;
} {
  const now = Date.now();
  const timestamps = userMessageTimestamps.get(userId) || [];
  
  // Clean old timestamps (older than 5 seconds)
  const recentTimestamps = timestamps.filter((t) => now - t < 5000);
  
  // Check if user sent 5+ messages in last 5 seconds
  if (recentTimestamps.length >= 5) {
    return {
      allowed: false,
      reason: 'Flood protection: Too many messages in short time',
    };
  }

  // Add current timestamp
  recentTimestamps.push(now);
  userMessageTimestamps.set(userId, recentTimestamps);

  return { allowed: true };
}

/**
 * Clean up old timestamps periodically
 */
setInterval(() => {
  const now = Date.now();
  userMessageTimestamps.forEach((timestamps, userId) => {
    const recent = timestamps.filter((t) => now - t < 10000);
    if (recent.length === 0) {
      userMessageTimestamps.delete(userId);
    } else {
      userMessageTimestamps.set(userId, recent);
    }
  });
}, 10000); // Clean every 10 seconds

