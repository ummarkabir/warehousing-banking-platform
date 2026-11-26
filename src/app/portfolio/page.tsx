'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function PortfolioPage() {
  const [commodities, setCommodities] = useState<any[]>([]);
  const [filteredCommodities, setFilteredCommodities] = useState<any[]>([]);
  const [revenueSettings, setRevenueSettings] = useState<any>(null);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssetForRelease, setSelectedAssetForRelease] = useState<any>(null);
  const [releasing, setReleasing] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }

    const fetchPortfolioData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // 1. Fetch live revenue settings for daily storage billing rate
      const { data: revData } = await supabase
        .from('revenue_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (revData) setRevenueSettings(revData);

      // 2. Fetch live market prices for accurate commodity valuation
      const { data: pricesData } = await supabase
        .from('market_prices')
        .select('commodity_name, price_per_unit');
      
      if (pricesData) {
        const priceMap: Record<string, number> = {};
        pricesData.forEach((p) => {
          priceMap[p.commodity_name.toLowerCase()] = p.price_per_unit;
        });
        setMarketPrices(priceMap);
      }

      // 3. Fetch user's tokenized commodities with warehouse relation
      const { data, error } = await supabase
        .from('commodities')
        .select(`
          *,
          warehouses ( name, location )
        `)
        .order('created_at', { ascending: false });

      if (data) {
        setCommodities(data);
        setFilteredCommodities(data);
      }
      setLoading(false);
    };

    fetchPortfolioData();
  }, [router, supabase]);

  // Search filter logic
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCommodities(commodities);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = commodities.filter((item) => {
        const name = (item.commodity_name || item.name || '').toLowerCase();
        const warehouseName = (item.warehouses?.name || item.warehouse_location || '').toLowerCase();
        const id = (item.id || '').toLowerCase();
        return name.includes(term) || warehouseName.includes(term) || id.includes(term);
      });
      setFilteredCommodities(filtered);
    }
  }, [searchTerm, commodities]);

  // Calculate dynamic storage charges: (Days Elapsed) * (Quantity) * (Daily Rate)
  const calculateStorageDetails = (createdAt: string, quantity: number) => {
    const dailyRate = revenueSettings?.daily_rate_per_unit || 50;
    const startDate = new Date(createdAt);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
    const daysStored = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const totalFee = daysStored * (quantity || 1) * dailyRate;

    return { daysStored, totalFee, dailyRate };
  };

  // Calculate market valuation using latest market pricing or stored valuation
  const getAssetValuation = (item: any) => {
    const nameKey = (item.commodity_name || item.name || '').toLowerCase();
    const livePrice = marketPrices[nameKey];
    if (livePrice && item.quantity) {
      return livePrice * item.quantity;
    }
    return item.valuation || item.total_value || 0;
  };

  // Export Portfolio Data to CSV
  const exportToCSV = () => {
    const headers = ['Asset ID,Commodity Name,Warehouse,Quantity (MT),Valuation (NGN),Accrued Storage Fee (NGN),Reg Date\n'];
    const rows = filteredCommodities.map((item) => {
      const { totalFee } = calculateStorageDetails(item.created_at, item.quantity);
      const val = getAssetValuation(item);
      const wName = item.warehouses?.name || item.warehouse_location || 'Storage Node';
      return `"${item.id}","${item.commodity_name || item.name || 'Commodity'}","${wName}","${item.quantity}","${val}","${totalFee}","${new Date(item.created_at).toLocaleDateString()}"`;
    });

    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Tokenized_Portfolio_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    a.click();
  };

  // Print or Export PDF
  const handlePrintPDF = () => {
    window.print();
  };

  // Process Commodity Release Request
  const handleConfirmRelease = async () => {
    if (!selectedAssetForRelease) return;
    setReleasing(true);

    const { daysStored, totalFee } = calculateStorageDetails(
      selectedAssetForRelease.created_at,
      selectedAssetForRelease.quantity
    );

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('settlements').insert({
      customer_name: user?.email || 'Authenticated User',
      amount: totalFee,
      status: 'pending',
      created_at: new Date()
    });

    if (error) {
      alert('Error initiating release settlement: ' + error.message);
    } else {
      alert(`Success! Release request for ${selectedAssetForRelease.commodity_name || 'Commodity'} submitted. Total storage fee accrued: ₦${totalFee.toLocaleString()} (${daysStored} days).`);
      setSelectedAssetForRelease(null);
    }
    setReleasing(false);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8 font-sans print:bg-white print:py-0 ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/40 pb-5 print:hidden">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight">
                Digital Receipt Portfolio
              </h1>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Live Synced Engine
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Manage tokenized commodity receipts, real-time market valuations, and dynamic storage billing charges.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${isDarkMode ? 'border-[#333] bg-[#222] text-amber-400 hover:bg-[#2a2a2a]' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
              title="Toggle Dark/Light Mode"
            >
              {isDarkMode ? '🌞 Light' : '🌙 Dark'}
            </button>

            {/* Export CSV Button */}
            <button
              onClick={exportToCSV}
              className={`rounded-xl px-3.5 py-2.5 text-xs font-bold border transition-all ${isDarkMode ? 'bg-[#222] border-[#333] text-slate-200 hover:bg-[#2a2a2a]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
            >
              📥 Export CSV
            </button>

            {/* Print / PDF Button */}
            <button
              onClick={handlePrintPDF}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2.5 text-xs font-bold shadow-md transition-all"
            >
              📄 Print / PDF
            </button>

            {/* Deposit Commodity Button */}
            <button
              onClick={() => router.push('/commodities/deposit')}
              className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2.5 text-xs font-bold shadow-md transition-all"
            >
              + Deposit
            </button>

            {/* Back to Dashboard */}
            <button
              onClick={() => router.push('/dashboard')}
              className={`rounded-xl px-3.5 py-2.5 text-xs font-bold border transition-all ${isDarkMode ? 'bg-[#222] border-[#333] text-slate-300 hover:bg-[#2a2a2a]' : 'bg-slate-200 border-slate-300 text-slate-800'}`}
            >
              &larr; Dashboard
            </button>
          </div>
        </div>

        {/* Dynamic Portfolio Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-4 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Tokenized Assets</p>
            <p className="text-2xl font-extrabold mt-1 text-blue-500">{filteredCommodities.length} <span className="text-xs font-normal text-slate-400">Receipts</span></p>
          </div>

          <div className={`p-4 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Cumulative Portfolio Value</p>
            <p className="text-2xl font-extrabold mt-1 text-emerald-500">
              ₦{filteredCommodities.reduce((acc, curr) => acc + getAssetValuation(curr), 0).toLocaleString()}
            </p>
          </div>

          <div className={`p-4 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Daily Storage Rate Base</p>
            <p className="text-2xl font-extrabold mt-1 text-amber-500">
              ₦{revenueSettings?.daily_rate_per_unit || 50} <span className="text-xs font-normal text-slate-400">/ Unit / Day</span>
            </p>
          </div>
        </div>

        {/* Search Bar Section */}
        <div className="print:hidden">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tokenized assets by commodity name, warehouse location, or receipt ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full rounded-2xl border px-4 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-xs ${
                isDarkMode 
                  ? 'bg-[#181818] border-[#262626] text-white placeholder:text-slate-500' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-3 text-xs font-bold text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Asset Cards Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            <p className="mt-3 text-xs font-semibold text-slate-400">Loading tokenized receipt portfolio...</p>
          </div>
        ) : filteredCommodities.length === 0 ? (
          <div className={`text-center py-16 rounded-3xl border ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
            <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {searchTerm ? 'No matching receipt records found.' : 'No tokenized commodities registered yet.'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {searchTerm ? 'Try searching with a different commodity name or ID.' : 'Deposit commodities in an approved facility to generate digital receipts.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCommodities.map((item) => {
              const { daysStored, totalFee, dailyRate } = calculateStorageDetails(item.created_at, item.quantity);
              const valuation = getAssetValuation(item);

              return (
                <div 
                  key={item.id} 
                  className={`rounded-3xl p-5 border shadow-xl flex flex-col justify-between transition-all hover:border-blue-500/50 ${
                    isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    {/* Badge & Asset ID */}
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Tokenized Receipt
                      </span>
                      <span className={`text-[11px] font-mono truncate max-w-[110px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        ID: {item.id}
                      </span>
                    </div>

                    {/* Commodity Name & Location */}
                    <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {item.commodity_name || item.name || 'Agricultural Asset'}
                    </h3>
                    <p className={`text-xs mt-0.5 flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span>📍</span>
                      <span className="truncate">{item.warehouses?.name || item.warehouse_location || 'Verified Storage Node'}</span>
                    </p>

                    {/* Financial Metrics */}
                    <div className={`mt-4 pt-3 border-t space-y-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                      <div className="flex justify-between text-xs">
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Stored Quantity:</span>
                        <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{item.quantity} Metric Tons</span>
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Market Valuation:</span>
                        <span className="font-black text-emerald-500">₦{valuation.toLocaleString()}</span>
                      </div>

                      <div className={`flex justify-between text-xs pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Accrued Storage Fee ({daysStored} Days @ ₦{dailyRate}/unit):</span>
                        <span className="font-bold text-amber-500">₦{totalFee.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className={`mt-5 pt-3 border-t flex gap-2 print:hidden ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <button
                      onClick={() => router.push(`/loans/request?asset_id=${item.id}&value=${valuation}`)}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all text-center"
                    >
                      🏦 Get Loan
                    </button>
                    <button
                      onClick={() => setSelectedAssetForRelease(item)}
                      className={`flex-1 py-2.5 rounded-xl border font-bold text-xs transition-all text-center ${
                        isDarkMode 
                          ? 'bg-[#222] border-[#333] text-slate-200 hover:bg-[#2a2a2a]' 
                          : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      📦 Request Release
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* --- COMMODITY RELEASE CONFIRMATION MODAL --- */}
      {selectedAssetForRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 print:hidden">
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border ${isDarkMode ? 'bg-[#181818] border-[#262626] text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-lg font-bold">Initiate Commodity Release</h3>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Asset: <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedAssetForRelease.commodity_name || selectedAssetForRelease.name}</span>
            </p>

            <div className={`my-4 p-3 rounded-2xl space-y-1.5 text-xs border ${isDarkMode ? 'bg-[#222] border-[#333]' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Storage Period:</span>
                <span className="font-bold">{calculateStorageDetails(selectedAssetForRelease.created_at, selectedAssetForRelease.quantity).daysStored} Days</span>
              </div>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Total Obligation Fee:</span>
                <span className="font-bold text-amber-500">₦{calculateStorageDetails(selectedAssetForRelease.created_at, selectedAssetForRelease.quantity).totalFee.toLocaleString()}</span>
              </div>
            </div>

            <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              * Business Rule: Commodity release is only finalized after all storage billing obligations have been cleared and verified by the Platform Administrator.
            </p>

            <div className="mt-5 flex space-x-3">
              <button
                onClick={() => setSelectedAssetForRelease(null)}
                className={`flex-1 rounded-2xl py-2.5 text-xs font-semibold border ${isDarkMode ? 'border-[#333] bg-[#222] text-slate-300' : 'border-slate-300 bg-slate-100 text-slate-700'}`}
              >
                Cancel
              </button>
              <button
                disabled={releasing}
                onClick={handleConfirmRelease}
                className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white shadow-md transition-all disabled:opacity-50"
              >
                {releasing ? 'Submitting...' : 'Confirm Release'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}