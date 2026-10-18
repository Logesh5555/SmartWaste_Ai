import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Clock, Fuel, ShieldCheck } from 'lucide-react';

const createOrderMarker = (order, isDepot = false) => {
  return L.divIcon({
    className: 'custom-bin-marker',
    html: `<div style="background-color: ${isDepot ? '#0f172a' : '#059669'}; color: white; width: 32px; height: 32px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25);">${
      isDepot ? '★' : order
    }</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const FitBoundsToRoute = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [points, map]);
  return null;
};

export const RouteMap = ({
  waypoints = [],
  depot = [77.5946, 12.9716],
  totalDistanceKm = 0,
  totalDurationMin = 0,
  fuelSavedLiters = 0,
  co2SavedKg = 0,
  height = '420px',
}) => {
  // Build polyline points in [lat, lng] format
  const depotLatLng = [depot[1], depot[0]];
  const routeLatLngs = [depotLatLng];

  waypoints.forEach((wp) => {
    if (wp.coordinates && wp.coordinates.length === 2) {
      routeLatLngs.push([wp.coordinates[1], wp.coordinates[0]]);
    }
  });

  // Return to depot
  routeLatLngs.push(depotLatLng);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Route Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-900 text-white text-xs">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400">Total Distance</p>
            <p className="font-bold text-slate-100">{totalDistanceKm} km</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400">Est. Duration</p>
            <p className="font-bold text-slate-100">{totalDurationMin} mins</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Fuel className="w-4 h-4 text-indigo-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400">Fuel Saved</p>
            <p className="font-bold text-emerald-400">~{fuelSavedLiters} L</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400">CO₂ Avoided</p>
            <p className="font-bold text-teal-400">~{co2SavedKg} kg</p>
          </div>
        </div>
      </div>

      {/* Map View */}
      <div style={{ height }} className="relative w-full">
        <MapContainer
          center={depotLatLng}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBoundsToRoute points={routeLatLngs} />

          {/* Depot Marker */}
          <Marker position={depotLatLng} icon={createOrderMarker(0, true)}>
            <Popup>
              <div className="text-xs font-semibold p-1">
                <span className="text-slate-900 font-extrabold block">Municipal Depot (Base)</span>
                <span className="text-slate-500">Route Start & Return Point</span>
              </div>
            </Popup>
          </Marker>

          {/* Waypoint Markers */}
          {waypoints.map((wp, index) => {
            const pos = [wp.coordinates[1], wp.coordinates[0]];
            return (
              <Marker key={wp.binId || index} position={pos} icon={createOrderMarker(index + 1)}>
                <Popup>
                  <div className="text-xs p-1 space-y-1">
                    <span className="text-emerald-700 font-extrabold block">
                      Stop #{index + 1}: {wp.binId}
                    </span>
                    <p className="font-semibold text-slate-800">{wp.label}</p>
                    {wp.distanceFromPrevKm !== undefined && (
                      <p className="text-[10px] text-slate-500">
                        Distance from prev: {wp.distanceFromPrevKm} km
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Route Polyline */}
          <Polyline
            positions={routeLatLngs}
            color="#059669"
            weight={4}
            opacity={0.85}
            dashArray="6, 6"
          />
        </MapContainer>
      </div>
    </div>
  );
};
