import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trash2, AlertTriangle, Clock, Layers } from 'lucide-react';

// Fix Leaflet default icon path issues in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom circular marker with fill percentage label
const createCustomMarker = (fill, status) => {
  const statusClass = status === 'critical' ? 'critical' : status === 'warning' ? 'warning' : 'normal';
  return L.divIcon({
    className: `custom-bin-marker ${statusClass}`,
    html: `<span>${Math.round(fill)}%</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

// Component to dynamically fit bounds when bins change
const MapBoundsAdjuster = ({ bins }) => {
  const map = useMap();
  useEffect(() => {
    if (bins && bins.length > 0) {
      const validCoords = bins
        .filter((b) => b.location?.coordinates && b.location.coordinates.length === 2)
        .map((b) => [b.location.coordinates[1], b.location.coordinates[0]]);
      if (validCoords.length > 0) {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [bins, map]);
  return null;
};

export const LiveBinMap = ({ bins = [], onSelectBin, height = '500px' }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredBins = useMemo(() => {
    return bins.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
      return true;
    });
  }, [bins, statusFilter, categoryFilter]);

  const defaultCenter = [12.9716, 77.5946]; // Bangalore CBD

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-50 border-b border-slate-200 gap-3 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>Live Municipal Bin Map</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold">
            {filteredBins.length} visible
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="critical">Critical (&ge;80%)</option>
            <option value="warning">Warning (60-80%)</option>
            <option value="normal">Normal (&lt;60%)</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="general">General</option>
            <option value="organic">Organic</option>
            <option value="recyclable">Recyclable</option>
            <option value="hazardous">Hazardous</option>
          </select>
        </div>
      </div>

      {/* Map Canvas */}
      <div style={{ height }} className="relative w-full">
        <MapContainer
          center={defaultCenter}
          zoom={12}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBoundsAdjuster bins={filteredBins} />

          {filteredBins.map((bin) => {
            const coords = bin.location?.coordinates || [77.5946, 12.9716];
            const position = [coords[1], coords[0]]; // Leaflet uses [lat, lng]
            const fill = bin.currentFillPercentage || 0;

            return (
              <Marker
                key={bin._id || bin.binId}
                position={position}
                icon={createCustomMarker(fill, bin.status)}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 min-w-[210px] space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="font-extrabold text-xs text-slate-900">{bin.binId}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          bin.status === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : bin.status === 'warning'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {bin.status}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 leading-tight">{bin.label}</p>
                    <p className="text-[11px] text-slate-500">{bin.ward}</p>

                    {/* Fill Level Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] font-medium text-slate-600">
                        <span>Fill Level</span>
                        <span className="font-bold text-slate-900">{Math.round(fill)}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            fill >= 80 ? 'bg-red-500' : fill >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, fill)}%` }}
                        />
                      </div>
                    </div>

                    {/* Metadata specs */}
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <div>
                        Category: <strong className="text-slate-700 capitalize">{bin.category}</strong>
                      </div>
                      <div>
                        Capacity: <strong className="text-slate-700">{bin.capacityLiters} L</strong>
                      </div>
                    </div>

                    {bin.predictedOverflowHours !== null && (
                      <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Overflow est: ~{bin.predictedOverflowHours} hrs</span>
                      </div>
                    )}

                    {onSelectBin && (
                      <button
                        onClick={() => onSelectBin(bin)}
                        className="w-full mt-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
                      >
                        Inspect Bin Telemetry
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Map Legend */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span>Normal (&lt;60%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span>Nearly Full (60-80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            <span>Critical Overflow (&ge;80%)</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-400">OpenStreetMap Live Telemetry</span>
      </div>
    </div>
  );
};
