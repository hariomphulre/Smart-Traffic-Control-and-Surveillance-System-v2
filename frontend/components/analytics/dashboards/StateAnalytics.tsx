'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useLocationFilter } from '@/context/LocationFilterContext';
import { useSquareLocation } from '@/hooks/useSquareLocation';
import { MdFullscreen, MdFullscreenExit, MdCameraAlt } from 'react-icons/md';
import { toPng } from 'html-to-image';

// Dynamically import the StateLeafletMap to prevent SSR issues with Leaflet
const StateLeafletMap = dynamic(
  () => import('../StateLeafletMap'), 
  { 
    ssr: false, 
    loading: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0f14]">
        <div className="w-12 h-12 border-4 border-[#3c4043] border-t-[#8AB4F8] rounded-full animate-spin mb-4"></div>
        <p className="text-[#8AB4F8] font-mono animate-pulse">Initializing State Grid...</p>
      </div> 
    )
  }
);

export default function StateAnalytics() {
  const { pathSegments, handleMapPinClick } = useLocationFilter();
  const { mapSignals } = useSquareLocation(); 

  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Extract State from path (Usually pathSegments[1] in most routing setups)
  const currentState = pathSegments && pathSegments.length > 0 
    ? pathSegments[1] || pathSegments[0] 
    : '';

  const stateSignals = useMemo(() => {
    if (!mapSignals || mapSignals.length === 0) return [];
    if (!currentState || currentState.toLowerCase() === 'unknown state') return mapSignals;

    const safeStateName = currentState.toLowerCase().trim();

    const filtered = mapSignals.filter((signal: any) => {
      // Deep String Search: Converts the entire signal object into a searchable string
      // Catches the state name even if nested inside signal.location.state etc.
      const signalDataString = JSON.stringify(signal).toLowerCase();
      return signalDataString.includes(safeStateName);
    });

    if (filtered.length === 0 && mapSignals.length > 0) {
      console.warn(`No signals matched "${currentState}". Restoring all signals to prevent empty map.`);
      return mapSignals; 
    }

    return filtered;
  }, [mapSignals, currentState]);

  const activeIntersections = stateSignals.length;

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapWrapperRef.current?.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  const saveAsImage = async () => {
    if (!mapWrapperRef.current) return;
    try {
      const btns = mapWrapperRef.current.querySelector('.map-actions-overlay');
      if (btns) btns.classList.add('hidden');
      
      const dataUrl = await toPng(mapWrapperRef.current, { cacheBust: true, pixelRatio: 2 });
      
      if (btns) btns.classList.remove('hidden');

      const link = document.createElement("a");
      link.download = `${currentState || 'state'}_traffic_map.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to generate map snapshot:", error);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-120px)] flex flex-col bg-[#131314]">
      
      {/* HEADER */}
      <div className="relative z-10 flex border-r border-b border-[#3c4043] p-1 pl-3 justify-between items-center bg-[#131314] shrink-0">
        <div className="flex items-center gap-3 pl-2">
          <p className="text-xl font-[450] text-[#ffffff] capitalize">
            {currentState || 'Unknown State'}
          </p>
        </div>
        <div className="flex items-center gap-3 pr-4">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm bg-[#1a202c] px-3 py-1.5 rounded border border-[#3c4043]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {activeIntersections} Active Squares
          </div>
        </div>
      </div>

      {/* FULL SCREEN DETAILED MAP */}
      <div 
        ref={mapWrapperRef}
        className={`w-full relative bg-[#0a0f14] overflow-hidden isolate ${isFullscreen ? 'h-screen' : 'h-140'}`}
      >
        
        {/* Map Actions Overlay */}
        <div className="map-actions-overlay absolute top-[10px] right-[10px] z-[1000] flex flex-col shadow-[0_1px_5px_rgba(0,0,0,0.65)] rounded-[4px] bg-white overflow-hidden border-2 border-[rgba(0,0,0,0.2)]">
          <button
            onClick={toggleFullscreen}
            className="w-[34px] h-[34px] flex items-center justify-center bg-white text-black hover:bg-[#f4f4f4] border-b border-[#ccc] transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "View Fullscreen"}
          >
            {isFullscreen ? <MdFullscreenExit size={22} /> : <MdFullscreen size={22} />}
          </button>
          <button
            onClick={saveAsImage}
            className="w-[34px] h-[34px] flex items-center justify-center bg-white text-black hover:bg-[#f4f4f4] transition-colors"
            title="Save as Image"
          >
            <MdCameraAlt size={20} />
          </button>
        </div>

        <StateLeafletMap 
          signals={stateSignals} 
          currentState={currentState}
          onSquareClick={(id: string) => {
            if (handleMapPinClick) {
              handleMapPinClick([...(pathSegments || []), id]);
            }
          }}
        />
      </div>
    </div>
  );
}