'use client'

import { useState, useMemo } from 'react';
import { FiImage, FiVideo, FiSearch, FiX } from 'react-icons/fi';

// Seeded random number generator for consistent SSR/client rendering
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate mock vehicle images
const generateVehicleImages = () => {
  const vehicleTypes = ['Car', 'Bike', 'Truck', 'Bus', 'Auto'];
  const images = [];

  for (let i = 1; i <= 50; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(seededRandom(i * 1) * 30));
    date.setHours(Math.floor(seededRandom(i * 2) * 24));
    date.setMinutes(Math.floor(seededRandom(i * 3) * 60));

    images.push({
      id: i,
      vehicleId: `VEH-${String(i).padStart(6, '0')}`,
      licenseNo: `DL-${Math.floor(seededRandom(i * 4) * 90) + 10}-${String.fromCharCode(65 + Math.floor(seededRandom(i * 5) * 26))}${String.fromCharCode(65 + Math.floor(seededRandom(i * 6) * 26))}-${Math.floor(seededRandom(i * 7) * 9000) + 1000}`,
      vehicleType: vehicleTypes[Math.floor(seededRandom(i * 8) * vehicleTypes.length)],
      timestamp: date.toISOString(),
      imagePath: `/local_data/all_vehicle_detected_img/vehicle_${i}.jpg`,
      licensePlatePath: `/local_data/all_license_plate_img/license_plate_${i}.jpg`,
    });
  }

  return images.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Generate mock accident images/recordings
const generateAccidentMedia = () => {
  const locations = ['MG Road Junction', 'Station Square', 'Park Street', 'City Center', 'Highway Toll Plaza', 'Airport Road'];
  const media = [];

  for (let i = 1; i <= 20; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(seededRandom(i * 10) * 60));
    date.setHours(Math.floor(seededRandom(i * 11) * 24));
    date.setMinutes(Math.floor(seededRandom(i * 12) * 60));

    const isVideo = seededRandom(i * 13) > 0.5;

    media.push({
      id: `ACC-${String(i).padStart(4, '0')}`,
      location: locations[Math.floor(seededRandom(i * 14) * locations.length)],
      timestamp: date.toISOString(),
      type: isVideo ? 'video' : 'image',
      path: isVideo ? `/recordings/accident_${i}.mp4` : `/recordings/accident_${i}.jpg`,
      duration: isVideo ? '60s' : null,
      severity: ['low', 'medium', 'high'][Math.floor(seededRandom(i * 15) * 3)],
    });
  }

  return media.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export default function Images() {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'accidents'>('vehicles');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<any>(null);

  const vehicleImages = useMemo(() => generateVehicleImages(), []);
  const accidentMedia = useMemo(() => generateAccidentMedia(), []);

  const filteredVehicleImages = useMemo(() => {
    if (!searchTerm) return vehicleImages;
    const search = searchTerm.toLowerCase();
    return vehicleImages.filter(img => 
      img.vehicleId.toLowerCase().includes(search) ||
      img.licenseNo.toLowerCase().includes(search) ||
      img.vehicleType.toLowerCase().includes(search)
    );
  }, [vehicleImages, searchTerm]);

  const filteredAccidentMedia = useMemo(() => {
    if (!searchTerm) return accidentMedia;
    const search = searchTerm.toLowerCase();
    return accidentMedia.filter(media => 
      media.id.toLowerCase().includes(search) ||
      media.location.toLowerCase().includes(search) ||
      media.severity.toLowerCase().includes(search)
    );
  }, [accidentMedia, searchTerm]);

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
              <div className="bg-[#f8f9fa] dark:bg-[#3c4043] aspect-video flex items-center justify-center relative">
                <FiImage size={48} className="text-[#5f6368] dark:text-[#9aa0a6]" />
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
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden cursor-pointer hover:border-black dark:hover:border-white transition-colors"
            >
              <div className="bg-gray-800 dark:bg-gray-700 aspect-video flex items-center justify-center relative">
                {media.type === 'video' ? (
                  <FiVideo size={48} className="text-gray-300" />
                ) : (
                  <FiImage size={48} className="text-gray-300" />
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
          <div className="bg-white dark:bg-gray-900 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-black dark:text-white">
                {activeTab === 'vehicles' ? `Vehicle ${selectedImage.vehicleId}` : `Accident ${selectedImage.id}`}
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
                          <p className="text-sm font-mono font-medium text-black dark:text-white">{selectedImage.vehicleId}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">License Number</p>
                          <p className="text-sm font-mono font-medium text-black dark:text-white">{selectedImage.licenseNo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Vehicle Type</p>
                          <p className="text-sm font-medium text-black dark:text-white">{selectedImage.vehicleType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Captured At</p>
                          <p className="text-sm font-medium text-black dark:text-white">{formatDateTime(selectedImage.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">File Paths</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Vehicle Image</p>
                          <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">{selectedImage.imagePath}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">License Plate Image</p>
                          <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">{selectedImage.licensePlatePath}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">Captured Images</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 aspect-video flex items-center justify-center border border-gray-300 dark:border-gray-700">
                        <div className="text-center">
                          <FiImage size={48} className="mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">Vehicle Image</p>
                          <p className="text-xs text-gray-400 mt-1">Image file not loaded</p>
                        </div>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 aspect-video flex items-center justify-center border border-gray-300 dark:border-gray-700">
                        <div className="text-center">
                          <FiImage size={48} className="mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">License Plate</p>
                          <p className="text-xs text-gray-400 mt-1">Image file not loaded</p>
                        </div>
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
                          <p className="text-sm font-mono font-medium text-black dark:text-white">{selectedImage.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                          <p className="text-sm font-medium text-black dark:text-white">{selectedImage.location}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Severity</p>
                          <p className="text-sm font-semibold text-black dark:text-white">
                            {selectedImage.severity.toUpperCase()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Recorded At</p>
                          <p className="text-sm font-medium text-black dark:text-white">{formatDateTime(selectedImage.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">Media File</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                          <p className="text-sm font-medium text-black dark:text-white">
                            {selectedImage.type === 'video' ? `Video (${selectedImage.duration})` : 'Image'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">File Path</p>
                          <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">{selectedImage.path}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">Media Preview</h3>
                    <div className="bg-gray-900 dark:bg-gray-800 aspect-video flex items-center justify-center border border-gray-700">
                      <div className="text-center text-white">
                        {selectedImage.type === 'video' ? (
                          <>
                            <FiVideo size={64} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm opacity-75">Video recording not available in demo</p>
                          </>
                        ) : (
                          <>
                            <FiImage size={64} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm opacity-75">Image not available in demo</p>
                          </>
                        )}
                        <p className="text-xs opacity-50 mt-2">{selectedImage.path}</p>
                      </div>
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

            