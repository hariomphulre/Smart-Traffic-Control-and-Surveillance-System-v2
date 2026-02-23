'use client'

import { useState, useEffect } from 'react';
import { FiX, FiSearch, FiMapPin, FiClock, FiAlertCircle, FiCheckCircle, FiXCircle, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { getChallans, getChallanStats, type Challan, type ChallanStats } from '@/lib/api';

export default function ChallanRecords() {
  const [allChallans, setAllChallans] = useState<Challan[]>([]);
  const [filteredChallans, setFilteredChallans] = useState<Challan[]>([]);
  const [stats, setStats] = useState<ChallanStats>({
    pending: 0,
    received: 0,
    rejected: 0,
    totalFines: 0,
    collectedFines: 0,
  });
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
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

        if (statusFilter !== 'all') params.status = statusFilter;
        if (searchTerm) params.search = searchTerm;

        const [challansResponse, statsResponse] = await Promise.all([
          getChallans(params),
          getChallanStats(),
        ]);

        setAllChallans(challansResponse.data || []);
        setStats(statsResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch challans');
        console.error('Error fetching challans:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, statusFilter, searchTerm]);

  useEffect(() => {
    // Client-side filtering for search (if backend doesn't handle it)
    if (searchTerm && statusFilter === 'all') {
      const search = searchTerm.toLowerCase();
      const filtered = allChallans.filter(challan =>
        challan.id.toLowerCase().includes(search) ||
        challan.licenseNo.toLowerCase().includes(search) ||
        challan.location.toLowerCase().includes(search) ||
        challan.vehicleType.toLowerCase().includes(search) ||
        challan.violationType.toLowerCase().includes(search)
      );
      setFilteredChallans(filtered);
    } else {
      setFilteredChallans(allChallans);
    }
  }, [allChallans, searchTerm, statusFilter]);

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
          <h1 className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed] mb-2">Challan Records</h1>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">Traffic violation challans and payment tracking</p>
        </div>
        <div className="gcloud-card p-8 text-center">
          <p className="text-[#5f6368] dark:text-[#9aa0a6]">Loading challans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed] mb-2">Challan Records</h1>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">Traffic violation challans and payment tracking</p>
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
        <h1 className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed] mb-2">Challan Records</h1>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">Traffic violation challans and payment tracking</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="gcloud-card p-4">
          <h3 className="text-[#5f6368] dark:text-[#9aa0a6] text-xs font-medium mb-1 uppercase">Total Challans</h3>
          <p className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed]">{stats.pending + stats.received + stats.rejected}</p>
        </div>
        <div className="gcloud-card p-4">
          <h3 className="text-[#5f6368] dark:text-[#9aa0a6] text-xs font-medium mb-1 uppercase">Pending</h3>
          <p className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed]">{stats.pending}</p>
        </div>
        <div className="gcloud-card p-4">
          <h3 className="text-[#5f6368] dark:text-[#9aa0a6] text-xs font-medium mb-1 uppercase">Received</h3>
          <p className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed]">{stats.received}</p>
        </div>
        <div className="gcloud-card p-4">
          <h3 className="text-[#5f6368] dark:text-[#9aa0a6] text-xs font-medium mb-1 uppercase">Total Fines</h3>
          <p className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed]">₹{stats.totalFines.toLocaleString()}</p>
        </div>
        <div className="gcloud-card p-4">
          <h3 className="text-[#5f6368] dark:text-[#9aa0a6] text-xs font-medium mb-1 uppercase">Collected</h3>
          <p className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed]">₹{stats.collectedFines.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="gcloud-card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors rounded ${
                statusFilter === 'all'
                  ? 'bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124]'
                  : 'bg-[#f1f3f4] dark:bg-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#4d4e52]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 text-sm font-medium transition-colors rounded ${
                statusFilter === 'pending'
                  ? 'bg-[#fbbc04] dark:bg-[#fdd663] text-[#202124]'
                  : 'bg-[#f1f3f4] dark:bg-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#fef7e0] dark:hover:bg-[#5f5317]'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setStatusFilter('received')}
              className={`px-4 py-2 text-sm font-medium transition-colors rounded ${
                statusFilter === 'received'
                  ? 'bg-[#34a853] dark:bg-[#81c995] text-white dark:text-[#202124]'
                  : 'bg-[#f1f3f4] dark:bg-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e6f4ea] dark:hover:bg-[#1e4620]'
              }`}
            >
              Received ({stats.received})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 text-sm font-medium transition-colors rounded ${
                statusFilter === 'rejected'
                  ? 'bg-[#5f6368] dark:bg-[#9aa0a6] text-white dark:text-[#202124]'
                  : 'bg-[#f1f3f4] dark:bg-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#4d4e52]'
              }`}
            >
              Rejected ({stats.rejected})
            </button>
          </div>
          <div className="relative w-full md:w-64">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6]" />
            <input
              type="text"
              placeholder="Search ID, License, Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#292a2d] text-[#202124] dark:text-[#e8eaed] rounded focus:ring-2 focus:ring-[#1a73e8] dark:focus:ring-[#8ab4f8] focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-[#5f6368] dark:text-[#9aa0a6]">
        Showing {filteredChallans.length} of {allChallans.length} challan records
      </div>

      {/* Challans List */}
      <div className="space-y-3">
        {filteredChallans.map((challan) => (
          <div
            key={challan.id}
            onClick={() => setSelectedChallan(challan)}
            className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] p-4 cursor-pointer hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] transition-colors"
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
        <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] p-12 text-center">
          <FiSearch size={64} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <h3 className="text-xl font-semibold text-black dark:text-white mb-2">No challans found</h3>
          <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or search term</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedChallan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedChallan(null)}>
          <div className="bg-white dark:bg-[#292a2d] shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-[#292a2d] border-b border-[#dadce0] dark:border-[#3c4043] px-6 py-5 flex justify-between items-center">
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
                <div className="bg-[#f8f9fa] dark:bg-[#35363a] p-4 border border-[#dadce0] dark:border-[#3c4043]">
                  <div className="flex items-center gap-3 mb-2">
                    <FiDollarSign className="text-black dark:text-white" size={20} />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Fine Amount</p>
                      <p className="text-2xl font-bold text-black dark:text-white">₹{selectedChallan.fineAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {selectedChallan.penaltyAmount > 0 && (
                  <div className="bg-[#f8f9fa] dark:bg-[#35363a] p-4 border border-[#dadce0] dark:border-[#3c4043]">
                    <div className="flex items-center gap-3 mb-2">
                      <FiAlertCircle className="text-black dark:text-white" size={20} />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Late Penalty</p>
                        <p className="text-2xl font-bold text-black dark:text-white">₹{selectedChallan.penaltyAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-[#f8f9fa] dark:bg-[#35363a] p-4 border border-[#dadce0] dark:border-[#3c4043]">
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
                <div className="bg-[#f8f9fa] dark:bg-[#35363a] p-5 border border-[#dadce0] dark:border-[#3c4043]">
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

                <div className="bg-[#f8f9fa] dark:bg-[#35363a] p-5 border border-[#dadce0] dark:border-[#3c4043]">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase">Vehicle Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">License Number</p>
                      <p className="text-lg font-mono font-bold bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 px-3 py-1 inline-block">{selectedChallan.licenseNo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vehicle Type</p>
                      <p className="text-sm font-medium text-black dark:text-white">
                        <span className="inline-block px-3 py-1 bg-[#e8eaed] dark:bg-[#3c4043] border border-[#dadce0] dark:border-[#3c4043]">
                          {selectedChallan.vehicleType}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence Section */}
              <div className="bg-[#f8f9fa] dark:bg-[#35363a] p-5 border border-[#dadce0] dark:border-[#3c4043]">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase">Evidence & Documentation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-[#292a2d] p-4 border border-[#dadce0] dark:border-[#3c4043] h-48 flex items-center justify-center">
                    <div className="text-center">
                      <div className="bg-[#e8eaed] dark:bg-[#3c4043] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-[#dadce0] dark:border-[#3c4043]">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Vehicle Image</p>
                      <p className="text-xs text-gray-400">Not available</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#292a2d] p-4 border border-[#dadce0] dark:border-[#3c4043] h-48 flex items-center justify-center">
                    <div className="text-center">
                      <div className="bg-[#e8eaed] dark:bg-[#3c4043] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-[#dadce0] dark:border-[#3c4043]">
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

