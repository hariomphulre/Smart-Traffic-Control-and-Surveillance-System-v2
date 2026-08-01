'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Marker, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiMinus, FiPlus } from 'react-icons/fi';
import { saveSquareLocation, type SquareWay } from '@/map/squareLocations'; 
import { WAY_PALETTE } from '@/lib/intersectionAnalysis';
import savedIntersectionsData from '@/data/saved-intersections.json'; 

const RADIUS_LIMIT_METERS = 70; 

// --- ICONS ---
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

function signalIcon(id: string, pinColor: string) {
  return L.divIcon({
    className: 'square-signal-marker',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-18px);">
        <!-- Flat SVG Pin (Transparent Hole) -->
        <svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0Zm0 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" fill="${pinColor}" stroke="#131314" stroke-width="1.5"/>
        </svg>
        
        <!-- Code Label -->
        <div style="
          margin-top: 2px; 
          padding: 3px 6px; 
          border-radius: 4px;
          font-size: 11px; 
          font-family: 'Roboto Mono', monospace; 
          font-weight: 700;
          background: #1a202c; 
          color: #ffffff; 
          border: 1.5px solid ${pinColor};
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.6);
        ">${id}</div>
      </div>
    `,
    iconSize: [40, 56],
    iconAnchor: [20, 36], 
  });
}

// --- DYNAMIC ZOOM LISTENER ---
function ZoomListener({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  useMapEvents({
    zoomend: (e) => {
      onZoomChange(e.target.getZoom());
    }
  });
  return null;
}

// Custom Zoom Controls 
function SquareMapZoomControls() {
  const map = useMap();
  return (
    <div className="absolute top-[92px] right-[10px] z-[1000] flex flex-col shadow-[0_1px_5px_rgba(0,0,0,0.65)] rounded-[4px] bg-white overflow-hidden border-2 border-[rgba(0,0,0,0.2)]">
      <button 
        onClick={() => map.zoomIn()} 
        className="w-[34px] h-[34px] flex items-center justify-center bg-white text-black hover:bg-[#f4f4f4] border-b border-[#ccc] transition-colors"
        title="Zoom In"
      >
        <FiPlus size={18} />
      </button>
      <button 
        onClick={() => map.zoomOut()} 
        className="w-[34px] h-[34px] flex items-center justify-center bg-white text-black hover:bg-[#f4f4f4] transition-colors"
        title="Zoom Out"
      >
        <FiMinus size={18} />
      </button>
    </div>
  );
}

// --- GEOSPATIAL MATH ---
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function processOsmWay(centerLat: number, centerLng: number, wayCoords: [number, number][]) {
  let closestIdx = 0;
  let minDistance = Infinity;
  const distances = wayCoords.map((coord, idx) => {
    const d = getDistance(centerLat, centerLng, coord[0], coord[1]);
    if (d < minDistance) { minDistance = d; closestIdx = idx; }
    return d;
  });

  if (minDistance > RADIUS_LIMIT_METERS) return []; 
  const segments = [];

  if (closestIdx > 0) {
    const arm1 = [];
    for (let i = closestIdx; i >= 0; i--) {
      arm1.push(wayCoords[i]);
      if (distances[i] > RADIUS_LIMIT_METERS) break; 
    }
    if (arm1.length > 1) segments.push(arm1);
  }

  if (closestIdx < wayCoords.length - 1) {
    const arm2 = [];
    for (let i = closestIdx; i < wayCoords.length; i++) {
      arm2.push(wayCoords[i]);
      if (distances[i] > RADIUS_LIMIT_METERS) break; 
    }
    if (arm2.length > 1) segments.push(arm2);
  }
  return segments;
}

// 🔥 UPDATED STATE BOUNDARY HIGHLIGHTER 🔥
const MapBoundsUpdater = ({ currentState, signals }: { currentState: string, signals: any[] }) => {
  const map = useMap();
  const [geoJsonData, setGeoJsonData] = useState<any>(null);

  useEffect(() => {
    if (!currentState) return;
    let isMounted = true;

    if (signals && signals.length > 0) {
      const bounds = L.latLngBounds(signals.map(s => [s.lat, s.lng]));
      map.flyToBounds(bounds, { padding: [100, 100], maxZoom: 12, duration: 1.5 });
    } 
    
    const fetchStateBounds = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?state=${encodeURIComponent(currentState)}&country=India&format=json&polygon_geojson=1`);
        const data = await res.json();
        
        if (data && data.length > 0 && isMounted) {
          const boundary = data.find((d: any) => d.geojson && (d.geojson.type === 'Polygon' || d.geojson.type === 'MultiPolygon'));
          if (boundary) setGeoJsonData(boundary.geojson);

          if (!signals || signals.length === 0) {
            const bbox = data[0].boundingbox;
            map.flyToBounds(
              [ [parseFloat(bbox[0]), parseFloat(bbox[2])], [parseFloat(bbox[1]), parseFloat(bbox[3])] ], 
              { padding: [50, 50], maxZoom: 10, duration: 1.5 }
            );
          }
        }
      } catch (err) { 
        console.error('Failed to geocode state bounds:', err); 
      }
    };
    
    fetchStateBounds();
    return () => { isMounted = false; };
  }, [currentState, signals, map]);

  if (!geoJsonData) return null;

  return (
    <GeoJSON 
      key={currentState} 
      data={geoJsonData}
      interactive={false}
      style={{
        color: '#8AB4F8', // Primary Blue
        weight: 1.5,
        opacity: 0.85,
        fill: false // 🔥 Removes the light shade inside the boundary completely
        // Dash array removed for solid line
      }}
    />
  );
};

export interface StateLeafletMapProps {
  signals: any[];
  currentState: string;
  onSquareClick?: (id: string) => void;
}

export default function StateLeafletMap({ signals, currentState, onSquareClick }: StateLeafletMapProps) {
  const [waysData, setWaysData] = useState<Record<string, SquareWay[]>>({});
  const [loadingSquares, setLoadingSquares] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(7); 
  
  const processedSignals = useRef(new Set<string>());
  const defaultCenter: [number, number] = [20.5937, 78.9629]; 

  useEffect(() => {
    if (!signals || signals.length === 0) return;
    let isMounted = true; 

    const savedIntersections = savedIntersectionsData as Record<string, any>;

    const fetchOSMBatch = async (batchSignals: any[], attempt = 0): Promise<void> => {
      const endpoints = ['https://lz4.overpass-api.de/api/interpreter', 'https://z.overpass-api.de/api/interpreter', 'https://overpass-api.de/api/interpreter'];
      const queries = batchSignals.map(sig => `way(around:${RADIUS_LIMIT_METERS}, ${sig.lat}, ${sig.lng})[highway~"^(primary|secondary|tertiary|trunk|residential|unclassified)$"];`).join('');
      const query = `[out:json];(${queries});out geom;`;

      try {
        const res = await fetch(endpoints[attempt], {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const data = await res.json();
        const rawOsmWays = data.elements.map((el: any) => el.geometry.map((g: any) => [g.lat, g.lon] as [number, number]));

        for (const signal of batchSignals) {
          const signalWays: SquareWay[] = [];
          let allArms: [number, number][][] = [];

          rawOsmWays.forEach((osmCoords: [number, number][]) => {
            const radialArms = processOsmWay(signal.lat, signal.lng, osmCoords);
            allArms.push(...radialArms);
          });

          allArms.sort((a, b) => b.length - a.length);
          const cleanArms = allArms.slice(0, 4);

          cleanArms.forEach((armCoords, idx) => {
            signalWays.push({
              id: `R${idx + 1}`,
              bearing: 0,
              color: WAY_PALETTE[idx % WAY_PALETTE.length],
              coordinates: armCoords,
              labelPosition: armCoords[armCoords.length - 1] || [signal.lat, signal.lng]
            });
          });

          if (isMounted && signalWays.length > 0) {
            setWaysData(prev => ({ ...prev, [signal.id]: signalWays }));
            
            try {
              await saveSquareLocation({
                signalId: signal.id,
                lat: signal.lat,
                lng: signal.lng,
                ways: signalWays
              });
            } catch (e) {
              console.error("Failed to save OSM data to local DB", e);
            }
          }
        }
      } catch (err) {
        if (attempt < endpoints.length - 1) return fetchOSMBatch(batchSignals, attempt + 1);
        throw err;
      }
    };

    const processQueue = async () => {
      const newWays: Record<string, SquareWay[]> = {};
      const missingSignals: any[] = [];

      signals.forEach((signal) => {
        const jsonSavedSquare = savedIntersections[signal.id];

        if (jsonSavedSquare && jsonSavedSquare.ways && jsonSavedSquare.ways.length > 0) {
          const formattedWays = jsonSavedSquare.ways.map((w: any) => ({
            ...w,
            labelPosition: w.labelPosition || w.coordinates[w.coordinates.length - 1]
          }));
          newWays[signal.id] = formattedWays;
        } else {
          missingSignals.push(signal);
        }
      });

      if (isMounted) setWaysData((prev) => ({ ...prev, ...newWays }));

      const uniqueMissing = missingSignals.filter(s => !processedSignals.current.has(s.id));
      if (uniqueMissing.length === 0) return;

      uniqueMissing.forEach(s => processedSignals.current.add(s.id));
      if (isMounted) setLoadingSquares(uniqueMissing.length);

      let consecutiveFails = 0;
      const CHUNK_SIZE = 25; 

      for (let i = 0; i < uniqueMissing.length; i += CHUNK_SIZE) {
        if (!isMounted) break;
        if (consecutiveFails >= 2) {
          if (isMounted) setIsBlocked(true);
          break; 
        }

        const chunk = uniqueMissing.slice(i, i + CHUNK_SIZE);
        
        try {
          await fetchOSMBatch(chunk);
          consecutiveFails = 0; 
          if (isMounted) setLoadingSquares(Math.max(0, uniqueMissing.length - (i + CHUNK_SIZE)));
        } catch (error) {
          consecutiveFails++;
        }

        if (i + CHUNK_SIZE < uniqueMissing.length) {
          await new Promise(resolve => setTimeout(resolve, 1500)); 
        }
      }
    };

    processQueue();
    return () => { isMounted = false; };
  }, [signals]);

  return (
    <div className="relative w-full h-full">
      <style>{`
        .leaflet-container { background: #0a0f14 !important; font-family: Roboto, sans-serif; }
        .square-way-label, .square-signal-marker { background: transparent !important; border: none !important; }
        .leaflet-control-zoom { display: none !important; } 
      `}</style>

      {/* DYNAMIC BOTTOM-LEFT STATUS CARD */}
      <div className="absolute bottom-0 left-0 bg-[#131314]/95 border-r border-t border-[#3c4043] rounded-tr-md p-2 shadow-2xl backdrop-blur-md z-[1000]">
        
        {loadingSquares > 0 && !isBlocked ? (
          <div className="flex items-center pl-1 gap-3 text-[#8AB4F8] font-mono text-sm">
            <span className="w-4 h-4 border-2 border-[#8AB4F8] border-t-transparent rounded-full animate-spin"></span>
            <span>OSM Running... ({loadingSquares} left)</span>
          </div>
        ) : isBlocked ? (
          <div className="flex items-center gap-3 text-[#ea4335] font-mono text-sm">
            <span>⚠️ API Rate Limit. Paused.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm pr-1">
            <div className="flex items-center justify-center animate-in fade-in zoom-in duration-300">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            <span>All Square Initiallized</span>
          </div>
        )}
      </div>

      <MapContainer center={defaultCenter} zoom={7} style={{ height: '100%', width: '100%', background: '#0a0f14' }} zoomControl={true}>
        
        <ZoomListener onZoomChange={setCurrentZoom} />
        
        <MapBoundsUpdater currentState={currentState} signals={signals} />
        <SquareMapZoomControls />

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          maxZoom={20}
        />

        {signals.map((signal) => {
          const squareWays = waysData[signal.id] || [];

          return (
            <React.Fragment key={signal.id}>
              {/* 1. Base Road Lines */}
              {squareWays.map((way) => (
                <Polyline
                  key={`${signal.id}-${way.id}`}
                  positions={way.coordinates as L.LatLngExpression[]}
                  pathOptions={{ color: way.color, weight: 7, opacity: 0.75, lineCap: 'round' }}
                />
              ))}

              {/* 2. Dashed Centerlines */}
              {squareWays.map((way) => (
                <Polyline
                  key={`dash-${signal.id}-${way.id}`}
                  positions={way.coordinates as L.LatLngExpression[]}
                  pathOptions={{ color: '#e8eaed', weight: 1, opacity: 0.35, dashArray: '6 10' }}
                />
              ))}

              {/* 3. Way Labels (R1, R2, R3) - ONLY VISIBLE IF ZOOMED IN */}
              {currentZoom >= 16 && squareWays.map((way) => (
                <Marker
                  key={`label-${signal.id}-${way.id}`}
                  position={way.labelPosition as L.LatLngExpression}
                  icon={wayLabelIcon(way.id, way.color)}
                  interactive={false}
                />
              ))}

              {/* 4. Central Signal Node (Always visible, #8AB4F8 Transparent Pin) */}
              <Marker
                position={[signal.lat, signal.lng]}
                icon={signalIcon(signal.id, '#8AB4F8')}
                eventHandlers={{ click: () => onSquareClick && onSquareClick(signal.id) }}
              />

            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}