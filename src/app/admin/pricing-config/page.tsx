'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function PricingConfigPage() {
  const [marketPrices, setMarketPrices] = useState<any[]>([]);
  const [revenueSettings, setRevenueSettings] = useState<any>({
    daily_rate_per_unit: 50,
    platform_split_percentage: 30,
    warehouse_split_percentage: 70,
  });
  
  // Form state for adding/updating commodity price
  const [commodityName, setCommodityName] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [unitType, setUnitType] = useState('Metric Ton');
  
  const [loading, setLoading] = useState(true);
  const [savingRevenue, setSavingRevenue] = useState(false);
  const [addingCommodity, setAddingCommodity] = useState(false);
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

  // Fetch Pricing & Revenue Configurations from Supabase
  const fetchConfigurations = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // Role verification for Admin / Superadmin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      alert('Unauthorized access: Administrator rights required.');
      router.push('/dashboard');
      return;
    }

    // 1. Fetch live commodity market prices
    const { data: pricesData } = await supabase
      .from('market_prices')
      .select('*')
      .order('commodity_name', { ascending: true });

    if (pricesData) setMarketPrices(pricesData);

    // 2. Fetch revenue settings
    const { data: revData } = await supabase
      .from('revenue_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (revData) setRevenueSettings(revData);

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

  // Handle adding or updating market commodity pricing
  const handleSaveMarketPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commodityName || !pricePerUnit) {
      alert('Please enter both commodity name and unit price.');
      return;
    }

    setAddingCommodity(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('market_prices')
      .upsert({
        commodity_name: commodityName.trim(),
        price_per_unit: parseFloat(pricePerUnit),
        unit_type: unitType,
        updated_at: new Date()
      }, { onConflict: 'commodity_name' });

    if (error) {
      alert('Error updating commodity price: ' + error.message);
    } else {
      // Audit log entry
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'MARKET_PRICE_UPDATE',
        details: `Updated ${commodityName} price to ₦${parseFloat(pricePerUnit).toLocaleString()} per ${unitType}`
      });

      alert(`Market valuation for ${commodityName} updated successfully!`);
      setCommodityName('');
      setPricePerUnit('');
      fetchConfigurations();
    }
    setAddingCommodity(false);
  };

  // Handle saving global storage fees and revenue splits
  const handleSaveRevenueSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRevenue(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('revenue_settings')
      .insert({
        daily_rate_per_unit: parseFloat(revenueSettings.daily_rate_per_unit),
        platform_split_percentage: parseFloat(revenueSettings.platform_split_percentage),
        warehouse_split_percentage: parseFloat(revenueSettings.warehouse_split_percentage),
        updated_at: new Date()
      });

    if (error) {
      alert('Error saving revenue config: ' + error.message);
    } else {
      // Audit log entry
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'REVENUE_CONFIG_UPDATE',
        details: `Daily rate: ₦${revenueSettings.daily_rate_per_unit}, Split: ${revenueSettings.platform_split_percentage}% Platform / ${revenueSettings.warehouse_split_percentage}% Owner`
      });

      alert('Revenue and storage pricing model updated successfully!');
      fetchConfigurations();
    }
    setSavingRevenue(false);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8 font-sans ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Top Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/40 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight">Pricing & Revenue Configuration Engine</h1>
              <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Fintech Rule Engine
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Configure commodity valuation feeds, daily storage rates, and automated revenue splits across warehouse nodes.
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

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
            <p className="mt-3 text-xs font-semibold text-slate-400">Synchronizing valuation rules...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* SECTION 1: GLOBAL REVENUE & STORAGE BILLING SETTINGS */}
            <div className="lg:col-span-1 space-y-6">
              <div className={`p-6 rounded-3xl border shadow-xl ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-lg">💰</div>
                  <div>
                    <h3 className="text-sm font-black">Storage & Revenue Split Rules</h3>
                    <p className="text-[11px] text-slate-400">Global fee parameters</p>
                  </div>
                </div>

                <form onSubmit={handleSaveRevenueSettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Daily Storage Fee (NGN / Unit / Day)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={revenueSettings.daily_rate_per_unit || ''}
                      onChange={(e) => setRevenueSettings({ ...revenueSettings, daily_rate_per_unit: e.target.value })}
                      className={`w-full rounded-xl border p-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Platform Share (%)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      value={revenueSettings.platform_split_percentage || ''}
                      onChange={(e) => {
                        const plat = parseFloat(e.target.value) || 0;
                        setRevenueSettings({
                          ...revenueSettings,
                          platform_split_percentage: plat,
                          warehouse_split_percentage: 100 - plat
                        });
                      }}
                      className={`w-full rounded-xl border p-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Warehouse Owner Share (%)
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={revenueSettings.warehouse_split_percentage || 0}
                      className={`w-full rounded-xl border p-3 text-xs font-mono font-bold opacity-75 cursor-not-allowed ${isDarkMode ? 'bg-[#1a1a1a] border-[#2a2a2a] text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-600'}`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingRevenue}
                    className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {savingRevenue ? 'Saving Configuration...' : 'Update Storage & Split Rules'}
                  </button>
                </form>
              </div>
            </div>

            {/* SECTION 2: COMMODITY MARKET PRICE CONFIGURATION */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Add / Update Commodity Form */}
              <div className={`p-6 rounded-3xl border shadow-xl ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 text-lg">📈</div>
                  <div>
                    <h3 className="text-sm font-black">Commodity Market Valuation Feed</h3>
                    <p className="text-[11px] text-slate-400">Configure base unit prices for dynamic tokenization</p>
                  </div>
                </div>

                <form onSubmit={handleSaveMarketPrice} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Commodity Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Maize, Paddy Rice, Soybeans"
                      required
                      value={commodityName}
                      onChange={(e) => setCommodityName(e.target.value)}
                      className={`w-full rounded-xl border p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Price per Unit (NGN)</label>
                    <input
                      type="number"
                      placeholder="e.g. 450000"
                      required
                      value={pricePerUnit}
                      onChange={(e) => setPricePerUnit(e.target.value)}
                      className={`w-full rounded-xl border p-2.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Unit Measurement</label>
                    <select
                      value={unitType}
                      onChange={(e) => setUnitType(e.target.value)}
                      className={`w-full rounded-xl border p-2.5 text-xs font-bold ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    >
                      <option value="Metric Ton">Metric Ton (MT)</option>
                      <option value="50kg Bag">50kg Bag</option>
                      <option value="100kg Bag">100kg Bag</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 pt-2">
                    <button
                      type="submit"
                      disabled={addingCommodity}
                      className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                    >
                      {addingCommodity ? 'Updating Valuation...' : '+ Set Commodity Price'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Market Prices Table */}
              <div className={`rounded-3xl border shadow-xl overflow-hidden ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Market Feeds ({marketPrices.length})</h4>
                  <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Live Token Engine
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`font-bold uppercase text-[10px] ${isDarkMode ? 'bg-[#222] text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                      <tr>
                        <th className="p-4">Commodity</th>
                        <th className="p-4">Unit Type</th>
                        <th className="p-4">Base Valuation (NGN)</th>
                        <th className="p-4">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800 text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
                      {marketPrices.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-400">No commodity prices configured yet.</td></tr>
                      ) : (
                        marketPrices.map((item) => (
                          <tr key={item.id || item.commodity_name} className={`transition-colors ${isDarkMode ? 'hover:bg-[#222]' : 'hover:bg-slate-50'}`}>
                            <td className="p-4 font-bold text-sm">{item.commodity_name}</td>
                            <td className="p-4 text-slate-400">{item.unit_type || 'Metric Ton'}</td>
                            <td className="p-4 font-black text-emerald-400">₦{(item.price_per_unit || 0).toLocaleString()}</td>
                            <td className="p-4 text-slate-400">{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'Just now'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}