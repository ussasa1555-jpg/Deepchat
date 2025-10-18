/**
 * Admin Action Comprehensive Logger
 * Logs every admin and management action
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export type ActionType =
  | 'ban_user'
  | 'unban_user'
  | 'delete_message'
  | 'delete_room'
  | 'room_lock'
  | 'room_unlock'
  | 'resolve_threat'
  | 'review_report'
  | 'suspend_admin'
  | 'unsuspend_admin'
  | 'promote_to_admin'
  | 'demote_admin'
  | 'ip_ban'
  | 'ip_whitelist_add'
  | 'system_config_change'
  | 'emergency_control'
  | 'system_announcement'
  | 'view_user'
  | 'search_user'
  | 'export_data'
  | 'database_query';

export type ActionCategory = 'view' | 'moderate' | 'critical';
export type TargetType = 'user' | 'room' | 'message' | 'admin' | 'system';

export interface AdminActionLog {
  admin_uid: string;
  admin_role: 'admin' | 'management';
  action_type: ActionType;
  action_category?: ActionCategory;
  target_type?: TargetType;
  target_id?: string;
  action_details: Record<string, any>;
  ip_address: string;
  user_agent?: string;
  device_fingerprint?: string;
  session_id?: string;
  password_verified?: boolean;
  twofa_verified?: boolean;
  webauthn_verified?: boolean;
  requires_approval?: boolean;
  approved_by?: string;
  success: boolean;
  error_message?: string;
  execution_time_ms?: number;
}

/**
 * Log admin action
 */
export async function logAdminAction(log: AdminActionLog): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('admin_actions').insert({
      admin_uid: log.admin_uid,
      admin_role: log.admin_role,
      action_type: log.action_type,
      action_category: log.action_category || categorizeAction(log.action_type),
      target_type: log.target_type,
      target_id: log.target_id,
      action_details: log.action_details,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      device_fingerprint: log.device_fingerprint,
      session_id: log.session_id,
      password_verified: log.password_verified || false,
      twofa_verified: log.twofa_verified || false,
      webauthn_verified: log.webauthn_verified || false,
      requires_approval: log.requires_approval || false,
      approved_by: log.approved_by,
      success: log.success,
      error_message: log.error_message,
      execution_time_ms: log.execution_time_ms,
    });

    if (error) {
      console.error('[ADMIN_LOG] Failed to log action:', error);
    } else {
      console.log(`[ADMIN_LOG] ${log.action_type} by ${log.admin_uid} (${log.success ? 'SUCCESS' : 'FAILED'})`);
    }
  } catch (error) {
    console.error('[ADMIN_LOG] Error logging action:', error);
  }
}

/**
 * Categorize action for security level
 */
function categorizeAction(actionType: ActionType): ActionCategory {
  const viewActions: ActionType[] = ['view_user', 'search_user'];
  const criticalActions: ActionType[] = [
    'suspend_admin',
    'promote_to_admin',
    'demote_admin',
    'delete_room',
    'room_lock',
    'room_unlock',
    'ip_ban',
    'system_config_change',
    'emergency_control',
    'database_query',
  ];

  if (viewActions.includes(actionType)) return 'view';
  if (criticalActions.includes(actionType)) return 'critical';
  return 'moderate';
}

/**
 * Create Management alert
 */
export async function createManagementAlert(alert: {
  alert_type: 'admin_abuse' | 'security' | 'system' | 'performance';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  related_uid?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('management_alerts').insert({
      alert_type: alert.alert_type,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      related_uid: alert.related_uid,
      metadata: alert.metadata || {},
    });

    if (error) {
      console.error('[MANAGEMENT_ALERT] Failed to create alert:', error);
    } else {
      console.log(`[MANAGEMENT_ALERT] ${alert.severity.toUpperCase()}: ${alert.title}`);
    }
  } catch (error) {
    console.error('[MANAGEMENT_ALERT] Error creating alert:', error);
  }
}

/**
 * Get recent admin actions
 */
export async function getRecentAdminActions(
  adminUid: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_actions')
      .select('*')
      .eq('admin_uid', adminUid)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[ADMIN_LOG] Error fetching actions:', error);
    return [];
  }
}

/**
 * Get all admin actions (Management only)
 */
export async function getAllAdminActions(
  filters?: {
    actionType?: string;
    adminUid?: string;
    startDate?: string;
    endDate?: string;
  },
  limit: number = 100
): Promise<any[]> {
  try {
    let query = supabaseAdmin
      .from('admin_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filters?.actionType) {
      query = query.eq('action_type', filters.actionType);
    }

    if (filters?.adminUid) {
      query = query.eq('admin_uid', filters.adminUid);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[ADMIN_LOG] Error fetching all actions:', error);
    return [];
  }
}

/**
 * Detect admin abuse patterns
 */
export async function detectAdminAbuse(adminUid: string): Promise<void> {
  try {
    const recentActions = await getRecentAdminActions(adminUid, 20);

    // Pattern 1: Targeting specific user (3+ actions on same user in 5 min)
    const last5Min = recentActions.filter(
      (a) => new Date(a.created_at).getTime() > Date.now() - 5 * 60 * 1000
    );

    const targetCounts: Record<string, number> = {};
    last5Min.forEach((a) => {
      if (a.target_id) {
        targetCounts[a.target_id] = (targetCounts[a.target_id] || 0) + 1;
      }
    });

    for (const [targetId, count] of Object.entries(targetCounts)) {
      if (count >= 3) {
        await createManagementAlert({
          alert_type: 'admin_abuse',
          severity: 'warning',
          title: 'Admin Targeting Specific User',
          description: `Admin ${adminUid} performed ${count} actions on user ${targetId} in 5 minutes`,
          related_uid: adminUid,
          metadata: { target_uid: targetId, action_count: count },
        });
      }
    }

    // Pattern 2: Off-hours activity (2-6 AM)
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 6 && recentActions.length > 0) {
      await createManagementAlert({
        alert_type: 'security',
        severity: 'warning',
        title: 'Off-Hours Admin Activity',
        description: `Admin ${adminUid} active at ${hour}:00 (unusual hour)`,
        related_uid: adminUid,
        metadata: { hour, action_count: recentActions.length },
      });
    }
  } catch (error) {
    console.error('[ADMIN_ABUSE] Error detecting abuse:', error);
  }
}


