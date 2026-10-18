import React, { useState, useEffect } from 'react';
import { collectionAPI, binsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  Truck,
  CheckCircle,
  Play,
  AlertTriangle,
  Scale,
  Navigation,
  Clock,
  MapPin,
  ClipboardCheck,
} from 'lucide-react';

export const StaffPortalPage = ({ onSelectBin, setActivePage }) => {
  const { user } = useAuth();
  const { lastTaskUpdate } = useSocket();
  const [tasks, setTasks] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [collectedWeightKg, setCollectedWeightKg] = useState(380);
  const [completionNotes, setCompletionNotes] = useState('All bins emptied and sanitized.');

  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueBinId, setIssueBinId] = useState('');
  const [issueType, setIssueType] = useState('damaged_bin');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueSeverity, setIssueSeverity] = useState('high');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadStaffData = async () => {
    try {
      const [taskRes, binRes] = await Promise.all([
        collectionAPI.getTasks(),
        binsAPI.getAll(),
      ]);
      setTasks(taskRes.data.tasks);
      setBins(binRes.data.bins);
      if (binRes.data.bins.length > 0) {
        setIssueBinId(binRes.data.bins[0].binId);
      }
    } catch (err) {
      console.error('Error fetching staff tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, []);

  useEffect(() => {
    if (lastTaskUpdate) {
      setTasks((prev) =>
        prev.map((t) => (t._id === lastTaskUpdate._id ? { ...t, ...lastTaskUpdate } : t))
      );
    }
  }, [lastTaskUpdate]);

  const handleStartTask = async (task) => {
    try {
      await collectionAPI.updateTaskStatus(task._id, { status: 'in_progress' });
      setFeedback(`Task ${task.taskNumber} is now In Progress.`);
      loadStaffData();
      setTimeout(() => setFeedback(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleOpenCompleteModal = (task) => {
    setSelectedTask(task);
    setCollectedWeightKg(Math.round((task.bins?.length || 2) * 180));
    setCompleteModalOpen(true);
  };

  const handleConfirmCompletion = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    setIsSubmitting(true);
    try {
      await collectionAPI.updateTaskStatus(selectedTask._id, {
        status: 'completed',
        collectedWeightKg: Number(collectedWeightKg),
        notes: completionNotes,
      });
      setCompleteModalOpen(false);
      setFeedback(`Task ${selectedTask.taskNumber} marked as Completed. Bins have been reset to nominal.`);
      loadStaffData();
      setTimeout(() => setFeedback(''), 5000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error completing task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportIssue = async (e) => {
    e.preventDefault();
    if (!issueBinId || !issueDescription) {
      alert('Please fill out all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await collectionAPI.reportIssue({
        binId: issueBinId,
        issueType,
        description: issueDescription,
        severity: issueSeverity,
      });
      setIssueModalOpen(false);
      setIssueDescription('');
      setFeedback('Incident report submitted and maintenance alert logged.');
      setTimeout(() => setFeedback(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error reporting issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <LoadingSkeleton count={3} type="card" />
      </div>
    );
  }

  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Field Operations &amp; Collection Portal
            </h1>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
              {user?.name || 'Staff Member'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Assigned Ward: <strong>{user?.assignedWard || 'Ward-1 Central Market'}</strong> • Active Shift
          </p>
        </div>

                  <button
                    onClick={() => setIssueModalOpen(true)}
                    className="btn-interactive px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-900/10 flex items-center gap-2 self-start sm:self-auto"
                  >
                    <AlertTriangle className="w-4 h-4" /> Report Damaged Bin / Hazard
                  </button>
                </div>

                {feedback && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{feedback}</span>
                  </div>
                )}

                {/* Active Tasks Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      Assigned Collection Tasks ({activeTasks.length} Pending / In Progress)
                    </h2>
                  </div>

                  {activeTasks.length === 0 ? (
                    <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <ClipboardCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                      <h3 className="text-sm font-bold text-slate-800">All Scheduled Tasks Completed</h3>
                      <p className="text-xs text-slate-500 mt-1">No active routes pending collection at this time.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {activeTasks.map((task) => {
                        const isInProgress = task.status === 'in_progress';
                        const waypoints = task.routeDetails?.waypoints || [];

                        return (
                          <div
                            key={task._id}
                            className={`card-hover p-6 rounded-2xl bg-white border shadow-sm transition-all space-y-4 group ${
                              isInProgress
                                ? 'border-blue-400 ring-2 ring-blue-500/20 card-hover-glow-blue'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                                    {task.taskNumber}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                      task.priority === 'critical'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}
                                  >
                                    {task.priority} Priority
                                  </span>
                                </div>
                                <h3 className="text-sm font-bold text-slate-800 mt-1">{task.title}</h3>
                                <p className="text-xs text-slate-500">{task.ward}</p>
                              </div>

                              <span
                                className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                                  isInProgress ? 'bg-blue-500 text-white animate-pulse' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {task.status.replace('_', ' ')}
                              </span>
                            </div>

                            {/* Route Specs Bar */}
                            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 text-xs text-slate-700 border border-slate-100">
                              <div className="flex items-center gap-2">
                                <Navigation className="w-4 h-4 text-emerald-600" />
                                <span>Distance: <strong>{task.routeDetails?.estimatedDistanceKm || 0} km</strong></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span>Duration: <strong>~{task.routeDetails?.estimatedDurationMin || 0} min</strong></span>
                              </div>
                            </div>

                            {/* Stop Sequence */}
                            <div>
                              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Stops Sequence ({task.bins?.length || 0} Bins)
                              </h4>
                              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {(task.bins || []).map((b, i) => {
                                  const binObj = typeof b === 'object' ? b : bins.find((item) => item._id === b) || {};
                                  return (
                                    <div
                                      key={binObj._id || i}
                                      className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="w-4 h-4 rounded-full bg-slate-900 text-white font-bold text-[9px] flex items-center justify-center">
                                          {i + 1}
                                        </span>
                                        <span className="font-bold text-slate-900">{binObj.binId || `BIN-${i + 1}`}</span>
                                        <span className="text-[11px] text-slate-500 truncate max-w-[150px]">
                                          {binObj.label}
                                        </span>
                                      </div>
                                      <span className="font-bold text-red-600">{binObj.currentFillPercentage || 85}% Full</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Task Action Buttons */}
                            <div className="pt-2 border-t flex items-center gap-2">
                              {!isInProgress ? (
                                <button
                                  onClick={() => handleStartTask(task)}
                                  className="btn-interactive flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" /> Start Collection Route
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenCompleteModal(task)}
                                  className="btn-interactive flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                  <CheckCircle className="w-4 h-4" /> Confirm &amp; Complete Clearance
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

      {/* Completed Tasks History */}
      {completedTasks.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recently Completed Routes ({completedTasks.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedTasks.slice(0, 3).map((task) => (
              <div key={task._id} className="card-hover card-hover-glow-emerald p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-2 group">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">{task.taskNumber}</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                    Completed
                  </span>
                </div>
                <p className="font-semibold text-slate-800">{task.title}</p>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>Waste Collected: <strong>{task.collectedWeightKg || 350} kg</strong></span>
                  <span>Fuel Saved: <strong>~{task.routeDetails?.fuelSavedLiters || 1.8} L</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title={`Complete Task: ${selectedTask?.taskNumber}`}
      >
        <form onSubmit={handleConfirmCompletion} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Confirming this route will record the total waste tonnage collected and automatically reset all
            associated bins to empty status (nominal 5% residual level), clearing active overflow alerts.
          </p>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Total Waste Collected (kg) *</label>
            <div className="relative">
              <Scale className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="number"
                required
                min="10"
                max="10000"
                value={collectedWeightKg}
                onChange={(e) => setCollectedWeightKg(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Operational Completion Notes</label>
            <textarea
              rows="3"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
              placeholder="e.g. Cleared all commercial market bins without delays."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setCompleteModalOpen(false)}
              className="px-4 py-2 rounded-xl border text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isSubmitting ? 'Finalizing...' : 'Submit Clearance & Reset Bins'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Report Issue Modal */}
      <Modal isOpen={issueModalOpen} onClose={() => setIssueModalOpen(false)} title="Report Field Issue / Damaged Bin">
        <form onSubmit={handleReportIssue} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Select Affected Waste Bin *</label>
            <select
              value={issueBinId}
              onChange={(e) => setIssueBinId(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
            >
              {bins.map((b) => (
                <option key={b._id} value={b.binId}>
                  {b.binId} — {b.label} ({b.ward})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Incident Type</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              >
                <option value="damaged_bin">Physical Damage / Lid Broken</option>
                <option value="stale_sensor">Telemetry / Sensor Malfunction</option>
                <option value="overflow_predicted">Severe Road Obstruction</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Severity</label>
              <select
                value={issueSeverity}
                onChange={(e) => setIssueSeverity(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              >
                <option value="high">High</option>
                <option value="critical">Critical</option>
                <option value="medium">Medium</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Issue Description *</label>
            <textarea
              rows="3"
              required
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Describe the operational damage or access obstruction in detail..."
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIssueModalOpen(false)}
              className="px-4 py-2 rounded-xl border text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isSubmitting ? 'Reporting...' : 'Dispatch Maintenance Alert'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
