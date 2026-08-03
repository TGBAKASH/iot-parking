import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, MapPin } from 'lucide-react';

/**
 * MapView Component (Fixed Leaflet Map - No Glitching, Smooth GPS Centering)
 */
export default function MapView({
  parkings,
  selectedParking,
  onSelectParking,
  userLocation,
  onRequestUserLocation,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const userMarkerRef = useRef(null);

  // 1. Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default to user location if already present, otherwise fallback
      const initialLat = userLocation ? userLocation.lat : 10.9541;
      const initialLng = userLocation ? userLocation.lng : 78.7589;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // CartoDB Dark Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Invalidate size to fix tile rendering/glitching bugs
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Center map when userLocation changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.invalidateSize();

    if (userLocation && !isNaN(userLocation.lat) && !isNaN(userLocation.lng)) {
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1.2 });
    }
  }, [userLocation?.lat, userLocation?.lng]);

  // 3. Center map when explicit parking card is selected by user
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedParking) return;

    const lat = parseFloat(selectedParking.latitude);
    const lng = parseFloat(selectedParking.longitude);

    if (!isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], 15, { duration: 1 });
    }
  }, [selectedParking?.id, selectedParking?.latitude, selectedParking?.longitude]);

  // 4. Update markers group (User Puck & Parking Pins)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // Add High-Visibility User GPS Puck
    if (userLocation && !isNaN(userLocation.lat) && !isNaN(userLocation.lng)) {
      const userLatLng = [userLocation.lat, userLocation.lng];

      const userIcon = L.divIcon({
        className: 'user-gps-marker',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10">
            <span class="absolute w-10 h-10 rounded-full bg-blue-500/40 animate-ping"></span>
            <span class="relative w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-2xl flex items-center justify-center">
              <span class="w-2.5 h-2.5 rounded-full bg-white"></span>
            </span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const userMarker = L.marker(userLatLng, { icon: userIcon, zIndexOffset: 1000 })
        .bindPopup(`
          <div style="padding: 4px; font-family: Inter, sans-serif;">
            <strong style="color: #60a5fa; font-size: 13px;">📍 Your Live GPS Location</strong>
            <p style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
              Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}
            </p>
          </div>
        `);

      markersGroup.addLayer(userMarker);
    }

    // Add Parking Location Markers
    parkings.forEach((parking) => {
      const lat = parseFloat(parking.latitude);
      const lng = parseFloat(parking.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const isAvailable = parseInt(parking.available_slots, 10) > 0;
      const isSelected = selectedParking && selectedParking.id === parking.id;

      const pinColor = isAvailable ? '#10b981' : '#ef4444';
      const borderStyle = isSelected ? 'border-4 border-blue-400 scale-110' : 'border-2 border-slate-900';

      const customPinIcon = L.divIcon({
        className: 'parking-pin-marker',
        html: `
          <div class="relative flex items-center justify-center ${borderStyle}" style="
            background-color: ${pinColor};
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 6px 16px rgba(0,0,0,0.6);
          ">
            <span style="
              transform: rotate(45deg);
              font-weight: 800;
              font-size: 14px;
              color: white;
            ">P</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      const popupHtml = `
        <div style="font-family: Inter, sans-serif; width: 230px; padding: 4px;">
          <h4 style="font-weight: 700; font-size: 14px; color: #f8fafc; margin-bottom: 2px;">
            ${parking.name}
          </h4>
          <p style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            📍 ${parking.address}, ${parking.city}
          </p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; margin-bottom: 8px; background: #0f172a; padding: 6px; border-radius: 8px; border: 1px solid #334155;">
            <div>
              <span style="color: #94a3b8; display: block; font-size: 9px; text-transform: uppercase;">Distance</span>
              <strong style="color: #60a5fa;">${parking.distanceText || 'Calculating...'}</strong>
            </div>
            <div>
              <span style="color: #94a3b8; display: block; font-size: 9px; text-transform: uppercase;">Est. Travel</span>
              <strong style="color: #fbbf24;">${parking.durationText || 'Calculating...'}</strong>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; margin-bottom: 10px;">
            <span style="color: #94a3b8;">Total Slots: <strong>${parking.total_slots}</strong></span>
            <span style="color: ${isAvailable ? '#10b981' : '#ef4444'}; font-weight: 700;">
              ${parking.available_slots} Free
            </span>
          </div>

          <a href="${googleMapsNavUrl}" target="_blank" rel="noopener noreferrer" style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            width: 100%;
            padding: 8px;
            background: #2563eb;
            color: white;
            font-weight: 700;
            font-size: 11px;
            border-radius: 8px;
            text-decoration: none;
          ">
            🚘 Navigate with Google Maps
          </a>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customPinIcon })
        .bindPopup(popupHtml, { className: 'custom-leaflet-popup' })
        .on('click', () => {
          if (onSelectParking) onSelectParking(parking);
        });

      markersGroup.addLayer(marker);

      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [parkings, selectedParking, userLocation]);

  const handleCenterUser = () => {
    if (onRequestUserLocation) onRequestUserLocation();
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1 });
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden card-modern border border-slate-800 shadow-xl">
      
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[450px]" />

      {/* Floating GPS Location Button */}
      <button
        onClick={handleCenterUser}
        className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold shadow-lg transition-all"
      >
        <Compass className="w-4 h-4 text-blue-400" />
        <span>{userLocation ? 'Center on My GPS Location' : 'Detect My Location'}</span>
      </button>

      {/* Top Floating Badge */}
      <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 font-medium flex items-center gap-2 shadow-md">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span>Live GPS Map Active</span>
      </div>

    </div>
  );
}
