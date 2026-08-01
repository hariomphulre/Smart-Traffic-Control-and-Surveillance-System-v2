'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useLocationFilter } from '@/context/LocationFilterContext';
import { useSquareLocation } from '@/hooks/useSquareLocation';
import { MdFullscreen, MdFullscreenExit, MdCameraAlt } from 'react-icons/md';
import { toPng } from 'html-to-image';

// Dynamically import the NationalLeafletMap to prevent SSR issues
const NationalLeafletMap = dynamic(
  () => import('../NationalLeafletMap'), 
  { 
    ssr: false, 
    loading: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0f14]">
        <div className="w-12 h-12 border-4 border-[#3c4043] border-t-[#8AB4F8] rounded-full animate-spin mb-4"></div>
        <p className="text-[#8AB4F8] font-mono animate-pulse">Initializing National Grid...</p>
      </div> 
    )
  }
);

export default function NationalAnalytics() {
  // 🔥 FIX 1: Destructured pathSegments so it can be used in the map pin click handler
  const { pathSegments, handleMapPinClick } = useLocationFilter();
  const { mapSignals } = useSquareLocation(); 

  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Since the app is only for India, we pass all available signals to the national view.
  const nationalSignals = useMemo(() => {
    return mapSignals || [];
  }, [mapSignals]);

  // 🔥 FIX 2: Added maintenance logic to keep UI consistent with City/State Analytics
  const activeIntersections = useMemo(() => {
    return nationalSignals.filter((s: any) => s.status !== 'maintenance' && s.isMaintenance !== true).length;
  }, [nationalSignals]);
  
  const maintenanceCount = nationalSignals.length - activeIntersections;

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
      link.download = `India_traffic_map.png`;
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
            India Overview
          </p>
        </div>
        <div className="flex items-center gap-2 pr-4">
          <div className="flex items-center gap-2 text-gray-200 font-mono text-sm px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Active Square: {activeIntersections} / {nationalSignals.length}
          </div>
          <div className="flex items-center gap-2 text-gray-200 font-mono text-sm px-3 py-1.5">
            {maintenanceCount > 5 && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
            )}
            {maintenanceCount > 0 && maintenanceCount <= 5 && (
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
            )}
            {maintenanceCount === 0 && (
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            )}
            Under Maintenance: {maintenanceCount}
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

        <NationalLeafletMap 
          signals={nationalSignals} 
          onSquareClick={(id: string) => {
            if (typeof handleMapPinClick === 'function') {
              handleMapPinClick([...(pathSegments || []), id]);
            }
          }}
        />
      </div>
    </div>
  );
}