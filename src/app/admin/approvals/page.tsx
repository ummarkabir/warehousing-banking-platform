'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<'warehouses' | 'inspections' | 'settlements'>('warehouses');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const supabase = createClient();
  const router = useRouter();

  // Detect user's preference for dark or light mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  // Fetch pending records across all approval streams
  const fetchApprovalData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // Verify Admin / Superadmin privilege
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      alert('Unauthorized access: Only administrators can view approvals.');
      router.push('/dashboard');
      return;
    }

    // 1. Pending Warehouse Registrations
    const { data: whData } = await supabase
      .from('warehouses')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false });
    if (whData) setWarehouses(whData);

    // 2. Inspection Checklist Submissions
    const { data: insData } = await supabase
      .from('inspections')
      .select('*, warehouses(name, location), users(name, email)')
      .order('created_at', { ascending: false });
    if (insData) setInspections(insData);

    // 3. Pending Release & Settlement Requests
    const { data: stData } = await supabase
      .from('settlements')
      .select('*')
      .order('created_at', { ascending: false });
    if (stData) setSettlements(stData);

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchApprovalData();
  }, [fetchApprovalData]);

  // Action Handler for Warehouse Approval/Rejection
  const handleWarehouseAction = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('warehouses')
      .update({ approval_status: status })
      .eq('id', id);

    if (error) {
      alert('Error updating warehouse status: ' + error.message);
    } else {
      // Audit Trail Logging
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: `WAREHOUSE_${status.toUpperCase()}`,
        details: `Warehouse ID ${id} was ${status} by Admin.`,
        created_at: new Date()
      });

      alert(`Warehouse facility registration ${status} successfully!`);
      fetchApprovalData();
    }
    setProcessingId(null);
  };

  // Action Handler for Settlement/Loan Approvals
  const handleSettlementAction = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('settlements')
      .update({ status })
      .eq('id', id);

    if (error) {
      alert('Error updating settlement status: ' + error.message);
    } else {
      // Audit Trail Logging
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: `SETTLEMENT_${status.toUpperCase()}`,
        details: `Settlement ID ${id} was ${status} by Admin.`,
        created_at: new Date()
      });

      alert(`Settlement request ${status} successfully!`);
      fetchApprovalData();
    }
    setProcessingId(null);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8 font-sans ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/40 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight">Admin Approval Control Center</h1>
              <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-500/20">
                Enterprise Standards
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Review and approve pending warehouse node registrations, QA inspection reports, and collateral release settlements.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${isDarkMode ? 'border-[#333] bg-[#222] text-amber-400 hover:bg-[#2a2a2a]' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
            >
              {isDarkMode ? '🌞 Light' : '🌙 Dark'}
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold border transition-all ${isDarkMode ? 'bg-[#222] border-[#333] text-slate-300 hover:bg-[#2a2a2a]' : 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300'}`}
            >
              &larr; Dashboard
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b text-xs font-bold space-x-6 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`pb-3 transition-all relative ${activeTab === 'warehouses' ? 'text-blue-500 border-b-2 border-blue-500' : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            🏢 Pending Warehouses ({warehouses.filter(w => w.approval_status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('inspections')}
            className={`pb-3 transition-all relative ${activeTab === 'inspections' ? 'text-blue-500 border-b-2 border-blue-500' : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            🔍 QA Inspector Reports ({inspections.length})
          </button>
          <button
            onClick={() => setActiveTab('settlements')}
            className={`pb-3 transition-all relative ${activeTab === 'settlements' ? 'text-blue-500 border-b-2 border-blue-500' : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            🏦 Settlements & Releases ({settlements.filter(s => s.status === 'pending').length})
          </button>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            <p className="mt-3 text-xs font-semibold text-slate-400">Loading pending approval queues...</p>
          </div>
        ) : (
          <div className={`rounded-3xl border shadow-xl overflow-hidden ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
            
            {/* TAB 1: WAREHOUSES */}
            {activeTab === 'warehouses' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`font-bold uppercase text-[10px] ${isDarkMode ? 'bg-[#222] text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                    <tr>
                      <th className="p-4">Facility Name</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Capacity (MT)</th>
                      <th className="p-4">Owner</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800 text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
                    {warehouses.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-slate-400">No warehouse approval requests found.</td></tr>
                    ) : (
                      warehouses.map((wh) => (
                        <tr key={wh.id} className={`transition-colors ${isDarkMode ? 'hover:bg-[#222]' : 'hover:bg-slate-50'}`}>
                          <td className="p-4 font-bold text-sm">{wh.name}</td>
                          <td className="p-4">{wh.location}</td>
                          <td className="p-4 font-mono font-bold">{wh.capacity} MT</td>
                          <td className="p-4">{wh.users?.name || wh.users?.email || 'N/A'}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              wh.approval_status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              wh.approval_status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {wh.approval_status || 'Pending'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {wh.approval_status === 'pending' && (
                              <>
                                <button
                                  disabled={processingId === wh.id}
                                  onClick={() => handleWarehouseAction(wh.id, 'approved')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] shadow-sm disabled:opacity-50 transition-all"
                                >
                                  Approve Node
                                </button>
                                <button
                                  disabled={processingId === wh.id}
                                  onClick={() => handleWarehouseAction(wh.id, 'rejected')}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-[11px] shadow-sm disabled:opacity-50 transition-all"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: INSPECTIONS */}
            {activeTab === 'inspections' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`font-bold uppercase text-[10px] ${isDarkMode ? 'bg-[#222] text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                    <tr>
                      <th className="p-4">Facility</th>
                      <th className="p-4">Inspector</th>
                      <th className="p-4">Notes</th>
                      <th className="p-4">Recommendation</th>
                      <th className="p-4">Submitted Date</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800 text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
                    {inspections.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-400">No inspector checklists submitted yet.</td></tr>
                    ) : (
                      inspections.map((ins) => (
                        <tr key={ins.id} className={`transition-colors ${isDarkMode ? 'hover:bg-[#222]' : 'hover:bg-slate-50'}`}>
                          <td className="p-4 font-bold">{ins.warehouses?.name || 'Warehouse Node'}</td>
                          <td className="p-4">{ins.users?.name || ins.users?.email || 'Inspector'}</td>
                          <td className="p-4 text-slate-400 truncate max-w-xs">{ins.inspector_notes || 'No remarks provided.'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              ins.recommendation === 'approve' ? 'bg-emerald-500/10 text-emerald-400' :
                              ins.recommendation === 'reject' ? 'bg-red-500/10 text-red-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>
                              {ins.recommendation || 'Needs Review'}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">{new Date(ins.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: SETTLEMENTS */}
            {activeTab === 'settlements' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`font-bold uppercase text-[10px] ${isDarkMode ? 'bg-[#222] text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                    <tr>
                      <th className="p-4">Ref ID</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Obligation Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800 text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
                    {settlements.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-400">No release or settlement requests pending.</td></tr>
                    ) : (
                      settlements.map((st) => (
                        <tr key={st.id} className={`transition-colors ${isDarkMode ? 'hover:bg-[#222]' : 'hover:bg-slate-50'}`}>
                          <td className="p-4 font-mono font-bold">{st.id.slice(0, 8)}...</td>
                          <td className="p-4 font-bold">{st.customer_name || 'Customer'}</td>
                          <td className="p-4 font-black text-emerald-400">₦{(st.amount || 0).toLocaleString()}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              st.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                              st.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>
                              {st.status || 'Pending'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {st.status === 'pending' && (
                              <>
                                <button
                                  disabled={processingId === st.id}
                                  onClick={() => handleSettlementAction(st.id, 'approved')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] shadow-sm disabled:opacity-50 transition-all"
                                >
                                  Approve
                                </button>
                                <button
                                  disabled={processingId === st.id}
                                  onClick={() => handleSettlementAction(st.id, 'rejected')}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-[11px] shadow-sm disabled:opacity-50 transition-all"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}