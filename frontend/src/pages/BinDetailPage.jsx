import React, { useState, useEffect } from 'react';
import { binsAPI, predictionAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft,
  Clock,
  Cpu,
  MapPin,
  Calendar,
  AlertTriangle,
  Radio,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export const BinDetailPage = ({ bin: initialBin, onBack, onDispatchCollection }) => {
  const { lastBinUpdate } = useSocket();
  const [bin, setBin] = useState(initialBin);
  const [history, setHistory] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      if (!initialBin?._id && !initialBin?.binId) return;
      try {
        const id = initialBin._id || initialBin.binId;
        const res = await binsAPI.getById(id);
        setBin(res.data.bin);
        setHistory(res.data.history || []);
        setPrediction(res.data.prediction);
      } catch (err) {
        console.error('Error loading bin detail:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [initialBin]);

  // Real-time update for this specific bin
  useEffect(() => {
    if (lastBinUpdate && (lastBinUpdate.binId === bin?.binId || lastBinUpdate._id === bin?._id)) {
      setBin((prev) => ({ ...prev, ...lastBinUpdate }));
      // Also update history table
      setHistory((prev) => [
        {
          _id: 'temp_' + Date.now(),
          fillPercentage: lastBinUpdate.currentFillPercentage,
          source: 'simulator',
          readingTimestamp: new Date(),
        },
        ...prev.slice(0, 29),
      ]);
    }
  }, [lastBinUpdate, bin]);

  if (!bin) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        <p>No bin selected.</p>
        <button onClick={onBack} className="mt-3 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold">
          Back to List
        </button>
      </div>
    );
  }

  const fill = bin.currentFillPercentage || 0;
  const isCritical = bin.status === 'critical';
  const isWarning = bin.status === 'warning';

  // Format history for chart
  const chartData = (history.length > 0 ? [...history].reverse() : bin.recentReadings || []).map((h) => ({
    time: new Date(h.readingTimestamp || h.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    fill: h.fillPercentage,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{bin.binId}</h1>
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  isCritical
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : isWarning
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                {bin.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">{bin.label} • {bin.ward}</p>
          </div>
        </div>

        {onDispatchCollection && (
          <button
            onClick={() => onDispatchCollection(bin)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-900/10 flex items-center gap-2 transition"
          >
            Schedule Collection For This Bin
          </button>
        )}
      </div>

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fill Gauge */}
        <div className={`card-hover ${isCritical ? 'card-hover-glow-red' : isWarning ? 'card-hover-glow-amber' : 'card-hover-glow-emerald'} p-5 bg-white rounded-2xl border border-slate-200 shadow-sm group`}>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fill Capacity</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-900'} group-hover:scale-105 transition-transform inline-block`}>
              {fill}%
            </span>
            <span className="text-xs text-slate-400">/ 100%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, fill)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Capacity: {bin.capacityLiters} L (~{Math.round((bin.capacityLiters * fill) / 100)} L volume)
          </p>
        </div>

        {/* Category & Threshold */}
        <div className="card-hover card-hover-glow-blue p-5 bg-white rounded-2xl border border-slate-200 shadow-sm group">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classification</span>
          <p className="text-2xl font-black text-slate-900 capitalize mt-2 group-hover:text-emerald-700 transition-colors">{bin.category}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span>Critical Alert Trigger: <strong>&ge;{bin.criticalThreshold}%</strong></span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Sensor ID: {bin.sensorId || 'IOT-GEN-01'}</p>
        </div>

        {/* Overflow Estimation */}
        <div className="card-hover p-5 bg-white rounded-2xl border border-slate-200 shadow-sm group">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Overflow Horizon</span>
          <div className="mt-2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-black text-indigo-700">
              {prediction?.estimated_hours_to_overflow !== null && prediction?.estimated_hours_to_overflow !== undefined
                ? `~${prediction.estimated_hours_to_overflow} hrs`
                : 'Nominal'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Confidence: <strong>{Math.round((prediction?.confidence_score || 0.9) * 100)}%</strong> (Random Forest)
          </p>
        </div>

        {/* Last Collection Date */}
        <div className="card-hover p-5 bg-white rounded-2xl border border-slate-200 shadow-sm group">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Collection</span>
          <div className="mt-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-slate-800">
              {bin.lastCollectedAt
                ? new Date(bin.lastCollectedAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Over 2 days ago'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Location: {bin.location?.address}</p>
        </div>
      </div>

      {/* AI Multi-Horizon Predictions Forecast Banner */}
      <div className="card-hover p-6 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/15 transition-all duration-700" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight">Scikit-Learn Machine Learning Forecast</h3>
              <p className="text-xs text-slate-400">
                Trained on historical diurnal fill patterns, day-of-week, and category dynamics
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-800">
            Engine: {prediction?.prediction_source || 'Random Forest Regressor'}
          </span>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          {(prediction?.predictions || [
            { horizon_hours: 6, predicted_fill_percentage: Math.min(100, fill + 12), status: 'normal' },
            { horizon_hours: 12, predicted_fill_percentage: Math.min(100, fill + 25), status: 'warning' },
            { horizon_hours: 24, predicted_fill_percentage: Math.min(100, fill + 48), status: 'critical' },
          ]).map((p) => {
            const isCrit = p.status === 'critical';
            const isWarn = p.status === 'warning';
            return (
              <div
                key={p.horizon_hours}
                className={`p-4 rounded-xl bg-slate-800/60 border ${
                  isCrit ? 'border-red-500/40 hover:border-red-500/70' : isWarn ? 'border-amber-500/40 hover:border-amber-500/70' : 'border-slate-700/80 hover:border-slate-600'
                } flex flex-col justify-between hover:scale-[1.02] transition-all duration-200 group/item`}
              >
                <div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">+{p.horizon_hours} Hours Forecast</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        isCrit
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : isWarn
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold text-white group-hover/item:text-emerald-400 transition-colors">
                    {p.predicted_fill_percentage}%
                  </div>
                </div>

                <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full ${
                      isCrit ? 'bg-red-400' : isWarn ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, p.predicted_fill_percentage)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Telemetry Fill Trend Chart */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Fill Level Time-Series Telemetry</h3>
            <p className="text-xs text-slate-500">Recorded sensor readings and accumulation trend</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Telemetry Active</span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="detailGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    borderRadius: '0.75rem',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="fill"
                  name="Fill Level (%)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#detailGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No historical logs available yet.
            </div>
          )}
        </div>
      </div>

      {/* Recent Sensor Readings Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Raw Telemetry Log Readings ({history.length} events)
          </h3>
        </div>
        <div className="max-h-60 overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-white border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 sticky top-0">
              <tr>
                <th className="px-4 py-2">Timestamp</th>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2">Fill Reading</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((h, i) => (
                <tr key={h._id || i} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-500 font-mono text-[11px]">
                    {new Date(h.readingTimestamp || h.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {h.source || 'simulator'}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-bold text-slate-900">{h.fillPercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
