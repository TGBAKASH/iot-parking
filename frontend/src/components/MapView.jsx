import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, ExternalLink, X, Compass, Maximize2, Minimize2 } from 'lucide-react';

export default function MapView({ 
  parkings, 
  selectedParking, 
  navigatingParking,
  onSelectParking, 
  onStartNavigation,
  userLocation, 
  onRequestUserLocation 
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersGroupRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markerMapRef = useRef({});
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    routeLayerRef.current = L.layerGroup().addTo(mapRef.current);

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

  // Invalidate map size on fullscreen toggle
  useEffect(() => {
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 200);
  }, [isFullscreen]);

  // When selectedParking changes (and not navigating), fly to it & open popup
  useEffect(() => {
    if (!mapRef.current || !selectedParking || navigatingParking) return;
    const lat = parseFloat(selectedParking.latitude);
    const lng = parseFloat(selectedParking.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      mapRef.current.flyTo([lat, lng], 13, { duration: 1 });
      const marker = markerMapRef.current[selectedParking.id];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedParking?.id, selectedParking?.latitude, navigatingParking]);

  // Handle live active navigation route drawing on map
  useEffect(() => {
    if (!mapRef.current || !routeLayerRef.current) return;
    routeLayerRef.current.clearLayers();

    if (navigatingParking && userLocation) {
      const destLat = parseFloat(navigatingParking.latitude);
      const destLng = parseFloat(navigatingParking.longitude);

      if (!isNaN(destLat) && !isNaN(destLng)) {
        // Draw route line
        const routeCoords = navigatingParking.routeCoordinates && navigatingParking.routeCoordinates.length > 0
          ? navigatingParking.routeCoordinates
          : [[userLocation.lat, userLocation.lng], [destLat, destLng]];

        // Outer glow
        const glowLine = L.polyline(routeCoords, {
          color: '#059669',
          weight: 8,
          opacity: 0.4,
          lineCap: 'round',
          lineJoin: 'round',
        });

        // Inner solid road line
        const mainLine = L.polyline(routeCoords, {
          color: '#10b981',
          weight: 4,
          opacity: 0.95,
          dashArray: '2, 8',
          dashOffset: '0',
          lineCap: 'round',
          lineJoin: 'round',
        });

        glowLine.addTo(routeLayerRef.current);
        mainLine.addTo(routeLayerRef.current);

        // Fit map bounds to show complete route smoothly
        const routeBounds = L.latLngBounds([
          [userLocation.lat, userLocation.lng],
          [destLat, destLng],
          ...routeCoords
        ]);
        mapRef.current.fitBounds(routeBounds, { padding: [70, 70], maxZoom: 14 });
      }
    }
  }, [navigatingParking, userLocation]);

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
        html: `<div style="position:relative;width:26px;height:26px;display:flex;align-items:center;justify-content:center">
                <div style="position:absolute;width:100%;height:100%;background:#3b82f6;border-radius:50%;opacity:0.35;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>
                <div style="width:14px;height:14px;background:#2563eb;border-radius:50%;border:2px solid white;position:relative;box-shadow:0 1px 6px rgba(0,0,0,0.35)"></div>
               </div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
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
        const isNav = navigatingParking?.id === parking.id;

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

        const borderStyle = isNav 
          ? '3px solid #059669; animation: bounce-custom 1s infinite'
          : `2px solid ${badgeBorder}`;

        // Interactive pill badge displaying slot count directly on map
        const parkingIcon = L.divIcon({
          className: 'parking-marker-pill',
          html: `<div style="display:inline-flex;align-items:center;background:white;border:${borderStyle};border-radius:20px;padding:3px 8px 3px 4px;box-shadow:0 4px 14px rgba(0,0,0,0.22);font-family:Inter,sans-serif;white-space:nowrap;cursor:pointer">
                  <div style="display:flex;align-items:center;justify-content:center;min-width:24px;height:24px;padding:0 5px;border-radius:12px;background:${badgeBg};color:white;font-weight:800;font-size:11px;margin-right:5px">
                    ${available}/${total}
                  </div>
                  <div style="display:flex;flex-direction:column;line-height:1.1">
                    <span style="font-size:11px;font-weight:700;color:#111827">${isIoT ? '⚡ IoT' : ''} ${parking.name.split(' ')[0]}</span>
                    <span style="font-size:9.5px;font-weight:700;color:${badgeBg}">${available} Free Slots</span>
                  </div>
                 </div>`,
          iconSize: [120, 34],
          iconAnchor: [60, 17],
          popupAnchor: [0, -20],
        });

        const latLng = [lat, lng];
        const marker = L.marker(latLng, { icon: parkingIcon, zIndexOffset: isNav ? 500 : 100 });
        markerMapRef.current[parking.id] = marker;

        const originParam = userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : '';
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${lat},${lng}&travelmode=driving`;

        const popupContent = document.createElement('div');
        popupContent.style.cssText = 'padding:10px 12px;min-width:210px;font-family:Inter,sans-serif';
        popupContent.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${isIoT ? '#059669' : '#6b7280'};background:${isIoT ? '#ecfdf5' : '#f3f4f6'};padding:2px 6px;border-radius:4px">
              ${isIoT ? '📶 IoT Live' : parking.city}
            </span>
            <span style="font-size:13px;font-weight:800;color:${badgeBg}">
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
            <button id="btn-nav-${parking.id}" style="flex:1;padding:7px 10px;background:#10b981;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:4px">
              Navigate ➔
            </button>
          </div>
        `;

        popupContent.querySelector(`#btn-inspect-${parking.id}`).addEventListener('click', () => {
          if (onSelectParking) onSelectParking(parking);
          mapRef.current.closePopup();
        });

        popupContent.querySelector(`#btn-nav-${parking.id}`).addEventListener('click', () => {
          if (onStartNavigation) onStartNavigation(parking);
          mapRef.current.closePopup();
        });

        marker.bindPopup(popupContent, {
          className: 'light-popup',
          closeButton: true,
          minWidth: 210,
        });

        marker.on('click', () => {
          if (onSelectParking) onSelectParking(parking);
        });

        marker.addTo(markersGroupRef.current);
        bounds.push(latLng);
      });
    }

    // Fit map bounds if not in active navigation
    if (!navigatingParking) {
      if (bounds.length > 1) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      } else if (bounds.length === 1) {
        mapRef.current.setView(bounds[0], 11);
      }
    }
  }, [parkings, userLocation, selectedParking, navigatingParking, onSelectParking, onStartNavigation]);

  return (
    <div className={`relative w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm transition-all duration-300 ${
      isFullscreen ? 'fixed inset-0 z-[9999] h-screen w-screen rounded-none border-none' : 'h-full'
    }`}>
      <style>{`
        .light-popup .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 8px 24px rgba(0,0,0,0.14);
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
        @keyframes bounce-custom {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Top right map control buttons */}
      <div className="absolute top-3 right-12 z-[1000] flex items-center gap-1.5">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 bg-white text-gray-700 rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Navigation"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Re-center GPS button */}
      <button
        onClick={onRequestUserLocation}
        className="absolute bottom-6 right-6 z-[1000] p-3 bg-white text-gray-700 rounded-full shadow-md border border-gray-200 hover:bg-gray-50 hover:text-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
        aria-label="Find my location"
        title="Center on my location"
      >
        <Compass size={20} />
      </button>

      {/* Real-time Map Legend / Slot indicator header */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm text-xs flex items-center gap-3">
        <span className="font-bold text-gray-800 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Live Slots:
        </span>
        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available
        </span>
        <span className="flex items-center gap-1 text-amber-700 font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Fast Filling
        </span>
        <span className="flex items-center gap-1 text-red-700 font-semibold">
          <span className="w-2 h-2 rounded-full bg-red-500"></span> Full
        </span>
      </div>

      {/* Floating In-Map Navigation Overlay when navigating */}
      {navigatingParking && (
        <div className="absolute bottom-4 left-4 right-20 z-[1000] bg-white/95 backdrop-blur-md border-2 border-emerald-500 rounded-xl p-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded uppercase">
                  Navigating
                </span>
                <span className="font-extrabold text-sm text-gray-900">{navigatingParking.name}</span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">{navigatingParking.address}</p>
            </div>
            
            {/* Live slot counter display right in the navigation HUD */}
            <div className="text-right">
              <div className="text-base font-black text-emerald-600">
                {navigatingParking.available_slots} / {navigatingParking.total_slots}
              </div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Slots Free
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
