import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';

export default function MapView({ parkings, selectedParking, onSelectParking, userLocation, onRequestUserLocation }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersGroupRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const center = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [11.65, 78.15]; // Default: Tamil Nadu

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      center: center,
      zoom: 10,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapRef.current);

    L.control.zoom({ position: 'topright' }).addTo(mapRef.current);
    markersGroupRef.current = L.layerGroup().addTo(mapRef.current);

    setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 250);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // When selectedParking changes, fly to it
  useEffect(() => {
    if (!mapRef.current || !selectedParking) return;
    const lat = parseFloat(selectedParking.latitude);
    const lng = parseFloat(selectedParking.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      mapRef.current.flyTo([lat, lng], 13, { duration: 1 });
    }
  }, [selectedParking?.id, selectedParking?.latitude]);

  // Update markers whenever parkings or userLocation change
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current) return;
    markersGroupRef.current.clearLayers();

    const bounds = [];

    // User location blue pulsing dot
    if (userLocation) {
      const userLatLng = [userLocation.lat, userLocation.lng];
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center">
                <div style="position:absolute;width:100%;height:100%;background:#3b82f6;border-radius:50%;opacity:0.3;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>
                <div style="width:12px;height:12px;background:#2563eb;border-radius:50%;border:2px solid white;position:relative"></div>
               </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker(userLatLng, { icon: userIcon, zIndexOffset: 1000 }).addTo(markersGroupRef.current);
      bounds.push(userLatLng);
    }

    // Parking markers
    if (parkings && parkings.length > 0) {
      parkings.forEach((parking) => {
        const lat = parseFloat(parking.latitude);
        const lng = parseFloat(parking.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const available = parseInt(parking.available_slots, 10) || 0;
        const total = parseInt(parking.total_slots, 10) || 1;
        const pct = total > 0 ? (available / total) * 100 : 0;

        let bgColor = '#10b981'; // emerald
        if (pct <= 15) bgColor = '#ef4444'; // red
        else if (pct <= 40) bgColor = '#eab308'; // yellow

        const parkingIcon = L.divIcon({
          className: 'parking-marker',
          html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:${bgColor};border:2px solid white;color:white;font-weight:700;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-family:Inter,sans-serif">${available}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const latLng = [lat, lng];
        const marker = L.marker(latLng, { icon: parkingIcon });

        const popupContent = document.createElement('div');
        popupContent.style.cssText = 'padding:8px;min-width:160px;font-family:Inter,sans-serif';
        popupContent.innerHTML = `
          <h3 style="font-weight:600;color:#1f2937;margin:0 0 4px;font-size:14px">${parking.name}</h3>
          <p style="color:#6b7280;font-size:13px;margin:0 0 8px">${available} / ${total} Available</p>
          <button id="btn-${parking.id}" style="width:100%;padding:6px 12px;background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500">View Details</button>
        `;

        popupContent.querySelector(`#btn-${parking.id}`).addEventListener('click', () => {
          if (onSelectParking) onSelectParking(parking);
          mapRef.current.closePopup();
        });

        marker.bindPopup(popupContent, {
          className: 'light-popup',
          closeButton: true,
          minWidth: 160,
        });

        marker.addTo(markersGroupRef.current);
        bounds.push(latLng);
      });
    }

    // Fit map to show ALL markers (user + parkings)
    if (bounds.length > 1) {
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    } else if (bounds.length === 1) {
      mapRef.current.setView(bounds[0], 12);
    }
  }, [parkings, userLocation, onSelectParking]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <style>{`
        .light-popup .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
          border: 1px solid #e5e7eb;
        }
        .light-popup .leaflet-popup-tip {
          background: white;
          border: 1px solid #e5e7eb;
        }
        .light-popup .leaflet-popup-content { margin: 0; }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <button
        onClick={onRequestUserLocation}
        className="absolute bottom-6 right-6 z-[1000] p-3 bg-white text-gray-700 rounded-full shadow-md border border-gray-200 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
        aria-label="Find my location"
      >
        <Navigation size={20} />
      </button>
    </div>
  );
}
