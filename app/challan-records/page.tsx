'use client'

import { useState, useMemo } from 'react';
import { FiX, FiSearch, FiMapPin, FiClock, FiAlertCircle, FiCheckCircle, FiXCircle, FiDollarSign, FiCalendar } from 'react-icons/fi';

// Seeded random number generator for consistent SSR/client rendering
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate mock challan data
const generateChallans = () => {
  const locations = ['MG Road Junction', 'Station Square', 'Park Street', 'City Center', 'Highway Toll Plaza', 'Airport Road'];
  const vehicleTypes = ['Car', 'Bike', 'Truck', 'Bus', 'Auto'];
  const violationTypes = ['No Helmet', 'Triple Riding', 'Red Light Violation', 'Over Speeding'];
  const statuses: ('pending' | 'received' | 'rejected')[] = ['pending', 'received', 'rejected'];
  const challans = [];

  for (let i = 0; i < 80; i++) {
    const vehicleType = vehicleTypes[Math.floor(seededRandom(i * 1) * vehicleTypes.length)];
    const violation = violationTypes[Math.floor(seededRandom(i * 2) * violationTypes.length)];
    const status = statuses[Math.floor(seededRandom(i * 3) * statuses.length)];
    
    const issueDate = new Date();
    issueDate.setDate(issueDate.getDate() - Math.floor(seededRandom(i * 4) * 60));
    issueDate.setHours(Math.floor(seededRandom(i * 5) * 24));
    issueDate.setMinutes(Math.floor(seededRandom(i * 6) * 60));

    const fineAmount = violation === 'Red Light Violation' ? 5000 
                      : violation === 'Over Speeding' ? 2000
                      : violation === 'Triple Riding' ? 1500
                      : 1000;

    const daysOverdue = status === 'pending' ? Math.floor(seededRandom(i * 7) * 30) : 0;
    const penaltyAmount = daysOverdue > 14 ? Math.floor(fineAmount * 0.5) : 0;

    const paymentDate = status === 'received' ? new Date(issueDate.getTime() + seededRandom(i * 8) * 20 * 24 * 60 * 60 * 1000) : null;

    challans.push({
      id: `CH-${String(i + 1).padStart(6, '0')}`,
      dateTime: issueDate.toISOString(),
      location: locations[Math.floor(seededRandom(i * 9) * locations.length)],
      licenseNo: `DL-${Math.floor(seededRandom(i * 10) * 90) + 10}-${String.fromCharCode(65 + Math.floor(seededRandom(i * 11) * 26))}${String.fromCharCode(65 + Math.floor(seededRandom(i * 12) * 26))}-${Math.floor(seededRandom(i * 13) * 9000) + 1000}`,
      vehicleType,
      violationType: violation,
      fineAmount,
      status,
      penaltyAmount,
      paymentDate: paymentDate?.toISOString(),
    });
  }

  return challans.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
};

export default function ChallanRecords() {
  const allChallans = useMemo(() => generateChallans(), []);
  const [selectedChallan, setSelectedChallan] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChallans = useMemo(() => {
    return allChallans.filter(challan => {
      // Apply status filter
      if (statusFilter !== 'all' && challan.status !== statusFilter) return false;

      // Apply search
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          challan.id.toLowerCase().includes(search) ||
          challan.licenseNo.toLowerCase().includes(search) ||
          challan.location.toLowerCase().includes(search) ||
          challan.vehicleType.toLowerCase().includes(search) ||
          challan.violationType.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [allChallans, statusFilter, searchTerm]);

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
    const pending = allChallans.filter(c => c.status === 'pending').length;
    const received = allChallans.filter(c => c.status === 'received').length;
    const rejected = allChallans.filter(c => c.status === 'rejected').length;
    const totalFines = allChallans.reduce((sum, c) => sum + c.fineAmount, 0);
    const collectedFines = allChallans.filter(c => c.status === 'received').reduce((sum, c) => sum + c.fineAmount + c.penaltyAmount, 0);

    return { pending, received, rejected, totalFines, collectedFines };
  }, [allChallans]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2 text-black dark:text-white">Challan Records</h1>
        <p className="text-gray-600 dark:text-gray-400">Traffic violation fines and payment tracking</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800">
          <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1 uppercase">Total Challans</h3>
          <p className="text-2xl font-bold text-black dark:text-white">{allChallans.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800">
          <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1 uppercase">Pending</h3>
          <p className="text-2xl font-bold text-black dark:text-white">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800">
          <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1 uppercase">Received</h3>
          <p className="text-2xl font-bold text-black dark:text-white">{stats.received}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800">
          <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1 uppercase">Total Fines</h3>
          <p className="text-2xl font-bold text-black dark:text-white">₹{stats.totalFines.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800">
          <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1 uppercase">Collected</h3>
          <p className="text-2xl font-bold text-black dark:text-white">₹{stats.collectedFines.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 font-medium transition-colors border ${
                statusFilter === 'all'
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                  : 'bg-white dark:bg-gray-900 text-black dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 font-medium transition-colors border ${
                statusFilter === 'pending'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white dark:bg-gray-900 text-black dark:text-white border-gray-300 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-950'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setStatusFilter('received')}
              className={`px-4 py-2 font-medium transition-colors border ${
                statusFilter === 'received'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white dark:bg-gray-900 text-black dark:text-white border-gray-300 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-950'
              }`}
            >
              Received ({stats.received})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 font-medium transition-colors border ${
                statusFilter === 'rejected'
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                  : 'bg-white dark:bg-gray-900 text-black dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Rejected ({stats.rejected})
            </button>
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
        Showing {filteredChallans.length} of {allChallans.length} challan records
      </div>

      {/* Challans List */}
      <div className="space-y-3">
        {filteredChallans.map((challan) => (
          <div
            key={challan.id}
            onClick={() => setSelectedChallan(challan)}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 cursor-pointer hover:border-black dark:hover:border-white transition-colors"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left Section */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm text-gray-500 dark:text-gray-400">{challan.id}</span>
                  <span className={`px-2 py-1 text-xs font-semibold border ${
                    challan.status === 'received'
                      ? 'bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-600 text-green-800 dark:text-green-200'
                      : challan.status === 'pending'
                      ? 'bg-red-100 dark:bg-red-900 border-red-500 dark:border-red-600 text-red-800 dark:text-red-200'
                      : 'bg-gray-200 dark:bg-gray-800 border-gray-500 dark:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}>
                    {challan.status === 'received' ? '✓ PAID' : challan.status === 'pending' ? '⚠ PENDING' : '✗ REJECTED'}
                  </span>
                </div>
                <h3 className="font-mono text-lg font-bold bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 px-2 py-1 inline-block mb-1">{challan.licenseNo}</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold mb-2">{challan.violationType}</p>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <FiMapPin size={14} />
                    <span>{challan.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiClock size={14} />
                    <span>{formatDateTime(challan.dateTime)}</span>
                  </div>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fine Amount</p>
                  <p className="text-2xl font-bold text-black dark:text-white">₹{challan.fineAmount.toLocaleString()}</p>
                  {challan.penaltyAmount > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">+₹{challan.penaltyAmount.toLocaleString()} penalty</p>
                  )}
                </div>
                {challan.status === 'received' ? (
                  <FiCheckCircle size={24} className="text-black dark:text-white" />
                ) : challan.status === 'pending' ? (
                  <FiAlertCircle size={24} className="text-gray-600 dark:text-gray-400" />
                ) : (
                  <FiXCircle size={24} className="text-gray-400" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredChallans.length === 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 text-center">
          <FiSearch size={64} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <h3 className="text-xl font-semibold text-black dark:text-white mb-2">No challans found</h3>
          <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or search term</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedChallan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedChallan(null)}>
          <div className="bg-white dark:bg-gray-900 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-5 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-black dark:text-white">Challan {selectedChallan.id}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedChallan.status === 'received' ? 'Payment Received' : selectedChallan.status === 'pending' ? 'Payment Pending' : 'Challan Rejected'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedChallan(null)} 
                className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white p-2"
              >
                <FiX size={28} />
              </button>
            </div>
            
            <div className="p-6">
              {/* Quick Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 border border-gray-300 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <FiDollarSign className="text-black dark:text-white" size={20} />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Fine Amount</p>
                      <p className="text-2xl font-bold text-black dark:text-white">₹{selectedChallan.fineAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {selectedChallan.penaltyAmount > 0 && (
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 border border-gray-300 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                      <FiAlertCircle className="text-black dark:text-white" size={20} />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Late Penalty</p>
                        <p className="text-2xl font-bold text-black dark:text-white">₹{selectedChallan.penaltyAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gray-100 dark:bg-gray-800 p-4 border border-gray-300 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <FiDollarSign className="text-black dark:text-white" size={20} />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Total Amount</p>
                      <p className="text-2xl font-bold text-black dark:text-white">
                        ₹{(selectedChallan.fineAmount + selectedChallan.penaltyAmount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              {selectedChallan.status === 'pending' && selectedChallan.penaltyAmount > 0 && (
                <div className="bg-red-50 dark:bg-red-950 border-l-4 border-red-600 p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <FiAlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-red-900 dark:text-red-200 mb-1">⚠ Overdue Payment - Late Penalty Applied!</p>
                      <p className="text-sm text-red-800 dark:text-red-300">
                        This challan is overdue. A penalty of ₹{selectedChallan.penaltyAmount.toLocaleString()} has been added.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedChallan.status === 'received' && (
                <div className="bg-green-50 dark:bg-green-950 border-l-4 border-green-600 p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <FiCheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-200 mb-1">✓ Payment Received</p>
                      <p className="text-sm text-green-800 dark:text-green-300">
                        Payment of ₹{(selectedChallan.fineAmount + selectedChallan.penaltyAmount).toLocaleString()} received on {formatDateTime(selectedChallan.paymentDate || '')}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-5 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase">Violation Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Violation Type</p>
                      <p className="text-base font-semibold text-black dark:text-white">{selectedChallan.violationType}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <FiMapPin className="text-gray-600 dark:text-gray-400 mt-1 flex-shrink-0" size={16} />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Location</p>
                        <p className="text-sm font-medium text-black dark:text-white">{selectedChallan.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FiClock className="text-gray-600 dark:text-gray-400 mt-1 flex-shrink-0" size={16} />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date & Time</p>
                        <p className="text-sm font-medium text-black dark:text-white">{formatDateTime(selectedChallan.dateTime)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-5 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase">Vehicle Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">License Number</p>
                      <p className="text-lg font-mono font-bold bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 px-3 py-1 inline-block">{selectedChallan.licenseNo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vehicle Type</p>
                      <p className="text-sm font-medium text-black dark:text-white">
                        <span className="inline-block px-3 py-1 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                          {selectedChallan.vehicleType}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence Section */}
              <div className="bg-gray-50 dark:bg-gray-800 p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase">Evidence & Documentation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-900 p-4 border border-gray-300 dark:border-gray-700 h-48 flex items-center justify-center">
                    <div className="text-center">
                      <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-300 dark:border-gray-700">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Vehicle Image</p>
                      <p className="text-xs text-gray-400">Not available</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-4 border border-gray-300 dark:border-gray-700 h-48 flex items-center justify-center">
                    <div className="text-center">
                      <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-300 dark:border-gray-700">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">License Plate</p>
                      <p className="text-xs text-gray-400">Not available</p>
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

