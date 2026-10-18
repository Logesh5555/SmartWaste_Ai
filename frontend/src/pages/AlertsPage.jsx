import React, { useState, useEffect } from 'react';
import { alertsAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  Clock,
  ShieldAlert,
  Search,
  Check,
} from 'lucide-react';

const WARDS = [
  'Ward-1 Central Market',
  'Ward-2 Tech Corridor',
  'Ward-3 Green Residences',
  'Ward-4 Metro Station',
  'Ward-5 Heritage Quarter',
];

export const AlertsPage = () => {
  const { latestAlert } = useSocket();
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('');
  const [resolvedTab, setResolvedTab] = useState('active'); // 'active' or 'resolved'
  const [wardFilter, setWardFilter] = useState('');

  const fetchAlertsData = async () => {
    try {
      const [alertRes, sumRes] = await Promise.all([
        alertsAPI.getAll({ resolved: resolvedTab === 'resolved' ? 'true' : 'false' }),
        alertsAPI.getSummary(),
      ]);
      setAlerts(alertRes.data.alerts);
      setSummary(sumRes.data.summary);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, [resolvedTab]);

  useEffect(() => {
    if (latestAlert && resolvedTab === 'active') {
      setAlerts((prev) => [latestAlert, ...prev.filter((a) => a._id !== latestAlert._id)]);
      alertsAPI.getSummary().then((res) => setSummary(res.data.summary)).catch(() => {});
    }
  }, [latestAlert, resolvedTab]);

  const handleResolve = async (id) => {
    try {
      await alertsAPI.resolve(id);
      fetchAlertsData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error resolving alert');
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter && a.severity !== severityFilter) return false;
    if (wardFilter && a.ward !== wardFilter) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Alerts &amp; Operational Incident Center
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Automated threshold warnings, sensor anomaly detections, and citizen/staff maintenance reports
        </p>
      </div>

      {/* Severity Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-hover card-hover-glow-red p-4 rounded-2xl bg-white border border-red-200/80 shadow-sm flex items-center justify-between group">
          <div>
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Critical Overflows</p>
            <p className="text-2xl font-black text-red-700 mt-1">
              {summary?.severityCounts?.critical || 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
            !
          </div>
        </div>

        <div className="card-hover card-hover-glow-amber p-4 rounded-2xl bg-white border border-amber-200/80 shadow-sm flex items-center justify-between group">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">High Priority</p>
            <p className="text-2xl font-black text-amber-700 mt-1">
              {summary?.severityCounts?.high || 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
            ▲
          </div>
        </div>

        <div className="card-hover card-hover-glow-blue p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between group">
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Medium / Low</p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {(summary?.severityCounts?.medium || 0) + (summary?.severityCounts?.low || 0)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
            ●
          </div>
        </div>

        <div className="card-hover card-hover-glow-emerald p-4 rounded-2xl bg-white border border-emerald-200 shadow-sm flex items-center justify-between group">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Resolved Incidents</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {summary?.resolvedCount || 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Active vs Resolved Toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setResolvedTab('active')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                resolvedTab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Active Alerts ({summary?.activeCount || 0})
            </button>
            <button
              onClick={() => setResolvedTab('resolved')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                resolvedTab === 'resolved' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Resolved History ({summary?.resolvedCount || 0})
            </button>
          </div>

          {/* Severity & Ward Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Wards</option>
              {WARDS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <LoadingSkeleton count={4} type="table" />
      ) : filteredAlerts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No {resolvedTab} alerts</h3>
          <p className="text-xs text-slate-500 mt-1">No alerts match the selected criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isCrit = alert.severity === 'critical';
            const isHigh = alert.severity === 'high';

            return (
              <div
                key={alert._id}
                className={`card-hover p-4 sm:p-5 rounded-2xl bg-white border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm group ${
                  alert.resolved
                    ? 'border-slate-200 bg-slate-50/50'
                    : isCrit
                    ? 'card-hover-glow-red border-red-200'
                    : isHigh
                    ? 'card-hover-glow-amber border-amber-200'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform ${
                      alert.resolved
                        ? 'bg-slate-100 text-slate-400'
                        : isCrit
                        ? 'bg-red-100 text-red-600'
                        : isHigh
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {alert.binId ? `[${alert.binId}]` : '[SYSTEM]'}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          alert.resolved
                            ? 'bg-slate-100 text-slate-600'
                            : isCrit
                            ? 'bg-red-500 text-white'
                            : isHigh
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 leading-relaxed">{alert.message}</p>
                    <p className="text-[11px] text-slate-500">Ward: {alert.ward || 'Central'}</p>
                  </div>
                </div>

                {!alert.resolved ? (
                  <button
                    onClick={() => handleResolve(alert._id)}
                    className="btn-interactive px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs transition flex items-center gap-1.5 shrink-0 self-end sm:self-auto shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shrink-0">
                    Resolved
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
