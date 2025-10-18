'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { NeonButton } from '@/components/ui/NeonButton';
import { Toast } from '@/components/ui/Toast';
import Link from 'next/link';

interface Report {
  id: string;
  reporter_uid: string;
  reported_uid: string | null;
  room_id: string | null;
  message_id: string | null;
  dm_thread_id: string | null;
  report_type: string;
  description: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  reporter_nickname?: string;
  reported_nickname?: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');
  const [loading, setLoading] = useState(true);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadReports();
  }, [filter]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const loadReports = async () => {
    try {
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch nicknames for reporter and reported users
      if (data && data.length > 0) {
        const allUids = [
          ...data.map(r => r.reporter_uid),
          ...data.map(r => r.reported_uid).filter(Boolean),
        ].filter(Boolean);

        const uniqueUids = Array.from(new Set(allUids));

        const { data: usersData } = await supabase
          .from('users')
          .select('uid, nickname')
          .in('uid', uniqueUids);

        const uidToNickname = new Map(
          (usersData || []).map(u => [u.uid, u.nickname])
        );

        const reportsWithNicknames = data.map(report => ({
          ...report,
          reporter_nickname: uidToNickname.get(report.reporter_uid) || 'Unknown',
          reported_nickname: report.reported_uid ? uidToNickname.get(report.reported_uid) || 'Unknown' : null,
        }));

        setReports(reportsWithNicknames);
      } else {
        setReports([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('[ADMIN] Load reports error:', error);
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'spam':
        return 'bg-retro-amber/20 text-retro-amber border-retro-amber/50';
      case 'abuse':
      case 'harassment':
        return 'bg-red-500/20 text-red-500 border-red-500/50';
      case 'inappropriate':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      default:
        return 'bg-accent/20 text-accent border-accent/50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'spam':
        return '⚠️';
      case 'abuse':
      case 'harassment':
        return '🚫';
      case 'inappropriate':
        return '⛔';
      case 'technical':
        return '🔧';
      default:
        return '📝';
    }
  };

  const handleResolve = async (reportId: string) => {
    const note = resolutionNotes[reportId] || '';
    
    if (!note.trim() || note.length < 5) {
      showToast('⚠️ Resolution note must be at least 5 characters', 'warning');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('reports')
        .update({
          status: 'resolved',
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
          resolution_notes: note.trim(),
        })
        .eq('id', reportId);

      if (error) throw error;

      showToast('✅ Report resolved successfully', 'success');
      setResolutionNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[reportId];
        return newNotes;
      });
      setExpandedReport(null);
      loadReports();
    } catch (error) {
      console.error('[REPORTS] Resolve error:', error);
      showToast('❌ Failed to resolve report', 'error');
    }
  };

  const handleDismiss = async (reportId: string) => {
    const note = resolutionNotes[reportId] || '';
    
    if (!note.trim() || note.length < 5) {
      showToast('⚠️ Resolution note must be at least 5 characters', 'warning');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('reports')
        .update({
          status: 'dismissed',
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
          resolution_notes: note.trim(),
        })
        .eq('id', reportId);

      if (error) throw error;

      showToast('✅ Report dismissed', 'success');
      setResolutionNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[reportId];
        return newNotes;
      });
      setExpandedReport(null);
      loadReports();
    } catch (error) {
      console.error('[REPORTS] Dismiss error:', error);
      showToast('❌ Failed to dismiss report', 'error');
    }
  };

  return (
    <div className="min-h-screen p-4 login-page">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      <div className="login-form max-w-7xl mx-auto">
        <div className="terminal space-y-6">
          {/* Retro Header */}
          <div className="border-b-2 border-border pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl uppercase tracking-wider text-accent retro-title">
                  [USER_REPORTS]
                </h1>
                <p className="text-accent/70 text-sm mt-1">
                  &gt; Moderation queue
                </p>
              </div>
              <Link href="/admin">
                <NeonButton variant="secondary">[BACK]</NeonButton>
              </Link>
            </div>
          </div>

          {/* Stats Bar - Retro */}
          <div className="border-2 border-border bg-surface/20 p-3">
            <div className="flex items-center justify-between text-sm font-mono">
              <div className="flex items-center gap-4">
                <span className="text-retro-amber">
                  PENDING: {reports.filter(r => r.status === 'pending').length}
                </span>
                <span className="text-accent">
                  RESOLVED: {reports.filter(r => r.status === 'resolved').length}
                </span>
                <span className="text-retro-gray">
                  TOTAL: {reports.length}
                </span>
              </div>
            </div>
          </div>

          {/* Filters - Retro */}
          <div className="flex gap-2">
            {(['all', 'pending', 'resolved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`retro-button transition-all ${
                  filter === f 
                    ? 'bg-accent text-bg border-accent' 
                    : 'border-border hover:border-accent'
                }`}
              >
                [{f.toUpperCase()}]
              </button>
            ))}
          </div>

          {/* Reports List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 border-2 border-border bg-surface/20">
                <p className="text-accent font-mono">
                  [LOADING_REPORTS...]
                </p>
                <p className="text-accent/50 text-sm mt-2 font-mono">
                  &gt; Fetching data...
                </p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 border-2 border-border bg-surface/20">
                <p className="text-accent/50 font-mono text-lg">
                  [NO_REPORTS_FOUND]
                </p>
                <p className="text-accent/30 text-sm mt-2 font-mono">
                  {filter === 'pending' ? '&gt; All reports reviewed!' : '&gt; Try different filter'}
                </p>
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                  className={`bg-surface/20 border-2 cursor-pointer transition-all font-mono ${
                    expandedReport === report.id 
                      ? 'border-accent' 
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  {/* Main Row - Retro */}
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <span className={`transition-transform ${expandedReport === report.id ? 'rotate-90' : ''}`}>
                        &gt;
                      </span>
                      <span className={`uppercase px-2 ${getTypeColor(report.report_type)}`}>
                        [{report.report_type}]
                      </span>
                      <span
                        className={`uppercase px-2 ${
                          report.status === 'resolved'
                            ? 'text-green-500'
                            : report.status === 'dismissed'
                            ? 'text-gray-400'
                            : 'text-retro-amber'
                        }`}
                      >
                        [{report.status}]
                      </span>
                      <span className="text-accent/50 ml-auto">
                        {new Date(report.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-accent text-sm mb-2 line-clamp-2 pl-3">
                      &gt; {report.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs pl-3">
                      <span className="text-retro-gray">
                        FROM: <span className="text-accent">{report.reporter_nickname}</span>
                      </span>
                      {report.reported_uid && (
                        <span className="text-retro-gray">
                          TARGET: <span className="text-red-400">{report.reported_nickname}</span>
                        </span>
                      )}
                      {report.room_id && (
                        <span className="text-retro-gray">
                          ROOM: <span className="text-accent/70">{report.room_id.substring(0, 8)}...</span>
                        </span>
                      )}
                      {report.dm_thread_id && (
                        <span className="text-retro-gray">
                          DM: <span className="text-accent/70">{report.dm_thread_id.substring(0, 8)}...</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details - Retro */}
                  {expandedReport === report.id && (
                    <div className="border-t-2 border-accent/20 bg-surface/30 p-4">
                      <h3 className="text-accent uppercase text-sm font-bold mb-3 font-mono">
                        &gt;&gt; [REPORT_DETAILS]
                      </h3>

                      <div className="space-y-2 text-sm mb-4 font-mono">
                        <div className="border border-border/50 bg-bg/30 p-2">
                          <p className="text-retro-gray text-xs">REPORT_ID:</p>
                          <p className="text-accent text-xs break-all">{report.id}</p>
                        </div>

                        <div className="border border-border/50 bg-bg/30 p-2">
                          <p className="text-retro-gray text-xs">TIMESTAMP:</p>
                          <p className="text-accent text-xs">{new Date(report.created_at).toLocaleString()}</p>
                        </div>

                        <div className="border border-border/50 bg-bg/30 p-2">
                          <p className="text-retro-gray text-xs">REPORTER:</p>
                          <p className="text-accent">{report.reporter_nickname}</p>
                          <p className="text-accent/50 text-xs">{report.reporter_uid}</p>
                        </div>

                        {report.reported_uid && (
                          <div className="border border-border/50 bg-bg/30 p-2">
                            <p className="text-retro-gray text-xs">REPORTED_USER:</p>
                            <p className="text-red-400">{report.reported_nickname}</p>
                            <p className="text-accent/50 text-xs">{report.reported_uid}</p>
                          </div>
                        )}

                        {report.message_id && (
                          <div className="border border-border/50 bg-bg/30 p-2">
                            <p className="text-retro-gray text-xs">MESSAGE_ID:</p>
                            <p className="text-accent text-xs break-all">{report.message_id}</p>
                          </div>
                        )}
                      </div>

                      <div className="border-2 border-accent/30 bg-bg/30 p-3 mb-4">
                        <p className="text-accent/70 text-xs uppercase mb-2 font-mono">DESCRIPTION:</p>
                        <p className="text-accent text-sm font-mono">&gt; {report.description}</p>
                      </div>

                      {report.status === 'pending' && (
                        <>
                          {/* Resolution Note Input */}
                          <div className="mb-4">
                            <label className="block text-xs text-accent mb-2 uppercase font-mono">
                              Resolution Note (min 5 chars) <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={resolutionNotes[report.id] || ''}
                              onChange={(e) => {
                                setResolutionNotes(prev => ({
                                  ...prev,
                                  [report.id]: e.target.value
                                }));
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-bg border-2 border-border p-3 text-accent font-mono text-sm focus:border-accent focus:outline-none"
                              rows={3}
                              placeholder="Describe the action taken (e.g., 'User warned', 'Content removed', etc.)"
                            />
                            <p className="text-accent/50 text-xs mt-1 font-mono">
                              {(resolutionNotes[report.id] || '').length}/5 minimum
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolve(report.id);
                              }}
                              className="retro-button flex-1 border-accent text-accent hover:bg-accent hover:text-bg"
                              disabled={!(resolutionNotes[report.id]?.trim()) || (resolutionNotes[report.id]?.length || 0) < 5}
                            >
                              [RESOLVE]
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDismiss(report.id);
                              }}
                              className="retro-button flex-1 border-retro-gray text-retro-gray hover:bg-retro-gray hover:text-bg"
                              disabled={!(resolutionNotes[report.id]?.trim()) || (resolutionNotes[report.id]?.length || 0) < 5}
                            >
                              [DISMISS]
                            </button>
                          </div>
                        </>
                      )}

                      {/* Show resolution notes for resolved/dismissed reports */}
                      {(report.status === 'resolved' || report.status === 'dismissed') && report.resolution_notes && (
                        <div className="border-2 border-green-500/30 bg-green-500/5 p-3">
                          <p className="text-green-500/70 text-xs uppercase mb-2 font-mono">RESOLUTION_NOTES:</p>
                          <p className="text-green-400 text-sm font-mono">&gt; {report.resolution_notes}</p>
                          {report.reviewed_by && (
                            <p className="text-green-500/50 text-xs font-mono mt-2">
                              Reviewed by: {report.reviewed_by.substring(0, 12)}... at {report.reviewed_at ? new Date(report.reviewed_at).toLocaleString() : 'N/A'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


