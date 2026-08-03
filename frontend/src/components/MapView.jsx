import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair } from 'lucide-react';

export default function MapView({
  parkings,
  selectedParking,
  onSelectParking,
  userLocation,
  onRequestUserLocation
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        center: userLocation ? [userLocation.lat, userLocation.lng] : [10.9541, 78.7589],
        zoom: 13,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'topright' }).addTo(mapRef.current);

      markersRef.current = L.layerGroup().addTo(mapRef.current);

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 250);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.invalidateSize();
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1.2 });
    }
  }, [userLocation?.lat, userLocation?.lng]);

  useEffect(() => {
    if (mapRef.current && selectedParking) {
      const lat = parseFloat(selectedParking.latitude);
      const lng = parseFloat(selectedParking.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        mapRef.current.flyTo([lat, lng], 15, { duration: 1 });
      }
    }
  }, [selectedParking?.id, selectedParking?.latitude, selectedParking?.longitude]);

  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div class="relative flex h-4 w-4 items-center justify-center">
                 <div class="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></div>
                 <div class="relative inline-flex h-3 w-3 rounded-full bg-blue-500 border-2 border-white"></div>
               </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(markersRef.current);
    }

    parkings?.forEach(parking => {
      const lat = parseFloat(parking.latitude);
      const lng = parseFloat(parking.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const available = parseInt(parking.available_slots, 10) || 0;
      const total = parseInt(parking.total_slots, 10) || 1;
      const percentage = (available / total) * 100;
      
      let colorClass = 'bg-red-500';
      if (percentage > 40) colorClass = 'bg-green-500';
      else if (percentage > 15) colorClass = 'bg-yellow-500';

      const parkingIcon = L.divIcon({
        className: 'parking-marker',
        html: `<div class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-neutral-900 ${colorClass} shadow-md shadow-black/50 text-[10px] font-bold text-neutral-950">${available}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      });

      const marker = L.marker([lat, lng], { icon: parkingIcon }).addTo(markersRef.current);

      const popupContent = document.createElement('div');
      popupContent.className = 'p-2 flex flex-col gap-2 min-w-[150px]';
      popupContent.innerHTML = `
        <h4 class="font-medium text-neutral-200 text-sm m-0">${parking.name}</h4>
        <div class="flex justify-between items-center text-xs text-neutral-400">
          <span>Available:</span>
          <span class="font-medium text-neutral-200">${available}/${total}</span>
        </div>
        ${parking.distance ? `<div class="text-xs text-neutral-500">${parking.distance}</div>` : ''}
        <button id="select-btn-${parking.id}" class="mt-2 w-full rounded-md bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors">Select</button>
      `;

      popupContent.querySelector(`#select-btn-${parking.id}`).addEventListener('click', () => {
        onSelectParking(parking);
      });

      marker.bindPopup(popupContent, {
        className: 'dark-popup',
        closeButton: false
      });
    });
  }, [parkings, userLocation, onSelectParking]);

  return (
    <div className="relative h-full w-full">
      <div 
        ref={mapContainerRef} 
        className="h-full w-full rounded-xl overflow-hidden border border-neutral-800 z-0 bg-[#0a0a0a]"
      />
      <style>{`
        .leaflet-container { background: #0a0a0a; font-family: 'Inter', sans-serif; }
        .leaflet-bar a { background-color: #171717 !important; border-color: #262626 !important; color: #a3a3a3 !important; }
        .leaflet-bar a:hover { background-color: #262626 !important; color: #f5f5f5 !important; }
        .dark-popup .leaflet-popup-content-wrapper { background: #171717; border: 1px solid #262626; color: #d4d4d4; border-radius: 8px; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.5); }
        .dark-popup .leaflet-popup-tip { background: #171717; border: 1px solid #262626; }
        .dark-popup .leaflet-popup-content { margin: 0; }
      `}</style>
      <button 
        onClick={onRequestUserLocation}
        className="absolute bottom-4 right-4 z-[400] flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 shadow-md hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
        title="My Location"
      >
        <Crosshair size={20} />
      </button>
    </div>
  );
}
