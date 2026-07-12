'use client';

import { useEffect, useRef } from 'react';
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
import { FiMinus, FiPlus } from 'react-icons/fi';
import type { SquareLocation } from '@/map/squareLocations';
import { getHeaderWayVehicleCount } from '@/lib/analyticsTrafficData';
import { trafficVehicleCountColor } from '@/utils/mapColors';

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const SQUARE_ZOOM = 18;

function MapFocus({
  lat,
  lng,
  enabled,
}: {
  lat: number;
  lng: number;
  enabled: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    map.flyTo([lat, lng], SQUARE_ZOOM, { duration: 1.2 });
  }, [lat, lng, map, enabled]);
  return null;
}

function SquareMapZoomControls({ disabled }: { disabled: boolean }) {
  const map = useMap();

  return (
    <div className="square-map-zoom-controls">
      <button
        type="button"
        className="square-map-zoom-btn"
        onClick={() => map.zoomIn()}
        disabled={disabled}
        aria-label="Zoom in"
      >
        <FiPlus size={16} />
      </button>
      <button
        type="button"
        className="square-map-zoom-btn"
        onClick={() => map.zoomOut()}
        disabled={disabled}
        aria-label="Zoom out"
      >
        <FiMinus size={16} />
      </button>
    </div>
  );
}

function wayLabelIcon(id: string, wayColor: string) {
  return L.divIcon({
    className: 'square-way-label',
    html: `
      <div style="
        padding: 2px 8px;
        border-radius: 4px;
        background: ${wayColor};
        border: 1px solid rgba(0, 0, 0, 0.18);
        color: #1a1a1a;
        font-family: 'Roboto Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
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
      <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-4px);pointer-events:none;">
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

function centerDragIcon() {
  return L.divIcon({
    className: 'square-center-handle',
    html: `
      <div class="square-center-handle-inner" style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid #fbbc04;
        background: rgba(138, 180, 248, 0.92);
        box-shadow: 0 0 8px rgba(251, 188, 4, 0.55);
        cursor: grab;
        pointer-events: auto;
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function wayHandleIcon(color: string) {
  return L.divIcon({
    className: 'square-way-handle',
    html: `
      <div style="
        width: 22px; height: 22px; border-radius: 50%;
        background: ${color}; border: 2px solid #fff;
        box-shadow: 0 2px 10px rgba(0,0,0,0.55);
        cursor: grab;
        pointer-events: auto;
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

interface DraggableHandleProps {
  position: [number, number];
  color: string;
  onDragEnd: (lat: number, lng: number) => void;
}

function DraggableHandle({ position, color, onDragEnd }: DraggableHandleProps) {
  const markerRef = useRef<L.Marker>(null);

  return (
    <Marker
      draggable
      position={position}
      ref={markerRef}
      icon={wayHandleIcon(color)}
      eventHandlers={{
        dragend: () => {
          const marker = markerRef.current;
          if (!marker) return;
          const { lat, lng } = marker.getLatLng();
          onDragEnd(lat, lng);
        },
      }}
      zIndexOffset={2000}
    />
  );
}

interface CenterDragHandleProps {
  position: [number, number];
  onDragEnd: (lat: number, lng: number) => void;
}

function CenterDragHandle({ position, onDragEnd }: CenterDragHandleProps) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    marker.dragging?.enable();
  }, []);

  return (
    <Marker
      draggable
      position={position}
      ref={markerRef}
      icon={centerDragIcon()}
      eventHandlers={{
        dragstart: () => {
          const marker = markerRef.current;
          marker?.getElement()?.classList.add('square-center-dragging');
        },
        dragend: () => {
          const marker = markerRef.current;
          marker?.getElement()?.classList.remove('square-center-dragging');
          if (!marker) return;
          const { lat, lng } = marker.getLatLng();
          onDragEnd(lat, lng);
        },
      }}
      zIndexOffset={3000}
    />
  );
}

interface EditableSquareMapProps {
  square: SquareLocation;
  isEditing: boolean;
  wayVehicleCounts?: Record<string, number>;
  onWayDragEnd: (wayId: string, lat: number, lng: number) => void;
  onCenterDragEnd: (lat: number, lng: number) => void;
}

export default function EditableSquareMap({
  square,
  isEditing,
  wayVehicleCounts = {},
  onWayDragEnd,
  onCenterDragEnd,
}: EditableSquareMapProps) {
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
        .square-way-handle, .square-center-handle {
          background: transparent !important;
          border: none !important;
          pointer-events: auto !important;
        }
        .square-center-handle-inner,
        .square-center-dragging .square-center-handle-inner {
          cursor: grabbing !important;
        }
        .square-leaflet-map .leaflet-pane,
        .square-leaflet-map .leaflet-top,
        .square-leaflet-map .leaflet-bottom,
        .square-leaflet-map .leaflet-control-container {
          z-index: 1 !important;
        }
        .square-leaflet-map .leaflet-marker-pane {
          z-index: 5 !important;
        }
        .square-leaflet-map .leaflet-overlay-pane {
          z-index: 1 !important;
        }
        .square-leaflet-map .leaflet-interactive {
          pointer-events: ${isEditing ? 'none' : 'auto'};
        }
        .square-map-zoom-controls {
          position: absolute;
          top: 50%;
          right: 12px;
          transform: translateY(-50%);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: #1a202c;
          border-radius: 8px;
          border: 1px solid #3c4043;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
          overflow: hidden;
        }
        .square-map-zoom-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1a202c;
          color: #e8eaed;
          border: none;
          border-bottom: 1px solid #3c4043;
          cursor: pointer;
          transition: background 0.15s;
        }
        .square-map-zoom-btn:last-child {
          border-bottom: none;
        }
        .square-map-zoom-btn:hover:not(:disabled) {
          background: #2d3748;
        }
        .square-map-zoom-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>

      <MapContainer
        center={[square.lat, square.lng]}
        zoom={SQUARE_ZOOM}
        minZoom={15}
        maxZoom={20}
        zoomControl={false}
        scrollWheelZoom={!isEditing}
        dragging={!isEditing}
        doubleClickZoom={!isEditing}
        className="square-leaflet-map h-full w-full"
        style={{ background: '#0a0f14' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO'
          url={DARK_TILES}
          subdomains="abcd"
          maxZoom={20}
        />

        <MapFocus lat={square.lat} lng={square.lng} enabled={!isEditing} />
        <SquareMapZoomControls disabled={isEditing} />

        <Polygon
          positions={square.intersectionBounds}
          pathOptions={{
            color: isEditing ? '#fbbc04' : '#8AB4F8',
            weight: 1.5,
            fillColor: isEditing ? '#fbbc04' : '#8AB4F8',
            fillOpacity: 0.08,
            dashArray: '4 4',
            interactive: false,
          }}
        />

        {square.ways.map((way) => {
          const vehicleCount = getHeaderWayVehicleCount(way.id, wayVehicleCounts);
          const densityColor = trafficVehicleCountColor(vehicleCount);
          const stripWeight = isEditing ? 10 : 8;

          return (
            <Polyline
              key={way.id}
              positions={way.coordinates}
              pathOptions={{
                color: densityColor,
                weight: stripWeight,
                opacity: 0.92,
                lineCap: 'round',
                lineJoin: 'round',
                interactive: false,
              }}
            />
          );
        })}

        {!isEditing &&
          square.ways.map((way) => (
            <Marker
              key={`label-${way.id}`}
              position={way.labelPosition}
              icon={wayLabelIcon(way.id, way.color)}
              interactive={false}
            />
          ))}

        {isEditing ? (
          <>
            <CenterDragHandle
              position={[square.lat, square.lng]}
              onDragEnd={onCenterDragEnd}
            />
            <Marker
              position={[square.lat, square.lng]}
              icon={signalIcon(square.signalId)}
              interactive={false}
              zIndexOffset={2500}
            />
          </>
        ) : (
          <>
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
                interactive: false,
              }}
            />
          </>
        )}

        {isEditing &&
          square.ways.map((way) => {
            const end = way.coordinates[way.coordinates.length - 1];
            return (
              <DraggableHandle
                key={`handle-${way.id}`}
                position={end}
                color={way.color}
                onDragEnd={(lat, lng) => onWayDragEnd(way.id, lat, lng)}
              />
            );
          })}
      </MapContainer>
    </>
  );
}
