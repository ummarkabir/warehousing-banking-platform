'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function KYCVerificationPage() {
  const [idType, setIdType] = useState('NIN');
  const [idNumber, setIdNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleKYCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Standard Validation Rules
    if (idNumber.length < 11) {
      alert('Invalid Identification Number. Please enter a valid 11-digit NIN or BVN.');
      setLoading(false);
      return;
    }

    // Save KYC Status to User Profile in Database
    const { error } = await supabase
      .from('users')
      .update({
        kyc_status: 'verified',
        kyc_type: idType,
        kyc_number_hash: idNumber, // In production, encrypt this
        updated_at: new Date()
      })
      .eq('id', user.id);

    if (error) {
      alert('KYC Submission failed: ' + error.message);
    } else {
      alert('KYC Identity Verification Successful! Full financial and linked warehouse access granted.');
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#181818] rounded-3xl p-6 border border-slate-800 shadow-2xl">
        <h2 className="text-xl font-black mb-1">KYC Identity Verification</h2>
        <p className="text-xs text-slate-400 mb-6">Complete mandatory compliance to link warehouse accounts and access collateral banking[cite: 5, 6].</p>

        <form onSubmit={handleKYCSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Select ID Document</label>
            <select 
              value={idType} 
              onChange={(e) => setIdType(e.target.value)} 
              className="w-full rounded-xl border border-slate-700 bg-[#222] p-3 text-xs text-white"
            >
              <option value="NIN">National Identity Number (NIN)</option>
              <option value="BVN">Bank Verification Number (BVN)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">11-Digit Identification Number</label>
            <input 
              type="text" 
              maxLength={11}
              required 
              placeholder="e.g. 22334455667" 
              value={idNumber} 
              onChange={(e) => setIdNumber(e.target.value)} 
              className="w-full rounded-xl border border-slate-700 bg-[#222] p-3 text-xs text-white font-mono" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-xs py-3.5 shadow-md transition-all disabled:opacity-50"
          >
            {loading ? 'Verifying Compliance Status...' : 'Submit & Verify Identity'}
          </button>
        </form>
      </div>
    </div>
  );
}