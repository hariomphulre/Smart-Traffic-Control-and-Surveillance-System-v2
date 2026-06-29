'use client'

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FiImage, FiVideo, FiSearch, FiX } from 'react-icons/fi';
import { getVehicleImages, getAccidentMedia, getImageUrl, type VehicleImage, type AccidentMedia } from '@/lib/api';
import { IoMdRefresh } from 'react-icons/io';
import LocationBar from '@/components/LocationBar';
import { useLocationFilter } from '@/context/LocationFilterContext';
import { MAP_SIGNALS } from '@/map/MapData';
import { IoSearchSharp } from 'react-icons/io5';

const DynamicMap = dynamic(() => import('@/components/RealMap'), { 
  ssr: false, 
  loading: () => <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-[#8AB4F8] font-mono animate-pulse">Initializing Satellite Uplink...</div> 
});

export default function Images() {
  const { isMapOpen, setIsMapOpen, pathSegments, handleMapPinClick } = useLocationFilter();
  const [activeTab, setActiveTab] = useState<'vehicles' | 'accidents'>('vehicles');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<VehicleImage | AccidentMedia | null>(null);
  const [vehicleImages, setVehicleImages] = useState<VehicleImage[]>([]);
  const [accidentMedia, setAccidentMedia] = useState<AccidentMedia[]>([]);
  const [filteredVehicleImages, setFilteredVehicleImages] = useState<VehicleImage[]>([]);
  const [filteredAccidentMedia, setFilteredAccidentMedia] = useState<AccidentMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: { page: number; limit: number; search?: string } = {
          page,
          limit: PAGE_SIZE,
        };

        if (searchTerm) params.search = searchTerm;

        if (activeTab === 'vehicles') {
          const response = await getVehicleImages(params);
          setVehicleImages(response.data || []);
          setTotal(response.total || 0);
        } else {
          const response = await getAccidentMedia(params);
          setAccidentMedia(response.data || []);
          setTotal(response.total || 0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch images');
        console.error('Error fetching images:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, page, searchTerm]);

  useEffect(() => {
    setFilteredVehicleImages(vehicleImages);
    setFilteredAccidentMedia(accidentMedia);
  }, [vehicleImages, accidentMedia]);

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-full dark:bg-[#131314]">
        <div className="w-full flex items-center justify-between h-13 mb-0 border-b border-[#3c4043] bg-[#131314] p-1 shadow-xl">
          <div className="flex items-center min-w-170 flex-1">
            <div>
              <p className="text-[#ffffff] font-mono text-xl ml-4">Traffic Camera Images</p>
            </div>
            
          </div>
          <div className="group flex items-center gap-1 px-2 mr-3 justify-center hover:bg-[#202124] rounded-sm transition-all">
            <IoMdRefresh className="h-5 w-5 text-[#669DF6] group-hover:text-[#AECBFA]"></IoMdRefresh>
            <button 
              className="py-1 font-medium transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg"
              >
              Refresh
            </button>
          </div>
        </div>
        <div className="w-full relative font-sans">
          {/* LOCATION BAR */}
          <LocationBar />

          {/* MAP MODAL */}
          {isMapOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
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
        </div>
        <div className="px-4 py-8">
          <div className="gcloud-card p-8 text-center">
            <p className="text-[#5f6368] dark:text-[#9aa0a6]">Loading images...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed] mb-2">Traffic Camera Images</h1>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">Vehicle detection images and accident recordings</p>
        </div>
        <div className="gcloud-card p-8 text-center">
          <p className="text-[#d93025] dark:text-[#f28b82]">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full px-0 py-0">
      <div className="w-full flex items-center justify-between h-13 mb-0 border-b border-l border-[#3c4043] bg-[#131314] p-1 shadow-xl">
        <div className="flex items-center min-w-170 flex-1">
          <div>
            <p className="text-[#ffffff] font-mono text-xl ml-4">Camera Images</p>
          </div>

          <div className="ml-5 min-w-0 flex-1 max-w-160">
            <div className="flex items-center gap-2 px-2.5 py-[5.5px] bg-[#292A2D] border border-[#3C4043] rounded-md transition-colors hover:bg-[#303134] focus-within:border-[#8AB4F8] focus-within:ring-0.7 focus-within:ring-[#8AB4F8]">
              
              <IoSearchSharp className="w-6 h-6 flex-shrink-0 text-[#669DF6]"></IoSearchSharp>

              <input
                type="text "
                placeholder="Search ( / ) for resources..."
                className="min-w-50 bg-transparent outline-none text-[#E8EAED] placeholder:text-[#9AA0A6] text-md"
              />
              
            </div>
          </div>
        </div>

        <div className="group flex items-center gap-1 px-2 mr-3 justify-center hover:bg-[#202124] rounded-sm transition-all">
          <IoMdRefresh className="h-5 w-5 text-[#669DF6] group-hover:text-[#AECBFA]"></IoMdRefresh>
          <button 
            className="py-1 font-medium transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg"
            >
            Refresh
          </button>
        </div>
      </div>

      <div className="w-full relative font-sans">
        {/* LOCATION BAR */}
        <LocationBar />

        {/* MAP MODAL */}
        {isMapOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
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
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            setActiveTab('vehicles');
            setSearchTerm('');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors rounded ${
            activeTab === 'vehicles'
              ? 'bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124]'
              : 'bg-[#f1f3f4] dark:bg-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#4d4e52]'
          }`}
        >
          <FiImage size={20} />
          Vehicle Images ({total > 0 && activeTab === 'vehicles' ? total : vehicleImages.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('accidents');
            setSearchTerm('');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors rounded ${
            activeTab === 'accidents'
              ? 'bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124]'
              : 'bg-[#f1f3f4] dark:bg-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#4d4e52]'
          }`}
        >
          <FiVideo size={20} />
          Accident Media ({total > 0 && activeTab === 'accidents' ? total : accidentMedia.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="gcloud-card p-4 mb-6">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6]" />
          <input
            type="text"
            placeholder={activeTab === 'vehicles' ? 'Search by Vehicle ID, License, Type...' : 'Search by ID, Location, Severity...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#292a2d] text-[#202124] dark:text-[#e8eaed] rounded focus:ring-2 focus:ring-[#1a73e8] dark:focus:ring-[#8ab4f8] focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-[#5f6368] dark:text-[#9aa0a6]">
        {activeTab === 'vehicles'
          ? `Showing ${filteredVehicleImages.length} of ${total} vehicle images`
          : `Showing ${filteredAccidentMedia.length} of ${total} accident media files`
        }
      </div>

      {/* Vehicle Images Grid */}
      {activeTab === 'vehicles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVehicleImages.map((img) => (
            <div
              key={img.id}
              onClick={() => setSelectedImage(img)}
              className="gcloud-card overflow-hidden cursor-pointer hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] transition-colors"
            >
                <div className="bg-[#f8f9fa] dark:bg-[#35363a] aspect-video flex items-center justify-center relative overflow-hidden">
                <img
                  src={getImageUrl(img.imagePath)}
                  alt={`Vehicle ${img.vehicleId}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute top-2 right-2 bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124] text-xs px-2 py-1 rounded">
                  {img.vehicleType}
                </div>
                </div>
              <div className="p-4">
                <h3 className="font-mono text-sm font-medium text-[#202124] dark:text-[#e8eaed] mb-2">{img.vehicleId}</h3>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <p><span className="font-medium">License:</span> <span className="font-mono font-bold bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 px-2 py-0.5">{img.licenseNo}</span></p>
                  <p><span className="font-medium">Captured:</span> {formatDateTime(img.timestamp)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accident Media Grid */}
      {activeTab === 'accidents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAccidentMedia.map((media) => (
            <div
              key={media.id}
              onClick={() => setSelectedImage(media)}
              className="bg-white dark:bg-[#292a2d] border border-gray-200 dark:border-gray-800 overflow-hidden cursor-pointer hover:border-black dark:hover:border-white transition-colors"
            >
              <div className="bg-[#f8f9fa] dark:bg-[#35363a] aspect-video flex items-center justify-center relative">
                {media.type === 'video' ? (
                  <FiVideo size={48} className="text-[#5f6368] dark:text-gray-300" />
                ) : (
                  <FiImage size={48} className="text-[#5f6368] dark:text-gray-300" />
                )}
                <div className="absolute top-2 right-2 bg-black dark:bg-white text-white dark:text-black text-xs px-2 py-1">
                  {media.type === 'video' ? `Video ${media.duration || 'N/A'}` : 'Image'}
                </div>
                <div className={`absolute bottom-2 left-2 text-xs px-2 py-1 font-bold ${
                  media.severity === 'high' ? 'bg-red-500 text-white' :
                  media.severity === 'medium' ? 'bg-orange-500 text-white' :
                  'bg-yellow-500 text-black'
                }`}>
                  {media.severity.toUpperCase()}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-mono text-sm font-semibold text-black dark:text-white mb-2">{media.id}</h3>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <p><span className="font-medium">Location:</span> {media.location}</p>
                  <p><span className="font-medium">Recorded:</span> {formatDateTime(media.timestamp)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {total > 0 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">
            Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded border border-[#dadce0] dark:border-[#5f6368] text-[#1a73e8] dark:text-[#8ab4f8] disabled:opacity-50 hover:bg-[#f8f9fa] dark:hover:bg-[#3c4043] transition-colors font-medium text-sm"
            >
              ← Previous
            </button>
            <span className="px-4 py-2 text-[#202124] dark:text-[#e8eaed] font-medium">
              Page {page}
            </span>
            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={page * PAGE_SIZE >= total}
              className="px-4 py-2 rounded border border-[#dadce0] dark:border-[#5f6368] text-[#1a73e8] dark:text-[#8ab4f8] disabled:opacity-50 hover:bg-[#f8f9fa] dark:hover:bg-[#3c4043] transition-colors font-medium text-sm"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
          <div className="bg-white dark:bg-[#292a2d] shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-[#292a2d] border-b border-[#dadce0] dark:border-[#3c4043] px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-black dark:text-white">
                {activeTab === 'vehicles' ? `Vehicle ${(selectedImage as VehicleImage).vehicleId}` : `Accident ${(selectedImage as AccidentMedia).id}`}
              </h2>
              <button onClick={() => setSelectedImage(null)} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {activeTab === 'vehicles' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">Vehicle Information</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Vehicle ID</p>
                          <p className="text-sm font-mono font-medium text-black dark:text-white">{(selectedImage as VehicleImage).vehicleId}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">License Number</p>
                          <p className="text-sm font-mono font-medium text-black dark:text-white">{(selectedImage as VehicleImage).licenseNo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Vehicle Type</p>
                          <p className="text-sm font-medium text-black dark:text-white">{(selectedImage as VehicleImage).vehicleType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Captured At</p>
                          <p className="text-sm font-medium text-black dark:text-white">{formatDateTime((selectedImage as VehicleImage).timestamp)}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">File Paths</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Vehicle Image</p>
                          <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">{(selectedImage as VehicleImage).imagePath}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">License Plate Image</p>
                          <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">{(selectedImage as VehicleImage).licensePlatePath}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">Captured Images</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#f8f9fa] dark:bg-[#35363a] p-1 aspect-video flex items-center justify-center border border-[#dadce0] dark:border-[#3c4043] overflow-hidden">
                        {(selectedImage as VehicleImage).imagePath ? (
                          <img 
                            src={getImageUrl((selectedImage as VehicleImage).imagePath)} 
                            alt="Vehicle" 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                            }}
                          />
                        ) : (
                          <FiImage size={48} className="text-gray-400" />
                        )}
                      </div>
                      <div className="bg-[#f8f9fa] dark:bg-[#35363a] p-1 aspect-video flex items-center justify-center border border-[#dadce0] dark:border-[#3c4043] overflow-hidden">
                        {(selectedImage as VehicleImage).licensePlatePath ? (
                          <img 
                            src={getImageUrl((selectedImage as VehicleImage).licensePlatePath)} 
                            alt="License Plate" 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                            }}
                          />
                        ) : (
                          <FiImage size={48} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">Incident Information</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Incident ID</p>
                          <p className="text-sm font-mono font-medium text-black dark:text-white">{(selectedImage as AccidentMedia).id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                          <p className="text-sm font-medium text-black dark:text-white">{(selectedImage as AccidentMedia).location}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Severity</p>
                          <p className="text-sm font-semibold text-black dark:text-white">
                            {(selectedImage as AccidentMedia).severity.toUpperCase()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Recorded At</p>
                          <p className="text-sm font-medium text-black dark:text-white">{formatDateTime((selectedImage as AccidentMedia).timestamp)}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">Media File</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                          <p className="text-sm font-medium text-black dark:text-white">
                            {(selectedImage as AccidentMedia).type === 'video' ? `Video (${(selectedImage as AccidentMedia).duration})` : 'Image'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">File Path</p>
                          <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">{(selectedImage as AccidentMedia).path}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">Media Preview</h3>
                    <div className="bg-[#f8f9fa] dark:bg-[#35363a] aspect-video flex items-center justify-center border border-[#dadce0] dark:border-[#3c4043] overflow-hidden">
                      {(selectedImage as AccidentMedia).type === 'video' ? (
                        <div className="text-center text-[#5f6368] dark:text-gray-300 p-4">
                          <FiVideo size={64} className="mx-auto mb-3 opacity-50" />
                          <p className="text-sm opacity-75">Video recording</p>
                          <p className="text-xs opacity-50 mt-2">{(selectedImage as AccidentMedia).path}</p>
                        </div>
                      ) : (
                        <img 
                          src={getImageUrl((selectedImage as AccidentMedia).path)} 
                          alt="Accident Media" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

            