import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Compass, Layers, ExternalLink } from 'lucide-react';

/**
 * MapView Component (Leaflet + OpenStreetMap + CartoDB Dark Theme)
 * 100% Free - Requires NO API Keys and NO Google Cloud Payment setup!
 * Features:
 * - Renders custom pins for all parking locations in real-time.
 * - Displays User Location marker with pulsing radar effect.
 * - InfoWindow popups showing distance, travel time, slot state counters,
 *   and "Navigate with Google Maps" external navigation button.
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

  // Initialize Leaflet map on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create Leaflet map centered at default location (San Francisco: 37.774929, -122.419416)
      const map = L.map(mapContainerRef.current, {
        center: [37.774929, -122.419416],
        zoom: 12,
        zoomControl: false,
      });

      // Add zoom control at top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Add CartoDB Dark Matter Tile Layer for sleek dark mode aesthetics
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Create LayerGroup for markers management
      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map markers whenever parkings, userLocation, or selectedParking change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    // Clear previous markers
    markersGroup.clearLayers();

    const bounds = L.latLngBounds();

    // 1. Add User Location Marker (if available)
    if (userLocation) {
      const userLatLng = [userLocation.lat, userLocation.lng];
      bounds.extend(userLatLng);

      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <span class="absolute w-8 h-8 rounded-full bg-cyan-400 opacity-40 animate-ping"></span>
            <span class="relative w-5 h-5 rounded-full bg-cyan-500 border-2 border-white shadow-lg flex items-center justify-center">
              <span class="w-2 h-2 rounded-full bg-white"></span>
            </span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const userMarker = L.marker(userLatLng, { icon: userIcon })
        .bindPopup(`
          <div style="font-family: Inter, sans-serif; padding: 4px;">
            <strong style="color: #38bdf8;">📍 Your Location</strong>
            <p style="font-size: 11px; color: #94a3b8; margin-top: 2px;">GPS location active</p>
          </div>
        `);

      markersGroup.addLayer(userMarker);
    }

    // 2. Add Parking Lot Markers
    parkings.forEach((parking) => {
      const lat = parseFloat(parking.latitude);
      const lng = parseFloat(parking.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const latLng = [lat, lng];
      bounds.extend(latLng);

      const isAvailable = parseInt(parking.available_slots, 10) > 0;
      const isSelected = selectedParking && selectedParking.id === parking.id;

      // Color coding for map pins
      const pinBgColor = isAvailable ? '#22c55e' : '#ef4444';
      const borderClass = isSelected ? 'border-4 border-cyan-400 scale-110 z-50' : 'border-2 border-slate-900';

      const customPinIcon = L.divIcon({
        className: 'custom-parking-marker',
        html: `
          <div class="relative flex items-center justify-center transform transition-transform duration-200 ${borderClass}" style="
            background-color: ${pinBgColor};
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
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

      // Construct "Navigate with Google Maps" deep-link URL
      const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      // Construct InfoWindow HTML popup
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
              <strong style="color: #38bdf8;">${parking.distanceText || 'Calculating...'}</strong>
            </div>
            <div>
              <span style="color: #94a3b8; display: block; font-size: 9px; text-transform: uppercase;">Est. Travel</span>
              <strong style="color: #fbbf24;">${parking.durationText || 'Calculating...'}</strong>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; margin-bottom: 10px;">
            <span style="color: #94a3b8;">Total Slots: <strong>${parking.total_slots}</strong></span>
            <span style="color: ${isAvailable ? '#22c55e' : '#ef4444'}; font-weight: 700;">
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
            background: linear-gradient(to right, #06b6d4, #2563eb);
            color: white;
            font-weight: 700;
            font-size: 11px;
            border-radius: 8px;
            text-decoration: none;
            box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
          ">
            🚘 Navigate with Google Maps
          </a>
        </div>
      `;

      const marker = L.marker(latLng, { icon: customPinIcon })
        .bindPopup(popupHtml, { className: 'custom-leaflet-popup' })
        .on('click', () => {
          if (onSelectParking) onSelectParking(parking);
        });

      markersGroup.addLayer(marker);

      // Open popup automatically if selected
      if (isSelected) {
        marker.openPopup();
      }
    });

    // Auto-fit map view to contain markers if multiple exist
    if (parkings.length > 0) {
      if (selectedParking) {
        map.flyTo([selectedParking.latitude, selectedParking.longitude], 14, { duration: 1.2 });
      } else if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    }
  }, [parkings, selectedParking, userLocation]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden glass-card border border-slate-800 shadow-2xl">
      
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[450px] z-10" />

      {/* Floating GPS Location Button */}
      <button
        onClick={onRequestUserLocation}
        className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold shadow-xl transition-all hover:scale-105"
        title="Find My Location"
      >
        <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
        <span>{userLocation ? 'Update My GPS Location' : 'Detect My Location'}</span>
      </button>

      {/* Top Floating Badge */}
      <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 font-semibold flex items-center gap-2 shadow-lg backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>OpenStreetMap + OSRM Routes Active (Free)</span>
      </div>

    </div>
  );
}
