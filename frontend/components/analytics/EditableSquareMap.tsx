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
import type { SquareLocation } from '@/map/squareLocations';

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
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid #fbbc04;
        background: rgba(138, 180, 248, 0.92);
        box-shadow: 0 0 14px rgba(251, 188, 4, 0.65);
        cursor: grab;
        pointer-events: auto;
      "></div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
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
  onWayDragEnd: (wayId: string, lat: number, lng: number) => void;
  onCenterDragEnd: (lat: number, lng: number) => void;
}

export default function EditableSquareMap({
  square,
  isEditing,
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
      `}</style>

      <MapContainer
        center={[square.lat, square.lng]}
        zoom={SQUARE_ZOOM}
        minZoom={15}
        maxZoom={20}
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

        {square.ways.map((way) => (
          <Polyline
            key={way.id}
            positions={way.coordinates}
            pathOptions={{
              color: way.color,
              weight: isEditing ? 9 : 7,
              opacity: isEditing ? 0.9 : 0.75,
              lineCap: 'round',
              interactive: false,
            }}
          />
        ))}

        {square.ways.map((way) => (
          <Polyline
            key={`dash-${way.id}`}
            positions={way.coordinates}
            pathOptions={{
              color: '#e8eaed',
              weight: 1,
              opacity: 0.35,
              dashArray: '6 10',
              interactive: false,
            }}
          />
        ))}

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
