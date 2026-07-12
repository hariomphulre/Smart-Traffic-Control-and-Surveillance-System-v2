'use client';

import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  CircleMarker,
  Marker,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { SquareLocation } from '@/map/squareLocations';

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

const SQUARE_ZOOM = 18;

function MapFocus({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], SQUARE_ZOOM, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

function wayLabelIcon(id: string, color: string) {
  return L.divIcon({
    className: 'square-way-label',
    html: `
      <div style="
        padding: 2px 8px;
        border-radius: 4px;
        background: rgba(10, 15, 20, 0.92);
        border: 1px solid ${color};
        color: ${color};
        font-family: 'Roboto Mono', monospace;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        pointer-events: none;
      ">${id}</div>
    `,
    iconSize: [36, 20],
    iconAnchor: [18, 10],
  });
}

function signalIcon(id: string) {
  return L.divIcon({
    className: 'square-signal-marker',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-4px);">
        <div style="
          width: 14px; height: 14px; border-radius: 50%;
          background: #8AB4F8; border: 2px solid #fff;
          box-shadow: 0 0 12px rgba(138,180,248,0.8);
        "></div>
        <div style="
          margin-top: 4px; padding: 1px 6px; border-radius: 3px;
          font-size: 10px; font-family: monospace; font-weight: bold;
          background: #0a0f14; color: #8AB4F8; border: 1px solid #3c4043;
        ">${id}</div>
      </div>
    `,
    iconSize: [48, 36],
    iconAnchor: [24, 14],
  });
}

interface RealSquareMapProps {
  square: SquareLocation;
}

export default function RealSquareMap({ square }: RealSquareMapProps) {
  return (
    <>
      <style>{`
        .square-leaflet-map .leaflet-container {
          background: #0a0f14 !important;
          font-family: Roboto, sans-serif;
        }
        .square-way-label, .square-signal-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      <MapContainer
        center={[square.lat, square.lng]}
        zoom={SQUARE_ZOOM}
        minZoom={15}
        maxZoom={20}
        scrollWheelZoom
        dragging
        doubleClickZoom
        className="square-leaflet-map h-full w-full"
        style={{ background: '#0a0f14' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO'
          url={DARK_TILES}
          subdomains="abcd"
          maxZoom={20}
        />

        <MapFocus lat={square.lat} lng={square.lng} />

        {/* Intersection footprint */}
        <Polygon
          positions={square.intersectionBounds}
          pathOptions={{
            color: '#8AB4F8',
            weight: 1.5,
            fillColor: '#8AB4F8',
            fillOpacity: 0.08,
            dashArray: '4 4',
          }}
        />

        {/* Way arms overlaid on real roads */}
        {square.ways.map((way) => (
          <Polyline
            key={way.id}
            positions={way.coordinates}
            pathOptions={{
              color: way.color,
              weight: 7,
              opacity: 0.75,
              lineCap: 'round',
            }}
          />
        ))}

        {/* Centerline dashes */}
        {square.ways.map((way) => (
          <Polyline
            key={`dash-${way.id}`}
            positions={way.coordinates}
            pathOptions={{
              color: '#e8eaed',
              weight: 1,
              opacity: 0.35,
              dashArray: '6 10',
            }}
          />
        ))}

        {/* Way labels R1–R4 at real positions */}
        {square.ways.map((way) => (
          <Marker
            key={`label-${way.id}`}
            position={way.labelPosition}
            icon={wayLabelIcon(way.id, way.color)}
            interactive={false}
          />
        ))}

        {/* Signal at real GPS point */}
        <Marker
          position={[square.lat, square.lng]}
          icon={signalIcon(square.signalId)}
          interactive={false}
        />

        <CircleMarker
          center={[square.lat, square.lng]}
          radius={6}
          pathOptions={{
            color: '#8AB4F8',
            fillColor: '#8AB4F8',
            fillOpacity: 0.25,
            weight: 1,
          }}
        />
      </MapContainer>
    </>
  );
}
