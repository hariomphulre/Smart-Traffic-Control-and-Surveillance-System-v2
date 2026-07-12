'use client'
import { CustomDurationModal } from '@/components/analytics/CustomDurationModal';
import LocationBar from '@/components/LocationBar';
import { useLocationFilter } from '@/context/LocationFilterContext';
import { useDurationFilter } from '@/hooks/useDurationFilter';
import { MAP_SIGNALS } from '@/map/MapData';
import dynamic from 'next/dynamic';
import React, { useEffect } from 'react'
import { FiEdit2, FiEye, FiList, FiPlus, FiTrash2 } from 'react-icons/fi';
import { IoMdRefresh } from 'react-icons/io';

const page = () => {
  const { isMapOpen, setIsMapOpen, pathSegments, handleMapPinClick } = useLocationFilter();
  const DynamicMap = dynamic(() => import('@/components/RealMap'), { 
    ssr: false, 
    loading: () => <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-[#8AB4F8] font-mono animate-pulse">Initializing Satellite Uplink...</div> 
  });
  const {
    selectedDuration,
    dateRange,
    isDefaultDuration,
    handleDurationSelect,
    isCustomModalOpen,
    customStart,
    customEnd,
    setCustomStart,
    setCustomEnd,
    handleCustomApply,
    closeCustomModal,
    resetDuration,
  } = useDurationFilter('all time');
  

  return (
        <div className="max-w-full dark:bg-[#131314]">
          <CustomDurationModal
            isOpen={isCustomModalOpen}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
            onClose={closeCustomModal}
            onApply={handleCustomApply}
          />
    
          <div className="w-full flex items-center justify-between h-13 mb-0 border-b border-[#3c4043] bg-[#131314] p-1 shadow-xl relative z-[60]">
            <div className="flex items-center min-w-170 flex-1">
              <div>
                <p className="text-[#ffffff] font-mono text-xl ml-4">Audit Logs</p>
              </div>
            </div>
    
            <div className="group flex items-center gap-1 px-2 mr-3 justify-center hover:bg-[#202124] rounded-sm transition-all"
              // onClick={handleRefresh}
            >
              <IoMdRefresh
                className={`h-5 w-5 text-[#669DF6] group-hover:text-[#AECBFA]`}
                // className={`h-5 w-5 text-[#669DF6] group-hover:text-[#AECBFA] 
                //   ${sectionRefreshing ? 'animate-spin' : ''}
                // `}
              />
              <button
                type="button"
                // disabled={sectionRefreshing}
                className="py-1 font-medium transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>
          
          {/* 1. MAP MODAL: Moved outside of the z-0 wrapper so it can float above all navbars */}
          {isMapOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="bg-[#131314] w-[95vw] h-[94vh] border-2 border-[#3c4043] rounded-2xl flex flex-col shadow-2xl overflow-hidden relative">
                
                <div className="h-12 border-b border-[#3c4043] bg-black flex items-center justify-between px-5 z-10 shrink-0">
                  <h2 className="text-[#8AB4F8] font-mono text-lg flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    Global Signal Radar
                  </h2>
                  <button 
                    onClick={() => setIsMapOpen(false)}
                    className="text-[#9aa0a6] hover:text-white transition-colors font-bold text-xl"
                  >
                    ✕
                  </button>
                </div>
    
                <div className="flex-1 relative z-0">
                  <DynamicMap 
                    signals={MAP_SIGNALS} 
                    pathSegments={pathSegments} 
                    onPinClick={handleMapPinClick} 
                  />
                </div>
    
              </div>
            </div>
          )}
    
          {/* 2. LOCATION BAR: Left in its original wrapper */}
          <div className="w-full relative font-sans z-[55]">
            <LocationBar />
          </div>
        </div>
  )
}

export default page
