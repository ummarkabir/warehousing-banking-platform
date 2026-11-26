'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LinkWarehouseBankingPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [ltvPercentage, setLtvPercentage] = useState('75'); // Default 75% LTV Cap

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  // Fetch approved warehouses and user wallets
  const fetchLinkageData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // 1. Fetch User's Approved Warehouses
    const { data: whData } = await supabase
      .from('warehouses')
      .select('*')
      .eq('owner_id', user.id)
      .eq('approval_status', 'approved');

    if (whData) setWarehouses(whData);

    // 2. Fetch User's Active Virtual Wallets
    const { data: walletData } = await supabase
      .from('wallets')
      .select('*')
      .eq('customer_id', user.id);

    if (walletData) setWallets(walletData);

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchLinkageData();
  }, [fetchLinkageData]);

  // Handle Linkage Submission
  const handleLinkageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWarehouseId || !selectedWalletId) {
      alert('Please select both a warehouse facility and a settlement wallet account.');
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      // 1. Update warehouse node with linked wallet reference
      const { error: updateError } = await supabase
        .from('warehouses')
        .update({
          linked_wallet_id: selectedWalletId,
          max_ltv_percent: parseFloat(ltvPercentage) || 75.0,
          updated_at: new Date()
        })
        .eq('id', selectedWarehouseId);

      if (updateError) throw updateError;

      // 2. Log System Security Audit Trail
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'WAREHOUSE_BANKING_LINKED',
        details: `Linked Warehouse ID ${selectedWarehouseId} to Wallet ID ${selectedWalletId} with ${ltvPercentage}% LTV limit.`
      });

      alert('Warehouse node successfully linked to financial settlement wallet!');
      router.push('/banking/wallet');
    } catch (err: any) {
      alert('Linkage Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isDarkMode ? 'bg-[#121212] text-blue-500' : 'bg-slate-100 text-blue-600'}`}>
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-3 text-xs font-semibold tracking-wider uppercase">Loading Banking Linkage Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8 font-sans ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/40 pb-5">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black tracking-tight">Warehouse Banking Linkage</h1>
              <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-500/20">
                Fintech Settlement Node
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Connect physical warehouse facilities to virtual bank accounts for automated collateral loan settlements.
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
              onClick={() => router.push('/banking/wallet')}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold border transition-all ${isDarkMode ? 'bg-[#222] border-[#333] text-slate-300 hover:bg-[#2a2a2a]' : 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300'}`}
            >
              &larr; Wallet
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
          <form onSubmit={handleLinkageSubmit} className="space-y-6">

            {/* SECTION 1: WAREHOUSE SELECTION */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 mb-4">1. Select Approved Warehouse Node</h3>
              <select
                required
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className={`w-full rounded-xl border p-3.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              >
                <option value="">-- Choose Warehouse Facility --</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.location}) — Capacity: {wh.capacity} MT
                  </option>
                ))}
              </select>
            </div>

            {/* SECTION 2: BANKING WALLET SELECTION */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 mb-4">2. Select Settlement Wallet Account</h3>
              <select
                required
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className={`w-full rounded-xl border p-3.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              >
                <option value="">-- Choose Settlement Wallet --</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    Acc No: {w.account_number} (Balance: ₦{(w.balance || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* SECTION 3: COLLATERAL LOAN THRESHOLD (LTV) */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 mb-4">3. Set Maximum Loan-To-Value (LTV) Ratio</h3>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400">Allowed LTV Percentage (%)</label>
                <input
                  type="number"
                  min="10"
                  max="90"
                  required
                  value={ltvPercentage}
                  onChange={(e) => setLtvPercentage(e.target.value)}
                  className={`w-full rounded-xl border p-3.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
                <p className="text-[11px] text-slate-500">
                  Defines the maximum collateral financing limit against stored token values in this facility (e.g., 75% of commodity valuation).
                </p>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider uppercase shadow-xl transition-all disabled:opacity-50"
              >
                {submitting ? 'Linking Node to Financial Engine...' : 'Authorize Banking Linkage'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}