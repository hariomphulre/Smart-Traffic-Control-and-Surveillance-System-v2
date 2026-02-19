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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2 text-black dark:text-white">Accident & Fire Reports</h1>
        <p className="text-gray-600 dark:text-gray-400">Incident detection and emergency response tracking</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800">
          <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1 uppercase">Total Incidents</h3>
          <p className="text-2xl font-bold text-black dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950 p-4 border-2 border-red-500">
          <h3 className="text-red-700 dark:text-red-300 text-xs font-semibold mb-1 uppercase">High Severity</h3>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.high}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950 p-4 border-2 border-orange-500">
          <h3 className="text-orange-700 dark:text-orange-300 text-xs font-semibold mb-1 uppercase">Medium Severity</h3>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.medium}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-950 p-4 border-2 border-yellow-500">
          <h3 className="text-yellow-700 dark:text-yellow-300 text-xs font-semibold mb-1 uppercase">Low Severity</h3>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.low}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-4 py-2 font-medium transition-colors border ${
              severityFilter === 'all'
                ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                : 'bg-white dark:bg-gray-900 text-black dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            All Reports ({stats.total})
          </button>
          <button
            onClick={() => setSeverityFilter('high')}
            className={`px-4 py-2 font-medium transition-colors border ${
              severityFilter === 'high'
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white dark:bg-gray-900 text-black dark:text-white border-gray-300 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-950'
            }`}
          >
            High Severity ({stats.high})
          </button>
          <button
            onClick={() => setSeverityFilter('medium')}
            className={`px-4 py-2 font-medium transition-colors border ${
              severityFilter === 'medium'
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white dark:bg-gray-900 text-black dark:text-white border-gray-300 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-950'
            }`}
          >
            Medium Severity ({stats.medium})
          </button>
          <button
            onClick={() => setSeverityFilter('low')}
            className={`px-4 py-2 font-medium transition-colors border ${
              severityFilter === 'low'
                ? 'bg-yellow-600 text-white border-yellow-600'
                : 'bg-white dark:bg-gray-900 text-black dark:text-white border-gray-300 dark:border-gray-700 hover:bg-yellow-50 dark:hover:bg-yellow-950'
            }`}
          >
            Low Severity ({stats.low})
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-gray-600 dark:text-gray-400">
        Showing {filteredReports.length} of {allReports.length} reports
      </div>

      {/* Accident Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            onClick={() => setSelectedReport(report)}
            className={`bg-white dark:bg-gray-900 border-l-4 p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
              report.severity === 'high' ? 'border-red-500' :
              report.severity === 'medium' ? 'border-orange-500' :
              'border-yellow-500'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-black dark:text-white">{report.id}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click to view details</p>
              </div>
              <span className={`px-3 py-1 text-xs font-bold ${
                report.severity === 'high' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-500' :
                report.severity === 'medium' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border border-orange-500' :
                'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-500'
              }`}>
                {report.severity.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                <FiMapPin className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{report.location}</span>
              </div>
              <div className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                <FiClock className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{formatDateTime(report.dateTime)}</span>
              </div>
              <div className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                <FiAlertTriangle className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{report.vehiclesInvolved.length} vehicle(s) involved</span>
              </div>
              {report.hasRecording && (
                <div className="flex items-start text-sm text-gray-700 dark:text-gray-300">
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

