import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string, options?: {
  allowLinks?: boolean;
  maxLength?: number;
}): string {
  const { allowLinks = true, maxLength = 10000 } = options || {};

  // Trim and limit length
  let sanitized = input.trim().substring(0, maxLength);

  // Configure DOMPurify
  const config: any = {
    ALLOWED_TAGS: allowLinks ? ['a'] : [],
    ALLOWED_ATTR: allowLinks ? ['href', 'target', 'rel'] : [],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
  };

  // Sanitize
  sanitized = DOMPurify.sanitize(sanitized, config);

  return sanitized;
}

/**
 * Sanitize message body
 */
export function sanitizeMessage(body: string): string {
  return sanitizeInput(body, {
    allowLinks: true,
    maxLength: 2000,
  });
}

/**
 * Sanitize nickname (no HTML, strict)
 */
export function sanitizeNickname(nickname: string): string {
  // Remove all HTML and special chars except alphanumeric and underscore
  let clean = nickname.trim();
  clean = DOMPurify.sanitize(clean, { ALLOWED_TAGS: [] });
  clean = clean.replace(/[^a-zA-Z0-9_]/g, '');
  return clean.substring(0, 16);
}

/**
 * Sanitize room name/description
 */
export function sanitizeRoomName(name: string): string {
  return sanitizeInput(name, {
    allowLinks: false,
    maxLength: 50,
  });
}

export function sanitizeRoomDescription(desc: string): string {
  return sanitizeInput(desc, {
    allowLinks: false,
    maxLength: 200,
  });
}

/**
 * Detect and prevent common attacks
 */
export function detectSuspiciousContent(text: string): {
  isSuspicious: boolean;
  reason?: string;
} {
  // SQL injection patterns
  const sqlPatterns = /(union|select|insert|update|delete|drop|exec|script)/gi;
  if (sqlPatterns.test(text)) {
    return { isSuspicious: true, reason: 'Potential SQL injection' };
  }

  // Script tags
  if (/<script|javascript:|onerror=/i.test(text)) {
    return { isSuspicious: true, reason: 'Potential XSS attack' };
  }

  // Excessive special characters (possible obfuscation)
  const specialCharRatio = (text.match(/[^a-zA-Z0-9\s]/g) || []).length / text.length;
  if (specialCharRatio > 0.5 && text.length > 20) {
    return { isSuspicious: true, reason: 'Suspicious character pattern' };
  }

  return { isSuspicious: false };
}







