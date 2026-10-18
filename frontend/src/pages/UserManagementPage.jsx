import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  Users,
  Plus,
  Shield,
  Truck,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  History,
} from 'lucide-react';

const WARDS = [
  'All Wards',
  'Ward-1 Central Market',
  'Ward-2 Tech Corridor',
  'Ward-3 Green Residences',
  'Ward-4 Metro Station',
  'Ward-5 Heritage Quarter',
];

export const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'staff',
    phone: '',
    assignedWard: 'Ward-1 Central Market',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsersAndLogs = async () => {
    try {
      const [uRes, aRes] = await Promise.all([
        usersAPI.getAll(),
        usersAPI.getActivities(),
      ]);
      setUsers(uRes.data.users);
      setActivities(aRes.data.logs || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndLogs();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert('Name and email required');
      return;
    }

    setIsSubmitting(true);
    try {
      await usersAPI.create(formData);
      setCreateModalOpen(false);
      setFormData({
        name: '',
        email: '',
        password: 'password123',
        role: 'staff',
        phone: '',
        assignedWard: 'Ward-1 Central Market',
      });
      fetchUsersAndLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await usersAPI.updateStatus(user._id, { status: nextStatus });
      fetchUsersAndLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleChangeRole = async (user, newRole) => {
    try {
      await usersAPI.updateStatus(user._id, { role: newRole });
      fetchUsersAndLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating role');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <LoadingSkeleton count={4} type="table" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            User Administration &amp; Access Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage municipal accounts, role permissions (Admin, Staff, Officer), and audit logs
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-900/10 flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Municipal User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Registered Municipal Accounts ({users.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-white border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
              <tr>
                <th className="px-4 py-3">User &amp; Contact</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Assigned Ward</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="font-extrabold text-slate-900 block">{u.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                  </td>

                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u, e.target.value)}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold capitalize focus:outline-none"
                    >
                      <option value="staff">Staff (Field)</option>
                      <option value="officer">Monitoring Officer</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </td>

                  <td className="px-4 py-3 font-medium text-slate-700">{u.assignedWard || 'All Wards'}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        u.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        u.status === 'active'
                          ? 'text-red-600 hover:bg-red-50 border border-red-200'
                          : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                      }`}
                    >
                      {u.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Activity Audit Trail Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Administrative Activity Audit Trail
          </h3>
        </div>

        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-white border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 sticky top-0">
              <tr>
                <th className="px-4 py-2">Timestamp</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Action Performed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.map((act) => (
                <tr key={act._id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-[11px] text-slate-400 font-mono">
                    {new Date(act.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 font-bold text-slate-800">{act.userName}</td>
                  <td className="px-4 py-2 text-slate-700">{act.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Municipal User">
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              >
                <option value="staff">Staff (Field Operations)</option>
                <option value="officer">Monitoring Officer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Assigned Ward</label>
              <select
                value={formData.assignedWard}
                onChange={(e) => setFormData({ ...formData, assignedWard: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              >
                {WARDS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Temporary Password</label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
