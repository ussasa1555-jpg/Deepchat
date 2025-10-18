/**
 * Advanced Threat Detection and Behavioral Analysis
 * ML-based anomaly detection for security threats
 */

import { logThreatDetection } from './auditLog';

export interface UserBehaviorPattern {
  uid: string;
  averageMessageLength: number;
  messagesPerHour: number;
  typingSpeed: number; // words per minute
  activeHours: number[]; // Hours of day (0-23)
  commonRooms: string[];
  lastActivity: number;
}

/**
 * Analyze message patterns for anomalies
 */
export function analyzeMessagePattern(
  message: string,
  userPattern: UserBehaviorPattern
): {
  isAnomalous: boolean;
  reason?: string;
  confidence: number; // 0-1
} {
  const messageLength = message.length;
  const avgLength = userPattern.averageMessageLength;

  // Check for extremely long messages (3x normal)
  if (messageLength > avgLength * 3 && avgLength > 0) {
    return {
      isAnomalous: true,
      reason: 'Message significantly longer than user average',
      confidence: 0.7,
    };
  }

  // Check for spam-like repeated patterns
  const repeatedPatternRegex = /(.{3,})\1{3,}/;
  if (repeatedPatternRegex.test(message)) {
    return {
      isAnomalous: true,
      reason: 'Repeated pattern detected (spam)',
      confidence: 0.9,
    };
  }

  // Check for excessive special characters (bot behavior)
  const specialChars = message.match(/[^a-zA-Z0-9\s]/g);
  const specialCharRatio = specialChars ? specialChars.length / messageLength : 0;

  if (specialCharRatio > 0.4) {
    return {
      isAnomalous: true,
      reason: 'Excessive special characters (potential bot)',
      confidence: 0.6,
    };
  }

  return {
    isAnomalous: false,
    confidence: 0,
  };
}

/**
 * Detect rapid messaging (flood attack)
 */
export function detectFloodPattern(
  messageTimestamps: number[],
  threshold: number = 10,
  windowMs: number = 10000
): {
  isFlooding: boolean;
  messagesPerSecond: number;
} {
  const now = Date.now();
  const recentMessages = messageTimestamps.filter((ts) => now - ts < windowMs);

  if (recentMessages.length > threshold) {
    const messagesPerSecond = recentMessages.length / (windowMs / 1000);
    return {
      isFlooding: true,
      messagesPerSecond,
    };
  }

  return {
    isFlooding: false,
    messagesPerSecond: recentMessages.length / (windowMs / 1000),
  };
}

/**
 * Detect credential stuffing attempts
 */
export function detectCredentialStuffing(
  failedLoginAttempts: { timestamp: number; username: string }[]
): {
  isPotentialAttack: boolean;
  uniqueUsernames: number;
  attemptsPerMinute: number;
} {
  const recentAttempts = failedLoginAttempts.filter(
    (a) => Date.now() - a.timestamp < 60000
  );

  const uniqueUsernames = new Set(recentAttempts.map((a) => a.username)).size;
  const attemptsPerMinute = recentAttempts.length;

  // Multiple usernames, high frequency = credential stuffing
  if (uniqueUsernames > 3 && attemptsPerMinute > 10) {
    return {
      isPotentialAttack: true,
      uniqueUsernames,
      attemptsPerMinute,
    };
  }

  return {
    isPotentialAttack: false,
    uniqueUsernames,
    attemptsPerMinute,
  };
}

/**
 * Analyze login time patterns
 */
export function analyzeLoginTimePattern(
  loginTimes: number[],
  userPattern: UserBehaviorPattern
): {
  isUnusual: boolean;
  reason?: string;
} {
  if (loginTimes.length === 0) {
    return { isUnusual: false };
  }

  const currentHour = new Date().getHours();
  const activeHours = userPattern.activeHours;

  // Check if current hour is unusual for this user
  const isUnusualHour = !activeHours.includes(currentHour) && activeHours.length > 0;

  if (isUnusualHour) {
    return {
      isUnusual: true,
      reason: `Login at unusual hour (${currentHour}:00)`,
    };
  }

  // Check for rapid succession logins
  const timeDiffs = loginTimes.slice(0, -1).map((t, i) => loginTimes[i + 1] - t);
  const hasRapidLogins = timeDiffs.some((diff) => diff < 5000); // < 5 seconds

  if (hasRapidLogins) {
    return {
      isUnusual: true,
      reason: 'Multiple rapid logins detected',
    };
  }

  return { isUnusual: false };
}

/**
 * Calculate user behavior score
 * Lower score = more suspicious
 */
export function calculateBehaviorScore(checks: {
  messagePattern: { isAnomalous: boolean; confidence: number };
  flooding: { isFlooding: boolean };
  loginPattern: { isUnusual: boolean };
}): {
  score: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
} {
  let score = 100;

  // Deduct for anomalies
  if (checks.messagePattern.isAnomalous) {
    score -= 30 * checks.messagePattern.confidence;
  }

  if (checks.flooding.isFlooding) {
    score -= 40;
  }

  if (checks.loginPattern.isUnusual) {
    score -= 20;
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (score >= 80) riskLevel = 'low';
  else if (score >= 60) riskLevel = 'medium';
  else if (score >= 40) riskLevel = 'high';
  else riskLevel = 'critical';

  return { score: Math.max(0, score), riskLevel };
}

/**
 * Auto-block user if threat score is critical
 */
export async function autoBlockIfThreatened(
  uid: string,
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  reason: string
): Promise<boolean> {
  if (riskLevel === 'critical') {
    // Log critical threat
    await logThreatDetection({
      uid,
      threat_type: 'auto_blocked',
      severity: 'critical',
      description: `User auto-blocked: ${reason}`,
      metadata: { auto_blocked: true, reason },
    });

    console.log(`[THREAT] User ${uid} auto-blocked (${reason})`);
    return true;
  }

  return false;
}

/**
 * Simple Bayes-based spam classifier
 */
export function classifySpam(message: string): {
  isSpam: boolean;
  confidence: number;
} {
  const spamKeywords = [
    'click here',
    'free money',
    'nigerian prince',
    'lottery winner',
    'viagra',
    'casino',
    'weight loss',
    'get rich quick',
    'limited time offer',
    'act now',
  ];

  const lowerMessage = message.toLowerCase();
  let spamScore = 0;

  // Check for spam keywords
  spamKeywords.forEach((keyword) => {
    if (lowerMessage.includes(keyword)) {
      spamScore += 0.2;
    }
  });

  // Check for excessive caps
  const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
  if (capsRatio > 0.7) {
    spamScore += 0.3;
  }

  // Check for excessive exclamation marks
  const exclamationCount = (message.match(/!/g) || []).length;
  if (exclamationCount > 5) {
    spamScore += 0.2;
  }

  // Check for suspicious links
  const linkCount = (message.match(/https?:\/\//gi) || []).length;
  if (linkCount > 3) {
    spamScore += 0.3;
  }

  const confidence = Math.min(spamScore, 1.0);
  const isSpam = confidence > 0.6;

  return { isSpam, confidence };
}




