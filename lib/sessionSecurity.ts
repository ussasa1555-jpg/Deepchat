/**
 * Session Security and Device Fingerprinting
 */

/**
 * Generate device fingerprint
 * Uses browser and device characteristics to create a unique identifier
 */
export function generateDeviceFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
  ];

  // Create a simple hash from components
  const fingerprint = components.join('|');
  return btoa(fingerprint).substring(0, 32);
}

/**
 * Detect if session is potentially hijacked
 */
export function detectSessionHijacking(
  storedFingerprint: string | null,
  currentFingerprint: string
): {
  isHijacked: boolean;
  reason?: string;
} {
  if (!storedFingerprint) {
    // First session, store fingerprint
    return { isHijacked: false };
  }

  if (storedFingerprint !== currentFingerprint) {
    return {
      isHijacked: true,
      reason: 'Device fingerprint mismatch',
    };
  }

  return { isHijacked: false };
}

/**
 * Store session fingerprint
 */
export function storeSessionFingerprint(fingerprint: string): void {
  sessionStorage.setItem('device_fingerprint', fingerprint);
}

/**
 * Get stored session fingerprint
 */
export function getStoredFingerprint(): string | null {
  return sessionStorage.getItem('device_fingerprint');
}

/**
 * Validate session freshness
 * Sessions older than maxAge should be refreshed
 */
export function validateSessionFreshness(
  lastActivity: number,
  maxAge: number = 30 * 60 * 1000 // 30 minutes default
): {
  isValid: boolean;
  reason?: string;
} {
  const age = Date.now() - lastActivity;

  if (age > maxAge) {
    return {
      isValid: false,
      reason: 'Session expired due to inactivity',
    };
  }

  return { isValid: true };
}

/**
 * Update last activity timestamp
 */
export function updateLastActivity(): void {
  sessionStorage.setItem('last_activity', Date.now().toString());
}

/**
 * Get last activity timestamp
 */
export function getLastActivity(): number {
  const stored = sessionStorage.getItem('last_activity');
  return stored ? parseInt(stored, 10) : Date.now();
}

/**
 * Detect unusual login patterns
 */
export interface LoginPattern {
  timestamp: number;
  ip?: string;
  userAgent?: string;
}

export function detectUnusualLoginPattern(
  recentLogins: LoginPattern[]
): {
  isUnusual: boolean;
  reason?: string;
} {
  if (recentLogins.length < 2) {
    return { isUnusual: false };
  }

  // Check for rapid succession logins (brute force attempt)
  const timeDiffs = recentLogins
    .slice(0, -1)
    .map((login, i) => recentLogins[i + 1].timestamp - login.timestamp);

  const avgTimeDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;

  if (avgTimeDiff < 5000) {
    // Less than 5 seconds between logins
    return {
      isUnusual: true,
      reason: 'Rapid succession login attempts detected',
    };
  }

  // Check for different IPs in short time
  const uniqueIps = new Set(recentLogins.map((l) => l.ip).filter(Boolean));
  if (uniqueIps.size > 3) {
    return {
      isUnusual: true,
      reason: 'Multiple IP addresses in short period',
    };
  }

  return { isUnusual: false };
}

/**
 * Extract client IP from request
 * Handles various proxy headers
 */
export function getClientIp(req: Request): string {
  const headers = req.headers;

  // Check common proxy headers
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return 'unknown';
}

/**
 * Validate IP address format
 */
export function isValidIp(ip: string): boolean {
  if (ip === 'unknown') return false;

  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}








