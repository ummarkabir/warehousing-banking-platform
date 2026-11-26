'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function InspectorDashboardPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  
  // QA Checklist States
  const [capacityCheck, setCapacityCheck] = useState(false);
  const [securityCheck, setSecurityCheck] = useState(false);
  const [ventilationCheck, setVentilationCheck] = useState(false);
  const [pestControlCheck, setPestControlCheck] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const fetchAssignedWarehouses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('warehouses')
      .select('id, name, location, capacity, status, inspection_status')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setWarehouses(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignedWarehouses();
  }, [supabase]);

  const handleSelectWarehouse = (w: any) => {
    setSelectedWarehouse(w);
    setCapacityCheck(false);
    setSecurityCheck(false);
    setVentilationCheck(false);
    setPestControlCheck(false);
    setNotes('');
  };

  const handleSubmitInspection = async (recommendation: 'recommended' | 'rejected') => {
    if (!selectedWarehouse) return;

    // Professional validation check
    if (recommendation === 'recommended' && (!capacityCheck || !securityCheck || !ventilationCheck || !pestControlCheck)) {
      if (!confirm('Compliance Warning: Not all mandatory QA checklist items are verified. Are you sure you want to approve this facility?')) {
        return;
      }
    }

    if (!notes.trim()) {
      alert('Professional Requirement: Please provide inspector remarks/comments before submitting the audit report.');
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Log Inspection Audit Trail in warehouse_inspections table
    const { error: inspectError } = await supabase.from('warehouse_inspections').insert({
      warehouse_id: selectedWarehouse.id,
      inspector_id: user?.id || null,
      capacity_verified: capacityCheck,
      security_verified: securityCheck,
      ventilation_verified: ventilationCheck,
      pest_control_verified: pestControlCheck,
      status: recommendation,
      report_notes: notes,
    });

    if (inspectError) {
      alert('Audit log submission failed: ' + inspectError.message);
      setSubmitting(false);
      return;
    }

    // 2. Update Facility Status in Core Registry (warehouses table)
    const newInspectionStatus = recommendation === 'recommended' ? 'inspection_passed' : 'inspection_failed';
    const newOverallStatus = recommendation === 'recommended' ? 'approved' : 'rejected';

    const { error: updateError } = await supabase
      .from('warehouses')
      .update({ 
        inspection_status: newInspectionStatus,
        status: newOverallStatus 
      })
      .eq('id', selectedWarehouse.id);

    if (updateError) {
      alert('Failed to update warehouse status: ' + updateError.message);
    } else {
      alert(`Facility audit completed successfully: ${recommendation === 'recommended' ? 'APPROVED' : 'REJECTED'}`);
      setSelectedWarehouse(null);
      fetchAssignedWarehouses();
    }
    
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Inspector & QA Verification Portal
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Regulatory compliance interface for physical warehouse auditing and tokenization authorization.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-lg bg-white border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            &larr; Back to Dashboard
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 animate-pulse">Syncing inspection registry...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Queue */}
            <div className="md:col-span-1 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Audit Queue ({warehouses.length})
              </h3>
              {warehouses.map((w) => (
                <div
                  key={w.id}
                  onClick={() => handleSelectWarehouse(w)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedWarehouse?.id === w.id
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <h4 className="font-bold text-sm text-slate-900">{w.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">📍 {w.location || 'Kano'}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-400">
                      Cap: {w.capacity ? Number(w.capacity).toLocaleString() : 0} Tons
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      w.inspection_status === 'inspection_passed' || w.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : w.inspection_status === 'inspection_failed' || w.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {w.inspection_status || w.status || 'pending_inspection'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Execution Panel */}
            <div className="md:col-span-2">
              {selectedWarehouse ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {selectedWarehouse.name}
                      </h3>
                      <p className="text-xs text-slate-500">📍 {selectedWarehouse.location}</p>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-semibold">
                      Max Capacity: {selectedWarehouse.capacity} Tons
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
                    Mandatory Compliance Checklist
                  </p>

                  <div className="space-y-3 mb-6">
                    <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={capacityCheck}
                        onChange={(e) => setCapacityCheck(e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded border-slate-300"
                      />
                      <span className="text-xs font-medium text-slate-700">Storage Area & Metric Capacity Verified</span>
                    </label>

                    <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securityCheck}
                        onChange={(e) => setSecurityCheck(e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded border-slate-300"
                      />
                      <span className="text-xs font-medium text-slate-700">Perimeter Security & CCTV Telemetry Operational</span>
                    </label>

                    <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ventilationCheck}
                        onChange={(e) => setVentilationCheck(e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded border-slate-300"
                      />
                      <span className="text-xs font-medium text-slate-700">Climate, Ventilation & Humidity Controls Stable</span>
                    </label>

                    <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pestControlCheck}
                        onChange={(e) => setPestControlCheck(e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded border-slate-300"
                      />
                      <span className="text-xs font-medium text-slate-700">Fumigation, Pest Control & Hygiene Compliant</span>
                    </label>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Auditor / Inspector Remarks (Required)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Enter formal inspection observations or compliance exceptions..."
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleSubmitInspection('recommended')}
                      disabled={submitting}
                      className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Processing...' : 'Recommend Approval'}
                    </button>
                    <button
                      onClick={() => handleSubmitInspection('rejected')}
                      disabled={submitting}
                      className="flex-1 rounded-lg bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Processing...' : 'Recommend Rejection'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-400">Select a warehouse facility from the audit queue to execute verification.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}