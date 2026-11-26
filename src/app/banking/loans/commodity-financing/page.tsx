'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function CommodityFinancingPage() {
  const [profile, setProfile] = useState<any>(null);
  const [eligibleCommodities, setEligibleCommodities] = useState<any[]>([]);
  const [selectedCommodityId, setSelectedCommodityId] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [wallet, setWallet] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const supabase = createClient();
  const router = useRouter();

  // Detect dark or light theme preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  // Fetch user profile, eligible collateral commodities, and settlement wallet account
  const fetchFinancingPrerequisites = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // 1. Fetch User Profile & Check KYC Status
    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      if (profileData.kyc_status !== 'verified') {
        alert('KYC Verification Required: You must complete identity verification (NIN/BVN) before requesting collateral loans.');
        router.push('/kyc');
        return;
      }
    }

    // 2. Fetch User's Active Tokenized Commodities (excluding already encumbered or released items)
    const { data: commData } = await supabase
      .from('commodities')
      .select('*, warehouses(name, location)')
      .eq('customer_id', user.id)
      .eq('status', 'tokenized');

    if (commData) setEligibleCommodities(commData);

    // 3. Fetch User's Active Virtual Wallet for Loan Disbursement
    const { data: walletData } = await supabase
      .from('wallets')
      .select('*')
      .eq('customer_id', user.id)
      .single();

    if (walletData) {
      setWallet(walletData);
    } else {
      // Auto-initialize virtual wallet if missing
      const { data: newWallet } = await supabase
        .from('wallets')
        .insert({
          customer_id: user.id,
          account_number: `400${Math.floor(1000000 + Math.random() * 9000000)}`,
          balance: 0.00,
          currency: 'NGN'
        })
        .select()
        .single();
      if (newWallet) setWallet(newWallet);
    }

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchFinancingPrerequisites();
  }, [fetchFinancingPrerequisites]);

  // Collateral & Loan-to-Value (LTV) Calculation Engine
  const selectedCommodity = eligibleCommodities.find((c) => c.id === selectedCommodityId);
  const collateralValuation = selectedCommodity ? parseFloat(selectedCommodity.market_value || selectedCommodity.token_amount || 0) : 0;
  const maxLtvPercentage = 75; // 75% LTV Cap
  const maxEligibleLoanAmount = (collateralValuation * maxLtvPercentage) / 100;

  // Handle Collateral Financing Application
  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommodityId) {
      alert('Please select an active tokenized commodity receipt as collateral.');
      return;
    }

    const loanValue = parseFloat(requestedAmount);
    if (!loanValue || loanValue <= 0) {
      alert('Please enter a valid loan request amount.');
      return;
    }

    if (loanValue > maxEligibleLoanAmount) {
      alert(`Loan Threshold Exceeded: Maximum financing for this collateral is ₦${maxEligibleLoanAmount.toLocaleString()} (${maxLtvPercentage}% LTV).`);
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      // 1. Create Active Loan Contract Record
      const { error: loanError } = await supabase
        .from('loans')
        .insert({
          customer_id: user?.id,
          commodity_id: selectedCommodityId,
          loan_amount: loanValue,
          repayment_status: 'active',
          created_at: new Date()
        });

      if (loanError) throw loanError;

      // 2. Disburse Funds to Customer Wallet
      if (wallet) {
        const newBalance = (parseFloat(wallet.balance) || 0) + loanValue;
        await supabase
          .from('wallets')
          .update({ balance: newBalance, updated_at: new Date() })
          .eq('id', wallet.id);
      }

      // 3. Log Immutable Security Audit Entry
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'LOAN_FINANCING_DISBURSED',
        details: `Disbursed ₦${loanValue.toLocaleString()} loan against Commodity ID ${selectedCommodityId} into Wallet ${wallet?.account_number}`
      });

      alert(`Success! Collateral loan of ₦${loanValue.toLocaleString()} has been approved and disbursed directly into your digital wallet.`);
      router.push('/banking/wallet');
    } catch (err: any) {
      alert('Financing Application Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isDarkMode ? 'bg-[#121212] text-emerald-400' : 'bg-slate-100 text-emerald-600'}`}>
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-3 text-xs font-semibold tracking-wider uppercase">Loading Liquidity Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8 font-sans ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Top Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/40 pb-5">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black tracking-tight">Collateral Commodity Financing</h1>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Instant Liquidity Portal
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Access up to 75% LTV collateral financing backed by verified warehouse receipts with automated wallet disbursement.
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

        {/* Main Application Container */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
          <form onSubmit={handleLoanSubmit} className="space-y-6">

            {/* SECTION 1: COLLATERAL SELECTION */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-4">1. Select Collateral Token Receipt</h3>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Eligible Stored Commodities *</label>
                <select
                  required
                  value={selectedCommodityId}
                  onChange={(e) => setSelectedCommodityId(e.target.value)}
                  className={`w-full rounded-xl border p-3.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                >
                  <option value="">-- Choose Tokenized Commodity Receipt --</option>
                  {eligibleCommodities.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.commodity_name} ({item.quantity} MT) — Valuation: ₦{(item.market_value || 0).toLocaleString()} [{item.warehouses?.name || 'Warehouse'}]
                    </option>
                  ))}
                </select>
                {eligibleCommodities.length === 0 && (
                  <p className="text-[11px] text-amber-400 mt-2">
                    ⚠️ No eligible unencumbered commodities found in your profile. Please deposit commodities first.
                  </p>
                )}
              </div>
            </div>

            {/* SECTION 2: LTV & FINANCING SUMMARY */}
            {selectedCommodity && (
              <div className={`p-5 rounded-2xl border space-y-4 ${isDarkMode ? 'bg-[#222] border-[#333]' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">2. Collateral Valuation & Limit Calculation</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Total Collateral Market Value:</span>
                    <span className="font-extrabold text-base text-white">₦{collateralValuation.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Max Allowed LTV:</span>
                    <span className="font-extrabold text-base text-purple-400">{maxLtvPercentage}% LTV</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Max Eligible Financing Limit:</span>
                    <span className="font-extrabold text-base text-emerald-400">₦{maxEligibleLoanAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: REQUESTED LIQUIDITY AMOUNT */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-4">3. Requested Loan Amount</h3>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Financing Request Amount (NGN) *
                </label>
                <input
                  type="number"
                  required
                  min="10000"
                  max={maxEligibleLoanAmount || undefined}
                  placeholder={`e.g. ${maxEligibleLoanAmount ? Math.floor(maxEligibleLoanAmount * 0.8) : 500000}`}
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  className={`w-full rounded-xl border p-3.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
                {wallet && (
                  <p className="text-[11px] text-slate-400 mt-2 flex items-center space-x-1">
                    <span>Target Disbursement Account:</span>
                    <strong className="text-white font-mono">{wallet.account_number}</strong>
                    <span>(WareFlow MFB)</span>
                  </p>
                )}
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || !selectedCommodityId}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider uppercase shadow-xl transition-all disabled:opacity-50"
              >
                {submitting ? 'Processing Instant Disbursement...' : 'Authorize Financing Request & Disburse Funds'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}