'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AdminVerifyPage() {
  const [commodities, setCommodities] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'commodities' | 'loans' | 'warehouses'>('commodities');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const supabase = createClient();
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Fetch commodities
    const { data: commData, error: commError } = await supabase
      .from('commodities')
      .select('id, name, commodity_type, quantity, estimated_value, status, created_at')
      .order('created_at', { ascending: false });

    // 2. Fetch loan requests
    const { data: loanData, error: loanError } = await supabase
      .from('loan_requests')
      .select('id, requested_amount, collateral_value, tenure_months, status, created_at')
      .order('created_at', { ascending: false });

    // 3. Fetch warehouses pending/approved status
    const { data: whData, error: whError } = await supabase
      .from('warehouses')
      .select('id, name, location, capacity, status, inspection_status, created_at')
      .order('created_at', { ascending: false });

    if (commError || loanError || whError) {
      setErrorMsg('Failed to load admin verification records.');
    } else {
      if (commData) setCommodities(commData);
      if (loanData) setLoans(loanData);
      if (whData) setWarehouses(whData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  // Update Commodity Status
  const handleUpdateCommodityStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('commodities')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert('Error updating commodity status: ' + error.message);
    } else {
      alert(`Commodity status updated to '${newStatus}' successfully!`);
      fetchData();
    }
  };

  // Update Loan Status
  const handleUpdateLoanStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('loan_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert('Error updating loan status: ' + error.message);
    } else {
      alert(`Loan request status updated to '${newStatus}' successfully!`);
      fetchData();
    }
  };

  // Update Warehouse Approval Status
  const handleUpdateWarehouseStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('warehouses')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert('Error updating warehouse status: ' + error.message);
    } else {
      alert(`Warehouse status updated to '${newStatus}' successfully!`);
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Admin Verification & Oversight Panel
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Review and authorize token deposits, collateral financing, and physical warehouse facilities
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-lg bg-white border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            &larr; Back to Dashboard
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
            {errorMsg}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-4 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('commodities')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'commodities'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Tokenized Commodities ({commodities.length})
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'loans'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Loan Requests ({loans.length})
          </button>
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'warehouses'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Warehouse Approvals ({warehouses.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 animate-pulse">Loading verification records...</p>
          </div>
        ) : activeTab === 'commodities' ? (
          /* Commodities Table */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Commodity Name</th>
                    <th className="py-3 px-4 font-semibold">Quantity</th>
                    <th className="py-3 px-4 font-semibold">Estimated Value</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {commodities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        No commodity records found.
                      </td>
                    </tr>
                  ) : (
                    commodities.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="py-3.5 px-4 font-medium text-gray-900">
                          {item.name || item.commodity_type}
                        </td>
                        <td className="py-3.5 px-4">{item.quantity} Units</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600">
                          ₦{(item.estimated_value || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 uppercase">
                            {item.status || 'tokenized'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleUpdateCommodityStatus(item.id, 'verified')}
                            className="bg-emerald-600 text-white px-2.5 py-1 rounded text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleUpdateCommodityStatus(item.id, 'rejected')}
                            className="bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded text-[11px] font-semibold hover:bg-red-100 transition-colors"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'loans' ? (
          /* Loans Table */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Requested Amount</th>
                    <th className="py-3 px-4 font-semibold">Collateral Value</th>
                    <th className="py-3 px-4 font-semibold">Tenure</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {loans.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        No loan requests found.
                      </td>
                    </tr>
                  ) : (
                    loans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-gray-50/50">
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          ₦{loan.requested_amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-600">
                          ₦{loan.collateral_value.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">{loan.tenure_months} Months</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 uppercase">
                            {loan.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleUpdateLoanStatus(loan.id, 'approved')}
                            className="bg-emerald-600 text-white px-2.5 py-1 rounded text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateLoanStatus(loan.id, 'rejected')}
                            className="bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded text-[11px] font-semibold hover:bg-red-100 transition-colors"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Warehouses Table */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Warehouse Name</th>
                    <th className="py-3 px-4 font-semibold">Location</th>
                    <th className="py-3 px-4 font-semibold">Capacity</th>
                    <th className="py-3 px-4 font-semibold">QA Inspection</th>
                    <th className="py-3 px-4 font-semibold">Overall Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {warehouses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        No warehouse facilities registered.
                      </td>
                    </tr>
                  ) : (
                    warehouses.map((wh) => (
                      <tr key={wh.id} className="hover:bg-gray-50/50">
                        <td className="py-3.5 px-4 font-bold text-gray-900">{wh.name}</td>
                        <td className="py-3.5 px-4 text-gray-500">📍 {wh.location}</td>
                        <td className="py-3.5 px-4">{wh.capacity} Tons</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 uppercase">
                            {wh.inspection_status || 'pending'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            wh.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {wh.status || 'pending'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleUpdateWarehouseStatus(wh.id, 'approved')}
                            className="bg-emerald-600 text-white px-2.5 py-1 rounded text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateWarehouseStatus(wh.id, 'rejected')}
                            className="bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded text-[11px] font-semibold hover:bg-red-100 transition-colors"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}