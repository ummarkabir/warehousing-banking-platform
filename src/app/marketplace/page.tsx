'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function MarketplacePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const fetchListings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('marketplace')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (data) {
      setListings(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, [supabase]);

  const handleBuyCommodity = async (item: any) => {
    if (!confirm(`Are you sure you want to purchase ${item.commodity_name} for ₦${item.total_price.toLocaleString()}?`)) return;

    setBuyingId(item.id);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // Update status to sold in database
    const { error } = await supabase
      .from('marketplace')
      .update({ status: 'sold' })
      .eq('id', item.id);

    if (error) {
      alert('Error processing purchase: ' + error.message);
    } else {
      alert(`Success! You have purchased ${item.commodity_name}. Tokens transferred to your wallet.`);
      fetchListings();
    }
    setBuyingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              🛒 Commodity Marketplace
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Trade tokenized warehouse receipts and secure digital commodities instantly.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/commodities/deposit')}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold shadow-md transition-all"
            >
              + List Asset for Sale
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-xl bg-slate-800 text-slate-300 px-3.5 py-2 text-xs font-bold border border-slate-700 hover:bg-slate-700 transition-all"
            >
              &larr; Back to Dashboard
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
            <p className="mt-3 text-xs font-semibold text-slate-400">Loading live commodity listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 bg-[#181818] rounded-3xl border border-slate-800">
            <p className="text-sm font-bold text-slate-300">No active listings found in the marketplace.</p>
            <p className="text-xs text-slate-500 mt-1">Check back later or list your tokenized assets for sale.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((item) => (
              <div 
                key={item.id} 
                className="bg-[#181818] rounded-3xl p-5 border border-slate-800 hover:border-emerald-500/50 transition-all shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      Tokenized Receipt
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {item.quantity} Units
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-white">{item.commodity_name}</h3>
                  
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Price per Unit:</span>
                      <span className="font-bold text-slate-200">₦{(item.unit_price || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Total Value:</span>
                      <span className="font-black text-emerald-400 text-sm">₦{(item.total_price || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={buyingId === item.id}
                  onClick={() => handleBuyCommodity(item)}
                  className="mt-6 w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 text-xs tracking-wide shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {buyingId === item.id ? 'Processing Purchase...' : 'Buy Commodity Token'}
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}