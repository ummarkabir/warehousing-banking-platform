'use client';
export const runtime = 'edge';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter, useParams } from 'next/navigation';

export default function CommodityEgressPage() {
  const params = useParams();
  const warehouseId = params?.id as string;

  const [warehouse, setWarehouse] = useState<any>(null);
  const [commodities, setCommodities] = useState<any[]>([]);
  const [selectedCommodityId, setSelectedCommodityId] = useState('');
  const [revenueSettings, setRevenueSettings] = useState<any>(null);
  
  // Egress Form States
  const [truckNumber, setTruckNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [egressNotes, setEgressNotes] = useState('');
  const [storageFeePaid, setStorageFeePaid] = useState(false);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const supabase = createClient();
  const router = useRouter();

  // Detect dark/light mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  // Fetch warehouse data, stored tokenized commodities, and storage billing settings
  const fetchEgressPrerequisites = useCallback(async () => {
    if (!warehouseId) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // 1. Fetch Warehouse Details
    const { data: whData, error: whError } = await supabase
      .from('warehouses')
      .select('*, users(name, email)')
      .eq('id', warehouseId)
      .single();

    if (whError || !whData) {
      alert('Warehouse node not found or unauthorized access.');
      router.push('/dashboard');
      return;
    }
    setWarehouse(whData);

    // 2. Fetch Active Tokenized Commodities in this warehouse
    const { data: commData } = await supabase
      .from('commodities')
      .select('*, users(name, email)')
      .eq('warehouse_id', warehouseId)
      .eq('status', 'tokenized')
      .order('created_at', { ascending: false });

    if (commData) setCommodities(commData);

    // 3. Fetch Global Revenue & Storage Billing Rules
    const { data: revData } = await supabase
      .from('revenue_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (revData) setRevenueSettings(revData);

    setLoading(false);
  }, [warehouseId, supabase, router]);

  useEffect(() => {
    fetchEgressPrerequisites();
  }, [fetchEgressPrerequisites]);

  // Selected Commodity Details
  const selectedCommodity = commodities.find((c) => c.id === selectedCommodityId);

  // Compute Storage Fee Calculation (Days Stored * Quantity * Daily Rate)
  const dailyRate = revenueSettings?.daily_rate_per_unit || 50; // N50/MT/Day fallback
  const depositDate = selectedCommodity?.created_at ? new Date(selectedCommodity.created_at) : new Date();
  const diffTime = Math.abs(new Date().getTime() - depositDate.getTime());
  const daysStored = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const commodityQuantity = parseFloat(selectedCommodity?.quantity) || 0;
  const computedStorageFee = daysStored * commodityQuantity * dailyRate;

  // Process Outbound Egress Submission
  const handleEgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommodityId) {
      alert('Please select a tokenized commodity receipt for egress.');
      return;
    }
    if (!storageFeePaid) {
      alert('Security Rejection: Storage fee obligations must be verified and cleared before commodity release.');
      return;
    }

    setProcessing(true);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      // 1. Verify if commodity is locked under an active collateral loan
      const { data: loanData } = await supabase
        .from('loans')
        .select('*')
        .eq('commodity_id', selectedCommodityId)
        .eq('repayment_status', 'active')
        .maybeSingle();

      if (loanData) {
        alert('Security Rejection: This commodity receipt is currently locked as collateral for an active bank loan. Repay the loan before egress.');
        setProcessing(false);
        return;
      }

      // 2. Update Commodity Status to 'released'
      const { error: commError } = await supabase
        .from('commodities')
        .update({ status: 'released' })
        .eq('id', selectedCommodityId);

      if (commError) throw commError;

      // 3. Record Egress Audit Log
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'COMMODITY_EGRESS_SUCCESS',
        details: `Egress executed: Released ${commodityQuantity} MT of ${selectedCommodity?.commodity_name}. Truck: ${truckNumber || 'N/A'}. Storage Fee Cleared: ₦${computedStorageFee.toLocaleString()}`
      });

      alert(`Commodity Egress Successful! Receipt successfully released and archived.`);
      router.push(`/warehouses/${warehouseId}/manage`);
    } catch (err: any) {
      alert('Error processing commodity egress: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isDarkMode ? 'bg-[#121212] text-amber-400' : 'bg-slate-100 text-amber-600'}`}>
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-3 text-xs font-semibold tracking-wider uppercase">Loading Warehouse Egress Terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8 font-sans ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/40 pb-5">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black tracking-tight">Outbound Commodity Egress & Release</h1>
              <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Secure Withdrawal
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Facility Node: <strong className="text-white">{warehouse?.name}</strong> ({warehouse?.location})
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
              onClick={() => router.push(`/warehouses/${warehouseId}/manage`)}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold border transition-all ${isDarkMode ? 'bg-[#222] border-[#333] text-slate-300 hover:bg-[#2a2a2a]' : 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300'}`}
            >
              &larr; Warehouse Operations
            </button>
          </div>
        </div>

        {/* Main Egress Form Container */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
          <form onSubmit={handleEgressSubmit} className="space-y-6">

            {/* SECTION 1: SELECT TOKENIZED COMMODITY RECEIPT */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 mb-4">1. Select Tokenized Receipt for Release</h3>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Active Stored Receipt *</label>
                <select
                  required
                  value={selectedCommodityId}
                  onChange={(e) => setSelectedCommodityId(e.target.value)}
                  className={`w-full rounded-xl border p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                >
                  <option value="">-- Choose Stored Commodity Receipt --</option>
                  {commodities.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.commodity_name} ({item.quantity} MT) — Depositor: {item.users?.name || 'Customer'} [ID: {item.id.slice(0, 8)}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SECTION 2: STORAGE FEE & BILLING SUMMARY */}
            {selectedCommodity && (
              <div className={`p-5 rounded-2xl border space-y-4 ${isDarkMode ? 'bg-[#222] border-[#333]' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">2. Storage Fee & Compliance Summary</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Quantity:</span>
                    <span className="font-mono font-bold text-sm">{selectedCommodity.quantity} MT</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Days Stored:</span>
                    <span className="font-mono font-bold text-sm">{daysStored} Days</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Daily Rate:</span>
                    <span className="font-mono font-bold text-sm">₦{dailyRate}/MT</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Total Storage Fee:</span>
                    <span className="font-black text-amber-400 text-sm">₦{computedStorageFee.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/50 flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="feePaid"
                    checked={storageFeePaid}
                    onChange={(e) => setStorageFeePaid(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 text-amber-600 focus:ring-amber-500 bg-slate-900"
                  />
                  <label htmlFor="feePaid" className="text-xs font-bold cursor-pointer">
                    I confirm that storage billing (₦{computedStorageFee.toLocaleString()}) has been fully paid and cleared.
                  </label>
                </div>
              </div>
            )}

            {/* SECTION 3: TRANSPORT & WAYBILL LOGISTICS */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 mb-4">3. Outbound Transport & Waybill Logistics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Truck Number / License Plate</label>
                  <input
                    type="text"
                    placeholder="e.g. KMC-442-XA"
                    value={truckNumber}
                    onChange={(e) => setTruckNumber(e.target.value)}
                    className={`w-full rounded-xl border p-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Driver Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ibrahim Sani"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className={`w-full rounded-xl border p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>

              </div>

              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-400 mb-1">Egress Remarks & Exit Inspection Notes</label>
                <textarea
                  rows={3}
                  placeholder="Enter exit verification notes..."
                  value={egressNotes}
                  onChange={(e) => setEgressNotes(e.target.value)}
                  className={`w-full rounded-xl border p-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                ></textarea>
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={processing || !storageFeePaid}
                className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs tracking-wider uppercase shadow-xl transition-all disabled:opacity-50"
              >
                {processing ? 'Processing Secure Egress...' : 'Authorize Commodity Release & Burn Token'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}