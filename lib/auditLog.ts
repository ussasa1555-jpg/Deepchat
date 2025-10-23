/**
 * Audit Logging and Security Event Tracking
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client for audit logging (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export type AuditAction =
  | 'login'
  | 'logout'
  | 'register'
  | 'password_change'
  | 'password_reset'
  | '2fa_enable'
  | '2fa_disable'
  | '2fa_verify'
  | 'encryption_key_rotate'
  | 'message_send'
  | 'message_edit'
  | 'message_delete'
  | 'user_block'
  | 'user_unblock'
  | 'suspicious_activity'
  | 'rate_limit_exceeded';

export interface AuditLogEntry {
  uid: string;
  action: AuditAction;
  ip_address?: string;
  user_agent?: string;
  device_fingerprint?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        uid: entry.uid,
        action: entry.action,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
        device_fingerprint: entry.device_fingerprint,
        metadata: entry.metadata || {},
      });

    if (error) {
      console.error('[AUDIT] Failed to log event:', error);
    } else {
      console.log(`[AUDIT] ${entry.action} logged for ${entry.uid}`);
    }
  } catch (error) {
    console.error('[AUDIT] Error logging event:', error);
  }
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  uid: string,
  limit: number = 100
): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('uid', uid)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[AUDIT] Failed to fetch logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[AUDIT] Error fetching logs:', error);
    return [];
  }
}

/**
 * Detect suspicious activity patterns
 */
export async function detectSuspiciousActivity(
  uid: string,
  currentIp: string
): Promise<{
  isSuspicious: boolean;
  reason?: string;
}> {
  try {
    // Get recent login attempts (last 5 minutes)
    const { data: recentLogins } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('uid', uid)
      .eq('action', 'login')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (recentLogins && recentLogins.length > 5) {
      return {
        isSuspicious: true,
        reason: 'Too many login attempts in short period',
      };
    }

    // Check for IP address changes
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('last_ip')
      .eq('uid', uid)
      .single();

    if (user && user.last_ip && user.last_ip !== currentIp) {
      // Log IP change as potential threat
      await logThreatDetection({
        uid,
        threat_type: 'ip_change',
        severity: 'medium',
        description: `Login from different IP: ${currentIp} (previous: ${user.last_ip})`,
        ip_address: currentIp,
        metadata: { previous_ip: user.last_ip, new_ip: currentIp },
      });
    }

    return { isSuspicious: false };
  } catch (error) {
    console.error('[AUDIT] Error detecting suspicious activity:', error);
    return { isSuspicious: false };
  }
}

export interface ThreatDetection {
  uid: string;
  threat_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ip_address?: string;
  metadata?: Record<string, any>;
}

/**
 * Log a threat detection
 */
export async function logThreatDetection(threat: ThreatDetection): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('threat_detections')
      .insert({
        uid: threat.uid,
        threat_type: threat.threat_type,
        severity: threat.severity,
        description: threat.description,
        ip_address: threat.ip_address,
        metadata: threat.metadata || {},
      });

    if (error) {
      console.error('[THREAT] Failed to log detection:', error);
    } else {
      console.log(`[THREAT] ${threat.threat_type} (${threat.severity}) logged for ${threat.uid}`);
    }
  } catch (error) {
    console.error('[THREAT] Error logging detection:', error);
  }
}

/**
 * Get active threats for a user
 */
export async function getUserThreats(uid: string): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('threat_detections')
      .select('*')
      .eq('uid', uid)
      .eq('resolved', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[THREAT] Failed to fetch threats:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[THREAT] Error fetching threats:', error);
    return [];
  }
}












