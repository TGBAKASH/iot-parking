import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin } from 'lucide-react';

export default function MapView({ parkings, selectedParking, onSelectParking, userLocation, onRequestUserLocation }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersGroupRef = useRef(null);
  const markerMapRef = useRef({});

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const center = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [10.7905, 78.7047]; // Default: Tamil Nadu (Trichy)

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      center: center,
      zoom: 9,
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

  // When selectedParking changes, fly to it & open popup
  useEffect(() => {
    if (!mapRef.current || !selectedParking) return;
    const lat = parseFloat(selectedParking.latitude);
    const lng = parseFloat(selectedParking.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      mapRef.current.flyTo([lat, lng], 13, { duration: 1 });
      const marker = markerMapRef.current[selectedParking.id];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedParking?.id, selectedParking?.latitude]);

  // Update markers whenever parkings or userLocation change
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current) return;
    markersGroupRef.current.clearLayers();
    markerMapRef.current = {};

    const bounds = [];

    // User location blue pulsing dot
    if (userLocation) {
      const userLatLng = [userLocation.lat, userLocation.lng];
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center">
                <div style="position:absolute;width:100%;height:100%;background:#3b82f6;border-radius:50%;opacity:0.35;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>
                <div style="width:12px;height:12px;background:#2563eb;border-radius:50%;border:2px solid white;position:relative;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>
               </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker(userLatLng, { icon: userIcon, zIndexOffset: 1000 }).addTo(markersGroupRef.current);
      bounds.push(userLatLng);
    }

    // Parking markers with clear slot count badge
    if (parkings && parkings.length > 0) {
      parkings.forEach((parking) => {
        const lat = parseFloat(parking.latitude);
        const lng = parseFloat(parking.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const available = parseInt(parking.available_slots, 10) || 0;
        const total = parseInt(parking.total_slots, 10) || 1;
        const pct = total > 0 ? (available / total) * 100 : 0;
        const isIoT = parking.id === 1;

        let badgeBg = '#10b981'; // emerald
        let badgeBorder = '#059669';
        let statusText = 'Available';

        if (pct <= 15) {
          badgeBg = '#ef4444'; // red
          badgeBorder = '#dc2626';
          statusText = 'Almost Full';
        } else if (pct <= 40) {
          badgeBg = '#f59e0b'; // amber
          badgeBorder = '#d97706';
          statusText = 'Filling Fast';
        }

        const isSelected = selectedParking?.id === parking.id;
        const transformScale = isSelected ? 'scale(1.1)' : 'scale(1)';

        // Interactive pill badge displaying slot count directly on map
        const parkingIcon = L.divIcon({
          className: 'parking-marker-pill',
          html: `<div style="transform:${transformScale};transition:transform 0.2s ease;display:inline-flex;align-items:center;background:white;border:2px solid ${badgeBorder};border-radius:20px;padding:3px 8px 3px 4px;box-shadow:0 3px 10px rgba(0,0,0,0.18);font-family:Inter,sans-serif;white-space:nowrap;cursor:pointer">
                  <div style="display:flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 4px;border-radius:11px;background:${badgeBg};color:white;font-weight:700;font-size:11px;margin-right:5px">
                    ${available}/${total}
                  </div>
                  <div style="display:flex;flex-direction:column;line-height:1">
                    <span style="font-size:11px;font-weight:700;color:#111827">${isIoT ? '⚡ IoT' : ''} ${parking.name.split(' ')[0]}</span>
                    <span style="font-size:9px;font-weight:600;color:${badgeBg}">${available} Slots Free</span>
                  </div>
                 </div>`,
          iconSize: [110, 32],
          iconAnchor: [55, 16],
          popupAnchor: [0, -18],
        });

        const latLng = [lat, lng];
        const marker = L.marker(latLng, { icon: parkingIcon });
        markerMapRef.current[parking.id] = marker;

        const originParam = userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : '';
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${lat},${lng}&travelmode=driving`;

        const popupContent = document.createElement('div');
        popupContent.style.cssText = 'padding:10px 12px;min-width:200px;font-family:Inter,sans-serif';
        popupContent.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${isIoT ? '#059669' : '#6b7280'};background:${isIoT ? '#ecfdf5' : '#f3f4f6'};padding:2px 6px;border-radius:4px">
              ${isIoT ? '📶 IoT Live' : parking.city}
            </span>
            <span style="font-size:12px;font-weight:700;color:${badgeBg}">
              ${available} / ${total} Free
            </span>
          </div>
          <h3 style="font-weight:700;color:#111827;margin:0 0 4px;font-size:14px;line-height:1.3">${parking.name}</h3>
          <p style="color:#6b7280;font-size:11px;margin:0 0 8px">${parking.address}</p>
          
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:6px 8px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;font-size:11px">
            <span style="color:#4b5563">Slot Availability:</span>
            <span style="font-weight:700;color:${badgeBg}">${statusText} (${Math.round(pct)}%)</span>
          </div>

          <div style="display:flex;gap:6px">
            <button id="btn-inspect-${parking.id}" style="flex:1;padding:7px 10px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">
              View Slots
            </button>
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="flex:1;padding:7px 10px;background:#10b981;color:white;text-decoration:none;text-align:center;border-radius:6px;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:4px">
              Navigate ➔
            </a>
          </div>
        `;

        popupContent.querySelector(`#btn-inspect-${parking.id}`).addEventListener('click', () => {
          if (onSelectParking) onSelectParking(parking);
          mapRef.current.closePopup();
        });

        marker.bindPopup(popupContent, {
          className: 'light-popup',
          closeButton: true,
          minWidth: 200,
        });

        marker.on('click', () => {
          if (onSelectParking) onSelectParking(parking);
        });

        marker.addTo(markersGroupRef.current);
        bounds.push(latLng);
      });
    }

    // Fit map to show all markers smoothly
    if (bounds.length > 1) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    } else if (bounds.length === 1) {
      mapRef.current.setView(bounds[0], 11);
    }
  }, [parkings, userLocation, selectedParking, onSelectParking]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <style>{`
        .light-popup .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          border: 1px solid #e5e7eb;
          padding: 0;
        }
        .light-popup .leaflet-popup-tip {
          background: white;
          border: 1px solid #e5e7eb;
        }
        .light-popup .leaflet-popup-content { margin: 0; }
        .parking-marker-pill {
          background: transparent !important;
          border: none !important;
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Re-center GPS button */}
      <button
        onClick={onRequestUserLocation}
        className="absolute bottom-6 right-6 z-[1000] p-3 bg-white text-gray-700 rounded-full shadow-md border border-gray-200 hover:bg-gray-50 hover:text-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
        aria-label="Find my location"
        title="Center on my location"
      >
        <Navigation size={20} />
      </button>

      {/* Real-time Map Legend / Slot indicator header */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm text-xs flex items-center gap-3">
        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Live Slots:
        </span>
        <span className="flex items-center gap-1 text-emerald-700 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available
        </span>
        <span className="flex items-center gap-1 text-amber-700 font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Fast Filling
        </span>
        <span className="flex items-center gap-1 text-red-700 font-medium">
          <span className="w-2 h-2 rounded-full bg-red-500"></span> Full
        </span>
      </div>
    </div>
  );
}
