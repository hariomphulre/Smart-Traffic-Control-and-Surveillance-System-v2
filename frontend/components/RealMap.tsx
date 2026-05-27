"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Custom HTML Map Pins ---
const createCustomIcon = (isSelected: boolean, id: string) => {
  return L.divIcon({
    className: 'custom-radar-pin',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translateY(-10px);">
        <div style="width: 24px; height: 24px; border-radius: 50%; background-color: ${isSelected ? '#10b981' : '#18181b'}; border: 2px solid ${isSelected ? '#fff' : '#8AB4F8'}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px ${isSelected ? '#10b981' : 'transparent'}; transform: scale(${isSelected ? 1.2 : 1}); transition: all 0.3s; cursor: pointer;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${isSelected ? '#fff' : '#8AB4F8'};"></div>
        </div>
        <div style="margin-top: 6px; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-family: monospace; font-weight: bold; background-color: ${isSelected ? '#10b981' : '#000'}; color: ${isSelected ? '#000' : '#8AB4F8'}; border: 1px solid #3c4043; white-space: nowrap; cursor: pointer;">
          ${id}
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// --- Map Auto-Zoom Controller ---
function MapController({ signals, pathSegments }: { signals: any[], pathSegments: string[] }) {
  const map = useMap();

  useEffect(() => {
    if (!signals || signals.length === 0) return;

    // Filter signals that match the CURRENT typed path
    const matchingSignals = signals.filter((sig) => {
      // If pathSegments is empty, this returns true for all signals
      return pathSegments.every((seg, i) => sig.path[i] === seg);
    });

    if (matchingSignals.length === 0) return;

    // If exactly 1 match (or we are deeply zoomed into a specific point)
    if (matchingSignals.length === 1) {
      map.flyTo([matchingSignals[0].lat, matchingSignals[0].lng], 15, { duration: 1.5 });
    } else {
      // If multiple matches (e.g. they typed "Maharashtra", zoom out to fit all MH signals)
      const bounds = L.latLngBounds(matchingSignals.map(s => [s.lat, s.lng]));
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5, maxZoom: 13 });
    }
  }, [pathSegments, signals, map]);

  return null;
}

export default function RealMap({ signals, pathSegments, onPinClick }: any) {
  return (
    <>
      {/* CSS Matrix Filter to turn standard maps into rich Colorful Dark Mode */}
      <style>{`
        .colorful-dark-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .leaflet-container {
          background-color: #0a0a0a !important;
        }
      `}</style>

      <MapContainer center={[19.5, 75.0]} zoom={6} style={{ height: '100%', width: '100%', backgroundColor: '#0a0a0a' }}>
        
        {/* OpenStreetMap with our custom dark filter applied */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="colorful-dark-tiles"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {/* Mounts the Auto-Zoom Engine */}
        <MapController signals={signals} pathSegments={pathSegments} />

        {/* Render GPS Markers safely */}
        {signals.map((sig: any) => {
          if (sig.lat === undefined || sig.lng === undefined) return null;
          
          const isSelected = pathSegments.join('/') === sig.path.join('/');
          return (
            <Marker
              key={sig.id}
              position={[sig.lat, sig.lng]}
              icon={createCustomIcon(isSelected, sig.id)}
              eventHandlers={{
                click: () => onPinClick(sig.path)
              }}
            />
          );
        })}
      </MapContainer>
    </>
  );
}