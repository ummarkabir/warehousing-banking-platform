'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      // Shigar da ke da nasara: Nuna Success Modal kafin a koma Dashboard
      setLoading(false);
      setShowSuccessModal(true);

      setTimeout(() => {
        router.push('/dashboard');
      }, 1800); // Tura shi zuwa Dashboard bayan sakan 1.8
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 relative flex items-center justify-center p-4 overflow-hidden ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Background Grid Lines & Animated Glowing Orbs */}
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

      {/* Login Card */}
      <div className={`relative z-10 w-full max-w-md rounded-2xl p-8 sm:p-10 shadow-2xl border backdrop-blur-xl transition-all duration-500 ${isDarkMode ? 'bg-slate-900/80 border-slate-800 shadow-blue-950/20' : 'bg-white/90 border-slate-200/80 shadow-slate-200'}`}>
        
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-950 to-indigo-900 text-white font-extrabold text-xl shadow-lg shadow-blue-950/40 border border-blue-800/50 mb-4">
            W
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Sign In Portal
          </h2>
          <p className={`text-xs sm:text-sm mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Access your Warehousing & Digital Tokenization Dashboard
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs sm:text-sm text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
            <div className="flex justify-between items-center mb-1.5">
              <label className={`block text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Password
              </label>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              className={`w-full rounded-xl border p-3 text-sm transition-all outline-none focus:ring-2 focus:ring-blue-600 ${isDarkMode ? 'bg-slate-950/60 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50/50 border-slate-300 text-slate-900 placeholder-slate-400'}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-950/30 hover:shadow-blue-900/50 hover:scale-[1.01] active:scale-[0.99] border border-blue-800/40 transition-all duration-300 disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In &rarr;'}
          </button>
        </form>

        {/* Register Redirect Link */}
        <div className={`mt-8 text-center text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Don&apos;t have an account?{' '}
          <button
            onClick={() => router.push('/register')}
            className="font-bold text-blue-600 dark:text-blue-400 hover:underline focus:outline-none ml-1"
          >
            Create Account here
          </button>
        </div>
      </div>

      {/* --- SUCCESS MODAL --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fade-in">
          <div className={`w-full max-w-sm rounded-3xl p-6 sm:p-8 text-center shadow-2xl border transform scale-100 transition-all duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
            
            {/* Animated Checkmark Icon */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/20 animate-bounce">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-xl font-extrabold tracking-tight">
              Authentication Successful!
            </h3>
            <p className={`text-xs mt-2 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Welcome back! Redirecting you to your secure ecosystem dashboard...
            </p>

            {/* Loading Spinner Dots */}
            <div className="mt-6 flex justify-center space-x-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping delay-150"></div>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping delay-300"></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}