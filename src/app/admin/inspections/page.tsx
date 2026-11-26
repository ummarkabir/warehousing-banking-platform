'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AdminInspectionsPage() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);

  const supabase = createClient();
  const router = useRouter();

  // Detect user's preference for dark or light mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  // Fetch all inspection records with warehouse and inspector details
  const fetchInspections = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // Verify Admin / Superadmin privilege
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      alert('Unauthorized access: Only administrators can view inspection records.');
      router.push('/dashboard');
      return;
    }

    const { data, error } = await supabase
      .from('inspections')
      .select(`
        *,
        warehouses ( name, location, capacity ),
        users ( name, email )
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setInspections(data);
    } else if (error) {
      console.error('Error fetching inspections:', error.message);
    }

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  return (
    <div className={`min-h-screen transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8 font-sans ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/40 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight">QA Inspection Management Hub</h1>
              <span className="bg-teal-500/10 text-teal-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-teal-500/20">
                Compliance Auditing
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Monitor warehouse facility evaluations, quality checklists, and inspector recommendations across storage nodes.
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

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-4 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Evaluations</p>
            <p className="text-2xl font-extrabold mt-1 text-teal-400">{inspections.length} <span className="text-xs font-normal text-slate-400">Reports</span></p>
          </div>

          <div className={`p-4 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Approved Facilities</p>
            <p className="text-2xl font-extrabold mt-1 text-emerald-400">
              {inspections.filter(i => i.recommendation === 'approve').length} <span className="text-xs font-normal text-slate-400">Nodes</span>
            </p>
          </div>

          <div className={`p-4 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pending Review</p>
            <p className="text-2xl font-extrabold mt-1 text-amber-400">
              {inspections.filter(i => i.recommendation === 'needs_review' || !i.recommendation).length} <span className="text-xs font-normal text-slate-400">Reports</span>
            </p>
          </div>
        </div>

        {/* Inspections Table Container */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent"></div>
            <p className="mt-3 text-xs font-semibold text-slate-400">Loading inspection audit logs...</p>
          </div>
        ) : (
          <div className={`rounded-3xl border shadow-xl overflow-hidden ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`font-bold uppercase text-[10px] ${isDarkMode ? 'bg-[#222] text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                  <tr>
                    <th className="p-4">Facility Name</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Certified Inspector</th>
                    <th className="p-4">Recommendation</th>
                    <th className="p-4">Evaluation Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800 text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
                  {inspections.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-400">No warehouse inspection reports found.</td></tr>
                  ) : (
                    inspections.map((ins) => (
                      <tr key={ins.id} className={`transition-colors ${isDarkMode ? 'hover:bg-[#222]' : 'hover:bg-slate-50'}`}>
                        <td className="p-4 font-bold text-sm">{ins.warehouses?.name || 'Storage Facility'}</td>
                        <td className="p-4 text-slate-400">{ins.warehouses?.location || 'N/A'}</td>
                        <td className="p-4 font-medium">{ins.users?.name || ins.users?.email || 'Inspector'}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            ins.recommendation === 'approve' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            ins.recommendation === 'reject' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {ins.recommendation || 'Needs Review'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">{new Date(ins.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedInspection(ins)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-[11px] shadow-sm transition-all"
                          >
                            View Checklist
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

      {/* --- INSPECTION DETAILS MODAL --- */}
      {selectedInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border space-y-4 max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-[#181818] border-[#262626] text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            
            <div className="flex justify-between items-start border-b border-slate-700/40 pb-3">
              <div>
                <h3 className="text-lg font-black">Inspection Audit Report</h3>
                <p className="text-xs text-slate-400">{selectedInspection.warehouses?.name} ({selectedInspection.warehouses?.location})</p>
              </div>
              <button 
                onClick={() => setSelectedInspection(null)}
                className="text-slate-400 hover:text-white font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Inspector:</span>
                  <span className="font-bold">{selectedInspection.users?.name || selectedInspection.users?.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Recommendation:</span>
                  <span className="font-bold uppercase text-teal-400">{selectedInspection.recommendation || 'Pending'}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-300 mb-1">Inspector Remarks & Notes:</h4>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 italic leading-relaxed">
                  {selectedInspection.inspector_notes || 'No remarks provided by the inspector.'}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-300 mb-1">Checklist Evaluation Data:</h4>
                <pre className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedInspection.checklist, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedInspection(null)}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all border border-slate-700"
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}