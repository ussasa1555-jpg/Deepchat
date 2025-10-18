import crypto from 'crypto';
import { authenticator } from 'otplib';

/**
 * 2FA/TOTP Utilities
 * Uses time-based one-time passwords (TOTP)
 */

export function generateSecret(): string {
  return authenticator.generateSecret();
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

export function generateQRCodeUrl(secret: string, email: string): string {
  const issuer = 'Deepchat';
  return authenticator.keyuri(email, issuer, secret);
}

/**
 * Verify TOTP code
 */
export function verifyTOTP(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

