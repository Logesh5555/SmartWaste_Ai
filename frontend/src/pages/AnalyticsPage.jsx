import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { WasteGenerationChart } from '../components/charts/WasteGenerationChart';
import { FillLevelComparisonChart } from '../components/charts/FillLevelComparisonChart';
import { WardWasteBarChart } from '../components/charts/WardWasteBarChart';
import { EfficiencyChart } from '../components/charts/EfficiencyChart';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  BarChart3,
  Download,
  Calendar,
  Fuel,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';

export const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await analyticsAPI.getSummary();
      setAnalytics(res.data.analytics);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleDownloadCSV = (type) => {
    const url = analyticsAPI.exportCSVUrl(type);
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <LoadingSkeleton count={4} type="card" />
        <LoadingSkeleton count={2} type="card" />
      </div>
    );
  }

  const opMetrics = analytics?.operationalMetrics || {};

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Municipal Waste Analytics &amp; Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical collection performance, category dynamics, sustainability metrics, and CSV data export
          </p>
        </div>

        {/* CSV Export Dropdown / Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleDownloadCSV('bins')}
            className="btn-interactive flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-emerald-400 text-slate-700 text-xs font-bold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" /> Export Bins CSV
          </button>
          <button
            onClick={() => handleDownloadCSV('tasks')}
            className="btn-interactive flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-blue-400 text-slate-700 text-xs font-bold shadow-sm transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" /> Export Tasks CSV
          </button>
          <button
            onClick={() => handleDownloadCSV('logs')}
            className="btn-interactive flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" /> Sensor Logs CSV
          </button>
        </div>
      </div>

      {/* Financial & Environmental Savings Banner */}
      <div className="card-hover p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-500/15 transition-all duration-700" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Operational Efficiency Summary
            </span>
            <h3 className="text-lg font-black text-white">Route Optimization Cost &amp; Carbon Savings</h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Calculated using prototype TSP routing distance reduction against baseline direct depot returns.
              Assumes 0.35 L diesel per km saved and ₹92 per liter fuel expenditure.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 w-full lg:w-auto">
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center hover:bg-slate-800 transition-colors">
              <span className="text-2xl font-black text-emerald-400">{opMetrics.fuelSavedLiters || 0} L</span>
              <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Diesel Saved</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center hover:bg-slate-800 transition-colors">
              <span className="text-2xl font-black text-teal-400">{opMetrics.co2SavedKg || 0} kg</span>
              <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">CO₂ Avoided</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center hover:bg-slate-800 transition-colors">
              <span className="text-2xl font-black text-purple-300">
                ₹{opMetrics.estimatedCostSavingsInr || 0}
              </span>
              <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Est. Fuel Cost</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center hover:bg-slate-800 transition-colors">
              <span className="text-2xl font-black text-amber-300">
                {opMetrics.averageCollectionEfficiency || 94.2}%
              </span>
              <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Collection Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-hover">
          <WasteGenerationChart data={analytics?.weeklyTrends || []} />
        </div>
        <div className="card-hover">
          <FillLevelComparisonChart data={analytics?.actualVsPredicted || []} />
        </div>
      </div>

      {/* Secondary Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-hover">
          <WardWasteBarChart data={analytics?.wardStats || []} />
        </div>
        <div className="card-hover">
          <EfficiencyChart categoryBreakdown={analytics?.categoryBreakdown || {}} />
        </div>
      </div>
    </div>
  );
};
