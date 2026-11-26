'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  const fetchSettlements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('settlements')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setSettlements(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettlements();
  }, [supabase]);

  // Secure Action Handler with Role Check & Audit Logging
  const handleAction = async (id: string, status: string, storageFeePaid: boolean = true) => {
    if (status === 'approved' && !storageFeePaid) {
      alert('Security Rejection: Cannot release commodity. Storage fee obligations have not been verified.');
      return;
    }

    setProcessingId(id);

    try {
      // 1. Double Check Admin / Superadmin Role for Security
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
        alert('Unauthorized Security Error: Only verified Platform Administrators can approve or reject settlements.');
        setProcessingId(null);
        return;
      }

      // 2. Update Settlement Status in Database
      const { error: updateError } = await supabase
        .from('settlements')
        .update({ status })
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // 3. Log Administrative Action to Audit Trail
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: `SETTLEMENT_${status.toUpperCase()}`,
        details: `Settlement ID ${id} was ${status} by ${profile.role}`,
        created_at: new Date()
      });

      alert(`Settlement request successfully ${status}!`);
      fetchSettlements();
    } catch (err: any) {
      alert('Error processing settlement action: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Settlements & Collateral Financing Approvals</h1>
            <p className="text-xs text-slate-500">Secure review, verification, and administrative approval for warehouse releases and financing.</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="rounded-xl bg-slate-200 text-slate-800 px-3.5 py-2 text-xs font-bold hover:bg-slate-300 transition-all"
          >
            &larr; Dashboard
          </button>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Reference ID</th>
                <th className="p-4">Customer / Owner</th>
                <th className="p-4">Amount / Valuation</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Secure Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading secure settlement records...</td></tr>
              ) : settlements.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No pending settlement or loan requests.</td></tr>
              ) : (
                settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">{s.id.slice(0, 8)}...</td>
                    <td className="p-4 font-bold text-slate-800">{s.customer_name || 'Verified Customer'}</td>
                    <td className="p-4 font-extrabold text-emerald-600">₦{(s.amount || 0).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        s.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        s.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {s.status || 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        disabled={processingId === s.id}
                        onClick={() => handleAction(s.id, 'approved', true)} 
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] shadow-xs disabled:opacity-50 transition-all"
                      >
                        {processingId === s.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button 
                        disabled={processingId === s.id}
                        onClick={() => handleAction(s.id, 'rejected', true)} 
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-[11px] shadow-xs disabled:opacity-50 transition-all"
                      >
                        {processingId === s.id ? 'Processing...' : 'Reject'}
                      </button>
                    </td>
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