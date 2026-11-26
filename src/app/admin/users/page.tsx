'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function UserManagementPage() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form states for creating user
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('customer');

  // Form states for wallet funding
  const [fundAmount, setFundAmount] = useState('');
  const [fundAction, setFundAction] = useState('add'); // 'add' or 'subtract'

  const supabase = createClient();
  const router = useRouter();

  // Load all registered users and check permissions
  const fetchUsersAndPermissions = async () => {
    setLoading(true);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'superadmin' && profile.role !== 'admin')) {
      alert('Access Denied! Only Superadmins and Admins can access this portal.');
      router.push('/dashboard');
      return;
    }

    setCurrentUser(profile);

    // Fetch Users with Wallets
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg('Error fetching users directory: ' + error.message);
    } else if (data) {
      // Fetch wallets for each user balance
      const usersWithWallets = await Promise.all(
        data.map(async (u) => {
          const { data: wData } = await supabase
            .from('wallets')
            .select('balance')
            .eq('customer_id', u.id)
            .single();
          return { ...u, balance: wData ? wData.balance : 0 };
        })
      );
      setUsersList(usersWithWallets);
      setFilteredUsers(usersWithWallets);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsersAndPermissions();
  }, [supabase]);

  // Search & Filter Logic
  useEffect(() => {
    let result = usersList;

    if (searchTerm) {
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'ALL') {
      result = result.filter((u) => u.role === roleFilter);
    }

    setFilteredUsers(result);
  }, [searchTerm, roleFilter, usersList]);

  // Create New User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
    });

    if (authError) {
      alert('Error creating auth account: ' + authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: dbError } = await supabase.from('users').insert({
        id: authData.user.id,
        name: newName,
        email: newEmail,
        phone: newPhone,
        role: newRole,
      });

      // Initialize wallet for user
      await supabase.from('wallets').insert({
        customer_id: authData.user.id,
        balance: 0.00,
        currency: 'NGN',
      });

      if (dbError) {
        alert('Error saving user profile: ' + dbError.message);
      } else {
        alert('User created successfully!');
        setShowCreateModal(false);
        setNewEmail('');
        setNewPassword('');
        setNewName('');
        setNewPhone('');
        fetchUsersAndPermissions();
      }
    }
    setLoading(false);
  };

  // Delete User
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) return;

    setUpdatingId(userId);
    const { error } = await supabase.from('users').delete().eq('id', userId);

    if (error) {
      alert('Error deleting user: ' + error.message);
    } else {
      alert('User successfully deleted from database!');
      fetchUsersAndPermissions();
    }
    setUpdatingId(null);
  };

  // Update User Role
  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);

    if (error) {
      alert('Error updating role: ' + error.message);
    } else {
      alert(`User role updated to ${newRole.toUpperCase()}!`);
      fetchUsersAndPermissions();
    }
    setUpdatingId(null);
  };

  // Fund Wallet (Add or Subtract)
  const handleFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const amt = parseFloat(fundAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const currentBalance = selectedUser.balance || 0;
    const newBalance = fundAction === 'add' ? currentBalance + amt : currentBalance - amt;

    if (newBalance < 0) {
      alert('Insufficient wallet balance for this deduction.');
      return;
    }

    setUpdatingId(selectedUser.id);
    const { error } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('customer_id', selectedUser.id);

    if (error) {
      alert('Error updating wallet: ' + error.message);
    } else {
      alert(`Wallet successfully ${fundAction === 'add' ? 'funded' : 'debited'}!`);
      setShowFundModal(false);
      setFundAmount('');
      setSelectedUser(null);
      fetchUsersAndPermissions();
    }
    setUpdatingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                User Directory & Access Control
              </h1>
              <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                {currentUser?.role || 'Admin Portal'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Create users, manage roles, adjust wallet balances, and monitor system accounts.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
            >
              <span>+ Create New User</span>
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-xl bg-slate-200 text-slate-800 px-3.5 py-2.5 text-xs font-bold hover:bg-slate-300 transition-all"
            >
              &larr; Dashboard
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search by Name or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:col-span-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
          >
            <option value="ALL">All Roles</option>
            <option value="customer">Customer</option>
            <option value="warehouse_owner">Warehouse Owner</option>
            <option value="warehouse_manager">Warehouse Manager</option>
            <option value="qa_inspector">QA Inspector</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-red-50 p-4 text-xs text-red-600 border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-3 text-xs font-semibold text-slate-500">Loading system users...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">User Details</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Wallet Balance</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                        No user records found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((usr) => (
                      <tr key={usr.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-extrabold text-slate-900">{usr.name || 'N/A'}</p>
                          <p className="text-[11px] text-slate-500">{usr.email}</p>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">{usr.phone || 'N/A'}</td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-600">
                          ₦{(usr.balance || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-700">
                            {usr.role || 'customer'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {/* Fund / Debit Button */}
                          <button
                            onClick={() => { setSelectedUser(usr); setShowFundModal(true); }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all"
                          >
                            Fund/Debit
                          </button>

                          {/* Role Select */}
                          <select
                            disabled={updatingId === usr.id}
                            value={usr.role || 'customer'}
                            onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                            className="rounded-lg border border-slate-300 p-1 text-xs text-slate-900 bg-white"
                          >
                            <option value="customer">Customer</option>
                            <option value="warehouse_owner">Warehouse Owner</option>
                            <option value="warehouse_manager">Warehouse Manager</option>
                            <option value="qa_inspector">QA Inspector</option>
                            <option value="admin">Admin</option>
                            <option value="superadmin">Superadmin</option>
                          </select>

                          {/* Delete Button */}
                          <button
                            disabled={updatingId === usr.id}
                            onClick={() => handleDeleteUser(usr.id, usr.email)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all"
                          >
                            Delete
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

        {/* --- CREATE USER MODAL --- */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl p-6 bg-white shadow-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Create New User Account</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                  <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-xl border p-2.5 text-xs text-slate-900" placeholder="e.g. Ali Baba" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                  <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full rounded-xl border p-2.5 text-xs text-slate-900" placeholder="name@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                  <input type="text" required value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full rounded-xl border p-2.5 text-xs text-slate-900" placeholder="+234..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Account Role</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full rounded-xl border p-2.5 text-xs text-slate-900 bg-white">
                    <option value="customer">Customer</option>
                    <option value="warehouse_owner">Warehouse Owner</option>
                    <option value="warehouse_manager">Warehouse Manager</option>
                    <option value="qa_inspector">QA Inspector</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                  <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-xl border p-2.5 text-xs text-slate-900" placeholder="••••••••" />
                </div>
                <div className="flex space-x-3 pt-2">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 rounded-xl py-2.5 text-xs font-bold border bg-slate-100 text-slate-700">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-md">Create User</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- FUND / DEBIT WALLET MODAL --- */}
        {showFundModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl p-6 bg-white shadow-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Manage Wallet Balance</h3>
              <p className="text-xs text-slate-500 mb-4">User: <span className="font-bold text-slate-800">{selectedUser.name}</span></p>
              
              <form onSubmit={handleFundSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Action Type</label>
                  <select value={fundAction} onChange={(e) => setFundAction(e.target.value)} className="w-full rounded-xl border p-2.5 text-xs text-slate-900 bg-white">
                    <option value="add">Add Funds (Credit)</option>
                    <option value="subtract">Subtract Funds (Debit)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (NGN)</label>
                  <input type="number" required min="1" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} className="w-full rounded-xl border p-2.5 text-xs text-slate-900" placeholder="e.g. 50000" />
                </div>
                <div className="flex space-x-3 pt-2">
                  <button type="button" onClick={() => setShowFundModal(false)} className="flex-1 rounded-xl py-2.5 text-xs font-bold border bg-slate-100 text-slate-700">Cancel</button>
                  <button type="submit" className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white shadow-md">Confirm</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}