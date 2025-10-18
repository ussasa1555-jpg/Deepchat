import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserRole, isAdminSuspended } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/adminActionLogger';
import { getClientIp } from '@/lib/sessionSecurity';
import { withRateLimit } from '@/lib/rateLimitMiddleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function handler(request: Request) {
  const startTime = Date.now();

  try {
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

    const role = await getUserRole(user.id);
    if (role !== 'admin' && role !== 'management') {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }

    const suspended = await isAdminSuspended(user.id);
    if (suspended) {
      return NextResponse.json({ error: 'Admin privileges suspended' }, { status: 403 });
    }

    const body = await request.json();
    const { uid, ban_id } = body;

    if (!uid && !ban_id) {
      return NextResponse.json({ error: 'UID or ban_id required' }, { status: 400 });
    }

    // Get ban record
    let query = supabaseAdmin.from('user_bans').select('*').eq('is_active', true);
    if (ban_id) {
      query = query.eq('id', ban_id);
    } else {
      query = query.eq('uid', uid);
    }

    const { data: bans } = await query;

    if (!bans || bans.length === 0) {
      return NextResponse.json({ error: 'No active ban found' }, { status: 404 });
    }

    const ban = bans[0];

    // Admin can only unban their own bans
    if (role === 'admin' && ban.banned_by !== user.id) {
      await logAdminAction({
        admin_uid: user.id,
        admin_role: role,
        action_type: 'unban_user',
        target_type: 'user',
        target_id: uid,
        action_details: { ban_id: ban.id },
        ip_address: getClientIp(request),
        success: false,
        error_message: 'Can only unban own bans',
        execution_time_ms: Date.now() - startTime,
      });
      return NextResponse.json({ error: 'Admins can only unban their own bans' }, { status: 403 });
    }

    // Deactivate ban
    const { error: unbanError } = await supabaseAdmin
      .from('user_bans')
      .update({
        is_active: false,
        unbanned_by: user.id,
        unbanned_at: new Date().toISOString(),
      })
      .eq('id', ban.id);

    if (unbanError) {
      await logAdminAction({
        admin_uid: user.id,
        admin_role: role,
        action_type: 'unban_user',
        target_type: 'user',
        target_id: uid,
        action_details: { ban_id: ban.id },
        ip_address: getClientIp(request),
        success: false,
        error_message: unbanError.message,
        execution_time_ms: Date.now() - startTime,
      });
      return NextResponse.json({ error: unbanError.message }, { status: 500 });
    }

    // Log success
    await logAdminAction({
      admin_uid: user.id,
      admin_role: role,
      action_type: 'unban_user',
      action_category: 'moderate',
      target_type: 'user',
      target_id: uid,
      action_details: {
        ban_id: ban.id,
        original_reason: ban.reason,
        original_banned_by: ban.banned_by,
      },
      ip_address: getClientIp(request),
      user_agent: request.headers.get('user-agent') || undefined,
      success: true,
      execution_time_ms: Date.now() - startTime,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API] Unban user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withRateLimit(handler, 'admin_unban_user');




