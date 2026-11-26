'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function WalletPage() {
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Modal / Action States
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // Detect dark/light mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  // Fetch Wallet Data and Transaction Ledger
  const fetchWalletDetails = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // 1. Fetch User Profile
    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) setProfile(profileData);

    // 2. Fetch Wallet Account
    const { data: walletData } = await supabase
      .from('wallets')
      .select('*')
      .eq('customer_id', user.id)
      .single();

    if (walletData) {
      setWallet(walletData);
    } else {
      // Auto-create wallet if missing
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

    // 3. Fetch Audit Logs / Transaction History
    const { data: txData } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (txData) setTransactions(txData);

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchWalletDetails();
  }, [fetchWalletDetails]);

  // Handle Simulated Deposit
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid deposit amount.');
      return;
    }

    setProcessing(true);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      const newBalance = (wallet?.balance || 0) + amount;

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance, updated_at: new Date() })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      // Log transaction in audit trail
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'WALLET_DEPOSIT',
        details: `Successfully deposited ₦${amount.toLocaleString()} into account ${wallet.account_number}`
      });

      alert(`Successfully funded wallet with ₦${amount.toLocaleString()}!`);
      setDepositAmount('');
      setShowDepositModal(false);
      fetchWalletDetails();
    } catch (err: any) {
      alert('Deposit failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isDarkMode ? 'bg-[#121212] text-emerald-400' : 'bg-slate-100 text-emerald-600'}`}>
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-3 text-xs font-semibold tracking-wider uppercase">Loading Secure Digital Banking...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: wallet?.currency || 'NGN',
    }).format(amount || 0);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8 font-sans ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/40 pb-5">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black tracking-tight">Digital Banking & Wallet</h1>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Fintech Ledger
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Account Holder: <strong className="text-white">{profile?.name || 'Umar Kabir'}</strong> ({profile?.company_name || 'Ecosystem Hub'})
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

        {/* Primary Wallet Card */}
        <div className="relative rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden bg-gradient-to-tr from-[#0A192F] to-[#172A45] text-white border border-slate-800">
          <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2 text-slate-300 text-xs font-medium mb-2">
                <span>Account Number: <strong className="font-mono text-white">{wallet?.account_number || '4001650391'}</strong></span>
                <span>•</span>
                <span>WareFlow Microfinance Bank</span>
              </div>
              
              <div className="flex items-center space-x-3 mt-1">
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                  {showBalance ? formatCurrency(wallet?.balance || 0) : '₦••••••••'}
                </h2>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-slate-400 hover:text-white text-base transition-colors"
                  title="Toggle Balance Visibility"
                >
                  {showBalance ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Available Ledger Balance (Real-time synchronized)</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap gap-3">
            <button 
              onClick={() => setShowDepositModal(true)}
              className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 text-xs tracking-wide shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <span>+ Fund Wallet</span>
            </button>
            <button 
              onClick={() => router.push('/loans/request')}
              className="flex-1 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 px-4 text-xs tracking-wide border border-slate-700 transition-all flex items-center justify-center space-x-2"
            >
              <span>🏦 Collateral Financing</span>
            </button>
          </div>
        </div>

        {/* Transaction History Ledger */}
        <div className={`rounded-3xl border shadow-xl overflow-hidden ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black">Recent Activity & Audit Ledger</h3>
              <p className="text-[11px] text-slate-400">Immutable ledger history for banking transactions</p>
            </div>
            <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Encrypted Audit Trail
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`font-bold uppercase text-[10px] ${isDarkMode ? 'bg-[#222] text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                <tr>
                  <th className="p-4">Action Type</th>
                  <th className="p-4">Transaction Details</th>
                  <th className="p-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800 text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
                {transactions.length === 0 ? (
                  <tr><td colSpan={3} className="p-8 text-center text-slate-400">No recent transactions recorded in ledger.</td></tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className={`transition-colors ${isDarkMode ? 'hover:bg-[#222]' : 'hover:bg-slate-50'}`}>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {tx.action}
                        </span>
                      </td>
                      <td className="p-4 font-medium">{tx.details}</td>
                      <td className="p-4 text-right text-slate-400 font-mono">{new Date(tx.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* --- FUND WALLET MODAL --- */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border space-y-4 ${isDarkMode ? 'bg-[#181818] border-[#262626] text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            
            <div className="flex justify-between items-center border-b border-slate-700/40 pb-3">
              <h3 className="text-sm font-black">Fund Digital Wallet</h3>
              <button 
                onClick={() => setShowDepositModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Deposit Amount (NGN)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  placeholder="e.g. 50000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className={`w-full rounded-xl border p-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider uppercase shadow-md transition-all disabled:opacity-50"
              >
                {processing ? 'Processing Payment...' : 'Confirm & Fund Wallet'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}