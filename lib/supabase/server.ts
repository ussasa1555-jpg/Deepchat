import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Create Supabase client for use in Server Components
 */
export const createClient = () => {
  return createServerComponentClient<Database>({ cookies });
};

/**
 * Get session on server
 */
export async function getSession() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user on server
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}












