'use client'

import { useState, useMemo } from 'react';
import { FiFilter, FiX, FiSearch } from 'react-icons/fi';

// Seeded random number generator for consistent SSR/client rendering
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Mock log data
const generateLogs = () => {
  const locations = ['MG Road Junction', 'Station Square', 'Park Street', 'City Center', 'Highway Toll Plaza', 'Airport Road'];
  const vehicleTypes = ['Car', 'Bike', 'Truck', 'Bus', 'Auto'];
  const logs = [];

  for (let i = 0; i < 100; i++) {
    const vehicleType = vehicleTypes[Math.floor(seededRandom(i * 1) * vehicleTypes.length)];
    const speed = Math.floor(seededRandom(i * 2) * 120) + 10;
    const isBike = vehicleType === 'Bike';
    
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(seededRandom(i * 3) * 30));
    date.setHours(Math.floor(seededRandom(i * 4) * 24));
    date.setMinutes(Math.floor(seededRandom(i * 5) * 60));

    logs.push({
      id: `VEH-${String(i + 1).padStart(6, '0')}`,
      dateTime: date.toISOString(),
      location: locations[Math.floor(seededRandom(i * 6) * locations.length)],
      licenseNo: `DL-${Math.floor(seededRandom(i * 7) * 90) + 10}-${String.fromCharCode(65 + Math.floor(seededRandom(i * 8) * 26))}${String.fromCharCode(65 + Math.floor(seededRandom(i * 9) * 26))}-${Math.floor(seededRandom(i * 10) * 9000) + 1000}`,
      vehicleType,
      speed,
      helmetStatus: isBike ? seededRandom(i * 11) > 0.4 : 'N/A',
      redLightCross: seededRandom(i * 12) > 0.85,
      tripling: isBike ? seededRandom(i * 13) > 0.9 : false,
    });
  }

  return logs.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
};

export default function Logs() {
  const allLogs = useMemo(() => generateLogs(), []);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [filters, setFilters] = useState({
    speeding: false,
    helmetless: false,
    redLight: false,
    tripling: false,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = useMemo(() => {
    return allLogs.filter(log => {
      // Apply filter conditions
      if (filters.speeding && log.speed <= 60) return false;
      if (filters.helmetless && (log.helmetStatus === true || log.helmetStatus === 'N/A')) return false;
      if (filters.redLight && !log.redLightCross) return false;
      if (filters.tripling && !log.tripling) return false;

      // Apply search
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          log.id.toLowerCase().includes(search) ||
          log.licenseNo.toLowerCase().includes(search) ||
          log.location.toLowerCase().includes(search) ||
          log.vehicleType.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [allLogs, filters, searchTerm]);

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

  const toggleFilter = (filterName: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2 text-black dark:text-white">System Logs</h1>
        <p className="text-gray-600 dark:text-gray-400">Vehicle detection and violation records</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleFilter('speeding')}
              className={`px-4 py-2 font-medium transition-colors border ${
                filters.speeding
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                  : 'bg-white dark:bg-gray-900 text-black dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <FiFilter className="inline mr-2" />
              Over Speeding
            </button>
            <button
              onClick={() => toggleFilter('helmetless')}
              className={`px-4 py-2 font-medium transition-colors border ${
                filters.helmetless
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                  : 'bg-white dark:bg-gray-900 text-black dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <FiFilter className="inline mr-2" />
              Helmet-less
            </button>
            <button
              onClick={() => toggleFilter('redLight')}
              className={`px-4 py-2 font-medium transition-colors border ${
                filters.redLight
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                  : 'bg-white dark:bg-gray-900 text-black dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <FiFilter className="inline mr-2" />
              Red Light
            </button>
            <button
              onClick={() => toggleFilter('tripling')}
              className={`px-4 py-2 font-medium transition-colors border ${
                filters.tripling
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                  : 'bg-white dark:bg-gray-900 text-black dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <FiFilter className="inline mr-2" />
              Tripling
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={() => setFilters({ speeding: false, helmetless: false, redLight: false, tripling: false })}
                className="px-4 py-2 font-medium bg-gray-200 dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-700"
              >
                Clear All ({activeFilterCount})
              </button>
            )}
          </div>
          <div className="relative w-full md:w-64">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search ID, License, Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-gray-600 dark:text-gray-400">
        Showing {filteredLogs.length} of {allLogs.length} logs
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Date & Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">License No.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Vehicle Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Speed</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Helmet</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Red Light</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Tripling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDateTime(log.dateTime)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-black dark:text-white">{log.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{log.location}</td>
                  <td className="px-4 py-3 text-sm"><span className="font-mono font-bold bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 px-2 py-0.5">{log.licenseNo}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{log.vehicleType}</td>
                  <td className={`px-4 py-3 text-sm font-semibold ${log.speed > 60 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {log.speed} km/h {log.speed > 60 && '⚠️'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {log.helmetStatus === 'N/A' ? (
                      <span className="text-gray-400">N/A</span>
                    ) : log.helmetStatus ? (
                      <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 font-bold">✗</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {log.redLightCross ? <span className="text-red-600 dark:text-red-400 font-bold">✗</span> : <span className="text-green-600 dark:text-green-400 font-bold">✓</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {log.tripling ? <span className="text-red-600 dark:text-red-400 font-bold">✗</span> : <span className="text-green-600 dark:text-green-400 font-bold">✓</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
          <div className="bg-white dark:bg-gray-900 shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-black dark:text-white">Vehicle Details - {selectedLog.id}</h2>
              <button onClick={() => setSelectedLog(null)} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">BASIC INFORMATION</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Date & Time</p>
                      <p className="text-sm font-medium text-black dark:text-white">{formatDateTime(selectedLog.dateTime)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                      <p className="text-sm font-medium text-black dark:text-white">{selectedLog.location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">License Number</p>
                      <p className="text-sm font-mono font-bold bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 px-2 py-1 inline-block">{selectedLog.licenseNo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Vehicle Type</p>
                      <p className="text-sm font-medium text-black dark:text-white">{selectedLog.vehicleType}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">VIOLATION STATUS</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Speed</p>
                      <p className={`text-sm font-semibold ${selectedLog.speed > 60 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {selectedLog.speed} km/h {selectedLog.speed > 60 && '⚠️ Over Speed'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Helmet Status</p>
                      <p className="text-sm font-medium">
                        {selectedLog.helmetStatus === 'N/A' ? (
                          <span className="text-gray-400">Not Applicable</span>
                        ) : selectedLog.helmetStatus ? (
                          <span className="text-green-600 dark:text-green-400 font-bold">✓ Wearing Helmet</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 font-bold">✗ No Helmet</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Red Light Violation</p>
                      <p className="text-sm font-medium">
                        {selectedLog.redLightCross ? (
                          <span className="text-red-600 dark:text-red-400 font-bold">✗ Violated</span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400 font-bold">✓ No Violation</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Triple Riding</p>
                      <p className="text-sm font-medium">
                        {selectedLog.tripling ? (
                          <span className="text-red-600 dark:text-red-400 font-bold">✗ Detected</span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400 font-bold">✓ Not Detected</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">CAPTURED IMAGES</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 h-48 flex items-center justify-center border border-gray-300 dark:border-gray-700">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 mb-2">Vehicle Image</p>
                      <p className="text-xs text-gray-400">Image not available</p>
                    </div>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 h-48 flex items-center justify-center border border-gray-300 dark:border-gray-700">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 mb-2">License Plate</p>
                      <p className="text-xs text-gray-400">Image not available</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
