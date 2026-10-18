import React, { useState, useEffect } from 'react';
import { binsAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { LiveBinMap } from '../components/map/LiveBinMap';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { MapPin, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

export const LiveMapPage = ({ onSelectBin, setActivePage }) => {
  const { lastBinUpdate } = useSocket();
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState('all'); // 'all', 'critical', 'warning'

  const fetchBins = async () => {
    setIsRefreshing(true);
    try {
      const res = await binsAPI.getAll();
      setBins(res.data.bins);
    } catch (err) {
      console.error('Error loading bins for map:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchBins();
  }, []);

  useEffect(() => {
    if (lastBinUpdate) {
      setBins((prev) =>
        prev.map((b) => (b.binId === lastBinUpdate.binId ? { ...b, ...lastBinUpdate } : b))
      );
    }
  }, [lastBinUpdate]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <LoadingSkeleton count={4} type="card" />
      </div>
    );
  }

  // Filter urgent bins (critical or warning)
  const allUrgentBins = bins.filter((b) => b.status === 'critical' || b.status === 'warning');
  const urgentBins = allUrgentBins.filter((b) => {
    if (sidebarFilter === 'critical') return b.status === 'critical';
    if (sidebarFilter === 'warning') return b.status === 'warning';
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
              <MapPin className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Live Telemetry Geospatial Map
              </h1>
              <p className="text-xs text-slate-500">
                Real-time GPS positions, fill markers, and critical threshold breach notifications
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchBins}
          disabled={isRefreshing}
          className="btn-interactive flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-emerald-400 shadow-sm transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Refresh Telemetry'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Map */}
        <div className="lg:col-span-3">
          <LiveBinMap
            bins={bins}
            height="640px"
            onSelectBin={(bin) => {
              if (onSelectBin) onSelectBin(bin);
              if (setActivePage) setActivePage('bin-detail');
            }}
          />
        </div>

        {/* Priority Urgency Sidebar */}
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Attention Queue
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-extrabold text-[10px]">
                {allUrgentBins.length} Bins
              </span>
            </div>

            {/* Quick Filter Tabs for sidebar */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-[11px] font-bold">
              <button
                onClick={() => setSidebarFilter('all')}
                className={`flex-1 py-1 rounded-lg transition ${
                  sidebarFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All ({allUrgentBins.length})
              </button>
              <button
                onClick={() => setSidebarFilter('critical')}
                className={`flex-1 py-1 rounded-lg transition ${
                  sidebarFilter === 'critical' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Critical ({bins.filter((b) => b.status === 'critical').length})
              </button>
              <button
                onClick={() => setSidebarFilter('warning')}
                className={`flex-1 py-1 rounded-lg transition ${
                  sidebarFilter === 'warning' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Warning ({bins.filter((b) => b.status === 'warning').length})
              </button>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {urgentBins.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  <p>All bins within safe fill limits.</p>
                </div>
              ) : (
                urgentBins.map((bin) => {
                  const isCrit = bin.status === 'critical';

                  return (
                    <div
                      key={bin._id}
                      onClick={() => {
                        if (onSelectBin) onSelectBin(bin);
                        if (setActivePage) setActivePage('bin-detail');
                      }}
                      className={`card-hover ${
                        isCrit ? 'card-hover-glow-red border-red-200' : 'card-hover-glow-amber border-amber-200'
                      } p-3.5 rounded-xl border cursor-pointer transition bg-white space-y-2 group`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {bin.binId}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isCrit ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          {bin.currentFillPercentage}% Full
                        </span>
                      </div>

                      <p className="text-[11px] font-semibold text-slate-700 truncate">{bin.label}</p>
                      <p className="text-[10px] text-slate-500">{bin.ward}</p>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCrit ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, bin.currentFillPercentage)}%` }}
                        />
                      </div>

                      {bin.predictedOverflowHours !== null && (
                        <div className="flex items-center gap-1 text-[10px] text-indigo-700 font-medium pt-1">
                          <Clock className="w-3 h-3" />
                          <span>Predicted overflow: ~{bin.predictedOverflowHours} hrs</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
