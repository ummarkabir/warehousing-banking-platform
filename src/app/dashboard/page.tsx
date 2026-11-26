'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [commoditiesCount, setCommoditiesCount] = useState(0);
  const [warehousesCount, setWarehousesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // Secure Inactivity Auto-Logout Handler (15 Minutes Standard)
  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/login');
  }, [supabase, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }

    const fetchDashboardData = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // 1. Fetch User Profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // 2. Fetch User Wallet Account
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('customer_id', user.id)
        .single();

      if (walletData) {
        setWallet(walletData);
      } else {
        // Auto-initialize wallet if not found
        const { data: newWallet } = await supabase
          .from('wallets')
          .insert({
            customer_id: user.id,
            account_number: `ACC-${Math.floor(10000000 + Math.random() * 90000000)}`,
            balance: 0.00,
            currency: 'NGN'
          })
          .select()
          .single();
        if (newWallet) setWallet(newWallet);
      }

      // 3. Count Tokenized Commodities
      const { count: commCount } = await supabase
        .from('commodities')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', user.id);

      if (commCount !== null) {
        setCommoditiesCount(commCount);
      }

      // 4. Count Owned Warehouses
      const { count: whCount } = await supabase
        .from('warehouses')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);

      if (whCount !== null) {
        setWarehousesCount(whCount);
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, [router, supabase]);

  // Inactivity Security Timer Hook
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(async () => {
        await supabase.auth.signOut();
        alert('Security Notice: Session expired due to inactivity. Please log in again.');
        router.push('/login');
      }, 15 * 60 * 1000);
    };

    const monitoredEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    monitoredEvents.forEach((event) => window.addEventListener(event, resetInactivityTimer));

    resetInactivityTimer();

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      monitoredEvents.forEach((event) => window.removeEventListener(event, resetInactivityTimer));
    };
  }, [supabase, router]);

  const handleLogoutConfirm = async () => {
    await handleSignOut();
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isDarkMode ? 'bg-[#121212] text-[#00b96b]' : 'bg-slate-100 text-blue-600'}`}>
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-3 text-xs font-semibold tracking-wider uppercase">Loading Secure Fintech Dashboard...</p>
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

  const userRole = profile?.role || 'customer';

  return (
    <div className={`min-h-screen transition-colors duration-300 relative pb-28 font-sans ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
      
      {/* Top Header Section */}
      <header className={`sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex justify-between items-center border-b backdrop-blur-md transition-colors ${isDarkMode ? 'bg-[#181818]/95 border-[#262626]' : 'bg-white/95 border-slate-200'}`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className={`p-2 rounded-xl border text-sm transition-all ${isDarkMode ? 'border-[#333] bg-[#222] text-white hover:bg-[#2a2a2a]' : 'border-slate-300 bg-slate-100 text-slate-800'}`}
            title="Open Menu"
          >
            ☰
          </button>

          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {profile?.name || 'Umar Kabir Muktar'}
              </span>
              <span className="text-[10px] bg-blue-500/10 text-blue-500 font-bold px-2 py-0.5 rounded-full uppercase">
                {userRole}
              </span>
            </div>
            <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Technical Team Lead & Developer
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl border text-xs transition-all ${isDarkMode ? 'border-[#262626] bg-[#1e1e1e] text-amber-400' : 'border-slate-200 bg-slate-100 text-slate-700'}`}
            title="Toggle Theme"
          >
            {isDarkMode ? '🌞' : '🌙'}
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="p-2 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-xs font-semibold transition-all hover:bg-red-500/20"
            title="Sign Out"
          >
            🚪
          </button>
        </div>
      </header>

      {/* --- SIDEBAR DRAWER --- */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          ></div>

          <div className={`relative w-80 max-w-full h-full shadow-2xl p-6 flex flex-col justify-between z-10 border-r ${isDarkMode ? 'bg-[#181818] border-[#262626] text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div>
              <div className="flex justify-between items-center pb-5 border-b border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{profile?.name || 'Umar Kabir Muktar'}</h4>
                    <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{profile?.email || 'umar@ecosystem.com'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className={`p-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-700 hover:text-slate-900'}`}
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
                <button 
                  onClick={() => { setIsSidebarOpen(false); router.push('/dashboard'); }}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-blue-600/10 hover:text-blue-500 transition-colors text-left text-sm font-semibold"
                >
                  <span>🏠</span>
                  <span>Dashboard Home</span>
                </button>

                <button 
                  onClick={() => { setIsSidebarOpen(false); router.push('/warehouses/register'); }}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-blue-600/10 hover:text-blue-500 transition-colors text-left text-sm font-semibold"
                >
                  <span>🏢</span>
                  <span>Warehouse Registration</span>
                </button>

                <button 
                  onClick={() => { setIsSidebarOpen(false); router.push('/banking/wallet'); }}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-blue-600/10 hover:text-blue-500 transition-colors text-left text-sm font-semibold"
                >
                  <span>💳</span>
                  <span>Digital Banking & Wallet</span>
                </button>

                <button 
                  onClick={() => { setIsSidebarOpen(false); router.push('/portfolio'); }}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-blue-600/10 hover:text-blue-500 transition-colors text-left text-sm font-semibold"
                >
                  <span>📊</span>
                  <span>Tokenized Portfolio</span>
                </button>

                <button 
                  onClick={() => { setIsSidebarOpen(false); router.push('/banking/link-warehouse'); }}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-blue-600/10 hover:text-blue-500 transition-colors text-left text-sm font-semibold"
                >
                  <span>🔗</span>
                  <span>Link Warehouse Account</span>
                </button>

                <button 
                  onClick={() => { setIsSidebarOpen(false); router.push('/loans/commodity-financing'); }}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-blue-600/10 hover:text-blue-500 transition-colors text-left text-sm font-semibold"
                >
                  <span>🏦</span>
                  <span>Commodity Financing & Loans</span>
                </button>

                {/* Admin Control Center in Sidebar */}
                {(userRole === 'superadmin' || userRole === 'admin') && (
                  <div className="pt-3 mt-3 border-t border-slate-700/50 space-y-1">
                    <p className="px-3 text-[10px] font-black uppercase tracking-wider text-blue-400 mb-1">Admin Control Center</p>
                    <button onClick={() => { setIsSidebarOpen(false); router.push('/admin/approvals'); }} className="w-full flex items-center space-x-3 p-2.5 rounded-xl hover:bg-blue-600/10 hover:text-blue-500 transition-colors text-left text-xs font-semibold">
                      <span>🛡️</span><span>Warehouse Approvals</span>
                    </button>
                    <button onClick={() => { setIsSidebarOpen(false); router.push('/admin/inspections'); }} className="w-full flex items-center space-x-3 p-2.5 rounded-xl hover:bg-blue-600/10 hover:text-blue-500 transition-colors text-left text-xs font-semibold">
                      <span>🔍</span><span>Assign Inspections</span>
                    </button>
                    <button onClick={() => { setIsSidebarOpen(false); router.push('/admin/pricing-config'); }} className="w-full flex items-center space-x-3 p-2.5 rounded-xl hover:bg-blue-600/10 hover:text-blue-500 transition-colors text-left text-xs font-semibold">
                      <span>⚙️</span><span>Pricing & Revenue Share</span>
                    </button>
                    <button onClick={() => { setIsSidebarOpen(false); router.push('/admin/settlements'); }} className="w-full flex items-center space-x-3 p-2.5 rounded-xl hover:bg-blue-600/10 hover:text-blue-500 transition-colors text-left text-xs font-semibold">
                      <span>💰</span><span>Settlements Management</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/50">
              <button
                onClick={() => { setIsSidebarOpen(false); setShowLogoutModal(true); }}
                className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold transition-all flex items-center justify-center space-x-2"
              >
                <span>🚪</span>
                <span>Sign Out Securely</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-6">

        {/* Primary Wallet & Integration Card */}
        <div className="relative rounded-3xl p-6 shadow-xl overflow-hidden bg-[#0A192F] text-white border border-slate-800">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2 text-slate-300 text-xs font-medium mb-1">
                <span>{wallet?.account_number || 'ACC-90823411'}</span>
                <span>|</span>
                <span className="truncate max-w-[160px]">{profile?.company_name || 'TriSphere & Ecosystem Hub'}</span>
              </div>
              
              <div className="flex items-center space-x-3 mt-1">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  {showBalance ? formatCurrency(wallet?.balance || 0) : '₦••••••••'}
                </h2>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  {showBalance ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Tokenized Assets & Wallet Synchronized</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex gap-3">
            <button 
              onClick={() => router.push('/banking/wallet')}
              className="flex-1 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-3 text-xs tracking-wide shadow-md transition-all flex items-center justify-center space-x-1.5"
            >
              <span>💳 Fund Wallet</span>
            </button>
            <button 
              onClick={() => router.push('/loans/commodity-financing')}
              className="flex-1 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-3 px-3 text-xs tracking-wide border border-slate-700 transition-all flex items-center justify-center space-x-1.5"
            >
              <span>🏦 Get Token Loan</span>
            </button>
          </div>
        </div>

        {/* Services & Operations Grid */}
        <div className={`rounded-3xl border p-5 shadow-sm ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-5">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Platform Services</h3>
            <span className="text-xs font-semibold text-blue-500 cursor-pointer hover:underline" onClick={() => setIsSidebarOpen(true)}>View Menu</span>
          </div>

          <div className="grid grid-cols-4 gap-y-6 gap-x-2 sm:gap-4">
            
            <div onClick={() => router.push('/warehouses/register')} className="flex flex-col items-center cursor-pointer group">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl mb-2 transition-transform group-hover:scale-110 shadow-sm ${isDarkMode ? 'bg-[#222] text-blue-400 border border-[#333]' : 'bg-slate-100 text-blue-600'}`}>🏢</div>
              <span className={`text-[11px] font-bold text-center leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Warehouse</span>
            </div>

            <div onClick={() => router.push('/banking/wallet')} className="flex flex-col items-center cursor-pointer group">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl mb-2 transition-transform group-hover:scale-110 shadow-sm ${isDarkMode ? 'bg-[#222] text-emerald-400 border border-[#333]' : 'bg-slate-100 text-emerald-600'}`}>💳</div>
              <span className={`text-[11px] font-bold text-center leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Wallet</span>
            </div>

            <div onClick={() => router.push('/portfolio')} className="flex flex-col items-center cursor-pointer group">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl mb-2 transition-transform group-hover:scale-110 shadow-sm ${isDarkMode ? 'bg-[#222] text-purple-400 border border-[#333]' : 'bg-slate-100 text-purple-600'}`}>📊</div>
              <span className={`text-[11px] font-bold text-center leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Portfolio</span>
            </div>

            <div onClick={() => router.push('/banking/link-warehouse')} className="flex flex-col items-center cursor-pointer group">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl mb-2 transition-transform group-hover:scale-110 shadow-sm ${isDarkMode ? 'bg-[#222] text-amber-400 border border-[#333]' : 'bg-slate-100 text-amber-600'}`}>🔗</div>
              <span className={`text-[11px] font-bold text-center leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Link Node</span>
            </div>

            <div onClick={() => router.push('/loans/commodity-financing')} className="flex flex-col items-center cursor-pointer group">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl mb-2 transition-transform group-hover:scale-110 shadow-sm ${isDarkMode ? 'bg-[#222] text-indigo-400 border border-[#333]' : 'bg-slate-100 text-indigo-600'}`}>🏦</div>
              <span className={`text-[11px] font-bold text-center leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Financing</span>
            </div>

            <div onClick={() => router.push('/kyc')} className="flex flex-col items-center cursor-pointer group">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl mb-2 transition-transform group-hover:scale-110 shadow-sm ${isDarkMode ? 'bg-[#222] text-teal-400 border border-[#333]' : 'bg-slate-100 text-teal-600'}`}>🛡️</div>
              <span className={`text-[11px] font-bold text-center leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Banking KYC</span>
            </div>

            <div onClick={() => router.push('/marketplace')} className="flex flex-col items-center cursor-pointer group">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl mb-2 transition-transform group-hover:scale-110 shadow-sm ${isDarkMode ? 'bg-[#222] text-rose-400 border border-[#333]' : 'bg-slate-100 text-rose-600'}`}>🛒</div>
              <span className={`text-[11px] font-bold text-center leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Marketplace</span>
            </div>

            <div onClick={() => router.push('/inspector/dashboard')} className="flex flex-col items-center cursor-pointer group">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl mb-2 transition-transform group-hover:scale-110 shadow-sm ${isDarkMode ? 'bg-[#222] text-sky-400 border border-[#333]' : 'bg-slate-100 text-sky-600'}`}>🔍</div>
              <span className={`text-[11px] font-bold text-center leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Inspection</span>
            </div>

          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Stored Commodities</p>
            <p className="text-2xl font-bold mt-1 text-[#00b96b]">{commoditiesCount} <span className={`text-xs font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Units</span></p>
            <p className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Tokenized Assets</p>
          </div>

          <div className={`p-4 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Managed Warehouses</p>
            <p className="text-2xl font-bold mt-1 text-blue-500">{warehousesCount} <span className={`text-xs font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nodes</span></p>
            <p className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Approved Facilities</p>
          </div>
        </div>

      </main>

      {/* --- LOGOUT MODAL --- */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl border ${isDarkMode ? 'bg-[#181818] border-[#262626] text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-md">
              🚪
            </div>

            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Sign Out Session?</h3>
            <p className={`text-xs mt-1.5 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Are you sure you want to terminate your secure fintech and warehousing session?
            </p>

            <div className="mt-5 flex space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className={`flex-1 rounded-2xl py-3 text-xs font-semibold border transition-all ${isDarkMode ? 'border-[#262626] bg-[#222] text-slate-300 hover:bg-[#2a2a2a]' : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 rounded-2xl bg-red-600 hover:bg-red-700 py-3 text-xs font-semibold text-white shadow-md transition-all"
              >
                Yes, Sign Out
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}