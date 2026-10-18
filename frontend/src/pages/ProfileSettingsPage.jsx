import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import {
  User,
  Settings,
  Key,
  Shield,
  Radio,
  CheckCircle,
  Copy,
  Save,
  Server,
  Cpu,
} from 'lucide-react';

export const ProfileSettingsPage = () => {
  const { user, updateUserData } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [assignedWard, setAssignedWard] = useState(user?.assignedWard || 'Ward-1 Central Market');

  const [warningThreshold, setWarningThreshold] = useState(60);
  const [criticalThreshold, setCriticalThreshold] = useState(80);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await authAPI.updateProfile({ name, phone, assignedWard });
      updateUserData(res.data.user);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating profile');
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText('iot_smartwaste_sensor_auth_key_8899');
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          System Settings &amp; Personal Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure municipal sensor thresholds, view IoT ingestion credentials, and manage your account
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Profile configuration saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Details Form */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <User className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">User Account Information</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Assigned Role</label>
              <input
                type="text"
                disabled
                value={user?.role?.toUpperCase() || ''}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-slate-400 font-bold capitalize cursor-not-allowed"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Primary Operational Ward</label>
              <input
                type="text"
                value={assignedWard}
                onChange={(e) => setAssignedWard(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" /> Save Profile Details
            </button>
          </form>
        </div>

        {/* Global Thresholds & IoT API Key */}
        <div className="space-y-6">
          {/* Thresholds Card */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <Settings className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Municipal Alert Thresholds</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Warning Threshold Level</span>
                  <span className="font-bold text-amber-600">{warningThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="80"
                  value={warningThreshold}
                  onChange={(e) => setWarningThreshold(Number(e.target.value))}
                  disabled={!isAdmin}
                  className="w-full accent-amber-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Bins exceeding this fill percentage transition to 'Warning' status (Yellow marker).
                </p>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Critical Overflow Threshold Level</span>
                  <span className="font-bold text-red-600">{criticalThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="95"
                  value={criticalThreshold}
                  onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                  disabled={!isAdmin}
                  className="w-full accent-red-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Bins exceeding this fill trigger immediate dispatch alerts (Pulsing Red marker).
                </p>
              </div>
            </div>
          </div>

          {/* IoT Hardware Ingestion Credentials */}
          <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Key className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">IoT Hardware Sensor Credentials</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Use this pre-shared API key to authenticate physical ultrasonic/optical fill level sensors
              streaming to the ingestion endpoint.
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <code className="text-xs text-emerald-400 font-mono">
                iot_smartwaste_sensor_auth_key_8899
              </code>
              <button
                onClick={copyApiKey}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
              >
                {apiKeyCopied ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 space-y-1">
              <p>Header: <code>x-api-key: &lt;API_KEY&gt;</code></p>
              <p>Endpoint: <code>POST /api/monitoring/sensor-reading</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
