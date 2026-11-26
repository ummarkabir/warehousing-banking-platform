'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (data) setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">System Audit Logs & Security Trails</h1>
            <p className="text-xs text-slate-500">Monitor platform activity, administrative actions, and security audit trails in real-time.</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="rounded-xl bg-slate-200 text-slate-800 px-3.5 py-2 text-xs font-bold">&larr; Dashboard</button>
        </div>

        <div className="bg-white rounded-2xl border overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Admin / User ID</th>
                <th className="p-4">Action Performed</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-700">
              {logs.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">No recorded audit trails yet.</td></tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id}>
                    <td className="p-4 text-slate-500">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="p-4 font-mono font-bold">{l.user_id ? l.user_id.slice(0, 8) : 'System'}</td>
                    <td className="p-4 font-bold text-blue-600">{l.action}</td>
                    <td className="p-4 text-slate-600">{l.details || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}