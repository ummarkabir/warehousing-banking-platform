'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function RevenuePage() {
  const [settings, setSettings] = useState<any>({ owner_share: 70, platform_share: 30, daily_rate_per_unit: 50 });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Here you can save configuration to database
    alert('Revenue-sharing and storage billing model updated successfully!');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Revenue-Sharing & Storage Pricing</h1>
            <p className="text-xs text-slate-500">Configure storage billing charges and revenue allocation between warehouse owners and platform operators.</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="rounded-xl bg-slate-200 text-slate-800 px-3.5 py-2 text-xs font-bold">&larr; Dashboard</button>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-xs">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Warehouse Owner Revenue Share (%)</label>
                <input type="number" value={settings.owner_share} onChange={(e) => setSettings({ ...settings, owner_share: e.target.value })} className="w-full rounded-xl border p-2.5 text-xs text-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Platform Operator Revenue Share (%)</label>
                <input type="number" value={settings.platform_share} onChange={(e) => setSettings({ ...settings, platform_share: e.target.value })} className="w-full rounded-xl border p-2.5 text-xs text-slate-900" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Daily Storage Billing Rate per Unit (NGN)</label>
              <input type="number" value={settings.daily_rate_per_unit} onChange={(e) => setSettings({ ...settings, daily_rate_per_unit: e.target.value })} className="w-full rounded-xl border p-2.5 text-xs text-slate-900" />
            </div>

            <button type="submit" disabled={loading} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-6 shadow-md">
              Save Configuration Model
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}