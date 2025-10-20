import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserRole, isAdminSuspended } from '@/lib/adminAuth';
import { checkAdminQuota, incrementAdminQuota } from '@/lib/adminQuotas';
import { logAdminAction } from '@/lib/adminActionLogger';
import { getClientIp } from '@/lib/sessionSecurity';
import { withRateLimit } from '@/lib/rateLimitMiddleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function handler(request: Request) {
  const startTime = Date.now();

  try {
    // Get session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Check role
    const role = await getUserRole(user.id);
    if (role !== 'admin' && role !== 'management') {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }

    // Check if admin is suspended
    const suspended = await isAdminSuspended(user.id);
    if (suspended) {
      await logAdminAction({
        admin_uid: user.id,
        admin_role: role,
        action_type: 'ban_user',
        action_details: { reason: 'Attempted while suspended' },
        ip_address: getClientIp(request),
        success: false,
        error_message: 'Admin privileges suspended',
      });
      return NextResponse.json({ error: 'Admin privileges suspended' }, { status: 403 });
    }

    // Parse body
    const body = await request.json();
    const { uid, reason, duration_hours } = body;

    // Validate
    if (!uid || !reason) {
      return NextResponse.json({ error: 'UID and reason required' }, { status: 400 });
    }

    if (reason.length < 10) {
      return NextResponse.json({ error: 'Reason must be at least 10 characters' }, { status: 400 });
    }

    // Check quota (Admin only)
    if (role === 'admin') {
      const quotaCheck = await checkAdminQuota(user.id, 'ban');
      if (!quotaCheck.allowed) {
        await logAdminAction({
          admin_uid: user.id,
          admin_role: role,
          action_type: 'ban_user',
          target_type: 'user',
          target_id: uid,
          action_details: { reason, quota_exceeded: true },
          ip_address: getClientIp(request),
          success: false,
          error_message: quotaCheck.reason,
          execution_time_ms: Date.now() - startTime,
        });
        return NextResponse.json({ error: quotaCheck.reason }, { status: 429 });
      }
    }

    // Admin can't ban other admins/management
    const targetRole = await getUserRole(uid);
    if (targetRole !== 'user') {
      await logAdminAction({
        admin_uid: user.id,
        admin_role: role,
        action_type: 'ban_user',
        target_type: 'user',
        target_id: uid,
        action_details: { reason, target_role: targetRole },
        ip_address: getClientIp(request),
        success: false,
        error_message: 'Cannot ban admin or management users',
        execution_time_ms: Date.now() - startTime,
      });
      return NextResponse.json({ error: 'Cannot ban admin or management users' }, { status: 403 });
    }

    // Admin max 24h, Management unlimited
    const maxDuration = role === 'admin' ? 24 : duration_hours;
    const finalDuration = Math.min(duration_hours || 24, maxDuration);
    const expiresAt = finalDuration ? new Date(Date.now() + finalDuration * 60 * 60 * 1000) : null;

    // Execute ban
    const { data: ban, error: banError } = await supabaseAdmin
      .from('user_bans')
      .insert({
        uid,
        banned_by: user.id,
        reason,
        ban_type: 'manual',
        duration_minutes: finalDuration ? finalDuration * 60 : null,
        expires_at: expiresAt?.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (banError) {
      await logAdminAction({
        admin_uid: user.id,
        admin_role: role,
        action_type: 'ban_user',
        target_type: 'user',
        target_id: uid,
        action_details: { reason, duration_hours: finalDuration },
        ip_address: getClientIp(request),
        success: false,
        error_message: banError.message,
        execution_time_ms: Date.now() - startTime,
      });
      return NextResponse.json({ error: banError.message }, { status: 500 });
    }

    // Update quota (Admin only)
    if (role === 'admin') {
      await incrementAdminQuota(user.id, 'ban');
    }

    // Log successful action
    await logAdminAction({
      admin_uid: user.id,
      admin_role: role,
      action_type: 'ban_user',
      action_category: 'moderate',
      target_type: 'user',
      target_id: uid,
      action_details: {
        reason,
        duration_hours: finalDuration,
        expires_at: expiresAt?.toISOString(),
        ban_id: ban.id,
      },
      ip_address: getClientIp(request),
      user_agent: request.headers.get('user-agent') || undefined,
      success: true,
      execution_time_ms: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      ban_id: ban.id,
      expires_at: expiresAt,
    });
  } catch (error: any) {
    console.error('[API] Ban user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withRateLimit(handler, 'admin_ban_user');








