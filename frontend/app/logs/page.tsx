'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { FiFilter, FiX, FiSearch, FiPlus, FiList, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getLogs, type Log } from '@/lib/api';
import LocationBar from '@/components/LocationBar';
import { useLocationFilter } from '@/context/LocationFilterContext';
import { MAP_SIGNALS } from '@/map/MapData';
import { ChartDurationPicker } from '@/components/analytics/ChartDurationPicker';
import { CustomDurationModal } from '@/components/analytics/CustomDurationModal';
import { VehicleTypeFilter } from '@/components/logs/VehicleTypeFilter';
import { useDurationFilter } from '@/hooks/useDurationFilter';
import type { LogVehicleTypeFilter } from '@/lib/logFilters';

const DynamicMap = dynamic(() => import('@/components/RealMap'), { 
  ssr: false, 
  loading: () => <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-[#8AB4F8] font-mono animate-pulse">Initializing Satellite Uplink...</div> 
});
import { IoMdRefresh } from 'react-icons/io';
import { IoWarningSharp } from 'react-icons/io5';
import { FaCheckCircle } from 'react-icons/fa';
import { FaCircleXmark } from 'react-icons/fa6';

// Define the structure for saved lists
interface SavedList {
  id: string;
  name: string;
  logs: Log[];
}

export default function Logs() {
  const { isMapOpen, setIsMapOpen, pathSegments, handleMapPinClick } = useLocationFilter();
  const [allLogs, setAllLogs] = useState<Log[]>([]);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [filters, setFilters] = useState({
    speeding: false,
    helmetless: false,
    redLight: false,
    tripling: false,
  });
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] =
    useState<LogVehicleTypeFilter>('All');
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [sectionRefreshing, setSectionRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const hasInitiallyLoaded = useRef(false);
  const PAGE_SIZE = 50;

  // --- UNIFIED LIST MANAGEMENT STATES ---
  const [isListMode, setIsListMode] = useState(false); // Controls if the checkbox table UI is active
  const [editingListId, setEditingListId] = useState<string | null>(null); // Tracks if we are editing vs creating
  const [selectedLogsForList, setSelectedLogsForList] = useState<Log[]>([]);
  const [listNameInput, setListNameInput] = useState('');
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [isViewListsOpen, setIsViewListsOpen] = useState(false);
  const [viewingList, setViewingList] = useState<SavedList | null>(null);
  // --------------------------------------

  const {
    selectedDuration,
    dateRange,
    isDefaultDuration,
    handleDurationSelect,
    isCustomModalOpen,
    customStart,
    customEnd,
    setCustomStart,
    setCustomEnd,
    handleCustomApply,
    closeCustomModal,
    resetDuration,
  } = useDurationFilter('all time');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [
    filters.speeding,
    filters.helmetless,
    filters.redLight,
    filters.tripling,
    debouncedSearch,
    vehicleTypeFilter,
    selectedDuration,
    dateRange.from,
    dateRange.to,
  ]);

  const fetchLogs = useCallback(
    async (loadMode: 'initial' | 'table' | 'section') => {
      if (loadMode === 'section') {
        setSectionRefreshing(true);
      } else if (loadMode === 'table') {
        setTableLoading(true);
      }

      try {
        setError(null);
        const params: Record<string, unknown> = {
          page,
          limit: PAGE_SIZE,
        };

        if (filters.speeding) params.speeding = true;
        if (filters.helmetless) params.helmetless = true;
        if (filters.redLight) params.redLight = true;
        if (filters.tripling) params.tripling = true;
        if (debouncedSearch) params.search = debouncedSearch;
        if (vehicleTypeFilter !== 'All') params.vehicleType = vehicleTypeFilter;
        if (dateRange.from) params.from = dateRange.from;
        if (dateRange.to) params.to = dateRange.to;

        const response = await getLogs(params);
        setAllLogs(response.data || []);
        setTotal(response.total || 0);
        hasInitiallyLoaded.current = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch logs');
        console.error('Error fetching logs:', err);
      } finally {
        setInitialLoading(false);
        setTableLoading(false);
        setSectionRefreshing(false);
      }
    },
    [
      page,
      filters.speeding,
      filters.helmetless,
      filters.redLight,
      filters.tripling,
      debouncedSearch,
      vehicleTypeFilter,
      dateRange.from,
      dateRange.to,
    ],
  );

  useEffect(() => {
    const loadMode = hasInitiallyLoaded.current ? 'table' : 'initial';
    fetchLogs(loadMode);
  }, [fetchLogs]);

  const handleRefresh = () => {
    fetchLogs('section');
  };

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

  // --- REVISED LIST MANAGEMENT HANDLERS ---
  const handleToggleLogSelection = (log: Log) => {
    setSelectedLogsForList(prev => {
      const exists = prev.find(l => l.id === log.id);
      if (exists) return prev.filter(l => l.id !== log.id);
      return [...prev, log];
    });
  };

  const startCreatingList = () => {
    setIsListMode(true);
    setEditingListId(null);
    setSelectedLogsForList([]);
    setListNameInput('');
    setIsViewListsOpen(false); 
  };

  const startEditingList = (list: SavedList) => {
    setIsListMode(true);
    setEditingListId(list.id);
    setSelectedLogsForList([...list.logs]);
    setListNameInput(list.name);
    setIsViewListsOpen(false);
  };

  const cancelListMode = () => {
    setIsListMode(false);
    setEditingListId(null);
    setSelectedLogsForList([]);
    setListNameInput('');
  };

  const saveList = () => {
    if (!listNameInput.trim() || selectedLogsForList.length === 0) return;
    
    if (editingListId) {
      // Update existing list
      setSavedLists(prev => prev.map(list => 
        list.id === editingListId 
          ? { ...list, name: listNameInput.trim(), logs: [...selectedLogsForList] } 
          : list
      ));
    } else {
      // Create new list
      const newList: SavedList = {
        id: Date.now().toString(),
        name: listNameInput.trim(),
        logs: [...selectedLogsForList],
      };
      setSavedLists(prev => [...prev, newList]);
    }
    cancelListMode();
  };

  const handleDeleteList = (id: string) => {
    setSavedLists(prev => prev.filter(list => list.id !== id));
  };
  // --------------------------------

  const violationFilterCount = Object.values(filters).filter(Boolean).length;
  const intervalFilterCount = isDefaultDuration ? 0 : 1;
  const vehicleTypeFilterCount = vehicleTypeFilter !== 'All' ? 1 : 0;
  const activeFilterCount =
    violationFilterCount + intervalFilterCount + vehicleTypeFilterCount;

  const clearAllFilters = () => {
    setFilters({
      speeding: false,
      helmetless: false,
      redLight: false,
      tripling: false,
    });
    setVehicleTypeFilter('All');
    resetDuration();
    setPage(1);
  };

  const sectionBusy = initialLoading || sectionRefreshing;

  return (
    <div className="max-w-full dark:bg-[#131314]">
      <CustomDurationModal
        isOpen={isCustomModalOpen}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
        onClose={closeCustomModal}
        onApply={handleCustomApply}
      />

      {/* Added relative and z-[60] here to fix dropdown overlap issues */}
      <div className="w-full flex items-center justify-between h-13 mb-0 border-b border-[#3c4043] bg-[#131314] p-1 shadow-xl relative z-[60]">
        <div className="flex items-center min-w-170 flex-1">
          <div>
            <p className="text-[#ffffff] font-mono text-xl ml-4">System Logs</p>
          </div>
          
          <div className="flex items-center gap-1 ml-0 pl-4">
            <div 
              onClick={startCreatingList}
              className={`group flex items-center gap-1 px-3 justify-center rounded-sm transition-all cursor-pointer ${isListMode && !editingListId ? 'bg-[#202124]' : 'hover:bg-[#202124]'}`}
            >
              <FiPlus className="h-4 w-4 text-[#669DF6] group-hover:text-[#AECBFA]" />
                  <button className="py-1 font-medium transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg">
                Create list
              </button>
            </div>

            <div className="relative">
              <div 
                onClick={() => setIsViewListsOpen(!isViewListsOpen)}
                className={`group flex items-center gap-1 px-3 justify-center rounded-sm transition-all cursor-pointer ${isViewListsOpen ? 'bg-[#202124]' : 'hover:bg-[#202124]'}`}
              >
                <FiList className="h-4 w-4 text-[#669DF6] group-hover:text-[#AECBFA]" />
                <button className="py-1 font-medium transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg">
                  View lists
                </button>
              </div>

              {/* View Lists Dropdown Menu */}
              {isViewListsOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-[#1e1e1e] border border-[#3c4043] rounded-md shadow-2xl z-[100] overflow-hidden">
                  <div className="px-4 py-2 bg-[#292a2d] border-b border-[#3c4043] font-medium text-[#e8eaed] text-sm">
                    Saved Lists
                  </div>
                  {savedLists.length === 0 ? (
                    <div className="p-4 text-sm text-[#9aa0a6] text-center">No lists created yet.</div>
                  ) : (
                    <ul className="max-h-60 overflow-y-auto py-1">
                      {savedLists.map(list => (
                        <li key={list.id} className="flex px-4 py-2 hover:bg-[#303134] flex items-center justify-between group border-b border-[#3c4043]/40 last:border-0 transition-colors">
                          <div className="flex gap-2 items-center overflow-hidden mr-2">
                            <p className="text-sm text-[#e8eaed] truncate max-w-[140px]" title={list.name}>{list.name}</p>
                            <p className="text-xs text-[#9aa0a6]">{list.logs.length} item(s)</p>
                          </div>
                          <div className="flex items-center gap-3 text-[#9aa0a6] transition-opacity">
                            <FiEye className="hover:text-[#8AB4F8] cursor-pointer" onClick={() => { setViewingList(list); setIsViewListsOpen(false); }} title="View list"/>
                            <FiEdit2 className="hover:text-[#8AB4F8] cursor-pointer" onClick={() => startEditingList(list)} title="Edit list" />
                            <FiTrash2 className="hover:text-red-400 cursor-pointer" onClick={() => handleDeleteList(list.id)} title="Delete list" />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="group flex items-center gap-1 px-2 mr-3 justify-center hover:bg-[#202124] rounded-sm transition-all"
          onClick={handleRefresh}
        >
          <IoMdRefresh
            className={`h-5 w-5 text-[#669DF6] group-hover:text-[#AECBFA] ${
              sectionRefreshing ? 'animate-spin' : ''
            }`}
          />
          <button
            type="button"
            disabled={sectionRefreshing}
            className="py-1 font-medium transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {/* <div className="w-full relative font-sans z-0">
        <LocationBar />
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
      </div> */}
      {/* 1. MAP MODAL: Moved outside of the z-0 wrapper so it can float above all navbars */}
      {isMapOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
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

      {/* 2. LOCATION BAR: Left in its original wrapper */}
      <div className="w-full relative font-sans z-[55]">
        <LocationBar />
      </div>

      <div className="py-5 px-4 dark:bg-[#131314] relative min-h-[320px]">
        {sectionBusy && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#131314]/90 backdrop-blur-[1px]">
            <div className="w-10 h-10 border-4 border-[#3c4043] border-t-[#8AB4F8] rounded-full animate-spin mb-3" />
            <p className="text-[#9aa0a6] font-mono text-sm">
              {initialLoading ? 'Loading logs...' : 'Refreshing logs...'}
            </p>
          </div>
        )}

        {error && !sectionBusy && (
          <div className="mb-4 px-4 py-3 rounded-md border border-[#d93025]/40 bg-[#d93025]/10 text-[#f28b82] text-sm">
            {error}
          </div>
        )}

        <div className="gcloud-card mb-4 p-0 !border-0 !bg-[#131314] !dark:bg-[#131314]">
          <div className="flex flex-col !bg-[#131314] md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <ChartDurationPicker
                variant="logs"
                isActive={!isDefaultDuration}
                selectedDuration={selectedDuration}
                onSelect={handleDurationSelect}
              />

              <VehicleTypeFilter
                selected={vehicleTypeFilter}
                onSelect={setVehicleTypeFilter}
              />

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
                  onClick={clearAllFilters}
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
                placeholder="Search ID, License No., Location, Vehicle Type..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 outline-none text-sm bg-transparent text-[#e8eaed]"
              />
            </div>
          </div>
        </div>

        <div className="mb-4 text-sm text-[#5f6368] dark:text-[#9aa0a6]">
          Showing {allLogs.length} of {total} logs
        </div>

        {/* --- DYNAMIC CREATION / EDIT BAR --- */}
        {isListMode && (
          <div className="mb-4 py-2 px-2.5 w-full border border-[#3c4043] rounded-md flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-4 w-full md:w-auto flex-1">
              <input 
                type="text" 
                placeholder="Enter list name..." 
                value={listNameInput}
                onChange={(e) => setListNameInput(e.target.value)}
                className="w-full max-w-sm px-3 py-1.5 bg-[#131314] border border-[#3c4043] focus:border-[#8AB4F8] text-[#e8eaed] text-sm rounded outline-none transition-colors"
              />
              <span className="text-[#8AB4F8] text-sm font-medium whitespace-nowrap bg-[#131314] px-2 py-1 rounded">
                {selectedLogsForList.length} Selected
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={cancelListMode}
                className="px-4 py-1.5 text-sm font-medium text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043] rounded transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveList}
                disabled={!listNameInput.trim() || selectedLogsForList.length === 0}
                className="px-4 py-1.5 text-sm font-medium bg-[#8AB4F8] text-[#202124] rounded hover:bg-[#669DF6] transition-colors disabled:bg-[#e8eaed61] disabled:cursor-not-allowed"
              >
                {editingListId ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        )}

        <div className="gcloud-card overflow-hidden relative">
          {tableLoading && !sectionBusy && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#131314]/75 backdrop-blur-[1px]">
              <div className="w-8 h-8 border-4 border-[#3c4043] border-t-[#8AB4F8] rounded-full animate-spin" />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full gcloud-table">
              <thead className="bg-[#f8f9fa] dark:bg-[#292A2D] border-b border-[#dadce0] dark:border-[#5f6368]">
                <tr>
                  {isListMode && (
                    <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed] w-12">Select</th>
                  )}
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
                {!tableLoading && allLogs.length === 0 && !sectionBusy && (
                  <tr>
                    <td
                      colSpan={isListMode ? 10 : 9}
                      className="px-4 py-10 text-center text-sm text-[#9aa0a6]"
                    >
                      No logs found matching your filters.
                    </td>
                  </tr>
                )}
                {allLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => {
                      if (isListMode) {
                        handleToggleLogSelection(log);
                      } else {
                        setSelectedLog(log);
                      }
                    }}
                    className={`hover:bg-[#f8f9fa] dark:hover:bg-[#2A2B2E] cursor-pointer transition-colors ${
                      isListMode && selectedLogsForList.find(l => l.id === log.id) ? 'bg-[#8AB4F8]/10 dark:bg-[#8AB4F8]/10' : 'dark:bg-[#131314]'
                    }`}
                  >
                    {isListMode && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={!!selectedLogsForList.find(l => l.id === log.id)}
                          onChange={() => handleToggleLogSelection(log)}
                          className="w-4 h-4 rounded border-[#5f6368] bg-[#131314] text-[#8AB4F8] focus:ring-[#8AB4F8] cursor-pointer"
                        />
                      </td>
                    )}
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

        {/* --- VIEW SAVED LIST MODAL --- */}
        {viewingList && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setViewingList(null)}>
            <div className="bg-[#131314] border border-[#3c4043] shadow-2xl rounded-lg max-w-5xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="bg-[#292a2d] border-b border-[#3c4043] px-6 py-4 flex justify-between items-center rounded-t-lg shrink-0">
                <h2 className="text-xl font-medium text-[#e8eaed] flex items-center gap-2">
                  <FiList className="text-[#8AB4F8]" />
                  {viewingList.name} 
                  <span className="text-sm text-[#9aa0a6] font-normal ml-2 bg-[#131314] px-2 py-0.5 rounded">{viewingList.logs.length} entries</span>
                </h2>
                <button onClick={() => setViewingList(null)} className="text-[#9aa0a6] hover:text-[#e8eaed] transition-colors bg-[#1e1e1e] hover:bg-[#3c4043] p-1.5 rounded-md">
                  <FiX size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <table className="w-full gcloud-table rounded overflow-hidden">
                   <thead className="bg-[#292A2D] border-b border-[#5f6368] sticky top-0 shadow-sm">
                     <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-[#e8eaed]">Date & Time</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-[#e8eaed]">ID</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-[#e8eaed]">Location</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-[#e8eaed]">License No.</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-[#e8eaed]">Vehicle Type</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-[#e8eaed]">Speed</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-[#e8eaed]">Helmet</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-[#e8eaed]">Red Light</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-[#e8eaed]">Tripling</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[#3c4043]">
                     {viewingList.logs.map(log => (
                       <tr key={log.id} className="hover:bg-[#2A2B2E] transition-colors">
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
            </div>
          </div>
        )}
        {/* ----------------------------- */}

        {/* Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
            <div className="bg-white dark:bg-[#292a2d] shadow-2xl rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-[#292a2d] border-b border-[#dadce0] dark:border-[#3c4043] px-6 py-4 flex justify-between items-center rounded-t-lg">
                <h2 className="text-xl font-medium text-[#202124] dark:text-[#e8eaed]">Vehicle Details - {selectedLog.id}</h2>
                <button onClick={() => setSelectedLog(null)} className="text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed] transition-colors">
                  <FiX size={24 } />
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