'use client'

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FiX, FiAlertTriangle, FiMapPin, FiClock, FiVideo } from 'react-icons/fi';
import { getAccidents, getAccidentStats, type Accident, type AccidentStats } from '@/lib/api';
import LocationBar from '@/components/LocationBar';
import { useLocationFilter } from '@/context/LocationFilterContext';
import { MAP_SIGNALS } from '@/map/MapData';

const DynamicMap = dynamic(() => import('@/components/RealMap'), { 
  ssr: false, 
  loading: () => <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-[#8AB4F8] font-mono animate-pulse">Initializing Satellite Uplink...</div> 
});
import { IoMdRefresh } from 'react-icons/io';

export default function AccidentReports() {
  const { isMapOpen, setIsMapOpen, pathSegments, handleMapPinClick } = useLocationFilter();
  const [allReports, setAllReports] = useState<Accident[]>([]);
  const [filteredReports, setFilteredReports] = useState<Accident[]>([]);
  const [stats, setStats] = useState<AccidentStats>({
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
  });
  const [selectedReport, setSelectedReport] = useState<Accident | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params: Record<string, unknown> = {
          page,
          limit: PAGE_SIZE,
        };

        if (severityFilter !== 'all') params.severity = severityFilter;

        const [accidentsResponse, statsResponse] = await Promise.all([
          getAccidents(params),
          getAccidentStats(),
        ]);

        setAllReports(accidentsResponse.data || []);
        setTotal(accidentsResponse.total || 0);
        setStats(statsResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch accidents');
        console.error('Error fetching accidents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, severityFilter]);

  useEffect(() => {
    setFilteredReports(allReports);
  }, [allReports]);

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
      <div className="w-full flex items-center justify-between h-13 mb-0 border-b border-[#3c4043] bg-[#131314] p-1 shadow-xl">
        <div className="flex items-center min-w-170 flex-1">
          <div>
            <p className="text-[#ffffff] font-mono text-xl ml-4">Accident & Fire Reports</p>
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
            <p className="text-[#ffffff] font-mono text-xl ml-4">Accident & Fire Reports</p>
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
      <div className="w-full flex items-center justify-between h-13 mb-0 border-b border-l border-[#3c4043] bg-[#131314] p-1 shadow-xl">
        <div className="flex items-center min-w-170 flex-1">
          <div>
            <p className="text-[#ffffff] font-mono text-xl ml-4">Accident & Fire Reports</p>
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

      <div className="px-4 py-4">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="gcloud-card p-4">
          <h3 className="text-[#5f6368] dark:text-[#9aa0a6] text-xs font-medium mb-1 uppercase">Total Incidents</h3>
          <p className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed]">{stats.total}</p>
        </div>
        <div className="gcloud-card p-4 bg-[#fce8e6] dark:bg-[#5f2120] border-2 border-[#ea4335] dark:border-[#f28b82]">
          <h3 className="text-[#d93025] dark:text-[#f28b82] text-xs font-medium mb-1 uppercase">High Severity</h3>
          <p className="text-2xl font-normal text-[#d93025] dark:text-[#f28b82]">{stats.high}</p>
        </div>
        <div className="gcloud-card p-4 bg-[#fef7e0] dark:bg-[#5f5317] border-2 border-[#fbbc04] dark:border-[#fdd663]">
          <h3 className="text-[#ea8600] dark:text-[#fdd663] text-xs font-medium mb-1 uppercase">Medium Severity</h3>
          <p className="text-2xl font-normal text-[#ea8600] dark:text-[#fdd663]">{stats.medium}</p>
        </div>
        <div className="gcloud-card p-4 bg-[#e6f4ea] dark:bg-[#1e4620] border-2 border-[#34a853] dark:border-[#81c995]">
          <h3 className="text-[#188038] dark:text-[#81c995] text-xs font-medium mb-1 uppercase">Low Severity</h3>
          <p className="text-2xl font-normal text-[#188038] dark:text-[#81c995]">{stats.low}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="gcloud-card p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded ${
              severityFilter === 'all'
                ? 'bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124]'
                : 'bg-[#f1f3f4] dark:bg-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#4d4e52]'
            }`}
          >
            All Reports ({stats.total})
          </button>
          <button
            onClick={() => setSeverityFilter('high')}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded ${
              severityFilter === 'high'
                ? 'bg-[#ea4335] dark:bg-[#f28b82] text-white dark:text-[#202124]'
                : 'bg-[#f1f3f4] dark:bg-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#fce8e6] dark:hover:bg-[#5f2120]'
            }`}
          >
            High Severity ({stats.high})
          </button>
          <button
            onClick={() => setSeverityFilter('medium')}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded ${
              severityFilter === 'medium'
                ? 'bg-[#fbbc04] dark:bg-[#fdd663] text-[#202124]'
                : 'bg-[#f1f3f4] dark:bg-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#fef7e0] dark:hover:bg-[#5f5317]'
            }`}
          >
            Medium Severity ({stats.medium})
          </button>
          <button
            onClick={() => setSeverityFilter('low')}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded ${
              severityFilter === 'low'
                ? 'bg-[#34a853] dark:bg-[#81c995] text-white dark:text-[#202124]'
                : 'bg-[#f1f3f4] dark:bg-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e6f4ea] dark:hover:bg-[#1e4620]'
            }`}
          >
            Low Severity ({stats.low})
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-[#5f6368] dark:text-[#9aa0a6]">
        Showing {filteredReports.length} of {stats.total} reports
      </div>

      {/* Accident Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            onClick={() => setSelectedReport(report)}
            className={`gcloud-card p-5 cursor-pointer hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] transition-colors border-l-4 ${
              report.severity === 'high' ? 'border-l-[#ea4335]' :
              report.severity === 'medium' ? 'border-l-[#fbbc04]' :
              'border-l-[#34a853]'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-base font-medium text-[#202124] dark:text-[#e8eaed]">{report.id}</h3>
                <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-1">Click to view details</p>
              </div>
              <span className={`px-3 py-1 text-xs font-medium rounded ${
                report.severity === 'high' ? 'bg-[#fce8e6] dark:bg-[#5f2120] text-[#d93025] dark:text-[#f28b82]' :
                report.severity === 'medium' ? 'bg-[#fef7e0] dark:bg-[#5f5317] text-[#ea8600] dark:text-[#fdd663]' :
                'bg-[#e6f4ea] dark:bg-[#1e4620] text-[#188038] dark:text-[#81c995]'
              }`}>
                {report.severity.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-start text-sm text-[#5f6368] dark:text-[#9aa0a6]">
                <FiMapPin className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{report.location}</span>
              </div>
              <div className="flex items-start text-sm text-[#5f6368] dark:text-[#9aa0a6]">
                <FiClock className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{formatDateTime(report.dateTime)}</span>
              </div>
              <div className="flex items-start text-sm text-[#5f6368] dark:text-[#9aa0a6]">
                <FiAlertTriangle className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{report.vehiclesInvolved.length} vehicle(s) involved</span>
              </div>
              {report.hasRecording && (
                <div className="flex items-start text-sm text-[#5f6368] dark:text-[#9aa0a6]">
                  <FiVideo className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>Recording available</span>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2\">{report.description || 'No description'}</p>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">
          Showing {total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}-{Math.min(page * PAGE_SIZE, total)} of {total} reports
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

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-white dark:bg-[#292a2d] shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-[#292a2d] border-b border-[#dadce0] dark:border-[#3c4043] px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-black dark:text-white">{selectedReport.id}</h2>
                <span className={`px-3 py-1 text-xs font-bold ${
                  selectedReport.severity === 'high' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-500' :
                  selectedReport.severity === 'medium' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border border-orange-500' :
                  'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-500'
                }`}>
                  {selectedReport.severity.toUpperCase()} SEVERITY
                </span>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {/* Incident Overview */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Incident Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <FiMapPin className="mr-3 mt-1 text-black dark:text-white" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                      <p className="text-sm font-medium text-black dark:text-white">{selectedReport.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FiClock className="mr-3 mt-1 text-black dark:text-white" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Date & Time</p>
                      <p className="text-sm font-medium text-black dark:text-white">{formatDateTime(selectedReport.dateTime)}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300\">{selectedReport.description || 'No description provided'}</p>
                </div>
              </div>

              {/* Recording Section */}
              {selectedReport.hasRecording !== false && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Incident Recording (1 min)</h3>
                  <div className="bg-[#f8f9fa] dark:bg-[#35363a] aspect-video flex items-center justify-center border border-[#dadce0] dark:border-[#3c4043]">
                    <div className="text-center text-[#5f6368] dark:text-gray-300">
                      <FiVideo size={48} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm opacity-75">Video recording not available in demo</p>
                      <p className="text-xs opacity-50 mt-1">File: accident_{selectedReport.id}.mp4</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicles Involved */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Vehicles Involved ({selectedReport.vehiclesInvolved.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedReport.vehiclesInvolved.map((vehicle: any, index: number) => (
                    <div key={index} className="border border-[#dadce0] dark:border-[#3c4043] p-4 bg-[#f8f9fa] dark:bg-[#35363a]">
                      <h4 className="font-semibold text-black dark:text-white mb-3">Vehicle {index + 1}</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">License Number</p>
                          <p className="text-sm font-mono font-bold bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 px-2 py-1 inline-block">{vehicle.licenseNo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Vehicle Type</p>
                          <p className="text-sm font-medium text-black dark:text-white">{vehicle.vehicleType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Speed at Impact</p>
                          <p className={`text-sm font-semibold ${vehicle.speed > 60 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>{vehicle.speed} km/h</p>
                        </div>
                      </div>
                      <div className="mt-3 bg-[#f8f9fa] dark:bg-[#35363a] p-3 h-32 flex items-center justify-center border border-[#dadce0] dark:border-[#3c4043]">
                        <p className="text-xs text-gray-400">Vehicle image not available</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Information */}
              <div className="border-l-4 border-[#1a73e8] dark:border-[#8ab4f8] p-4 bg-[#f8f9fa] dark:bg-[#35363a]">
                <h4 className="font-semibold mb-2 text-black dark:text-white">
                  {selectedReport.severity === 'high' 
                    ? '🚨 High Priority Incident'
                    : selectedReport.severity === 'medium'
                    ? '⚠️ Medium Priority Incident'
                    : 'ℹ️ Low Priority Incident'}
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedReport.severity === 'high' 
                    ? 'Emergency services have been dispatched immediately. This incident requires urgent attention.'
                    : selectedReport.severity === 'medium'
                    ? 'Incident has been logged and emergency services have been notified.'
                    : 'Incident has been logged for record keeping. No immediate action required.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

