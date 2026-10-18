import React, { useState, useEffect } from 'react';
import { binsAPI, collectionAPI, usersAPI } from '../services/api';
import { RouteMap } from '../components/map/RouteMap';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  CalendarDays,
  Navigation,
  Sparkles,
  Truck,
  CheckCircle,
  Clock,
  Fuel,
  ShieldCheck,
  Plus,
  ArrowRight,
} from 'lucide-react';

export const CollectionSchedulePage = ({ setActivePage }) => {
  const [bins, setBins] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Route Planning State
  const [selectedBinIds, setSelectedBinIds] = useState([]);
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [routeTitle, setRouteTitle] = useState('High-Priority Waste Clearance');
  const [priority, setPriority] = useState('high');
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async () => {
    try {
      const [binRes, staffRes, taskRes] = await Promise.all([
        binsAPI.getAll(),
        usersAPI.getAll({ role: 'staff' }),
        collectionAPI.getTasks(),
      ]);
      setBins(binRes.data.bins);
      setStaffUsers(staffRes.data.users);
      setTasks(taskRes.data.tasks);

      // Pre-select critical bins
      const criticalIds = binRes.data.bins
        .filter((b) => b.status === 'critical')
        .map((b) => b._id);
      setSelectedBinIds(criticalIds);

      if (staffRes.data.users.length > 0) {
        setAssignedStaffId(staffRes.data.users[0]._id);
      }
    } catch (err) {
      console.error('Error loading route scheduling data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleBin = (id) => {
    setSelectedBinIds((prev) =>
      prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id]
    );
  };

  const handleSelectAllCritical = () => {
    const criticalIds = bins
      .filter((b) => b.status === 'critical' || b.status === 'warning')
      .map((b) => b._id);
    setSelectedBinIds(criticalIds);
  };

  const handleRunOptimization = async () => {
    if (selectedBinIds.length === 0) {
      alert('Please select at least one bin for routing.');
      return;
    }

    setIsOptimizing(true);
    try {
      const res = await collectionAPI.previewOptimization(selectedBinIds);
      setOptimizedRoute(res.data.result);
    } catch (err) {
      alert(err.response?.data?.message || 'Error running optimization algorithm');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (selectedBinIds.length === 0) {
      alert('Select at least one bin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: routeTitle,
        binIds: selectedBinIds,
        assignedTo: assignedStaffId || null,
        priority,
        autoOptimize: true,
      };

      const res = await collectionAPI.createTask(payload);
      setSuccessMessage(`Route ${res.data.task.taskNumber} dispatched successfully!`);
      setOptimizedRoute(null);
      loadData();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch route');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <LoadingSkeleton count={4} type="card" />
        <LoadingSkeleton count={3} type="table" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Intelligent Collection Scheduling &amp; Routing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Nearest-Neighbor TSP algorithm clusters bins, cuts redundant mileage, and assigns staff
          </p>
        </div>

        <button
          onClick={handleSelectAllCritical}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" /> Auto-Select Overflowing Bins ({bins.filter((b) => b.status === 'critical').length})
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Two-Column Planning Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Bin Selector & Task Dispatch Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Bin Checklist */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Candidate Bins ({selectedBinIds.length} selected)
                </h3>
                <p className="text-[10px] text-slate-400">Select bins to calculate shortest collection path</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBinIds(bins.map((b) => b._id))}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition"
                >
                  All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedBinIds([])}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {bins.map((bin) => {
                const isSelected = selectedBinIds.includes(bin._id);
                const isCrit = bin.status === 'critical';
                const isWarn = bin.status === 'warning';

                return (
                  <div
                    key={bin._id}
                    onClick={() => handleToggleBin(bin._id)}
                    className={`card-hover p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs group ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div
                        className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors block">
                          {bin.binId}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block max-w-[180px]">
                          {bin.label}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isCrit ? 'bg-red-500 text-white' : isWarn ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {bin.currentFillPercentage}%
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 capitalize">{bin.category}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Run Algorithm Button */}
            <button
              onClick={handleRunOptimization}
              disabled={isOptimizing || selectedBinIds.length === 0}
              className="btn-interactive w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 text-emerald-400 ${isOptimizing ? 'animate-spin' : ''}`} />
              {isOptimizing ? 'Computing Shortest Route...' : 'Preview TSP Route Optimization'}
            </button>
          </div>

          {/* Dispatch Form */}
          <form onSubmit={handleCreateTask} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-700 border-b pb-2">
              Dispatch &amp; Staff Assignment
            </h3>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Route Title</label>
              <input
                type="text"
                required
                value={routeTitle}
                onChange={(e) => setRouteTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical Urgent</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assign Staff</label>
                <select
                  value={assignedStaffId}
                  onChange={(e) => setAssignedStaffId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="">Unassigned (Open Queue)</option>
                  {staffUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.assignedWard || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || selectedBinIds.length === 0}
              className="btn-interactive w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Truck className="w-4 h-4" />
              {isSubmitting ? 'Creating Route...' : 'Dispatch Route to Staff Portal'}
            </button>
          </form>
        </div>

        {/* Right Column: Route Map & Step Sequence (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <RouteMap
            waypoints={optimizedRoute?.waypoints || []}
            totalDistanceKm={optimizedRoute?.totalDistanceKm || 0}
            totalDurationMin={optimizedRoute?.totalDurationMin || 0}
            fuelSavedLiters={optimizedRoute?.fuelSavedLiters || 0}
            co2SavedKg={optimizedRoute?.co2SavedKg || 0}
            height="460px"
          />

          {/* Ordered Waypoints Step List */}
          {optimizedRoute?.waypoints && optimizedRoute.waypoints.length > 0 && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  Optimized Waypoint Sequence (Depot Loop)
                </h4>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {optimizedRoute.waypoints.length} Stops
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto text-xs pr-1">
                {optimizedRoute.waypoints.map((wp) => (
                  <div key={wp.binId} className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors group">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[10px] shadow-sm group-hover:scale-110 transition-transform">
                        {wp.order}
                      </span>
                      <div>
                        <span className="font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">{wp.binId}</span>
                        <span className="text-[11px] text-slate-500 ml-2">{wp.label}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      +{wp.distanceFromPrevKm} km
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Existing Dispatched Tasks Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Current Dispatched Routes &amp; Assignments ({tasks.length} tasks)
          </h3>
          <button
            onClick={() => setActivePage('staff-portal')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition"
          >
            Staff Portal View <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-white border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
              <tr>
                <th className="px-4 py-3">Task ID</th>
                <th className="px-4 py-3">Title &amp; Ward</th>
                <th className="px-4 py-3">Bins Count</th>
                <th className="px-4 py-3">Assigned Staff</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Est. Distance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <tr key={task._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-extrabold text-slate-900">{task.taskNumber}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-800 block">{task.title}</span>
                    <span className="text-[10px] text-slate-400">{task.ward}</span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">{task.bins?.length || 0} stops</td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {task.assignedTo?.name || 'Unassigned'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        task.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {task.routeDetails?.estimatedDistanceKm || 0} km (~{task.routeDetails?.estimatedDurationMin || 0} min)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
