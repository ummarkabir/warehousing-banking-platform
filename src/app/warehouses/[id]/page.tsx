'use client';
export const runtime = 'edge';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter, useParams } from 'next/navigation';

export default function ManageWarehousePage() {
  const params = useParams();
  const warehouseId = params?.id as string;

  const [warehouse, setWarehouse] = useState<any>(null);
  const [commodities, setCommodities] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<'commodities' | 'inspections' | 'settings'>('commodities');

  const supabase = createClient();
  const router = useRouter();

  // Detect dark/light mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  // Fetch warehouse data, stored commodities, and inspection history
  const fetchWarehouseDetails = useCallback(async () => {
    if (!warehouseId) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // 1. Fetch Warehouse details
    const { data: whData, error: whError } = await supabase
      .from('warehouses')
      .select('*, users(name, email)')
      .eq('id', warehouseId)
      .single();

    if (whError || !whData) {
      alert('Warehouse node not found or unauthorized.');
      router.push('/dashboard');
      return;
    }

    setWarehouse(whData);

    // 2. Fetch all commodities stored in this specific facility
    const { data: commData } = await supabase
      .from('commodities')
      .select('*, users(name, email)')
      .eq('warehouse_id', warehouseId)
      .order('created_at', { ascending: false });

    if (commData) setCommodities(commData);

    // 3. Fetch inspection audit records for this facility
    const { data: inspData } = await supabase
      .from('inspections')
      .select('*, users(name, email)')
      .eq('warehouse_id', warehouseId)
      .order('created_at', { ascending: false });

    if (inspData) setInspections(inspData);

    setLoading(false);
  }, [warehouseId, supabase, router]);

  useEffect(() => {
    fetchWarehouseDetails();
  }, [fetchWarehouseDetails]);

  // Calculate total stored capacity in Metric Tons
  const totalStoredQuantity = commodities.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0);
  const warehouseCapacity = parseFloat(warehouse?.capacity) || 1;
  const utilizationPercentage = Math.min(100, Math.round((totalStoredQuantity / warehouseCapacity) * 100));

  // Toggle Warehouse Approval / Operational Status (Admin Only)
  const handleUpdateStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('warehouses')
      .update({ approval_status: newStatus })
      .eq('id', warehouseId);

    if (error) {
      alert('Failed to update status: ' + error.message);
    } else {
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'WAREHOUSE_STATUS_UPDATE',
        details: `Warehouse ID ${warehouseId} status set to ${newStatus}`
      });

      alert(`Warehouse operational status updated to ${newStatus.toUpperCase()}`);
      fetchWarehouseDetails();
    }
    setUpdatingStatus(false);
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isDarkMode ? 'bg-[#121212] text-blue-500' : 'bg-slate-100 text-blue-600'}`}>
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-3 text-xs font-semibold tracking-wider uppercase">Loading Warehouse Facility Operations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8 font-sans ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Top Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/40 pb-5">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black tracking-tight">{warehouse?.name || 'Warehouse Operations'}</h1>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                warehouse?.approval_status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                warehouse?.approval_status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {warehouse?.approval_status || 'Pending Verification'}
              </span>
            </div>
            <p className={`text-xs mt-1 flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>📍 {warehouse?.location}</span>
              <span>• Owner: {warehouse?.users?.name || warehouse?.users?.email || 'N/A'}</span>
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

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className={`p-5 rounded-3xl border shadow-xl ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Capacity</p>
            <p className="text-2xl font-extrabold mt-1 text-blue-500">{warehouseCapacity.toLocaleString()} <span className="text-xs font-normal text-slate-400">MT</span></p>
            <p className="text-[10px] text-slate-400 mt-1">Maximum storage rating</p>
          </div>

          <div className={`p-5 rounded-3xl border shadow-xl ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Current Occupancy</p>
            <p className="text-2xl font-extrabold mt-1 text-emerald-400">{totalStoredQuantity.toLocaleString()} <span className="text-xs font-normal text-slate-400">MT</span></p>
            <div className="w-full bg-slate-700/30 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${utilizationPercentage}%` }}></div>
            </div>
          </div>

          <div className={`p-5 rounded-3xl border shadow-xl ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Facility Utilization</p>
            <p className="text-2xl font-extrabold mt-1 text-purple-400">{utilizationPercentage}%</p>
            <p className="text-[10px] text-slate-400 mt-1">{commodities.length} Tokenized Receipts Stored</p>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className={`flex border-b text-xs font-bold space-x-6 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={() => setActiveTab('commodities')}
            className={`pb-3 transition-all ${activeTab === 'commodities' ? 'text-blue-500 border-b-2 border-blue-500' : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            📦 Stored Commodities ({commodities.length})
          </button>
          <button
            onClick={() => setActiveTab('inspections')}
            className={`pb-3 transition-all ${activeTab === 'inspections' ? 'text-blue-500 border-b-2 border-blue-500' : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            🔍 Inspection Logs ({inspections.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 transition-all ${activeTab === 'settings' ? 'text-blue-500 border-b-2 border-blue-500' : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            ⚙️ Node Operations
          </button>
        </div>

        {/* TAB 1: COMMODITIES TABLE */}
        {activeTab === 'commodities' && (
          <div className={`rounded-3xl border shadow-xl overflow-hidden ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`font-bold uppercase text-[10px] ${isDarkMode ? 'bg-[#222] text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                  <tr>
                    <th className="p-4">Token ID</th>
                    <th className="p-4">Commodity</th>
                    <th className="p-4">Quantity (MT)</th>
                    <th className="p-4">Depositor</th>
                    <th className="p-4">Valuation (NGN)</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800 text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
                  {commodities.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-400">No commodities deposited in this facility yet.</td></tr>
                  ) : (
                    commodities.map((item) => (
                      <tr key={item.id} className={`transition-colors ${isDarkMode ? 'hover:bg-[#222]' : 'hover:bg-slate-50'}`}>
                        <td className="p-4 font-mono font-bold">{item.id.slice(0, 8)}...</td>
                        <td className="p-4 font-bold text-sm">{item.commodity_name || item.name}</td>
                        <td className="p-4 font-mono font-bold">{item.quantity} MT</td>
                        <td className="p-4">{item.users?.name || item.users?.email || 'Customer'}</td>
                        <td className="p-4 font-black text-emerald-400">₦{(item.market_value || item.valuation || 0).toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            item.status === 'tokenized' ? 'bg-emerald-500/10 text-emerald-400' :
                            item.status === 'released' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {item.status || 'Stored'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: INSPECTION HISTORY */}
        {activeTab === 'inspections' && (
          <div className={`rounded-3xl border shadow-xl overflow-hidden ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`font-bold uppercase text-[10px] ${isDarkMode ? 'bg-[#222] text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                  <tr>
                    <th className="p-4">Inspector</th>
                    <th className="p-4">Notes / Remarks</th>
                    <th className="p-4">Recommendation</th>
                    <th className="p-4">Date Evaluated</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800 text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
                  {inspections.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-400">No QA inspection records found for this facility.</td></tr>
                  ) : (
                    inspections.map((ins) => (
                      <tr key={ins.id} className={`transition-colors ${isDarkMode ? 'hover:bg-[#222]' : 'hover:bg-slate-50'}`}>
                        <td className="p-4 font-bold">{ins.users?.name || ins.users?.email || 'Inspector'}</td>
                        <td className="p-4 text-slate-400 max-w-md">{ins.inspector_notes || 'No notes added.'}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
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
          </div>
        )}

        {/* TAB 3: NODE OPERATIONS & CONTROLS */}
        {activeTab === 'settings' && (
          <div className={`p-6 rounded-3xl border shadow-xl space-y-6 ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
            <div>
              <h3 className="text-base font-black">Facility Operational Controls</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage node status and trigger administrative compliance reviews.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-[#222] border-[#333]' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="text-xs font-bold text-slate-300">Set Node Operational Status</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus('approved')}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    Approve Facility
                  </button>
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus('pending')}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    Set Pending Review
                  </button>
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus('rejected')}
                    className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    Suspend Node
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-[#222] border-[#333]' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="text-xs font-bold text-slate-300">Dispatch QA Inspection Team</h4>
                <p className="text-[11px] text-slate-400">Request an on-site physical evaluation checklist for this warehouse.</p>
                <button
                  onClick={() => router.push(`/inspector/dashboard?warehouse_id=${warehouseId}`)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  🔍 Initiate QA Audit Report
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}