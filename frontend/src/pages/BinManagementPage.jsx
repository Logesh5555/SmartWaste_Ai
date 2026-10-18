import React, { useState, useEffect } from 'react';
import { binsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  Trash2,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash,
  Eye,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle,
  X,
  MapPin,
} from 'lucide-react';

const WARDS = [
  'Ward-1 Central Market',
  'Ward-2 Tech Corridor',
  'Ward-3 Green Residences',
  'Ward-4 Metro Station',
  'Ward-5 Heritage Quarter',
];

const CATEGORIES = ['general', 'recyclable', 'organic', 'hazardous'];

export const BinManagementPage = ({ onSelectBin, setActivePage }) => {
  const { user } = useAuth();
  const { lastBinUpdate } = useSocket();
  const isAdmin = user?.role === 'admin';

  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // desc = highest fill first

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBin, setSelectedBin] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    binId: '',
    label: '',
    ward: 'Ward-1 Central Market',
    category: 'general',
    capacityLiters: 1000,
    address: 'Metropolitan Area',
    coordinates: '77.5946, 12.9716',
    criticalThreshold: 80,
    warningThreshold: 60,
  });

  const fetchBins = async () => {
    try {
      const res = await binsAPI.getAll();
      setBins(res.data.bins);
    } catch (err) {
      console.error('Error fetching bins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBins();
  }, []);

  // Update bin state dynamically when sensor simulator fires
  useEffect(() => {
    if (lastBinUpdate) {
      setBins((prev) =>
        prev.map((b) => (b.binId === lastBinUpdate.binId ? { ...b, ...lastBinUpdate } : b))
      );
    }
  }, [lastBinUpdate]);

  const handleOpenAdd = () => {
    const nextNumber = bins.length + 1;
    setFormData({
      binId: `BIN-W1-${String(nextNumber).padStart(3, '0')}`,
      label: `New Collection Point ${nextNumber}`,
      ward: 'Ward-1 Central Market',
      category: 'general',
      capacityLiters: 1000,
      address: 'Central Avenue',
      coordinates: '77.5946, 12.9716',
      criticalThreshold: 80,
      warningThreshold: 60,
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (bin) => {
    setSelectedBin(bin);
    setFormData({
      binId: bin.binId,
      label: bin.label,
      ward: bin.ward,
      category: bin.category,
      capacityLiters: bin.capacityLiters,
      address: bin.location?.address || 'Metropolitan Area',
      coordinates: `${bin.location?.coordinates?.[0] || 77.5946}, ${bin.location?.coordinates?.[1] || 12.9716}`,
      criticalThreshold: bin.criticalThreshold || 80,
      warningThreshold: bin.warningThreshold || 60,
      currentFillPercentage: bin.currentFillPercentage || 0,
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (bin) => {
    setSelectedBin(bin);
    setIsDeleteOpen(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    try {
      const coords = formData.coordinates.split(',').map((c) => parseFloat(c.trim()));
      await binsAPI.create({
        ...formData,
        coordinates: coords.length === 2 ? coords : [77.5946, 12.9716],
      });
      setIsAddOpen(false);
      fetchBins();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating bin');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedBin) return;
    try {
      const coords = formData.coordinates.split(',').map((c) => parseFloat(c.trim()));
      await binsAPI.update(selectedBin._id, {
        ...formData,
        location: {
          address: formData.address,
          type: 'Point',
          coordinates: coords.length === 2 ? coords : selectedBin.location?.coordinates,
        },
      });
      setIsEditOpen(false);
      fetchBins();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating bin');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBin) return;
    try {
      await binsAPI.delete(selectedBin._id);
      setIsDeleteOpen(false);
      fetchBins();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting bin');
    }
  };

  // Filter & Sort Logic
  const filteredBins = bins
    .filter((b) => {
      if (wardFilter && b.ward !== wardFilter) return false;
      if (categoryFilter && b.category !== categoryFilter) return false;
      if (statusFilter && b.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          b.binId.toLowerCase().includes(s) ||
          b.label.toLowerCase().includes(s) ||
          b.ward.toLowerCase().includes(s)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const fillA = a.currentFillPercentage || 0;
      const fillB = b.currentFillPercentage || 0;
      return sortOrder === 'desc' ? fillB - fillA : fillA - fillB;
    });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Waste Bin Fleet Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure telemetry sensors, coordinates, categories, and critical overflow thresholds
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="btn-interactive px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/20 flex items-center gap-2 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add New Waste Bin
          </button>
        )}
      </div>

      {/* Filter and Search Bar with Hover States */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-3 card-hover">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box with Clear Button */}
          <div className="relative sm:col-span-2 group">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by Bin ID, Location, or Ward..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Ward Filter */}
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          >
            <option value="">All Municipal Wards</option>
            {WARDS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          >
            <option value="">All Statuses</option>
            <option value="normal">Normal (&lt;60%)</option>
            <option value="warning">Warning (60-80%)</option>
            <option value="critical">Critical (&ge;80%)</option>
            <option value="damaged">Damaged / Issue</option>
          </select>
        </div>

        {/* Results summary and sort button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Showing <strong>{filteredBins.length}</strong> of {bins.length} bins
          </span>

          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="btn-interactive flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 transition px-2.5 py-1 rounded-lg hover:bg-emerald-50"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort: {sortOrder === 'desc' ? 'Highest Fill Level First' : 'Lowest Fill Level First'}
          </button>
        </div>
      </div>

      {/* Bins Table with Row Hover Interactions */}
      {loading ? (
        <LoadingSkeleton count={6} type="table" />
      ) : filteredBins.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <Trash2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No matching waste bins found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search criteria or filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Bin ID &amp; Location</th>
                  <th className="px-4 py-3.5">Ward</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Current Fill Level</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Last Reading</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBins.map((bin) => {
                  const fill = bin.currentFillPercentage || 0;
                  const isCrit = bin.status === 'critical';
                  const isWarn = bin.status === 'warning';

                  return (
                    <tr
                      key={bin._id}
                      className="group hover:bg-emerald-50/40 transition-colors duration-150 cursor-pointer"
                      onClick={() => {
                        if (onSelectBin) onSelectBin(bin);
                        if (setActivePage) setActivePage('bin-detail');
                      }}
                    >
                      {/* Bin ID & Label */}
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-slate-900 text-xs group-hover:text-emerald-700 transition-colors">
                          {bin.binId}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{bin.label}</div>
                      </td>

                      {/* Ward */}
                      <td className="px-4 py-3.5 font-semibold text-slate-700">{bin.ward}</td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`capitalize text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${
                            bin.category === 'organic'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : bin.category === 'recyclable'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : bin.category === 'hazardous'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {bin.category}
                        </span>
                      </td>

                      {/* Fill Progress Bar with Hover Scale */}
                      <td className="px-4 py-3.5 min-w-[150px]">
                        <div className="flex items-center justify-between font-bold text-slate-800 text-[11px] mb-1">
                          <span className="group-hover:scale-105 transition-transform origin-left">{fill}%</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Cap: {bin.capacityLiters}L
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCrit ? 'bg-red-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, fill)}%` }}
                          />
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${
                            isCrit
                              ? 'bg-red-100 text-red-700 border-red-200 animate-pulse'
                              : isWarn
                              ? 'bg-amber-100 text-amber-700 border-amber-200'
                              : bin.status === 'damaged'
                              ? 'bg-purple-100 text-purple-700 border-purple-200'
                              : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {bin.status}
                        </span>
                      </td>

                      {/* Last Reading */}
                      <td className="px-4 py-3.5 text-[11px] text-slate-500 font-medium">
                        {bin.lastReadingAt
                          ? new Date(bin.lastReadingAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Just now'}
                      </td>

                      {/* Actions with Hover Feedback */}
                      <td
                        className="px-5 py-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              if (onSelectBin) onSelectBin(bin);
                              if (setActivePage) setActivePage('bin-detail');
                            }}
                            title="Inspect Bin Telemetry"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-100 transition-all duration-200 hover:scale-110"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(bin)}
                                title="Edit Bin Configuration"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-100 transition-all duration-200 hover:scale-110"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDelete(bin)}
                                title="Decommission Bin"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-100 transition-all duration-200 hover:scale-110"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Bin Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register New Waste Bin">
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Bin ID *</label>
              <input
                type="text"
                required
                value={formData.binId}
                onChange={(e) => setFormData({ ...formData, binId: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Ward *</label>
              <select
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500"
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
            <label className="font-semibold text-slate-700 block mb-1">Label / Landmark *</label>
            <input
              type="text"
              required
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl capitalize focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Capacity (Liters)</label>
              <input
                type="number"
                value={formData.capacityLiters}
                onChange={(e) => setFormData({ ...formData, capacityLiters: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">GPS Coordinates (Lng, Lat)</label>
            <input
              type="text"
              value={formData.coordinates}
              onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
              placeholder="77.5946, 12.9716"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Warning Threshold (%)</label>
              <input
                type="number"
                value={formData.warningThreshold}
                onChange={(e) => setFormData({ ...formData, warningThreshold: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Critical Threshold (%)</label>
              <input
                type="number"
                value={formData.criticalThreshold}
                onChange={(e) => setFormData({ ...formData, criticalThreshold: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl border text-slate-600 font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-interactive px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm"
            >
              Save Bin
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Bin Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Bin: ${selectedBin?.binId}`}>
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Label / Location Landmark</label>
            <input
              type="text"
              required
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Ward</label>
              <select
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              >
                {WARDS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl capitalize"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Critical Threshold (%)</label>
              <input
                type="number"
                value={formData.criticalThreshold}
                onChange={(e) => setFormData({ ...formData, criticalThreshold: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Capacity (Liters)</label>
              <input
                type="number"
                value={formData.capacityLiters}
                onChange={(e) => setFormData({ ...formData, capacityLiters: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-xl border text-slate-600 font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-interactive px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm"
            >
              Update Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Bin Decommission">
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            Are you sure you want to decommission and remove bin <strong>{selectedBin?.binId}</strong> ({selectedBin?.label})?
            Historical telemetry logs will be archived.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 rounded-xl border text-slate-600 font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="btn-interactive px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition shadow-sm"
            >
              Confirm Deletion
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
