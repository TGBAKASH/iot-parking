import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';

export default function MapView({ parkings, selectedParking, onSelectParking, userLocation, onRequestUserLocation }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialCenter = userLocation || [10.9541, 78.7589];

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      center: initialCenter,
      zoom: 14,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapRef.current);

    L.control.zoom({ position: 'topright' }).addTo(mapRef.current);

    markersGroupRef.current = L.layerGroup().addTo(mapRef.current);

    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.flyTo(userLocation, 15);
    }
  }, [userLocation]);

  useEffect(() => {
    if (mapRef.current && selectedParking && selectedParking.latitude && selectedParking.longitude) {
      mapRef.current.flyTo([selectedParking.latitude, selectedParking.longitude], 16);
    }
  }, [selectedParking]);

  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div class="relative flex items-center justify-center w-6 h-6">
                <div class="absolute w-full h-full bg-blue-500 rounded-full opacity-30 animate-ping"></div>
                <div class="relative w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></div>
               </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker(userLocation, { icon: userIcon, zIndexOffset: 1000 }).addTo(markersGroupRef.current);
    }

    if (parkings) {
      parkings.forEach((parking) => {
        if (!parking.latitude || !parking.longitude) return;

        const available = parseInt(parking.available_slots, 10) || 0;
        const total = parseInt(parking.total_slots, 10) || 1;
        const pct = total > 0 ? (available / total) * 100 : 0;
        let colorClass = 'bg-emerald-500 border-emerald-700';
        if (pct <= 15) {
          colorClass = 'bg-red-500 border-red-700';
        } else if (pct <= 40) {
          colorClass = 'bg-yellow-500 border-yellow-700';
        }

        const parkingIcon = L.divIcon({
          className: 'parking-marker',
          html: `<div class="flex items-center justify-center w-8 h-8 rounded-full border-2 text-white font-bold text-xs shadow-md ${colorClass}">
                  ${available}
                 </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([parking.latitude, parking.longitude], { icon: parkingIcon });
        
        const popupContent = document.createElement('div');
        popupContent.className = 'p-2 min-w-[150px]';
        popupContent.innerHTML = `
          <h3 class="font-semibold text-gray-800 mb-1 truncate">${parking.name}</h3>
          <p class="text-sm text-gray-600 mb-3">${available} / ${total} Available</p>
          <button id="btn-select-${parking.id}" class="w-full py-1.5 px-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors text-sm font-medium">View Details</button>
        `;

        popupContent.querySelector(`#btn-select-${parking.id}`).addEventListener('click', () => {
          if (onSelectParking) onSelectParking(parking);
          mapRef.current.closePopup();
        });

        marker.bindPopup(popupContent, {
          className: 'light-popup',
          closeButton: true,
          minWidth: 150
        });

        marker.addTo(markersGroupRef.current);
      });
    }
  }, [parkings, userLocation, onSelectParking]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <style>{`
        .light-popup .leaflet-popup-content-wrapper {
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e5e7eb;
        }
        .light-popup .leaflet-popup-tip {
          background-color: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .light-popup .leaflet-popup-content {
          margin: 10px;
        }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      <button
        onClick={onRequestUserLocation}
        className="absolute bottom-6 right-6 z-[1000] p-3 bg-white text-gray-700 rounded-full shadow-md border border-gray-200 hover:bg-gray-50 hover:text-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        aria-label="Find my location"
      >
        <Navigation size={20} />
      </button>
    </div>
  );
}
