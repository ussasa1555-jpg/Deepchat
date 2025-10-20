/**
 * Admin Authentication and Authorization
 * Role-based access control for admin panel
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export type UserRole = 'user' | 'admin' | 'management';

/**
 * Get user role
 */
export async function getUserRole(uid: string): Promise<UserRole> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('uid', uid)
      .single();

    if (error) throw error;
    return (data?.role as UserRole) || 'user';
  } catch (error) {
    console.error('[ADMIN_AUTH] Error getting user role:', error);
    return 'user';
  }
}

/**
 * Check if user is admin or management
 */
export async function isAdmin(uid: string): Promise<boolean> {
  const role = await getUserRole(uid);
  return role === 'admin' || role === 'management';
}

/**
 * Check if user is management
 */
export async function isManagement(uid: string): Promise<boolean> {
  const role = await getUserRole(uid);
  return role === 'management';
}

/**
 * Check if admin is suspended
 */
export async function isAdminSuspended(uid: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.rpc('is_admin_suspended', {
      p_admin_uid: uid,
    });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('[ADMIN_AUTH] Error checking suspension:', error);
    return false;
  }
}

/**
 * Check if user has 2FA enabled
 */
export async function check2FAEnabled(uid: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('two_factor_enabled')
      .eq('uid', uid)
      .single();

    if (error) throw error;
    return data?.two_factor_enabled || false;
  } catch (error) {
    console.error('[ADMIN_AUTH] Error checking 2FA:', error);
    return false;
  }
}

/**
 * Require admin role
 * Throws error if not admin/management
 */
export async function requireAdmin(uid: string): Promise<void> {
  const role = await getUserRole(uid);
  
  if (role !== 'admin' && role !== 'management') {
    throw new Error('Admin or Management role required');
  }
  
  // Check if suspended
  const suspended = await isAdminSuspended(uid);
  if (suspended) {
    throw new Error('Admin privileges suspended');
  }
  
  // Check 2FA (required for all admins)
  const has2FA = await check2FAEnabled(uid);
  if (!has2FA) {
    throw new Error('2FA must be enabled for admin access');
  }
}

/**
 * Require management role
 * Throws error if not management
 */
export async function requireManagement(uid: string): Promise<void> {
  const role = await getUserRole(uid);
  
  if (role !== 'management') {
    throw new Error('Management role required');
  }
}

/**
 * Check IP whitelist (Management only)
 */
export async function checkIPWhitelist(
  managementUid: string,
  ipAddress: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ip_whitelist')
      .select('*')
      .eq('management_uid', managementUid)
      .eq('is_active', true)
      .or(`ip_address.eq.${ipAddress},ip_range.cs.{${ipAddress}}`); // CIDR match

    if (error) throw error;

    // Update last_used_at
    if (data && data.length > 0) {
      await supabaseAdmin
        .from('ip_whitelist')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', data[0].id);
      
      return true;
    }

    return false;
  } catch (error) {
    console.error('[ADMIN_AUTH] Error checking IP whitelist:', error);
    return false;
  }
}

/**
 * Check if IP is banned
 */
export async function checkIPBanned(ipAddress: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ip_bans')
      .select('*')
      .eq('is_active', true)
      .or(`ip_address.eq.${ipAddress},ip_range.cs.{${ipAddress}}`)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

    if (error) throw error;
    return (data && data.length > 0) || false;
  } catch (error) {
    console.error('[ADMIN_AUTH] Error checking IP ban:', error);
    return false;
  }
}






