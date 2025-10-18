'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { NeonButton } from '@/components/ui/NeonButton';
import { CLIInput } from '@/components/ui/CLIInput';
import { ExportButton } from '@/components/admin/ExportButton';
import Link from 'next/link';

interface AuditLog {
  id: string;
  uid?: string;
  admin_uid?: string;
  nickname?: string;
  action?: string;
  action_type?: string;
  admin_role?: string;
  action_category?: string;
  target_type?: string;
  target_id?: string;
  action_details?: any;
  ip_address: string | null;
  user_agent: string | null;
  metadata?: any;
  success?: boolean;
  created_at: string;
  source?: 'audit_logs' | 'admin_actions';
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [ipSearch, setIPSearch] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      // Load both audit_logs and admin_actions
      const [auditLogsResult, adminActionsResult] = await Promise.all([
        supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('admin_actions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500),
      ]);

      // Get all unique UIDs to fetch nicknames
      const allUids = [
        ...(auditLogsResult.data || []).map(log => log.uid),
        ...(adminActionsResult.data || []).map(log => log.admin_uid),
      ].filter(Boolean);

      const uniqueUids = Array.from(new Set(allUids));

      // Fetch nicknames for all UIDs
      const { data: usersData } = await supabase
        .from('users')
        .select('uid, nickname')
        .in('uid', uniqueUids);

      const uidToNickname = new Map(
        (usersData || []).map(u => [u.uid, u.nickname])
      );

      // Combine and format both sources
      const auditLogs = (auditLogsResult.data || []).map((log) => ({
        ...log,
        nickname: uidToNickname.get(log.uid) || 'Unknown',
        source: 'audit_logs' as const,
      }));

      const adminActions = (adminActionsResult.data || []).map((log) => ({
        ...log,
        uid: log.admin_uid,
        nickname: uidToNickname.get(log.admin_uid) || 'Unknown',
        action: log.action_type,
        source: 'admin_actions' as const,
      }));

      // Merge and sort by created_at
      const combined = [...auditLogs, ...adminActions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setLogs(combined);
      setLoading(false);
    } catch (error) {
      console.error('[ADMIN] Load audit logs error:', error);
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const action = log.action || log.action_type;
    if (actionFilter !== 'all' && action !== actionFilter) return false;
    if (userSearch && !log.uid?.toLowerCase().includes(userSearch.toLowerCase())) return false;
    if (ipSearch && !log.ip_address?.toLowerCase().includes(ipSearch.toLowerCase())) return false;
    return true;
  });

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action || l.action_type).filter(Boolean)));

  return (
    <div className="min-h-screen p-4 login-page">
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      <div className="login-form max-w-7xl mx-auto">
        <div className="terminal space-y-6">
          {/* Header */}
          <div className="border-b-2 border-border pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl uppercase tracking-wider text-accent retro-title">Audit Logs</h1>
              <p className="text-accent/70 text-sm mt-1">System activity audit trail (last 1000)</p>
            </div>
            <Link href="/admin">
              <NeonButton variant="secondary">← Back</NeonButton>
            </Link>
          </div>

          {/* Filter */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-bg border-2 border-border p-2 text-accent font-mono text-sm focus:border-accent focus:outline-none"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          {/* Logs Table */}
          <div className="bg-bg/50 border-2 border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
              <table className="w-full">
                <thead className="bg-accent/10 border-b-2 border-border sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-accent text-sm uppercase">Time</th>
                    <th className="text-left p-3 text-accent text-sm uppercase">User</th>
                    <th className="text-left p-3 text-accent text-sm uppercase">Action</th>
                    <th className="text-left p-3 text-accent text-sm uppercase">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center p-8 text-accent/50">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center p-8 text-accent/50">
                        No logs found
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <>
                        <tr 
                          key={log.id} 
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                          className={`border-b border-border/30 hover:bg-accent/5 cursor-pointer transition-colors ${
                            log.source === 'admin_actions' ? 'bg-retro-amber/5' : ''
                          } ${expandedLog === log.id ? 'bg-accent/10' : ''}`}
                        >
                          <td className="p-3 text-accent/70 text-sm font-mono">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs transition-transform ${expandedLog === log.id ? 'rotate-90' : ''}`}>
                                ▶
                              </span>
                              {new Date(log.created_at).toLocaleString()}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="text-accent font-semibold text-sm">
                                {log.nickname || 'Unknown'}
                              </span>
                              <span className="text-accent/50 font-mono text-xs">
                                {(log.uid || log.admin_uid || 'N/A').substring(0, 12)}...
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-sm font-mono">
                            <div className="flex items-center gap-2">
                              <span className={log.source === 'admin_actions' ? 'text-retro-amber' : 'text-accent'}>
                                {log.action || log.action_type}
                              </span>
                              {log.source === 'admin_actions' && (
                                <span className="text-xs px-1 py-0.5 bg-retro-amber/20 text-retro-amber rounded">
                                  {log.admin_role?.toUpperCase()}
                                </span>
                              )}
                              {log.success === false && (
                                <span className="text-xs px-1 py-0.5 bg-red-500/20 text-red-500 rounded">
                                  FAILED
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-accent/70 text-sm">{log.ip_address || 'N/A'}</td>
                        </tr>
                        
                        {/* Expanded Details Row */}
                        {expandedLog === log.id && (
                          <tr className="bg-bg/80 border-b-2 border-accent/20">
                            <td colSpan={4} className="p-6">
                              <div className="space-y-4">
                                {/* Header */}
                                <div className="border-b border-border pb-3">
                                  <h3 className="text-accent uppercase text-sm font-bold flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    LOG DETAILS
                                  </h3>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  {/* Who */}
                                  <div className="bg-bg/50 border border-border/50 rounded p-3">
                                    <p className="text-accent/70 text-xs uppercase mb-1">User</p>
                                    <p className="text-accent font-bold">{log.nickname || 'Unknown'}</p>
                                    <p className="text-accent/50 font-mono text-xs break-all mt-1">{log.uid || log.admin_uid || 'N/A'}</p>
                                  </div>

                                  {/* When */}
                                  <div className="bg-bg/50 border border-border/50 rounded p-3">
                                    <p className="text-accent/70 text-xs uppercase mb-1">Timestamp</p>
                                    <p className="text-accent font-mono">{new Date(log.created_at).toLocaleString()}</p>
                                  </div>

                                  {/* Action */}
                                  <div className="bg-bg/50 border border-border/50 rounded p-3">
                                    <p className="text-accent/70 text-xs uppercase mb-1">Action Type</p>
                                    <p className={`font-mono ${log.source === 'admin_actions' ? 'text-retro-amber' : 'text-accent'}`}>
                                      {log.action || log.action_type}
                                    </p>
                                    {log.action_category && (
                                      <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${
                                        log.action_category === 'critical' ? 'bg-red-500/20 text-red-500' :
                                        log.action_category === 'moderate' ? 'bg-retro-amber/20 text-retro-amber' :
                                        'bg-accent/20 text-accent'
                                      }`}>
                                        {log.action_category}
                                      </span>
                                    )}
                                  </div>

                                  {/* IP Address */}
                                  <div className="bg-bg/50 border border-border/50 rounded p-3">
                                    <p className="text-accent/70 text-xs uppercase mb-1">IP Address</p>
                                    <p className="text-accent font-mono">{log.ip_address || 'Unknown'}</p>
                                  </div>

                                  {/* User Agent */}
                                  <div className="col-span-2 bg-bg/50 border border-border/50 rounded p-3">
                                    <p className="text-accent/70 text-xs uppercase mb-1">User Agent</p>
                                    <p className="text-accent/80 font-mono text-xs break-all">
                                      {log.user_agent || 'Unknown'}
                                    </p>
                                  </div>

                                  {/* Role (Admin Actions Only) */}
                                  {log.admin_role && (
                                    <div className="bg-bg/50 border border-border/50 rounded p-3">
                                      <p className="text-accent/70 text-xs uppercase mb-1">Admin Role</p>
                                      <p className="text-retro-amber font-mono uppercase">{log.admin_role}</p>
                                    </div>
                                  )}

                                  {/* Target (Admin Actions Only) */}
                                  {log.target_type && (
                                    <div className="bg-bg/50 border border-border/50 rounded p-3">
                                      <p className="text-accent/70 text-xs uppercase mb-1">Target</p>
                                      <p className="text-accent font-mono">
                                        {log.target_type}: {log.target_id ? log.target_id.substring(0, 20) : 'N/A'}
                                      </p>
                                    </div>
                                  )}

                                  {/* Success Status */}
                                  {log.success !== undefined && (
                                    <div className="bg-bg/50 border border-border/50 rounded p-3">
                                      <p className="text-accent/70 text-xs uppercase mb-1">Status</p>
                                      <p className={`font-bold ${log.success ? 'text-green-500' : 'text-red-500'}`}>
                                        {log.success ? '✓ SUCCESS' : '✗ FAILED'}
                                      </p>
                                    </div>
                                  )}

                                  {/* Source */}
                                  <div className="bg-bg/50 border border-border/50 rounded p-3">
                                    <p className="text-accent/70 text-xs uppercase mb-1">Source Table</p>
                                    <p className={`font-mono text-xs ${log.source === 'admin_actions' ? 'text-retro-amber' : 'text-accent'}`}>
                                      {log.source || 'audit_logs'}
                                    </p>
                                  </div>
                                </div>

                                {/* Metadata/Details */}
                                {(log.metadata || log.action_details) && (
                                  <div className="bg-bg/50 border border-border/50 rounded p-3">
                                    <p className="text-accent/70 text-xs uppercase mb-2">Additional Details</p>
                                    <pre className="text-accent/80 font-mono text-xs overflow-x-auto custom-scrollbar bg-bg/80 p-3 rounded">
                                      {JSON.stringify(log.metadata || log.action_details, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {/* Close Button */}
                                <div className="flex justify-end pt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedLog(null);
                                    }}
                                    className="retro-button text-sm"
                                  >
                                    [Close Details]
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

