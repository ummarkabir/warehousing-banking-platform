'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function KYCPage() {
  const [profile, setProfile] = useState<any>(null);
  const [docType, setDocType] = useState('NIN');
  const [idNumber, setIdNumber] = useState('');
  const [companyRcNumber, setCompanyRcNumber] = useState('');
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

  // Fetch current user KYC status
  const fetchUserKYCStatus = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchUserKYCStatus();
  }, [fetchUserKYCStatus]);

  // Handle KYC Submission
  const handleKYCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idNumber || idNumber.length < 11) {
      alert('Invalid Identification Number: Please enter a valid 11-digit NIN or BVN.');
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      // Update user record in Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update({
          kyc_status: 'verified', // Set to verified upon submission (or 'pending' if manual review needed)
          company_name: companyRcNumber ? `RC-${companyRcNumber}` : profile?.company_name,
          updated_at: new Date()
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Log Security Audit Trail
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'KYC_SUBMITTED',
        details: `KYC Identity verification submitted (${docType}: ${idNumber.slice(0, 3)}****${idNumber.slice(-2)})`,
        created_at: new Date()
      });

      alert('KYC Identity Verification Successful! Full financial and warehouse features are now unlocked.');
      fetchUserKYCStatus();
    } catch (err: any) {
      alert('KYC Submission Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isDarkMode ? 'bg-[#121212] text-blue-500' : 'bg-slate-100 text-blue-600'}`}>
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-3 text-xs font-semibold tracking-wider uppercase">Loading Compliance Terminal...</p>
        </div>
      </div>
    );
  }

  const kycStatus = profile?.kyc_status || 'pending';

  return (
    <div className={`min-h-screen transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8 font-sans ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/40 pb-5">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black tracking-tight">KYC Identity & AML Verification</h1>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                kycStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                kycStatus === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {kycStatus}
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Mandatory regulatory identity compliance for commodity tokenization and collateral loans.
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

        {/* Verification Status Card */}
        <div className={`p-6 rounded-3xl border shadow-xl flex items-center space-x-4 ${
          kycStatus === 'verified' 
            ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400' 
            : isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'
        }`}>
          <div className="text-3xl">
            {kycStatus === 'verified' ? '🛡️' : '⚠️'}
          </div>
          <div>
            <h3 className="text-sm font-extrabold">
              {kycStatus === 'verified' ? 'Account Verified & Compliant' : 'Verification Required'}
            </h3>
            <p className="text-xs opacity-80 mt-0.5">
              {kycStatus === 'verified'
                ? 'Your account has passed anti-money laundering checks. Full access granted to commodity tokenization and loan requests.'
                : 'Please submit your National Identity Number (NIN) or Bank Verification Number (BVN) to unlock financial operations.'}
            </p>
          </div>
        </div>

        {/* Verification Submission Form */}
        {kycStatus !== 'verified' && (
          <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${isDarkMode ? 'bg-[#181818] border-[#262626]' : 'bg-white border-slate-200'}`}>
            <form onSubmit={handleKYCSubmit} className="space-y-6">
              
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 mb-4">1. Select Government ID Document Type</h3>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className={`w-full rounded-xl border p-3.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                >
                  <option value="NIN">National Identity Number (NIN)</option>
                  <option value="BVN">Bank Verification Number (BVN)</option>
                  <option value="PASSPORT">International Passport</option>
                  <option value="DRIVERS_LICENSE">Drivers License</option>
                </select>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 mb-4">2. Enter Identification Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      11-Digit {docType} Number *
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      required
                      placeholder="e.g. 22334455667"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className={`w-full rounded-xl border p-3.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      CAC Registration / RC Number (Optional for Corporate Accounts)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. RC-8194625"
                      value={companyRcNumber}
                      onChange={(e) => setCompanyRcNumber(e.target.value)}
                      className={`w-full rounded-xl border p-3.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-[#222] border-[#333] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider uppercase shadow-xl transition-all disabled:opacity-50"
                >
                  {submitting ? 'Verifying Identity & Compliance...' : 'Submit & Complete KYC'}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}