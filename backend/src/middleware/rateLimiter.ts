import { db } from '../db/db';

export interface RateLimitResult {
  allowed: boolean;
  message?: string;
  retryAfterSeconds?: number;
}

export interface PasswordValidationDetails {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

/**
 * Enforces rate limiting on OTP generation requests:
 * - Max 1 OTP request every 60 seconds per email (cooldown period)
 * - Max 3 OTP requests every 15 minutes per email (window limit)
 */
export async function checkOtpRequestRateLimit(email: string): Promise<RateLimitResult> {
  const normalizedEmail = email.trim().toLowerCase();
  
  // 1. Check for 60-second cooldown between requests
  const recentOtp: any = await db.prepare(`
    SELECT created_at 
    FROM otps 
    WHERE email = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `).get(normalizedEmail);

  if (recentOtp && recentOtp.created_at) {
    const lastTime = new Date(recentOtp.created_at).getTime();
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - lastTime) / 1000);
    
    if (elapsedSeconds < 60) {
      const waitTime = 60 - elapsedSeconds;
      return {
        allowed: false,
        message: `Please wait ${waitTime} second${waitTime > 1 ? 's' : ''} before requesting another OTP code.`,
        retryAfterSeconds: waitTime
      };
    }
  }

  // 2. Check for 15-minute window count limit (max 3 requests)
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const countResult: any = await db.prepare(`
    SELECT COUNT(*) as count 
    FROM otps 
    WHERE email = ? AND created_at >= ?
  `).get(normalizedEmail, fifteenMinsAgo);

  const requestCount = countResult ? parseInt(countResult.count, 10) : 0;
  if (requestCount >= 3) {
    return {
      allowed: false,
      message: 'Too many OTP requests for this email address. Please wait 15 minutes before requesting again.',
      retryAfterSeconds: 900
    };
  }

  return { allowed: true };
}

/**
 * Validates industry standard password complexity:
 * - Minimum 8 characters long
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character (!@#$%^&* etc.)
 */
export function validatePasswordComplexity(password: string): { 
  valid: boolean; 
  message?: string;
  details: PasswordValidationDetails;
} {
  if (!password || typeof password !== 'string') {
    return { 
      valid: false, 
      message: 'Password is required',
      details: { minLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, hasSpecialChar: false }
    };
  }

  const details: PasswordValidationDetails = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)
  };

  const valid = Object.values(details).every(Boolean);

  let message: string | undefined;
  if (!valid) {
    const missing: string[] = [];
    if (!details.minLength) missing.push('at least 8 characters');
    if (!details.hasUppercase) missing.push('at least 1 uppercase letter');
    if (!details.hasLowercase) missing.push('at least 1 lowercase letter');
    if (!details.hasNumber) missing.push('at least 1 number');
    if (!details.hasSpecialChar) missing.push('at least 1 special character');

    message = `Password must contain: ${missing.join(', ')}.`;
  }

  return { valid, message, details };
}
