'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { NeonButton } from './NeonButton';
import { Toast } from './Toast';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUid?: string;
  reportedNickname?: string;
  roomId?: string | null;
  messageId?: string | null;
  dmThreadId?: string | null;
}

export function ReportModal({
  isOpen,
  onClose,
  reportedUid,
  reportedNickname,
  roomId,
  messageId,
  dmThreadId,
}: ReportModalProps) {
  const [reportType, setReportType] = useState('spam');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || description.length < 10) {
      showToast('⚠️ Description must be at least 10 characters', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('❌ Please login to submit reports', 'error');
        setSubmitting(false);
        return;
      }

      const reportData: any = {
        reporter_uid: session.user.id,
        report_type: reportType,
        description: description.trim(),
        status: 'pending',
      };

      // Add optional fields only if they exist
      if (reportedUid) reportData.reported_uid = reportedUid;
      if (roomId) reportData.room_id = roomId;
      if (messageId) reportData.message_id = messageId;
      if (dmThreadId) reportData.dm_thread_id = dmThreadId;

      console.log('[REPORT] Submitting:', reportData);

      const { error, data } = await supabase.from('reports').insert(reportData).select();

      if (error) {
        console.error('[REPORT] Database error:', error);
        showToast(`❌ Failed to submit: ${error.message}`, 'error');
        setSubmitting(false);
        return;
      }

      console.log('[REPORT] Success:', data);
      showToast('✅ Report submitted! Admins will review within 24h', 'success');
      
      // Wait for toast to be visible
      setTimeout(() => {
        setDescription('');
        setReportType('spam');
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('[REPORT] Submit error:', error);
      showToast(`❌ Error: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[10000] space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="terminal max-w-lg w-full">
        {/* Header */}
        <div className="border-b-2 border-border pb-4 mb-4">
          <h2 className="text-xl text-accent uppercase tracking-wider font-mono">
            [REPORT_{reportedNickname?.toUpperCase() || 'CONTENT'}]
          </h2>
          <p className="text-accent/70 text-sm font-mono mt-1">
            &gt; Submit moderation report
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm text-accent mb-2 uppercase tracking-wider">
              Report Type <span className="text-red-500">*</span>
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-bg border-2 border-border p-3 text-accent font-mono text-sm focus:border-accent focus:outline-none"
              required
            >
              <option value="spam">SPAM / FLOODING</option>
              <option value="abuse">ABUSE / BULLYING</option>
              <option value="harassment">HARASSMENT</option>
              <option value="inappropriate">INAPPROPRIATE CONTENT</option>
              <option value="technical">TECHNICAL ISSUE</option>
              <option value="other">OTHER</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-accent mb-2 uppercase tracking-wider">
              Description (min 10 chars) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-bg border-2 border-border p-3 text-accent font-mono text-sm focus:border-accent focus:outline-none"
              rows={4}
              placeholder="Please describe the issue in detail..."
              required
              minLength={10}
            />
            <p className="text-accent/50 text-xs mt-1">
              Characters: {description.length}/10 minimum
            </p>
          </div>

          {/* Info Box */}
          <div className="border-2 border-retro-amber/50 bg-retro-amber/5 p-3">
            <p className="text-retro-amber text-xs font-mono">
              [WARNING] False reports may result in account suspension.
              Reports are reviewed by admins within 24 hours.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="retro-button flex-1"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="retro-button flex-1 bg-retro-amber hover:bg-retro-amber/80"
              disabled={submitting || description.length < 10}
            >
              {submitting ? '[SUBMITTING...]' : '[SUBMIT_REPORT]'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}

