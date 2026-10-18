import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { monitoringAPI, analyticsAPI, binsAPI } from '../services/api';
import { MetricCard } from '../components/common/MetricCard';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { SimulatorWidget } from '../components/simulator/SimulatorWidget';
import { WasteGenerationChart } from '../components/charts/WasteGenerationChart';
import { FillLevelComparisonChart } from '../components/charts/FillLevelComparisonChart';
import { WardWasteBarChart } from '../components/charts/WardWasteBarChart';
import { EfficiencyChart } from '../components/charts/EfficiencyChart';
import { LiveBinMap } from '../components/map/LiveBinMap';
import {
  Trash2,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  CalendarCheck,
  Clock,
  Gauge,
  Cpu,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Zap,
} from 'lucide-react';

export const AdminDashboard = ({ setActivePage, onSelectBin }) => {
  const { lastBinUpdate } = useSocket();
  const [kpis, setKpis] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [kpiRes, anaRes, binRes] = await Promise.all([
        monitoringAPI.getKPIs(),
        analyticsAPI.getSummary(),
        binsAPI.getAll(),
      ]);
      setKpis(kpiRes.data.kpis);
      setAnalytics(anaRes.data.analytics);
      setBins(binRes.data.bins);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Soft refresh on real-time bin telemetry update
  useEffect(() => {
    if (lastBinUpdate) {
      setBins((prev) =>
        prev.map((b) => (b.binId === lastBinUpdate.binId ? { ...b, ...lastBinUpdate } : b))
      );
      monitoringAPI.getKPIs().then((res) => setKpis(res.data.kpis)).catch(() => {});
    }
  }, [lastBinUpdate]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <LoadingSkeleton count={8} type="card" />
        <LoadingSkeleton count={3} type="table" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-7 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              EcoNexa Command Center
            </h1>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Live Stream
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time IoT telemetry, Scikit-Learn predictions, and TSP collection dispatch
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActivePage('scheduling')}
            className="btn-interactive px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/20 flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4" /> Dispatch Collection Route
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Simulator Control Widget */}
      <SimulatorWidget />

      {/* 8 Municipal KPI Cards with Hover Lift */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Waste Bins"
          value={kpis?.totalBins || 0}
          subtitle="Monitored across 5 wards"
          icon={Trash2}
          color="blue"
        />
        <MetricCard
          title="Normal Status"
          value={kpis?.normalBins || 0}
          subtitle="Fill level below 60%"
          icon={CheckCircle}
          color="emerald"
        />
        <MetricCard
          title="Nearing Capacity"
          value={kpis?.warningBins || 0}
          subtitle="60% – 80% fill warning"
          icon={AlertTriangle}
          color="amber"
        />
        <MetricCard
          title="Overflowing / Critical"
          value={kpis?.criticalBins || 0}
          subtitle="Exceeds 80% threshold"
          icon={AlertOctagon}
          color="red"
        />
        <MetricCard
          title="Scheduled Today"
          value={kpis?.scheduledToday || 0}
          subtitle="Assigned active routes"
          icon={CalendarCheck}
          color="purple"
        />
        <MetricCard
          title="Pending Tasks"
          value={kpis?.pendingTasks || 0}
          subtitle="Awaiting staff dispatch"
          icon={Clock}
          color="amber"
        />
        <MetricCard
          title="Average Fill Level"
          value={`${kpis?.averageFillPercentage || 0}%`}
          subtitle="City-wide capacity usage"
          icon={Gauge}
          color="emerald"
        />
        <MetricCard
          title="Predicted Overflows"
          value={kpis?.predictedOverflows || 0}
          subtitle="Within next 12 hours"
          icon={Cpu}
          color="red"
        />
      </div>

      {/* Primary Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-hover">
          <WasteGenerationChart data={analytics?.weeklyTrends || []} />
        </div>
        <div className="card-hover">
          <FillLevelComparisonChart data={analytics?.actualVsPredicted || []} />
        </div>
      </div>

      {/* Secondary Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-hover">
          <WardWasteBarChart data={analytics?.wardStats || []} />
        </div>
        <div className="card-hover">
          <EfficiencyChart categoryBreakdown={analytics?.categoryBreakdown || {}} />
        </div>
      </div>

      {/* Live Map Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Geospatial Waste Bin Overview
            </h2>
            <p className="text-xs text-slate-500">Live positions, fill readings, and critical alert rings</p>
          </div>
          <button
            onClick={() => setActivePage('map')}
            className="group flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition"
          >
            <span>Full Map View</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        <div className="card-hover">
          <LiveBinMap
            bins={bins}
            onSelectBin={(bin) => {
              if (onSelectBin) onSelectBin(bin);
              setActivePage('bin-detail');
            }}
            height="460px"
          />
        </div>
      </div>

      {/* Operational Fuel & Financial Savings Callout */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/90 shadow-sm card-hover">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                EcoNexa Municipal Efficiency Metrics
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Calculated using automated TSP shortest-path sequencing versus conventional random direct depot loops across completed collections.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 sm:gap-8 shrink-0">
            <div className="text-center group cursor-default">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 block group-hover:scale-105 transition-transform">
                {analytics?.operationalMetrics?.fuelSavedLiters || 0} L
              </span>
              <p className="text-[10px] uppercase font-extrabold text-slate-500 mt-0.5">Fuel Conserved</p>
            </div>
            <div className="text-center group cursor-default">
              <span className="text-2xl sm:text-3xl font-black text-teal-700 block group-hover:scale-105 transition-transform">
                {analytics?.operationalMetrics?.co2SavedKg || 0} kg
              </span>
              <p className="text-[10px] uppercase font-extrabold text-slate-500 mt-0.5">CO₂ Avoided</p>
            </div>
            <div className="text-center group cursor-default">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 block group-hover:scale-105 transition-transform">
                ₹{analytics?.operationalMetrics?.estimatedCostSavingsInr || 0}
              </span>
              <p className="text-[10px] uppercase font-extrabold text-slate-500 mt-0.5">Est. Cost Saved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
