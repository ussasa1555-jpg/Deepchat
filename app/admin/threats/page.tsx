'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { NeonButton } from '@/components/ui/NeonButton';
import Link from 'next/link';

interface Threat {
  id: string;
  uid: string;
  threat_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ip_address: string | null;
  metadata: any;
  resolved: boolean;
  created_at: string;
}

export default function AdminThreatsPage() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [filter, setFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThreats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadThreats, 30000);
    return () => clearInterval(interval);
  }, [showResolved]);

  const loadThreats = async () => {
    try {
      let query = supabase
        .from('threat_detections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!showResolved) {
        query = query.eq('resolved', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setThreats(data || []);
      setLoading(false);
    } catch (error) {
      console.error('[ADMIN] Load threats error:', error);
      setLoading(false);
    }
  };

  const filteredThreats =
    filter === 'all' ? threats : threats.filter((t) => t.severity === filter);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-500/10 text-red-500';
      case 'high':
        return 'border-retro-amber bg-retro-amber/10 text-retro-amber';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/10 text-yellow-500';
      case 'low':
        return 'border-accent bg-accent/10 text-accent';
      default:
        return 'border-border bg-bg/10 text-accent';
    }
  };

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
              <h1 className="text-2xl uppercase tracking-wider text-accent retro-title">Threat Detections</h1>
              <p className="text-accent/70 text-sm mt-1">Security threats and anomalies</p>
            </div>
            <Link href="/admin">
              <NeonButton variant="secondary">← Back</NeonButton>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setFilter(sev)}
                className={`retro-button ${filter === sev ? 'bg-accent/20' : ''}`}
              >
                {sev.toUpperCase()}
              </button>
            ))}
            <button
              onClick={() => setShowResolved(!showResolved)}
              className={`retro-button ${showResolved ? 'bg-accent/20' : ''}`}
            >
              {showResolved ? 'Hide Resolved' : 'Show Resolved'}
            </button>
          </div>

          {/* Threats List */}
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-accent/50 py-8">Loading threats...</p>
            ) : filteredThreats.length === 0 ? (
              <p className="text-center text-accent/50 py-8">No threats found</p>
            ) : (
              filteredThreats.map((threat) => (
                <div
                  key={threat.id}
                  className={`border-2 rounded-lg p-4 ${getSeverityColor(threat.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs uppercase font-bold px-2 py-1 bg-current/20 rounded">
                          {threat.severity}
                        </span>
                        <span className="text-xs font-mono">{threat.threat_type}</span>
                      </div>
                      <p className="text-sm mb-2">{threat.description}</p>
                      <div className="text-xs opacity-70">
                        <p>User: {threat.uid}</p>
                        {threat.ip_address && <p>IP: {threat.ip_address}</p>}
                        <p>Time: {new Date(threat.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    {!threat.resolved && (
                      <button className="retro-button text-sm">
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}








