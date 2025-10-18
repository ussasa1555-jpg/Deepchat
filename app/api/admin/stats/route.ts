import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserRole } from '@/lib/adminAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
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

    // Get system stats
    const { data: stats, error: statsError } = await supabaseAdmin.rpc('get_admin_stats');

    if (statsError) throw statsError;

    // Get additional stats
    const [
      { count: totalUsers },
      { count: totalRooms },
      { count: totalMessages },
      { count: activeThreats },
      { count: pendingReports },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('rooms').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('threat_detections')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', false),
      supabaseAdmin
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);

    return NextResponse.json({
      ...stats[0],
      total_users: totalUsers,
      total_rooms: totalRooms,
      total_messages: totalMessages,
      active_threats: activeThreats,
      pending_reports: pendingReports,
    });
  } catch (error: any) {
    console.error('[API] Get stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}




