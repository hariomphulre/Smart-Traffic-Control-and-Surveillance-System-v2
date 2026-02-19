'use client'

import { useState, useMemo } from 'react';
import { FiX, FiAlertTriangle, FiMapPin, FiClock, FiVideo } from 'react-icons/fi';

// Seeded random number generator for consistent SSR/client rendering
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate mock accident reports
const generateAccidentReports = () => {
  const locations = ['MG Road Junction', 'Station Square', 'Park Street', 'City Center', 'Highway Toll Plaza', 'Airport Road', 'Mall Crossing', 'University Gate'];
  const vehicleTypes = ['Car', 'Bike', 'Truck', 'Bus', 'Auto'];
  const severities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
  const reports = [];

  for (let i = 0; i < 25; i++) {
    const numVehicles = Math.floor(seededRandom(i * 1) * 3) + 1;
    const vehicles = [];

    for (let j = 0; j < numVehicles; j++) {
      const seed = i * 100 + j * 10;
      vehicles.push({
        licenseNo: `DL-${Math.floor(seededRandom(seed + 1) * 90) + 10}-${String.fromCharCode(65 + Math.floor(seededRandom(seed + 2) * 26))}${String.fromCharCode(65 + Math.floor(seededRandom(seed + 3) * 26))}-${Math.floor(seededRandom(seed + 4) * 9000) + 1000}`,
        speed: Math.floor(seededRandom(seed + 5) * 80) + 40,
        vehicleType: vehicleTypes[Math.floor(seededRandom(seed + 6) * vehicleTypes.length)],
      });
    }

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(seededRandom(i * 2) * 90));
    date.setHours(Math.floor(seededRandom(i * 3) * 24));
    date.setMinutes(Math.floor(seededRandom(i * 4) * 60));

    const severity = severities[Math.floor(seededRandom(i * 5) * severities.length)];

    reports.push({
      id: `ACC-${String(i + 1).padStart(4, '0')}`,
      location: locations[Math.floor(seededRandom(i * 6) * locations.length)],
      dateTime: date.toISOString(),
      description: `${numVehicles}-vehicle ${severity} severity collision detected. ${severity === 'high' ? 'Multiple injuries reported.' : severity === 'medium' ? 'Minor injuries possible.' : 'No major injuries.'} Emergency services ${severity === 'high' ? 'dispatched immediately' : 'notified'}.`,
      vehiclesInvolved: vehicles,
      severity,
      hasRecording: seededRandom(i * 7) > 0.3,
    });
  }

  return reports.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
};

export default function AccidentReports() {
  const allReports = useMemo(() => generateAccidentReports(), []);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredReports = useMemo(() => {
    if (severityFilter === 'all') return allReports;
    return allReports.filter(report => report.severity === severityFilter);
  }, [allReports, severityFilter]);

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

  const stats = useMemo(() => {
    const high = allReports.filter(r => r.severity === 'high').length;
    const medium = allReports.filter(r => r.severity === 'medium').length;
    const low = allReports.filter(r => r.severity === 'low').length;
    return { high, medium, low, total: allReports.length };
  }, [allReports]);

  return (
    <div className="max-w-full px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed] mb-2">Accident & Fire Reports</h1>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">Incident detection and emergency response tracking</p>
      </div>

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
        Showing {filteredReports.length} of {allReports.length} reports
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

            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{report.description}</p>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-white dark:bg-gray-900 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
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
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedReport.description}</p>
                </div>
              </div>

              {/* Recording Section */}
              {selectedReport.hasRecording && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Incident Recording (1 min)</h3>
                  <div className="bg-gray-900 aspect-video flex items-center justify-center border border-gray-700">
                    <div className="text-center text-white">
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
                    <div key={index} className="border border-gray-200 dark:border-gray-800 p-4">
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
                      <div className="mt-3 bg-gray-100 dark:bg-gray-800 p-3 h-32 flex items-center justify-center border border-gray-300 dark:border-gray-700">
                        <p className="text-xs text-gray-400">Vehicle image not available</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Information */}
              <div className="border-l-4 border-black dark:border-white p-4 bg-gray-100 dark:bg-gray-800">
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
  );
}

