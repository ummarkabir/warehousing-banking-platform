'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoanRequestPage() {
  const [userCommodities, setUserCommodities] = useState<any[]>([]);
  const [selectedCommodityId, setSelectedCommodityId] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [collateralValue, setCollateralValue] = useState(0);
  const [maxLoanAllowed, setMaxLoanAllowed] = useState(0);
  const [tenure, setTenure] = useState('3');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const supabase = createClient();
  const router = useRouter();

  // Load user's deposited commodities to use as collateral
  useEffect(() => {
    const fetchCommodities = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('commodities')
        .select('id, name, commodity_type, estimated_value, market_value, tokenized_value')
        .eq('customer_id', user.id);

      if (error) {
        setErrorMsg('Failed to load eligible collateral assets.');
      } else if (data) {
        setUserCommodities(data);
      }
      setFetchingData(false);
    };

    fetchCommodities();
  }, [supabase, router]);

  // Update collateral valuation and max loan allowed (e.g., 70% Loan-to-Value ratio)
  const handleCommodityChange = (id: string) => {
    setSelectedCommodityId(id);
    const selected = userCommodities.find((item) => item.id === id);

    if (selected) {
      const val = selected.estimated_value || selected.market_value || selected.tokenized_value || 0;
      setCollateralValue(val);
      setMaxLoanAllowed(val * 0.7); // 70% LTV max threshold
    } else {
      setCollateralValue(0);
      setMaxLoanAllowed(0);
    }
  };

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const amountNum = parseFloat(requestedAmount);

    if (amountNum > maxLoanAllowed) {
      setErrorMsg(`Loan request exceeds the maximum allowable threshold (70% LTV = ₦${maxLoanAllowed.toLocaleString()}).`);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { error: dbError } = await supabase.from('loan_requests').insert({
      borrower_id: user.id,
      commodity_id: selectedCommodityId,
      requested_amount: amountNum,
      collateral_value: collateralValue,
      tenure_months: parseInt(tenure),
      status: 'pending',
    });

    if (dbError) {
      setErrorMsg(dbError.message);
    } else {
      alert('Loan application submitted successfully! Pending verification.');
      router.push('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900">
          Apply for Commodity Loan
        </h2>
        <p className="text-center text-xs text-gray-500 mt-1">
          Pledge your tokenized warehouse receipts as collateral for instant working capital
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xs border border-gray-200 rounded-xl sm:px-10">
          {errorMsg && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
              {errorMsg}
            </div>
          )}

          {fetchingData ? (
            <div className="text-center py-6">
              <p className="text-xs text-gray-500 animate-pulse">Loading collateral assets...</p>
            </div>
          ) : userCommodities.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-gray-600 mb-4">You have no tokenized assets to use as collateral.</p>
              <button
                onClick={() => router.push('/commodities/deposit')}
                className="text-xs font-semibold text-blue-600 underline"
              >
                Deposit Commodities First &rarr;
              </button>
            </div>
          ) : (
            <form onSubmit={handleLoanSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Select Collateral Asset
                </label>
                <select
                  required
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={selectedCommodityId}
                  onChange={(e) => handleCommodityChange(e.target.value)}
                >
                  <option value="">-- Choose Tokenized Commodity --</option>
                  {userCommodities.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name || item.commodity_type} (Valued: ₦{(item.estimated_value || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {collateralValue > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 space-y-1">
                  <p><strong>Collateral Value:</strong> ₦{collateralValue.toLocaleString()}</p>
                  <p><strong>Max Eligible Loan (70% LTV):</strong> ₦{maxLoanAllowed.toLocaleString()}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Requested Loan Amount (₦)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000000"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Loan Tenure (Months)
                </label>

                <select
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={tenure}
                  onChange={(e) => setTenure(e.target.value)}
                >
                  <option value="1">1 Month</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Submitting Application...' : 'Submit Loan Application'}
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