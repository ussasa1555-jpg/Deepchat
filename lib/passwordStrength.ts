import zxcvbn from 'zxcvbn';

export interface PasswordStrengthResult {
  score: number; // 0-4
  feedback: string;
  isStrong: boolean;
  crackTime: string;
}

/**
 * Check password strength using zxcvbn
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      feedback: 'Password required',
      isStrong: false,
      crackTime: '0 seconds',
    };
  }

  const result = zxcvbn(password);

  const feedbackMessages = [
    'Very weak - easily cracked',
    'Weak - vulnerable to attacks',
    'Fair - consider adding more complexity',
    'Good - acceptable strength',
    'Excellent - very strong password',
  ];

  return {
    score: result.score,
    feedback: result.feedback.warning || feedbackMessages[result.score],
    isStrong: result.score >= 3,
    crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second || 'Unknown',
  };
}

/**
 * Validate password meets minimum requirements
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Minimum 8 characters required');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Must contain lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Must contain number');
  }

  // Check strength
  const strength = checkPasswordStrength(password);
  if (!strength.isStrong && errors.length === 0) {
    errors.push('Password too weak - add more complexity');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get password strength color for UI
 */
export function getStrengthColor(score: number): string {
  const colors = [
    'text-error',      // 0: Very weak
    'text-error',      // 1: Weak  
    'text-warning',    // 2: Fair
    'text-success',    // 3: Good
    'text-accent',     // 4: Excellent
  ];
  
  return colors[score] || 'text-muted';
}








