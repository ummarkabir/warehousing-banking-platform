'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function RegisterWarehousePage() {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const supabase = createClient();
  const router = useRouter();

  const handleWarehouseRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // 1. Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      router.push('/login');
      return;
    }

    const parsedCapacity = parseFloat(capacity);

    // 2. Insert warehouse record into public.warehouses table
    // Match 'total_capacity' and 'available_capacity' columns in database schema
    const { error: dbError } = await supabase.from('warehouses').insert({
      name: name,
      location: location,
      capacity: parsedCapacity, // set capacity column if present
      total_capacity: parsedCapacity, // set total_capacity NOT NULL column
      available_capacity: parsedCapacity, // set initial available capacity
      owner_id: user.id,
      status: 'pending_inspection',
    });

    if (dbError) {
      setErrorMsg(dbError.message);
    } else {
      alert('Warehouse registered successfully and submitted for QA inspection!');
      router.push('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900">
          Register Storage Facility
        </h2>
        <p className="text-center text-xs text-gray-500 mt-1">
          Submit warehouse infrastructure details for tokenization compliance
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xs border border-gray-200 rounded-xl sm:px-10">
          {errorMsg && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleWarehouseRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Warehouse Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dakata Central Agro Store"
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Geographical Location / Address
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ahmadu Bello Way, Kano"
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Total Storage Capacity (Metric Tons)
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 5000"
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Submitting Facility...' : 'Submit for Inspection'}
              </button>
            </div>
          </form>

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