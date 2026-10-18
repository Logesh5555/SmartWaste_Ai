import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { monitoringAPI } from '../../services/api';
import { Play, Pause, RefreshCw, Cpu, Radio, ShieldCheck, Zap } from 'lucide-react';

export const SimulatorWidget = () => {
  const { simulatorStatus } = useSocket();
  const [loading, setLoading] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState(simulatorStatus.intervalMs || 5000);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const nextAction = simulatorStatus.isRunning ? 'stop' : 'start';
      await monitoringAPI.toggleSimulator(nextAction, selectedInterval);
    } catch (err) {
      console.error('Simulator toggle error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStep = async () => {
    setLoading(true);
    try {
      await monitoringAPI.triggerStep();
    } catch (err) {
      console.error('Simulator manual step error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-navy-950 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl transition-all duration-300 hover:border-slate-700">
      {/* Background ambient glow */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              simulatorStatus.isRunning
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20 animate-pulse'
                : 'bg-slate-800/80 text-slate-400 border border-slate-700'
            }`}
          >
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-extrabold tracking-tight">
                IoT Sensor Telemetry Simulator
              </h4>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full transition-all duration-300 ${
                  simulatorStatus.isRunning
                    ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-400/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {simulatorStatus.isRunning ? 'Active Stream' : 'Paused'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Generates calibrated sensor fill increments and triggers real-time alerts.
            </p>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto">
          <select
            value={selectedInterval}
            onChange={(e) => setSelectedInterval(Number(e.target.value))}
            disabled={simulatorStatus.isRunning}
            className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors hover:border-slate-600"
          >
            <option value={3000}>3 sec interval</option>
            <option value={5000}>5 sec interval</option>
            <option value={10000}>10 sec interval</option>
          </select>

          <button
            onClick={handleToggle}
            disabled={loading}
            className={`btn-interactive flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition shadow-md disabled:opacity-50 ${
              simulatorStatus.isRunning
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
            }`}
          >
            {simulatorStatus.isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause Telemetry
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Start Stream
              </>
            )}
          </button>

          <button
            onClick={handleStep}
            disabled={loading}
            title="Trigger Single Sensor Cycle"
            className="btn-interactive flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Step</span>
          </button>
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
        <div className="flex items-center gap-2 group cursor-pointer">
          <Cpu className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-slate-300">Physical IoT API:</span>
          <code className="text-emerald-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono group-hover:border-emerald-500/40 transition-colors">
            POST /api/monitoring/sensor-reading
          </code>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Device Auth Key: <code>x-api-key</code></span>
        </div>
      </div>
    </div>
  );
};
