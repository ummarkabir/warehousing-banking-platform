'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function CommodityDepositPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [commodityName, setCommodityName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingWh, setFetchingWh] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const supabase = createClient();
  const router = useRouter();

  // Fetch approved warehouses on component mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name, location');

      if (error) {
        setErrorMsg('Failed to load storage facilities.');
      } else if (data) {
        setWarehouses(data);
      }
      setFetchingWh(false);
    };

    fetchWarehouses();
  }, [supabase]);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      router.push('/login');
      return;
    }

    // 2. Insert commodity record into public.commodities table
    const { error: dbError } = await supabase.from('commodities').insert({
      customer_id: user.id,
      warehouse_id: selectedWarehouse,
      name: commodityName,
      quantity: parseFloat(quantity),
      estimated_value: parseFloat(estimatedValue || '0'),
      status: 'tokenized', // default status upon digital receipt creation
    });

    if (dbError) {
      setErrorMsg(dbError.message);
    } else {
      alert('Commodity successfully deposited and tokenized into digital receipt!');
      router.push('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900">
          Deposit & Tokenize Commodity
        </h2>
        <p className="text-center text-xs text-gray-500 mt-1">
          Convert physical agricultural goods into secure digital warehouse receipts
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xs border border-gray-200 rounded-xl sm:px-10">
          {errorMsg && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
              {errorMsg}
            </div>
          )}

          {fetchingWh ? (
            <div className="text-center py-6">
              <p className="text-xs text-gray-500 animate-pulse">Loading available warehouses...</p>
            </div>
          ) : (
            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Select Warehouse Facility
                </label>
                <select
                  required
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                >
                  <option value="">-- Choose Storage Location --</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Commodity Name / Type
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dry Maize / White Sorghum"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  value={commodityName}
                  onChange={(e) => setCommodityName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Quantity (Metric Tons / Bags)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 250"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Estimated Valuation (₦)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 15000000"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Tokenizing Asset...' : 'Deposit & Generate Token'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              &larr; Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}