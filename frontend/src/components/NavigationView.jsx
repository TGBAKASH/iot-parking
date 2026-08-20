import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { parkingService } from '../services/api';
import { fetchDrivingDistanceAndDuration } from '../services/routingService';
import { socket, subscribeToSlotUpdates, unsubscribeFromSlotUpdates } from '../services/socket';
import { ArrowLeft, Navigation, ExternalLink, MapPin, Clock, Wifi, Loader2 } from 'lucide-react';

export default function NavigationView({ parking: initialParking, userLocation, onGoBack }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [parking, setParking] = useState(initialParking);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const available = parseInt(parking.available_slots, 10) || 0;
  const total = parseInt(parking.total_slots, 10) || 1;
  const pct = total > 0 ? (available / total) * 100 : 0;
  const isIoT = parking.id === 1;

  let statusColor = '#10b981';
  let statusBg = 'bg-emerald-500';
  let statusText = 'Available';
  if (pct <= 15) { statusColor = '#ef4444'; statusBg = 'bg-red-500'; statusText = 'Almost Full'; }
  else if (pct <= 40) { statusColor = '#f59e0b'; statusBg = 'bg-amber-500'; statusText = 'Filling Fast'; }

  // Google Maps URL
  const originParam = userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : '';
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${parking.latitude},${parking.longitude}&travelmode=driving`;

  // Listen for real-time slot updates
  useEffect(() => {
    const handleUpdate = (data) => {
      if (data.parking_id === parking.id) {
        const newAvail = data.updated_parking
          ? parseInt(data.updated_parking.available_slots, 10)
          : Math.max(0, available + (data.is_occupied ? -1 : 1));
        setParking(prev => ({ ...prev, available_slots: newAvail }));
      }
    };

    subscribeToSlotUpdates(handleUpdate);
    return () => unsubscribeFromSlotUpdates();
  }, [parking.id]);

  // Refresh parking data periodically
  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await parkingService.getParkingById(parking.id);
        if (res.success && res.data) {
          setParking(prev => ({ ...prev, available_slots: res.data.available_slots, total_slots: res.data.total_slots }));
        }
      } catch (e) {}
    };
    refresh();
    const interval = setInterval(refresh, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [parking.id]);

  // Initialize fullscreen map with route
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const destLat = parseFloat(parking.latitude);
    const destLng = parseFloat(parking.longitude);
    const userLat = userLocation?.lat || 10.7905;
    const userLng = userLocation?.lng || 78.6844;

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      center: [userLat, userLng],
      zoom: 11,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(mapRef.current);

    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    // User marker
    const userIcon = L.divIcon({
      className: '',
      html: `<div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center">
              <div style="position:absolute;width:100%;height:100%;background:#3b82f6;border-radius:50%;opacity:0.3;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>
              <div style="width:16px;height:16px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>
             </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 1000 }).addTo(mapRef.current);

    // Destination marker
    const destIcon = L.divIcon({
      className: '',
      html: `<div style="display:flex;flex-direction:column;align-items:center">
              <div style="background:${statusColor};color:white;font-weight:800;font-size:13px;padding:6px 12px;border-radius:12px;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);text-align:center;line-height:1.1;font-family:Inter,sans-serif">
                <div>${available}/${total}</div>
                <div style="font-size:9px;font-weight:600;opacity:0.9;margin-top:1px">SLOTS FREE</div>
              </div>
              <div style="width:3px;height:12px;background:${statusColor};margin-top:-1px"></div>
              <div style="width:8px;height:8px;background:${statusColor};border-radius:50%;margin-top:-1px"></div>
             </div>`,
      iconSize: [80, 60],
      iconAnchor: [40, 60],
    });
    L.marker([destLat, destLng], { icon: destIcon, zIndexOffset: 900 }).addTo(mapRef.current);

    // Fetch and draw driving route
    const drawRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${destLng},${destLat}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);

          const distKm = (route.distance / 1000).toFixed(1);
          const durMins = Math.max(1, Math.round(route.duration / 60));
          setRouteInfo({ distance: `${distKm} km`, duration: `${durMins} mins` });

          // Glow
          L.polyline(coords, { color: '#059669', weight: 9, opacity: 0.3, lineCap: 'round', lineJoin: 'round' }).addTo(mapRef.current);
          // Main
          L.polyline(coords, { color: '#10b981', weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }).addTo(mapRef.current);

          mapRef.current.fitBounds(L.latLngBounds(coords), { padding: [80, 80], maxZoom: 14 });
        } else {
          // Fallback straight line
          L.polyline([[userLat, userLng], [destLat, destLng]], { color: '#10b981', weight: 4, dashArray: '8,12' }).addTo(mapRef.current);
          mapRef.current.fitBounds([[userLat, userLng], [destLat, destLng]], { padding: [80, 80] });
        }
      } catch (e) {
        L.polyline([[userLat, userLng], [destLat, destLng]], { color: '#10b981', weight: 4, dashArray: '8,12' }).addTo(mapRef.current);
        mapRef.current.fitBounds([[userLat, userLng], [destLat, destLng]], { padding: [80, 80] });
      }
      setLoading(false);
    };

    drawRoute();

    setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 300);

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Update destination marker when slot count changes
  useEffect(() => {
    // The marker icon is static HTML, so we just need to track it for the overlay
  }, [available]);

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
      `}</style>

      {/* === TOP OVERLAY BAR: Live Slot Count === */}
      <div className="bg-white border-b border-gray-200 shadow-sm z-50 flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Back + Parking Info */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onGoBack}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-gray-900 text-sm truncate">{parking.name}</h2>
                {isIoT && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <Wifi className="w-2.5 h-2.5" /> IoT Live
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{parking.address}, {parking.city}</span>
              </p>
            </div>
          </div>

          {/* Center: Live Slot Count (THE MAIN FEATURE) */}
          <div className="flex-shrink-0 mx-4">
            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 shadow-md ${
              pct > 40 ? 'border-emerald-400 bg-emerald-50' : pct > 15 ? 'border-amber-400 bg-amber-50' : 'border-red-400 bg-red-50'
            }`}>
              <div className="text-center">
                <div className={`text-2xl font-black leading-none ${
                  pct > 40 ? 'text-emerald-700' : pct > 15 ? 'text-amber-700' : 'text-red-700'
                }`}>
                  {available} / {total}
                </div>
                <div className={`text-[10px] font-extrabold uppercase tracking-wider mt-0.5 ${
                  pct > 40 ? 'text-emerald-600' : pct > 15 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  Slots Free • {statusText}
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${statusBg} animate-pulse`}></div>
            </div>
          </div>

          {/* Right: Route info + Google Maps */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {routeInfo && (
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-gray-900 flex items-center gap-1 justify-end">
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  {routeInfo.distance}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3" />
                  {routeInfo.duration}
                </div>
              </div>
            )}
            
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Google Maps</span>
              <span className="sm:hidden">Maps</span>
            </a>
          </div>
        </div>
      </div>

      {/* === FULLSCREEN MAP === */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="text-sm font-medium text-gray-600">Loading route...</span>
            </div>
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
