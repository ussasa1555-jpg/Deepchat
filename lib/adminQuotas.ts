/**
 * Admin Quota Management
 * Rate limiting specifically for admin actions
 */

import { createClient } from '@supabase/supabase-js';
import { createManagementAlert } from './adminActionLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export type QuotaAction = 'ban' | 'unban' | 'delete_message' | 'delete_room';

interface QuotaLimits {
  bans_per_hour: number;
  bans_per_day: number;
  bans_per_month: number;
  deletes_per_hour: number;
  deletes_per_day: number;
}

const ADMIN_LIMITS: QuotaLimits = {
  bans_per_hour: 5,
  bans_per_day: 20,
  bans_per_month: 100,
  deletes_per_hour: 10,
  deletes_per_day: 50,
};

/**
 * Check if admin has quota available
 */
export async function checkAdminQuota(
  adminUid: string,
  action: QuotaAction
): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  try {
    // Get or create quota record
    let { data: quota, error } = await supabaseAdmin
      .from('admin_quotas')
      .select('*')
      .eq('admin_uid', adminUid)
      .single();

    if (error || !quota) {
      // Create new quota record
      await supabaseAdmin.from('admin_quotas').insert({
        admin_uid: adminUid,
      });
      
      quota = {
        admin_uid: adminUid,
        bans_last_hour: 0,
        bans_last_day: 0,
        bans_last_month: 0,
        deletes_last_hour: 0,
        deletes_last_day: 0,
        last_reset_hour: new Date(),
        last_reset_day: new Date(),
        last_reset_month: new Date(),
      };
    }

    // Check based on action type
    if (action === 'ban' || action === 'unban') {
      if (quota.bans_last_hour >= ADMIN_LIMITS.bans_per_hour) {
        return {
          allowed: false,
          reason: `Hourly ban limit exceeded (${ADMIN_LIMITS.bans_per_hour}/hour)`,
          remaining: 0,
        };
      }

      if (quota.bans_last_day >= ADMIN_LIMITS.bans_per_day) {
        return {
          allowed: false,
          reason: `Daily ban limit exceeded (${ADMIN_LIMITS.bans_per_day}/day)`,
          remaining: 0,
        };
      }

      if (quota.bans_last_month >= ADMIN_LIMITS.bans_per_month) {
        return {
          allowed: false,
          reason: `Monthly ban limit exceeded (${ADMIN_LIMITS.bans_per_month}/month)`,
          remaining: 0,
        };
      }

      return {
        allowed: true,
        remaining: ADMIN_LIMITS.bans_per_hour - quota.bans_last_hour,
      };
    }

    if (action === 'delete_message') {
      if (quota.deletes_last_hour >= ADMIN_LIMITS.deletes_per_hour) {
        return {
          allowed: false,
          reason: `Hourly delete limit exceeded (${ADMIN_LIMITS.deletes_per_hour}/hour)`,
          remaining: 0,
        };
      }

      if (quota.deletes_last_day >= ADMIN_LIMITS.deletes_per_day) {
        return {
          allowed: false,
          reason: `Daily delete limit exceeded (${ADMIN_LIMITS.deletes_per_day}/day)`,
          remaining: 0,
        };
      }

      return {
        allowed: true,
        remaining: ADMIN_LIMITS.deletes_per_hour - quota.deletes_last_hour,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('[ADMIN_QUOTA] Error checking quota:', error);
    return { allowed: false, reason: 'Quota check failed' };
  }
}

/**
 * Increment admin quota after action
 */
export async function incrementAdminQuota(
  adminUid: string,
  action: QuotaAction
): Promise<void> {
  try {
    const field =
      action === 'ban' || action === 'unban'
        ? ['bans_last_hour', 'bans_last_day', 'bans_last_month']
        : ['deletes_last_hour', 'deletes_last_day'];

    for (const f of field) {
      await supabaseAdmin.rpc('increment_quota', {
        p_admin_uid: adminUid,
        p_field: f,
      });
    }

    // Check if quota abuse (5 in 10 minutes)
    await detectQuotaAbuse(adminUid, action);
  } catch (error) {
    console.error('[ADMIN_QUOTA] Error incrementing quota:', error);
  }
}

/**
 * Detect quota abuse patterns
 */
async function detectQuotaAbuse(
  adminUid: string,
  action: QuotaAction
): Promise<void> {
  try {
    // Get recent actions (last 10 minutes)
    const { data: recentActions } = await supabaseAdmin
      .from('admin_actions')
      .select('created_at, action_type')
      .eq('admin_uid', adminUid)
      .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .in('action_type', ['ban_user', 'delete_message']);

    if (!recentActions) return;

    const banCount = recentActions.filter((a) => a.action_type === 'ban_user').length;
    const deleteCount = recentActions.filter((a) => a.action_type === 'delete_message').length;

    // Rapid banning (5+ in 10 minutes)
    if (banCount >= 5) {
      // Auto-timeout admin
      await timeoutAdmin(adminUid, 'rate_limit', 24);

      // Alert Management
      await createManagementAlert({
        alert_type: 'admin_abuse',
        severity: 'critical',
        title: 'Admin Rate Limit Abuse Detected',
        description: `Admin ${adminUid} issued ${banCount} bans in 10 minutes`,
        related_uid: adminUid,
        metadata: {
          action_count: banCount,
          time_window_minutes: 10,
          auto_action: 'timeout_24h',
        },
      });

      console.log(`[ADMIN_QUOTA] Admin ${adminUid} auto-suspended for quota abuse`);
    }

    // Rapid deletions (10+ in 10 minutes)
    if (deleteCount >= 10) {
      await createManagementAlert({
        alert_type: 'admin_abuse',
        severity: 'warning',
        title: 'High Delete Activity',
        description: `Admin ${adminUid} deleted ${deleteCount} messages in 10 minutes`,
        related_uid: adminUid,
        metadata: {
          delete_count: deleteCount,
          time_window_minutes: 10,
        },
      });
    }
  } catch (error) {
    console.error('[ADMIN_QUOTA] Error detecting abuse:', error);
  }
}

/**
 * Timeout admin (suspend privileges)
 */
async function timeoutAdmin(
  adminUid: string,
  type: 'rate_limit' | 'abuse_detected' | 'manual',
  durationHours: number
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    await supabaseAdmin.from('admin_timeouts').insert({
      admin_uid: adminUid,
      reason: `Auto-timeout: ${type}`,
      timeout_type: type,
      issued_by: null, // Auto
      duration_hours: durationHours,
      expires_at: expiresAt.toISOString(),
      is_active: true,
    });

    console.log(`[ADMIN_QUOTA] Admin ${adminUid} timed out for ${durationHours} hours`);
  } catch (error) {
    console.error('[ADMIN_QUOTA] Error timing out admin:', error);
  }
}

/**
 * Get quota status for admin
 */
export async function getQuotaStatus(adminUid: string): Promise<{
  bans_hour: number;
  bans_day: number;
  bans_month: number;
  deletes_hour: number;
  deletes_day: number;
  limits: QuotaLimits;
}> {
  try {
    const { data } = await supabaseAdmin
      .from('admin_quotas')
      .select('*')
      .eq('admin_uid', adminUid)
      .single();

    if (!data) {
      return {
        bans_hour: 0,
        bans_day: 0,
        bans_month: 0,
        deletes_hour: 0,
        deletes_day: 0,
        limits: ADMIN_LIMITS,
      };
    }

    return {
      bans_hour: data.bans_last_hour,
      bans_day: data.bans_last_day,
      bans_month: data.bans_last_month,
      deletes_hour: data.deletes_last_hour,
      deletes_day: data.deletes_last_day,
      limits: ADMIN_LIMITS,
    };
  } catch (error) {
    console.error('[ADMIN_QUOTA] Error getting quota status:', error);
    return {
      bans_hour: 0,
      bans_day: 0,
      bans_month: 0,
      deletes_hour: 0,
      deletes_day: 0,
      limits: ADMIN_LIMITS,
    };
  }
}








