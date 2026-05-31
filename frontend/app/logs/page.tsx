'use client'

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FiFilter, FiX, FiSearch } from 'react-icons/fi';
import { getLogs, type Log } from '@/lib/api';
import LocationBar from '@/components/LocationBar';
import { useLocationFilter } from '@/context/LocationFilterContext';
import { MAP_SIGNALS } from '@/map/MapData';

const DynamicMap = dynamic(() => import('@/components/RealMap'), { 
  ssr: false, 
  loading: () => <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-[#8AB4F8] font-mono animate-pulse">Initializing Satellite Uplink...</div> 
});
import { AiFillExclamationCircle } from 'react-icons/ai';
import { FaCircleExclamation, FaCircleXmark } from 'react-icons/fa6';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { HiExclamationCircle } from 'react-icons/hi';
import { IoIosWarning, IoMdRefresh } from 'react-icons/io';
import { IoWarningSharp } from 'react-icons/io5';
import { GoCheckCircle, GoCheckCircleFill, GoCircle, GoXCircle, GoXCircleFill } from 'react-icons/go';
import { MdCheckCircle } from 'react-icons/md';

export default function Logs() {
  const { isMapOpen, setIsMapOpen, pathSegments, handleMapPinClick } = useLocationFilter();
  const [allLogs, setAllLogs] = useState<Log[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<Log[]>([]);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [filters, setFilters] = useState({
    speeding: false,
    helmetless: false,
    redLight: false,
    tripling: false,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: Record<string, unknown> = {
          page,
          limit: PAGE_SIZE,
        };

        if (filters.speeding) params.speeding = true;
        if (filters.helmetless) params.helmetless = true;
        if (filters.redLight) params.redLight = true;
        if (filters.tripling) params.tripling = true;
        if (searchTerm) params.search = searchTerm;

        const response = await getLogs(params);
        setAllLogs(response.data || []);
        setTotal(response.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch logs');
        console.error('Error fetching logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page, filters.speeding, filters.helmetless, filters.redLight, filters.tripling, searchTerm]);

  useEffect(() => {
    setFilteredLogs(allLogs);
  }, [allLogs]);

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

  if (loading) {
    return (
      <div className="w-full flex items-center justify-between h-13 mb-0 border-b border-[#3c4043] bg-[#131314] p-1 shadow-xl">
        <div className="flex items-center min-w-170 flex-1">
          <div>
            <p className="text-[#ffffff] font-mono text-xl ml-4">System Logs</p>
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
    );
  }

  if (error) {
    return (
      <div className="w-full flex items-center justify-between h-13 mb-0 border-b border-[#3c4043] bg-[#131314] p-1 shadow-xl">
        <div className="flex items-center min-w-170 flex-1">
          <div>
            <p className="text-[#ffffff] font-mono text-xl ml-4">System Logs</p>
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
    );
  }

  return (
    <div className="max-w-full dark:bg-[#131314]">
      <div className="w-full flex items-center justify-between h-13 mb-0 border-b border-[#3c4043] bg-[#131314] p-1 shadow-xl">
        <div className="flex items-center min-w-170 flex-1">
          <div>
            <p className="text-[#ffffff] font-mono text-xl ml-4">System Logs</p>
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

      <div className="py-5 px-4 dark:bg-[#131314]">
        {/* Filters and Search */}
        <div className="gcloud-card mb-4 p-0 !border-0 !bg-[#131314] !dark:bg-[#131314]">
          <div className="flex flex-col !bg-[#131314] md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleFilter('speeding')}
                className={`px-4 py-2 text-sm font-medium transition-colors rounded ${
                  filters.speeding
                    ? 'bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124]'
                    : 'bg-[#f1f3f4] dark:bg-[#292A2D] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#4d4e52]'
                }`}
              >
                <FiFilter className="inline mr-2" />
                Over Speeding
              </button>
              <button
                onClick={() => toggleFilter('helmetless')}
                className={`px-4 py-2 text-sm font-medium transition-colors rounded ${
                  filters.helmetless
                    ? 'bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124]'
                    : 'bg-[#f1f3f4] dark:bg-[#292A2D] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#4d4e52]'
                }`}
              >
                <FiFilter className="inline mr-2" />
                Helmet-less
              </button>
              <button
                onClick={() => toggleFilter('redLight')}
                className={`px-4 py-2 text-sm font-medium transition-colors rounded ${
                  filters.redLight
                    ? 'bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124]'
                    : 'bg-[#f1f3f4] dark:bg-[#292A2D] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#4d4e52]'
                }`}
              >
                <FiFilter className="inline mr-2" />
                Red Light
              </button>
              <button
                onClick={() => toggleFilter('tripling')}
                className={`px-4 py-2 text-sm font-medium transition-colors rounded ${
                  filters.tripling
                    ? 'bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124]'
                    : 'bg-[#f1f3f4] dark:bg-[#292A2D] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#4d4e52]'
                }`}
              >
                <FiFilter className="inline mr-2" />
                Tripling
              </button>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters({ speeding: false, helmetless: false, redLight: false, tripling: false })}
                  className="px-4 py-2 text-sm font-medium bg-[#f1f3f4] dark:bg-[#292A2D] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#4d4e52] transition-colors rounded"
                >
                  Clear All ({activeFilterCount})
                </button>
              )}
            </div>
            <div className="relative w-full md:w-100 border border-[#3C4043] rounded-md transition-colors focus-within:border-[#8AB4F8] focus-within:ring-0.7 focus-within:ring-[#8AB4F8]">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6]" />
              <input
                type="text"
                placeholder="Search ID, License, Location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-[#5f6368] dark:text-[#9aa0a6]">
          Showing {filteredLogs.length} of {total} logs
        </div>

        {/* Logs Table */}
        <div className="gcloud-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full gcloud-table">
              <thead className="bg-[#f8f9fa] dark:bg-[#292A2D] border-b border-[#dadce0] dark:border-[#5f6368]">
                <tr>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Date & Time</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">ID</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Location</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">License No.</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Vehicle Type</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Speed</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Helmet</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Red Light</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Tripling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dadce0] dark:divide-[#3c4043]">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-[#f8f9fa] dark:bg-[#131314] dark:hover:bg-[#2A2B2E] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-[#5f6368] dark:text-[#9aa0a6]">{formatDateTime(log.dateTime)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-[#5f6368] dark:text-[#9aa0a6]">{log.id}</td>
                    <td className="px-4 py-3 text-sm text-[#5f6368] dark:text-[#9aa0a6]">{log.location}</td>
                    <td className="px-4 py-3 text-sm"><span className="font-mono font-medium text-[#8AB4F8] dark:text-[#8AB4F8]">{log.licenseNo}</span></td>
                    <td className="px-4 py-3 text-sm text-[#5f6368] dark:text-[#9aa0a6]">{log.vehicleType}</td>
                    <td className={`flex gap-1.5 items-center px-4 py-3 text-sm font-medium ${log.speed > 60 ? 'text-[#d93025] dark:text-[#f28b82]' : 'text-[#5f6368] dark:text-[#9aa0a6]'}`}>
                      {log.speed} km/h {(log.speed > 60 && '') || (log.speed >= 100 && <IoWarningSharp className="w-4.5 h-4.5" />)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.helmetStatus === 'N/A' ? (
                        <span className="text-[#5f6368] dark:text-[#9aa0a6]">N/A</span>
                      ) : log.helmetStatus ? (
                        <FaCheckCircle className="text-[#188038] dark:text-[#81c995] w-4.5 h-4.5 font-bold"/>

                      ) : (
                        <FaCircleXmark className="text-[#d93025] dark:text-[#f28b82] w-4.5 h-4.5 font-bold"/>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.redLightCross ? <FaCircleXmark className="text-[#d93025] dark:text-[#f28b82] w-4.5 h-4.5 font-bold"/> : <FaCheckCircle className="text-[#188038] dark:text-[#81c995] w-4.5 h-4.5 font-bold"/>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.tripling ? <FaCircleXmark className="text-[#d93025] dark:text-[#f28b82] w-4.5 h-4.5 font-bold"/> : <FaCheckCircle className="text-[#188038] dark:text-[#81c995] w-4.5 h-4.5 font-bold"/>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-1 px-4">
            <div className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">
              Showing {total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}-{Math.min(page * PAGE_SIZE, total)} of {total} logs
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-2 py-1.5 text-[#669DF6] rounded-md dark:text-[#8ab4f8] disabled:opacity-40 hover:bg-[#f8f9fa] dark:hover:bg-[#3c4043] transition-colors font-medium text-sm"
              >
                ← Previous
              </button>
              <span className="px-0 py-1 text-[#202124] dark:text-[#e8eaed] font-medium">
                Page {page}
              </span>
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={page * PAGE_SIZE >= total}
                className="px-2 py-1.5 text-[#669DF6] rounded-md dark:text-[#8ab4f8] disabled:opacity-40 hover:bg-[#f8f9fa] dark:hover:bg-[#3c4043] transition-colors font-medium text-sm"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
            <div className="bg-white dark:bg-[#292a2d] shadow-2xl rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-[#292a2d] border-b border-[#dadce0] dark:border-[#3c4043] px-6 py-4 flex justify-between items-center rounded-t-lg">
                <h2 className="text-xl font-medium text-[#202124] dark:text-[#e8eaed]">Vehicle Details - {selectedLog.id}</h2>
                <button onClick={() => setSelectedLog(null)} className="text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed] transition-colors">
                  <FiX size={24} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-[#5f6368] dark:text-[#9aa0a6] mb-2 uppercase">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Date & Time</p>
                        <p className="text-sm font-medium text-[#202124] dark:text-[#e8eaed]">{formatDateTime(selectedLog.dateTime)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedLog.location}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">License Number</p>
                        <p className="text-sm font-mono font-semibold bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-200 px-2 py-1 inline-block">{selectedLog.licenseNo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Vehicle Type</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedLog.vehicleType}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase">Violation Status</h3>
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
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase">Captured Images</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 h-48 flex items-center justify-center border border-gray-300 dark:border-gray-600">
                      <div className="text-center">
                        <p className="text-gray-600 dark:text-gray-400 mb-2">Vehicle Image</p>
                        <p className="text-xs text-gray-400">Image not available</p>
                      </div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 h-48 flex items-center justify-center border border-gray-300 dark:border-gray-600">
                      <div className="text-center">
                        <p className="text-gray-600 dark:text-gray-400 mb-2">License Plate</p>
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
    </div>
  );
}
