'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeTerms) {
      setErrorMsg('Please agree to the Terms and Conditions before registering.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // 1. Sign up user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setErrorMsg(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Insert profile record into public.users
      const { error: dbError } = await supabase.from('users').insert({
        id: authData.user.id,
        name: fullName,
        email: email,
        phone: phone,
        role: role,
      });

      if (dbError) {
        setErrorMsg(dbError.message);
      } else {
        alert('Account created successfully!');
        router.push('/login');
      }
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 relative flex items-center justify-center p-4 overflow-hidden ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Background Subtle Grid Lines & Animated Glowing Orbs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute -top-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-25 animate-pulse ${isDarkMode ? 'bg-blue-900' : 'bg-blue-300'}`}></div>
        <div className={`absolute bottom-0 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20 animate-bounce duration-1000 ${isDarkMode ? 'bg-indigo-950' : 'bg-indigo-200'}`}></div>
      </div>

      {/* Dark/Light Mode Toggle Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2.5 rounded-xl border text-sm transition-all duration-300 shadow-sm ${isDarkMode ? 'border-slate-700 bg-slate-900 text-amber-400 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
          title="Toggle Dark/Light Mode"
        >
          {isDarkMode ? '🌞 Light' : '🌙 Dark'}
        </button>
      </div>

      {/* Registration Card */}
      <div className={`relative z-10 w-full max-w-lg rounded-2xl p-8 sm:p-10 shadow-2xl border backdrop-blur-xl transition-all duration-500 ${isDarkMode ? 'bg-slate-900/80 border-slate-800 shadow-blue-950/20' : 'bg-white/90 border-slate-200/80 shadow-slate-200'}`}>
        
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-950 to-indigo-900 text-white font-extrabold text-xl shadow-lg shadow-blue-950/40 border border-blue-800/50 mb-4">
            W
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Create Ecosystem Account
          </h2>
          <p className={`text-xs sm:text-sm mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Register for Warehousing, QA & Digital Tokenization Access
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs sm:text-sm text-red-600 dark:text-red-400 animate-shake">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Umar Kabir"
              className={`w-full rounded-xl border p-3 text-sm transition-all outline-none focus:ring-2 focus:ring-blue-600 ${isDarkMode ? 'bg-slate-950/60 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50/50 border-slate-300 text-slate-900 placeholder-slate-400'}`}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                className={`w-full rounded-xl border p-3 text-sm transition-all outline-none focus:ring-2 focus:ring-blue-600 ${isDarkMode ? 'bg-slate-950/60 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50/50 border-slate-300 text-slate-900 placeholder-slate-400'}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Phone Number
              </label>
              <input
                type="text"
                required
                placeholder="+234..."
                className={`w-full rounded-xl border p-3 text-sm transition-all outline-none focus:ring-2 focus:ring-blue-600 ${isDarkMode ? 'bg-slate-950/60 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50/50 border-slate-300 text-slate-900 placeholder-slate-400'}`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Account Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={`w-full rounded-xl border p-3 text-sm transition-all outline-none focus:ring-2 focus:ring-blue-600 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
            >
              <option value="customer">Customer / Commodity Owner</option>
              <option value="warehouse_owner">Warehouse Owner</option>
              <option value="warehouse_manager">Warehouse Manager</option>
              <option value="qa_inspector">QA Inspector</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className={`w-full rounded-xl border p-3 text-sm transition-all outline-none focus:ring-2 focus:ring-blue-600 ${isDarkMode ? 'bg-slate-950/60 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50/50 border-slate-300 text-slate-900 placeholder-slate-400'}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Terms and Conditions Checkbox */}
          <div className="flex items-start space-x-3 pt-2">
            <input
              type="checkbox"
              id="terms"
              required
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900 cursor-pointer"
            />
            <label htmlFor="terms" className={`text-xs leading-relaxed cursor-pointer ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              I agree to the <span className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Terms and Conditions</span> & Privacy Policy for Asset Tokenization.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-950/30 hover:shadow-blue-900/50 hover:scale-[1.01] active:scale-[0.99] border border-blue-800/40 transition-all duration-300 disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating Account...' : 'Create Account &rarr;'}
          </button>
        </form>

        {/* Redirect to Login Link */}
        <div className={`mt-8 text-center text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Already have an account?{' '}
          <button
            onClick={() => router.push('/login')}
            className="font-bold text-blue-600 dark:text-blue-400 hover:underline focus:outline-none ml-1"
          >
            Sign In here
          </button>
        </div>
      </div>
    </div>
  );
}