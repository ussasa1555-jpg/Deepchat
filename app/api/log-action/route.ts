import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * API Route: Log User Actions
 * Captures IP, User Agent, and Device information
 * Used for audit logging and security tracking
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get request body
    const body = await req.json();
    const { uid, action, metadata = {} } = body;

    if (!uid || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: uid, action' },
        { status: 400 }
      );
    }

    // Extract IP address (handle various proxy headers)
    const ip_address = 
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') || // Cloudflare
      req.ip ||
      'unknown';

    // Extract User Agent
    const user_agent = req.headers.get('user-agent') || 'unknown';

    // Extract device info from User Agent
    const device = extractDevice(user_agent);

    // Enhanced metadata
    const enhancedMetadata = {
      ...metadata,
      device,
      user_agent, // Store full user agent in metadata for backup
      timestamp: new Date().toISOString(),
      referer: req.headers.get('referer') || undefined,
    };

    // Insert into audit_logs
    const { error } = await supabase.from('audit_logs').insert({
      uid,
      action,
      ip_address,
      user_agent,
      device_fingerprint: generateDeviceFingerprint(ip_address, user_agent),
      metadata: enhancedMetadata,
    });

    if (error) {
      console.error('[LOG-ACTION] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to log action' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LOG-ACTION] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Extract device type from User Agent
 */
function extractDevice(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('ipad')) return 'iPad';
    if (ua.includes('android')) return 'Android';
    return 'Mobile';
  }
  
  if (ua.includes('tablet')) return 'Tablet';
  
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('cros')) return 'ChromeOS';
  
  return 'Desktop';
}

/**
 * Generate a device fingerprint for tracking
 */
function generateDeviceFingerprint(ip: string, userAgent: string): string {
  // Simple fingerprint based on IP + User Agent hash
  const combined = `${ip}|${userAgent}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}




