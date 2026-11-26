'use client';
export const runtime = 'edge';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter, useParams } from 'next/navigation';

export default function CommodityIngressPage() {
  const params = useParams();
  const warehouseId = params?.id as string;

  const [warehouse, setWarehouse] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [marketPrices, setMarketPrices] = useState<any[]>([]);
  
  // Intake Form States
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [commodityName, setCommodityName] = useState('Maize');
  const [quantityMT, setQuantityMT] = useState('');
  const [moistureContent, setMoistureContent] = useState('');
  const [impurityPercentage, setImpurityPercentage] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [intakeNotes, setIntakeNotes] = useState('');

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

  // Fetch warehouse details, registered customers, and live commodity pricing feeds
  const fetchIngressPrerequisites = useCallback(async () => {
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
      alert('Warehouse facility not found or access denied.');
      router.push('/dashboard');
      return;
    }
    setWarehouse(whData);

    // 2. Fetch Customer Accounts for Depositor Selection
    const { data: custData } = await supabase
      .from('users')
      .select('id, name, email, company_name')
      .order('name', { ascending: true });

    if (custData) setCustomers(custData);

    // 3. Fetch Live Market Pricing Feeds for Token Valuation
    const { data: priceData } = await supabase
      .from('market_prices')
      .select('*');

    if (priceData) setMarketPrices(priceData);

    setLoading(false);
  }, [warehouseId, supabase, router]);

  useEffect(() => {
    fetchIngressPrerequisites();
  }, [fetchIngressPrerequisites]);

  // Compute Live Estimated Valuation based on Market Pricing Feeds
  const currentCommodityFeed = marketPrices.find(
    (p) => p.commodity_name.toLowerCase() === commodityName.toLowerCase()
  );
  const baseUnitPrice = currentCommodityFeed?.price_per_unit || 450000; // Default N450,000/MT fallback
  const computedValuation = (parseFloat(quantityMT) || 0) * baseUnitPrice;

  // Process Ingress Submission & Mint Tokenized Receipt
  const handleIngressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !quantityMT || parseFloat(quantityMT) <= 0) {
      alert('Please select a valid customer and enter a positive commodity quantity.');
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      // 1. Insert new Commodity Receipt into database
      const { data: commodityData, error: commError } = await supabase
        .from('commodities')
        .insert({
          customer_id: selectedCustomerId,
          warehouse_id: warehouseId,
          commodity_name: commodityName,
          quantity: parseFloat(quantityMT),
          market_value: computedValuation,
          token_amount: computedValuation, // 1:1 Pegged Tokenized Commodity Valuation
          status: 'tokenized',
          created_at: new Date()
        })
        .select()
        .single();

      if (commError) throw commError;

      // 2. Record Physical Quality Inspection Intake Log
      await supabase.from('inspections').insert({
        warehouse_id: warehouseId,
        inspector_id: user?.id,
        checklist: {
          moisture_content_percent: parseFloat(moistureContent) || 0,
          impurity_percent: parseFloat(impurityPercentage) || 0,
          batch_number: batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
          ingress_notes: intakeNotes
        },
        inspector_notes: `Ingress Intake: ${quantityMT} MT of ${commodityName}. Moisture: ${moistureContent}%.`,
        recommendation: 'approve',
        created_at: new Date()
      });

      // 3. Log System Audit Trail
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'COMMODITY_INGRESS_SUCCESS',
        details: `Ingress processed: ${quantityMT} MT ${commodityName} (Valuation: ₦${computedValuation.toLocaleString()}) into Warehouse ID ${warehouseId}`
      });

      alert(`Commodity Ingress Successful! Tokenized Receipt minted with valuation of ₦${computedValuation.toLocaleString()}`);
      router.push(`/warehouses/${warehouseId}/manage`);
    } catch (err: any) {
      alert('Error recording commodity ingress: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isDarkMode ? 'bg-[#121212] text-emerald-400' : 'bg-slate-100 text-emerald-600'}`}>
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-3 text-xs font-semibold tracking-wider uppercase">Loading Warehouse Intake System...</p>
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
              <h1 className="text-2xl font-black tracking-tight">Commodity Ingress & Token Intake</h1>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Physical Intake
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

        {/* Main Intake Form Container */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
          <form onSubmit={handleIngressSubmit} className="space-y-6">

            {/* SECTION 1: DEPOSITOR & COMMODITY TYPE */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-4">1. Depositor & Crop Selection</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Select Depositor / Owner Account *</label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className={`w-full rounded-xl border p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  >
                    <option value="">-- Choose Depositor Account --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.email} {c.company_name ? `(${c.company_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Commodity Type *</label>
                  <select
                    required
                    value={commodityName}
                    onChange={(e) => setCommodityName(e.target.value)}
                    className={`w-full rounded-xl border p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  >
                    <option value="Maize">Yellow Maize</option>
                    <option value="White Maize">White Maize</option>
                    <option value="Paddy Rice">Paddy Rice</option>
                    <option value="Soybeans">Soybeans</option>
                    <option value="Sorghum">Sorghum</option>
                    <option value="Wheat">Hard Red Wheat</option>
                    <option value="Sesame">Sesame Seeds</option>
                  </select>
                </div>

              </div>
            </div>

            {/* SECTION 2: QUANTITY & PHYSICAL INSPECTION PARAMETERS */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-4">2. Quantity & QA Lab Verification</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Quantity (Metric Tons) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 50.00"
                    value={quantityMT}
                    onChange={(e) => setQuantityMT(e.target.value)}
                    className={`w-full rounded-xl border p-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Moisture Content (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 12.5"
                    value={moistureContent}
                    onChange={(e) => setMoistureContent(e.target.value)}
                    className={`w-full rounded-xl border p-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Foreign Matter / Impurity (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 1.2"
                    value={impurityPercentage}
                    onChange={(e) => setImpurityPercentage(e.target.value)}
                    className={`w-full rounded-xl border p-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>

              </div>
            </div>

            {/* SECTION 3: BATCH LOGS & COMPUTED TOKEN VALUATION */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-4">3. Batch Tagging & Automated Valuation</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Batch / Waybill Tag Number</label>
                    <input
                      type="text"
                      placeholder="e.g. WB-2026-9901"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      className={`w-full rounded-xl border p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                  </div>

                  {/* Computed Token Valuation Box */}
                  <div className={`p-4 rounded-2xl border flex flex-col justify-between ${isDarkMode ? 'bg-[#222] border-[#333]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Calculated Tokenized Receipt Valuation</span>
                    <div className="text-xl font-extrabold text-emerald-400 mt-1">
                      ₦{computedValuation.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      Base Rate: ₦{baseUnitPrice.toLocaleString()} / MT
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Ingress Remarks & Physical Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Add notes regarding truck condition, stack location, or packaging..."
                    value={intakeNotes}
                    onChange={(e) => setIntakeNotes(e.target.value)}
                    className={`w-full rounded-xl border p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider uppercase shadow-xl transition-all disabled:opacity-50"
              >
                {submitting ? 'Processing Ingress & Minting Tokens...' : 'Submit Commodity Ingress & Mint Receipt'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}