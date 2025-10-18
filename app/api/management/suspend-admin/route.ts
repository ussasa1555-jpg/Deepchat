import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserRole, isManagement } from '@/lib/adminAuth';
import { logAdminAction, createManagementAlert } from '@/lib/adminActionLogger';
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

    // Only Management can suspend admins
    const isManagementRole = await isManagement(user.id);
    if (!isManagementRole) {
      return NextResponse.json({ error: 'Management role required' }, { status: 403 });
    }

    const body = await request.json();
    const { admin_uid, reason, duration_hours, password } = body;

    // Validate
    if (!admin_uid || !reason || !duration_hours || !password) {
      return NextResponse.json(
        { error: 'admin_uid, reason, duration_hours, and password required' },
        { status: 400 }
      );
    }

    if (reason.length < 20) {
      return NextResponse.json(
        { error: 'Reason must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Verify password
    const { error: pwError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    });

    if (pwError) {
      await logAdminAction({
        admin_uid: user.id,
        admin_role: 'management',
        action_type: 'suspend_admin',
        target_type: 'admin',
        target_id: admin_uid,
        action_details: { reason },
        ip_address: getClientIp(request),
        password_verified: false,
        success: false,
        error_message: 'Password verification failed',
        execution_time_ms: Date.now() - startTime,
      });
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Check target is actually admin
    const targetRole = await getUserRole(admin_uid);
    if (targetRole !== 'admin' && targetRole !== 'management') {
      return NextResponse.json({ error: 'Target user is not an admin' }, { status: 400 });
    }

    // Cannot suspend other management (only via DB)
    if (targetRole === 'management') {
      return NextResponse.json(
        { error: 'Cannot suspend management via application' },
        { status: 403 }
      );
    }

    // Create timeout
    const expiresAt = new Date(Date.now() + duration_hours * 60 * 60 * 1000);

    const { error: timeoutError } = await supabaseAdmin.from('admin_timeouts').insert({
      admin_uid,
      reason,
      timeout_type: 'manual',
      issued_by: user.id,
      duration_hours,
      expires_at: expiresAt.toISOString(),
      is_active: true,
    });

    if (timeoutError) {
      await logAdminAction({
        admin_uid: user.id,
        admin_role: 'management',
        action_type: 'suspend_admin',
        target_type: 'admin',
        target_id: admin_uid,
        action_details: { reason, duration_hours },
        ip_address: getClientIp(request),
        password_verified: true,
        success: false,
        error_message: timeoutError.message,
        execution_time_ms: Date.now() - startTime,
      });
      return NextResponse.json({ error: timeoutError.message }, { status: 500 });
    }

    // Create alert
    await createManagementAlert({
      alert_type: 'admin_abuse',
      severity: 'warning',
      title: 'Admin Suspended',
      description: `Admin ${admin_uid} suspended for ${duration_hours} hours by ${user.id}`,
      related_uid: admin_uid,
      metadata: { reason, duration_hours, suspended_by: user.id },
    });

    // Log success
    await logAdminAction({
      admin_uid: user.id,
      admin_role: 'management',
      action_type: 'suspend_admin',
      action_category: 'critical',
      target_type: 'admin',
      target_id: admin_uid,
      action_details: {
        reason,
        duration_hours,
        expires_at: expiresAt.toISOString(),
      },
      ip_address: getClientIp(request),
      user_agent: request.headers.get('user-agent') || undefined,
      password_verified: true,
      success: true,
      execution_time_ms: Date.now() - startTime,
    });

    return NextResponse.json({ success: true, expires_at: expiresAt });
  } catch (error: any) {
    console.error('[API] Suspend admin error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withRateLimit(handler, 'management_suspend_admin');




