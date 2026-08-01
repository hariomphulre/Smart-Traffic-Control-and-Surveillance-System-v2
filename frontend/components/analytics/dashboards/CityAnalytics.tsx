'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useLocationFilter } from '@/context/LocationFilterContext';
import { useSquareLocation } from '@/hooks/useSquareLocation';
import { MdFullscreen, MdFullscreenExit, MdCameraAlt } from 'react-icons/md';
import { toPng } from 'html-to-image';

const CityLeafletMap = dynamic(
  () => import('../CityLeafletMap'), 
  { 
    ssr: false, 
    loading: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0f14]">
        <div className="w-12 h-12 border-4 border-[#3c4043] border-t-[#8AB4F8] rounded-full animate-spin mb-4"></div>
        <p className="text-[#8AB4F8] font-mono animate-pulse">Initializing City Grid...</p>
      </div> 
    )
  }
);

export default function CityAnalytics() {
  const { pathSegments, handleMapPinClick } = useLocationFilter();
  const { mapSignals } = useSquareLocation(); 

  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentCity = pathSegments && pathSegments.length >= 2 
    ? pathSegments.length === 2 ? pathSegments[1] : pathSegments[2] 
    : '';

  const citySignals = useMemo(() => {
    if (!mapSignals || mapSignals.length === 0) return [];
    if (!currentCity || currentCity === 'Unknown City') return mapSignals;

    const safeCityName = currentCity.toLowerCase().trim();

    const filtered = mapSignals.filter((signal: any) => {
      const signalDataString = JSON.stringify(signal).toLowerCase();
      return signalDataString.includes(safeCityName);
    });

    if (filtered.length === 0 && mapSignals.length > 0) {
      console.warn(`No signals matched "${currentCity}". Restoring all signals to prevent empty map.`);
      return mapSignals; 
    }

    return filtered;
  }, [mapSignals, currentCity]);

  // Calculate active vs maintenance signals
  const activeIntersections = useMemo(() => {
    return citySignals.filter((s: any) => s.status !== 'maintenance' && s.isMaintenance !== true).length;
  }, [citySignals]);
  
  const maintenanceCount = citySignals.length - activeIntersections;

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
      link.download = `${currentCity || 'city'}_traffic_map.png`;
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
            {currentCity || 'Invalid Location'} 
          </p>
        </div>
        <div className="flex items-center gap-2 pr-4">
          <div className="flex items-center gap-2 text-gray-200 font-mono text-sm px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Active Square: {activeIntersections} / {citySignals.length}
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
        
        {/* Custom Map Actions Overlay */}
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

        <CityLeafletMap 
          signals={citySignals} 
          currentCity={currentCity}
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