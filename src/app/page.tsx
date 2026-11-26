'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={`min-h-screen transition-colors duration-500 overflow-x-hidden relative ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Background Subtle Grid Lines & Glowing Orbs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute -top-40 -left-40 w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-25 animate-pulse ${isDarkMode ? 'bg-blue-900' : 'bg-blue-300'}`}></div>
        <div className={`absolute top-1/3 -right-20 w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-20 animate-bounce duration-1000 ${isDarkMode ? 'bg-indigo-950' : 'bg-indigo-200'}`}></div>
        <div className={`absolute -bottom-20 left-1/3 w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-15 animate-pulse ${isDarkMode ? 'bg-blue-950' : 'bg-teal-200'}`}></div>
      </div>

      {/* Top Navigation Bar */}
      <header className={`relative z-50 backdrop-blur-md border-b px-4 sm:px-8 py-4 flex justify-between items-center transition-colors duration-500 ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => router.push('/')}>
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-blue-950 via-blue-900 to-indigo-950 flex items-center justify-center text-white font-extrabold text-lg sm:text-xl shadow-lg shadow-blue-950/40 border border-blue-800/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            W
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight bg-gradient-to-r from-blue-900 to-indigo-900 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              WareFlow & Tokenization
            </h1>
            <p className={`text-[10px] sm:text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Enterprise Ecosystem</p>
          </div>
        </div>

        {/* Desktop Navigation Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl border text-sm transition-all duration-300 ${isDarkMode ? 'border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700' : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            title="Toggle Dark/Light Mode"
          >
            {isDarkMode ? '🌞 Light' : '🌙 Dark'}
          </button>

          <button
            onClick={() => router.push('/login')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${isDarkMode ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-700 hover:bg-slate-100'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => router.push('/register')}
            className="rounded-xl bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-950/30 hover:shadow-blue-900/50 hover:scale-105 active:scale-95 border border-blue-800/40 transition-all duration-300"
          >
            Get Started &rarr;
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-1.5 rounded-lg border text-xs ${isDarkMode ? 'border-slate-700 bg-slate-800 text-amber-400' : 'border-slate-300 bg-slate-100 text-slate-700'}`}
          >
            {isDarkMode ? '🌞' : '🌙'}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-lg border text-xs font-bold ${isDarkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-800'}`}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className={`md:hidden absolute top-16 left-0 right-0 z-40 border-b p-4 space-y-3 shadow-xl backdrop-blur-lg transition-all ${isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'}`}>
          <button
            onClick={() => { setMobileMenuOpen(false); router.push('/login'); }}
            className={`w-full text-left py-2.5 px-3 rounded-lg text-xs font-semibold ${isDarkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-800 hover:bg-slate-100'}`}
          >
            Sign In (Login)
          </button>
          <button
            onClick={() => { setMobileMenuOpen(false); router.push('/register'); }}
            className="w-full text-center py-2.5 px-3 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-950 to-indigo-950 shadow-md"
          >
            Get Started &rarr;
          </button>
        </div>
      )}

      {/* Hero Section */}
      <main className="relative z-10 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32 text-center">
          
          <div className="inline-flex items-center px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-blue-950/10 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300 mb-6 sm:mb-8 border border-blue-900/20 backdrop-blur-sm animate-bounce">
            ✨ Next-Gen Agricultural Asset Digitization & Settlement
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tight max-w-5xl mx-auto leading-tight">
            Secure Warehousing, Quality Assurance & <span className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 dark:from-blue-400 dark:via-indigo-400 dark:to-teal-300 bg-clip-text text-transparent">Commodity Tokenization</span>
          </h2>
          
          <p className={`mt-4 sm:mt-6 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Transform physical agricultural storage into liquid digital assets. Empowering farmers, warehouse owners, inspectors, and financial partners with robust Role-Based Access Control (RBAC).
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <button
              onClick={() => router.push('/register')}
              className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-white shadow-xl shadow-blue-950/40 hover:shadow-blue-900/60 hover:scale-105 active:scale-95 border border-blue-800/50 transition-all duration-300"
            >
              Create Account Free
            </button>
            <button
              onClick={() => router.push('/login')}
              className={`w-full sm:w-auto rounded-xl border px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-bold shadow-sm backdrop-blur-sm hover:scale-105 active:scale-95 transition-all duration-300 ${isDarkMode ? 'border-slate-800 bg-slate-900/60 text-slate-200 hover:bg-slate-800' : 'border-slate-300 bg-white/80 text-slate-700 hover:bg-slate-50'}`}
            >
              Access Portal (Login)
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            
            {/* Feature 1 */}
            <div className={`p-5 sm:p-6 rounded-2xl border transition-all duration-500 group cursor-pointer backdrop-blur-md hover:-translate-y-2 hover:shadow-2xl ${isDarkMode ? 'bg-slate-900/60 border-slate-800 hover:border-blue-800 shadow-blue-950/20' : 'bg-white/80 border-slate-200 hover:border-blue-900/40 shadow-xl'}`}>
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-tr from-blue-950 to-blue-800 text-white flex items-center justify-center font-bold mb-4 sm:mb-5 text-xl sm:text-2xl shadow-lg shadow-blue-950/40 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                🏢
              </div>
              <h3 className={`font-bold text-sm sm:text-base transition-colors ${isDarkMode ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-900'}`}>Warehouse Registration</h3>
              <p className={`text-xs mt-2 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Submit storage facility credentials, metrics, and capacity specifications for regulatory audits.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`p-5 sm:p-6 rounded-2xl border transition-all duration-500 group cursor-pointer backdrop-blur-md hover:-translate-y-2 hover:shadow-2xl ${isDarkMode ? 'bg-slate-900/60 border-slate-800 hover:border-teal-800 shadow-teal-950/20' : 'bg-white/80 border-slate-200 hover:border-teal-900/40 shadow-xl'}`}>
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-tr from-teal-900 to-emerald-700 text-white flex items-center justify-center font-bold mb-4 sm:mb-5 text-xl sm:text-2xl shadow-lg shadow-teal-950/40 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                🔍
              </div>
              <h3 className={`font-bold text-sm sm:text-base transition-colors ${isDarkMode ? 'text-white group-hover:text-teal-400' : 'text-slate-900 group-hover:text-teal-900'}`}>Inspector QA Portal</h3>
              <p className={`text-xs mt-2 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Rigorous compliance inspections covering security, ventilation, capacity, and pest control management.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`p-5 sm:p-6 rounded-2xl border transition-all duration-500 group cursor-pointer backdrop-blur-md hover:-translate-y-2 hover:shadow-2xl ${isDarkMode ? 'bg-slate-900/60 border-slate-800 hover:border-purple-800 shadow-purple-950/20' : 'bg-white/80 border-slate-200 hover:border-purple-900/40 shadow-xl'}`}>
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-tr from-purple-950 to-indigo-800 text-white flex items-center justify-center font-bold mb-4 sm:mb-5 text-xl sm:text-2xl shadow-lg shadow-purple-950/40 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                📦
              </div>
              <h3 className={`font-bold text-sm sm:text-base transition-colors ${isDarkMode ? 'text-white group-hover:text-purple-400' : 'text-slate-900 group-hover:text-purple-900'}`}>Commodity Tokenization</h3>
              <p className={`text-xs mt-2 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Deposit agricultural inventory and instantly generate verifiable digital warehouse receipt tokens.
              </p>
            </div>

            {/* Feature 4 */}
            <div className={`p-5 sm:p-6 rounded-2xl border transition-all duration-500 group cursor-pointer backdrop-blur-md hover:-translate-y-2 hover:shadow-2xl ${isDarkMode ? 'bg-slate-900/60 border-slate-800 hover:border-amber-800 shadow-amber-950/20' : 'bg-white/80 border-slate-200 hover:border-amber-900/40 shadow-xl'}`}>
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-tr from-amber-900 to-orange-700 text-white flex items-center justify-center font-bold mb-4 sm:mb-5 text-xl sm:text-2xl shadow-lg shadow-amber-950/40 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                🏦
              </div>
              <h3 className={`font-bold text-sm sm:text-base transition-colors ${isDarkMode ? 'text-white group-hover:text-amber-400' : 'text-slate-900 group-hover:text-amber-900'}`}>Collateral Financing</h3>
              <p className={`text-xs mt-2 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Pledge tokenized asset receipts as secure collateral to access instant micro-loans and liquidity.
              </p>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`relative z-10 border-t py-6 sm:py-8 px-4 sm:px-8 text-center text-[11px] sm:text-xs transition-colors duration-500 ${isDarkMode ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-white/80 border-slate-200 text-slate-500'}`}>
        <p>&copy; 2026 Warehousing & Digital Tokenization Ecosystem. All rights reserved.</p>
      </footer>
    </div>
  );
}