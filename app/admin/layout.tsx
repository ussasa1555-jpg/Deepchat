'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login?redirect=/admin');
        return;
      }

      // Check role
      const { data: userData } = await supabase
        .from('users')
        .select('role, two_factor_enabled')
        .eq('uid', session.user.id)
        .single();

      if (!userData || (userData.role !== 'admin' && userData.role !== 'management')) {
        router.push('/dashboard?error=admin_access_denied');
        return;
      }

      // Require 2FA for admin access
      if (!userData.two_factor_enabled) {
        router.push('/settings?error=2fa_required_for_admin');
        return;
      }

      // Check if admin is suspended
      const { data: suspended } = await supabase.rpc('is_admin_suspended', {
        p_admin_uid: session.user.id,
      });

      if (suspended) {
        router.push('/dashboard?error=admin_suspended');
        return;
      }

      setAuthorized(true);
      setLoading(false);
    } catch (error) {
      console.error('[ADMIN] Access check error:', error);
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center login-page">
        <div className="particles-container">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="particle"></div>
          ))}
        </div>
        <div className="login-form">
          <div className="terminal max-w-md w-full">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin h-5 w-5 border-2 border-accent border-t-transparent rounded-full"></div>
              <p className="text-accent animate-pulse">Verifying admin access...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}




