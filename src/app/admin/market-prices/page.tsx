'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function MarketPricesPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commodityName, setCommodityName] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const supabase = createClient();
  const router = useRouter();

  const fetchPrices = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('market_prices').select('*').order('created_at', { ascending: false });
    if (data) setPrices(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPrices();
  }, [supabase]);

  const handleAddPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('market_prices').insert({
      commodity_name: commodityName,
      price_per_unit: parseFloat(pricePerUnit),
      updated_at: new Date()
    });

    if (error) {
      alert('Error updating price: ' + error.message);
    } else {
      alert('Market price updated successfully for automatic tokenization!');
      setCommodityName('');
      setPricePerUnit('');
      fetchPrices();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Commodity Market Pricing & Tokenization</h1>
            <p className="text-xs text-slate-500">Manage real-time market prices used for automatic commodity valuation and token generation.</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="rounded-xl bg-slate-200 text-slate-800 px-3.5 py-2 text-xs font-bold">&larr; Dashboard</button>
        </div>

        {/* Add / Update Form */}
        <div className="bg-white p-6 rounded-2xl border shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Set New Commodity Market Value</h3>
          <form onSubmit={handleAddPrice} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input type="text" placeholder="Commodity Name (e.g. Maize, Rice)" required value={commodityName} onChange={(e) => setCommodityName(e.target.value)} className="rounded-xl border p-2.5 text-xs text-slate-900" />
            <input type="number" placeholder="Price per Unit (NGN)" required value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} className="rounded-xl border p-2.5 text-xs text-slate-900" />
            <button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 shadow-md">Update Valuation Engine</button>
          </form>
        </div>

        {/* Prices Table */}
        <div className="bg-white rounded-2xl border overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Commodity</th>
                <th className="p-4">Current Price / Unit (NGN)</th>
                <th className="p-4">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-700">
              {prices.length === 0 ? (
                <tr><td colSpan={3} className="p-6 text-center text-slate-400">No market prices configured yet.</td></tr>
              ) : (
                prices.map((p) => (
                  <tr key={p.id}>
                    <td className="p-4 font-bold text-slate-900">{p.commodity_name}</td>
                    <td className="p-4 font-extrabold text-emerald-600">₦{(p.price_per_unit || 0).toLocaleString()}</td>
                    <td className="p-4 text-slate-500">{new Date(p.updated_at || p.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}