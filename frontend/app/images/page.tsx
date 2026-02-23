'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiImage, FiVideo, FiSearch, FiX } from 'react-icons/fi';
import { getVehicleImages, getAccidentMedia, getImageUrl, type VehicleImage, type AccidentMedia } from '@/lib/api';

export default function Images() {
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


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: any = {
          page,
          limit: 100,
        };

        if (searchTerm) params.search = searchTerm;

        if (activeTab === 'vehicles') {
          const response = await getVehicleImages(params);
          setVehicleImages(response.data || []);
          console.log('Fetched vehicle images:', response.data);
        } else {
          const response = await getAccidentMedia(params);
          setAccidentMedia(response.data || []);
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
    if (activeTab === 'vehicles') {
      if (!searchTerm) {
        setFilteredVehicleImages(vehicleImages);
      } else {
        const search = searchTerm.toLowerCase();
        setFilteredVehicleImages(vehicleImages.filter(img =>
          img.vehicleId.toLowerCase().includes(search) ||
          img.licenseNo.toLowerCase().includes(search) ||
          img.vehicleType.toLowerCase().includes(search)
        ));
      }
    } else {
      if (!searchTerm) {
        setFilteredAccidentMedia(accidentMedia);
      } else {
        const search = searchTerm.toLowerCase();
        setFilteredAccidentMedia(accidentMedia.filter(media =>
          media.id.toLowerCase().includes(search) ||
          media.location.toLowerCase().includes(search) ||
          media.severity.toLowerCase().includes(search)
        ));
      }
    }
  }, [vehicleImages, accidentMedia, searchTerm, activeTab]);

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
      <div className="max-w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed] mb-2">Traffic Camera Images</h1>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">Vehicle detection images and accident recordings</p>
        </div>
        <div className="gcloud-card p-8 text-center">
          <p className="text-[#5f6368] dark:text-[#9aa0a6]">Loading images...</p>
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
    <div className="max-w-full px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed] mb-2">Traffic Camera Images</h1>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">Vehicle detection images and accident recordings</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            setActiveTab('vehicles');
            setSearchTerm('');
          }}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors rounded ${
            activeTab === 'vehicles'
              ? 'bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124]'
              : 'bg-[#f1f3f4] dark:bg-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#4d4e52]'
          }`}
        >
          <FiImage size={20} />
          Vehicle Images ({vehicleImages.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('accidents');
            setSearchTerm('');
          }}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors rounded ${
            activeTab === 'accidents'
              ? 'bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124]'
              : 'bg-[#f1f3f4] dark:bg-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#4d4e52]'
          }`}
        >
          <FiVideo size={20} />
          Accident Media ({accidentMedia.length})
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
          ? `Showing ${filteredVehicleImages.length} of ${vehicleImages.length} vehicle images`
          : `Showing ${filteredAccidentMedia.length} of ${accidentMedia.length} accident media files`
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
                  src={`uploads/${img.imagePath}`}
                  alt={`Vehicle ${img.vehicleId}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
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
                  {media.type === 'video' ? `Video ${media.duration}` : 'Image'}
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
                            const img = e.target as HTMLImageElement;
                            const parent = img.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="text-center text-[#5f6368] dark:text-gray-300 p-4 flex flex-col items-center justify-center w-full h-full">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-3 opacity-50"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                  <p class="text-sm opacity-75">Image not found</p>
                                  <p class="text-xs opacity-50 mt-2">${(selectedImage as AccidentMedia).path}</p>
                                </div>
                              `;
                            }
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

            