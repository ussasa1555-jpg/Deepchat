import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isManagement } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/adminActionLogger';
import { getClientIp } from '@/lib/sessionSecurity';
import { withRateLimit } from '@/lib/rateLimitMiddleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function handler(request: Request) {
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

    // Only Management
    const isManagementRole = await isManagement(user.id);
    if (!isManagementRole) {
      await logAdminAction({
        admin_uid: user.id,
        admin_role: 'admin',
        action_type: 'view_room_key',
        target_type: 'room',
        action_details: { unauthorized: true },
        ip_address: getClientIp(request),
        success: false,
        error_message: 'Management role required',
      });
      return NextResponse.json({ error: 'Management role required' }, { status: 403 });
    }

    const body = await request.json();
    const { room_id } = body;

    if (!room_id) {
      return NextResponse.json({ error: 'room_id required' }, { status: 400 });
    }

    // Use database function (includes logging)
    const { data, error } = await supabaseAdmin.rpc('get_room_key_safe', {
      p_room_id: room_id,
      p_viewer_uid: user.id,
    });

    if (error) throw error;

    return NextResponse.json({ key: data || '[KEY_NOT_FOUND]' });
  } catch (error: any) {
    console.error('[API] Get room key error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withRateLimit(handler, 'management_system_config');








