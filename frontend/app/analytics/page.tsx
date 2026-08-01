'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';
import dynamic from 'next/dynamic';
import {
  getViolations,
  getVehicleTypes,
  getHourlyTraffic,
  getSpeedDistribution,
  getStats,
  type Violation,
  type VehicleType,
  type HourlyTraffic,
  type SpeedDistribution,
  type AnalyticsStats,
} from '@/lib/api';
import { FaCaretDown, FaSearch } from 'react-icons/fa';
import { ChartDurationPicker } from '@/components/analytics/ChartDurationPicker';
import { CustomDurationModal } from '@/components/analytics/CustomDurationModal';
import {
  ANALYTICS_CHART_IDS,
  useChartDurations,
} from '@/components/analytics/useChartDurations';
import {
  getSpeedRangeColor,
  sortSpeedDistribution,
  totalSpeedDistributionCount,
} from '@/lib/speedDistribution';
import { IoSearchSharp } from 'react-icons/io5';
import { MdArrowDropDown, MdOutlineEmergency } from 'react-icons/md';
import { IoMdRefresh } from 'react-icons/io';
import { MAP_SIGNALS } from '@/map/MapData';
import LocationBar from '@/components/LocationBar';
import { useLocationFilter } from '@/context/LocationFilterContext';
import { 
  MdDirectionsCar, 
  MdAccessTime, 
  MdOutlineQueue, 
  MdOutlineInsights, 
  MdTrendingUp, 
  MdTrendingDown,
  MdWarningAmber,
} from 'react-icons/md';
import { FaAmbulance } from 'react-icons/fa';
import TrafficVol from '@/components/analytics/charts/TrafficVol';
import Violations from '@/components/analytics/charts/Violations';
import AnalyticsPieChartPanel from '@/components/analytics/AnalyticsPieChartPanel';
import SquareLocationMap from '@/components/analytics/SquareLocationMap';
import StateAnalytics from '@/components/analytics/dashboards/StateAnalytics';
import { useSquareLocation } from '@/hooks/useSquareLocation';
import { formatWayList, wayWaitMultiplier, wayQueueMultiplier, getAnalyticsWays } from '@/map/squareLocations';
import { buildAnalyticsTrafficData } from '@/lib/analyticsTrafficData';
import { toPng } from "html-to-image";
import CityAnalytics from '@/components/analytics/dashboards/CityAnalytics';
import NationalAnalytics from '@/components/analytics/dashboards/NationalAnalytics';
// Generate high-resolution mock data (every 15 seconds)
const generateDenseData = () => {
  const data = [];
  const startTime = new Date();
  startTime.setHours(13, 45, 0, 0);

  for (let i = 0; i <= 2700; i += 15) { 
    const timeLabel = startTime.toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit", 
      second: "2-digit" 
    });

    let p50 = 40 + Math.random() * 20;
    let vehicles = 70 + Math.random() * 30;
    let p95 = 90 + Math.random() * 30;
    let p99 = 110 + Math.random() * 40;

    if (i > 1750 && i < 2000) {
      const spikeMultiplier = Math.random() * 10 + 2;
      p50 *= (spikeMultiplier * 0.5);
      vehicles *= (spikeMultiplier * 0.8);
      p95 *= spikeMultiplier;
      p99 *= (spikeMultiplier * 1.2);
    }

    data.push({ time: timeLabel, p50, vehicles, p95, p99 });
    startTime.setSeconds(startTime.getSeconds() + 15);
  }
  return data;
};

const formatYAxis = (tickItem: number) => {
  if (tickItem === 0) return "0";
  return `${Math.round(tickItem)}`;
};

const formatXAxis = (tickItem: string) => tickItem.replace(/:\d{2}\s/, ' ');

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a202c] border border-[#2d3748] rounded shadow-lg p-3 min-w-[120px]">
        <p className="text-gray-100 font-medium mb-2 text-sm">{label}</p>
        {[...payload].reverse().map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {formatYAxis(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Dynamically import map to avoid SSR issues
const TrafficHeatMap = dynamic(
  () => import('@/components/TrafficHeatMap'),
  { ssr: false }
);

// Professional color palette for charts - Google Cloud style
const CHART_COLORS = {
  primary: '#1a73e8',
  success: '#34a853',
  warning: '#fbbc04',
  danger: '#ea4335',
  gray: '#5f6368',
};

const VIOLATION_COLORS = ['#ea4335', '#fbbc04', '#34a853', '#1a73e8'];
const VEHICLE_COLORS = ['#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#8ab4f8'];

const EMERGENCY_METRICS = [
  { key: 'p50', label: 'Fire Brigade', color: '#2b6cb0' },
  { key: 'p95', label: 'Ambulance', color: '#ed6363' },
];
const INCIDENTS_METRICS = [
  { key: 'p50', label: 'Fire', color: '#2b6cb0' },
  { key: 'p95', label: 'Accident', color: '#ed6363' },
];

const DynamicMap = dynamic(() => import('@/components/RealMap'), { 
  ssr: false, 
  loading: () => <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-[#8AB4F8] font-mono animate-pulse">Initializing Satellite Uplink...</div> 
});

// Tooltip for the Peak Traffic Donut Chart
const PeakTrafficTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Hide tooltip if hovering over the empty future track
    if (data.isFuture) return null; 

    return (
      <div className="bg-[#1e1e1e] ml-20 border border-gray-700 p-3 rounded shadow-xl text-xs font-mono z-50">
        <p className="mb-2 text-sm font-bold border-b border-gray-700 pb-1" style={{ color: data.fill }}>
          {data.name} Traffic
        </p>
        <div className="flex flex-col gap-1 w-40 text-[13px]">
          <p className="text-gray-400">Avg. Traffic: <span className="text-[#e8eaed]">{data.avgVolume}</span></p>
          <p className="text-gray-400">Duration: <span className="text-[#e8eaed]">{data.duration}</span></p>
          <p className="text-gray-400">Timing: <span className="text-[#e8eaed]">{data.timing}</span></p>
        </div>
      </div>
    );
  }
  return null;
};

// Tooltip for the Growth Rate Sparkline
const SparklineTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e1e1e] border border-gray-700 px-2 py-1 rounded shadow-lg text-[10px] font-mono z-50">
        <span className="text-gray-400 mr-2">{payload[0].payload.day}:</span>
        <span className="text-white font-bold">{payload[0].value}%</span>
      </div>
    );
  }
  return null;
};

// Custom animated hover shape for the Peak Traffic Donut Chart
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 2}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={1}
        style={{
          transition: 'all 0.3s ease-in-out',
          outline: 'none',
        }}
      />
    </g>
  );
};

export default function Analytics() {
  const {
    getDuration,
    handleDurationSelect,
    isCustomModalOpen,
    customStart,
    customEnd,
    setCustomStart,
    setCustomEnd,
    handleCustomApply,
    closeCustomModal,
  } = useChartDurations();

  useEffect(() => {
    handleDurationSelect(('headlineData' as any), 'Today');
  }, [handleDurationSelect]);

  const [chartDataSeed, setChartDataSeed] = useState(0);
  const data = useMemo(() => generateDenseData(), [chartDataSeed]);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasInitiallyLoaded = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [peakActiveIndex, setPeakActiveIndex] = useState<number>(-1);

  // Sync fullscreen state if user exits via ESC key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === cardRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // 1. Fullscreen Toggle Handler
  const toggleFullscreen = async () => {
    if (!cardRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await cardRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error swapping fullscreen mode:", error);
    }
  };

  // 2. Export Data as CSV Handler
  const exportCSV = () => {
    const headers = ["Timestamp", "p50_ms", "vehicles_ms", "p95_ms", "p99_ms"];
    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        [row.time, Math.round(row.p50), Math.round(row.vehicles), Math.round(row.p95), Math.round(row.p99)].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "span_update_catalog_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Save Component Layout as Image Handler
  const saveAsImage = async () => {
    if (!cardRef.current) return;

    try {
      const actionsArea = cardRef.current.querySelector(".chart-actions");
      if (actionsArea) actionsArea.classList.add("invisible");

      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      
      if (actionsArea) actionsArea.classList.remove("invisible");

      const link = document.createElement("a");
      link.download = "span_update_catalog_graph.png";
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to generate graph snapshot:", error);
    }
  };

  const { isMapOpen, setIsMapOpen, pathSegments, handleMapPinClick, isLocked } = useLocationFilter();
  const { square, analyticsWays, loading: squareLoading, error: squareError, updateSquare, applySavedCoordinates, mapSignals } = useSquareLocation();

  const [violationsData, setViolationsData] = useState<Violation[]>([]);
  const [vehicleTypeData, setVehicleTypeData] = useState<VehicleType[]>([]);
  const [hourlyTraffic, setHourlyTraffic] = useState<HourlyTraffic[]>([]);
  const [speedDistribution, setSpeedDistribution] = useState<SpeedDistribution[]>([]);
  const [stats, setStats] = useState<AnalyticsStats>({
    totalVehicles: 0,
    totalViolations: 0,
    helmetless: 0,
    tripling: 0,
    redLightCross: 0,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [sectionRefreshing, setSectionRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [contentRefreshKey, setContentRefreshKey] = useState(0);

  const fetchAnalytics = useCallback(async (loadMode: 'initial' | 'section') => {
    if (loadMode === 'section') {
      setSectionRefreshing(true);
    }

    setError(null);
    setUsingDemoData(false);

    const results = await Promise.allSettled([
      getStats(),
      getViolations(),
      getVehicleTypes(),
      getHourlyTraffic(),
      getSpeedDistribution(),
    ]);

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length === results.length) {
      const reason = failed[0].status === 'rejected' ? failed[0].reason : null;
      setError(
        reason instanceof Error ? reason.message : 'Failed to fetch analytics',
      );
      setInitialLoading(false);
      setSectionRefreshing(false);
      return;
    }

    if (results[0].status === 'fulfilled') setStats(results[0].value);
    if (results[1].status === 'fulfilled') setViolationsData(results[1].value);
    if (results[2].status === 'fulfilled') setVehicleTypeData(results[2].value);
    if (results[3].status === 'fulfilled') setHourlyTraffic(results[3].value);
    if (results[4].status === 'fulfilled') setSpeedDistribution(results[4].value);

    if (failed.length > 0) {
      setUsingDemoData(true);
    }

    hasInitiallyLoaded.current = true;
    setInitialLoading(false);
    setSectionRefreshing(false);

    if (loadMode === 'section') {
      setChartDataSeed((seed) => seed + 1);
      setContentRefreshKey((key) => key + 1);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics('initial');
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    fetchAnalytics('section');
  };

  const totalVehicles = stats.totalVehicles || vehicleTypeData.reduce((sum, item) => sum + item.count, 0);
  const totalViolations = stats.totalViolations || violationsData.reduce((sum, item) => sum + item.count, 0);

  const speedDistributionChartData = useMemo(
    () => sortSpeedDistribution(speedDistribution),
    [speedDistribution],
  );
  const speedDistributionTotal = useMemo(
    () => totalSpeedDistributionCount(speedDistributionChartData),
    [speedDistributionChartData],
  );

  // --- DYNAMIC HEADLINE DATA LOGIC ---
  const totalVehiclesCount = totalVehicles || 0;

  const analyticsTrafficData = useMemo(
    () =>
      buildAnalyticsTrafficData(getAnalyticsWays(square), {
        seed: chartDataSeed,
        locationKey: `${pathSegments.join('/')}:${square?.signalId ?? 'pending'}`,
      }),
    [square, pathSegments, chartDataSeed],
  );

  const trafficWays = analyticsTrafficData.ways;
  const wayCount = trafficWays.length;

  const headlineVehicleTotal = analyticsTrafficData.total;

  const avgWaitTime = Math.floor(40 + (totalVehiclesCount % 60));
  const avgQueueLength = Math.floor(20 + (totalVehiclesCount % 30));

  // Growth rate fluctuation
  const growthRate = (totalVehiclesCount % 15) - 5; // Yields -5% to +9%
  const isGrowthPositive = growthRate >= 0;
  
  // Added days for the sparkline X-axis
  const sparkDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const sparklineData = sparkDays.map((day, i) => ({
    day,
    value: Math.floor(50 + (i * growthRate) + (Math.random() * 10))
  }));

// --- REAL-TIME PEAK TRAFFIC CALCULATION ---
  // Get exact fractional hour (e.g., 3:30 AM = 3.5)
  const currentHour = new Date().getHours() + (new Date().getMinutes() / 60);

  const baseSegments = [
    { name: 'Night (Low)', start: 0, end: 7, fill: '#34a853', avgVolume: `${Math.floor(totalVehiclesCount * 0.05)} veh/hr`, duration: '7 hrs', timing: '00:00 - 07:00' },
    { name: 'Morning Peak', start: 7, end: 11, fill: '#ea4335', avgVolume: `${Math.floor(totalVehiclesCount * 0.35)} veh/hr`, duration: '4 hrs', timing: '07:00 - 11:00' },
    { name: 'Mid-day (Mod)', start: 11, end: 16, fill: '#fbbc04', avgVolume: `${Math.floor(totalVehiclesCount * 0.15)} veh/hr`, duration: '5 hrs', timing: '11:00 - 16:00' },
    { name: 'Evening Peak', start: 16, end: 21, fill: '#ea4335', avgVolume: `${Math.floor(totalVehiclesCount * 0.40)} veh/hr`, duration: '5 hrs', timing: '16:00 - 21:00' },
    { name: 'Night (Low)', start: 21, end: 24, fill: '#34a853', avgVolume: `${Math.floor(totalVehiclesCount * 0.05)} veh/hr`, duration: '3 hrs', timing: '21:00 - 24:00' }
  ];

  const peakTrafficData: any[] = [];
  let accumulatedHours = 0;

  // 1. Only push segments (or partial segments) that have already elapsed today
  baseSegments.forEach(seg => {
    if (currentHour > seg.start) {
      const activeValue = Math.min(currentHour, seg.end) - seg.start;
      if (activeValue > 0) {
        peakTrafficData.push({
          ...seg,
          value: activeValue, // Overrides value with just the elapsed hours
        });
        accumulatedHours += activeValue;
      }
    }
  });

  // 2. Fill the remainder of the 24 hours with an empty dark track
  const remainingHours = 24 - accumulatedHours;
  if (remainingHours > 0) {
    peakTrafficData.push({
      name: 'Future',
      value: remainingHours,
      fill: '#292A2D', // Subtle grey unlit track
      isFuture: true
    });
  }

  // Incidents
  const accidentsCount = Math.floor((totalVehiclesCount / 1000) * 2);
  const fireCount = Math.floor((totalVehiclesCount / 5000));
  const ambCount = Math.floor(totalVehiclesCount * 0.02);
  const fireBrigadeCount = Math.floor(totalVehiclesCount * 0.005);
  // -----------------------------------

  const currentLocationName = pathSegments && pathSegments.length > 0 
    ? pathSegments[pathSegments.length - 1] 
    : '-';

  const currentCity = pathSegments && pathSegments.length>=2 ? pathSegments[1] : '-';

  if (initialLoading && !hasInitiallyLoaded.current) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3c4043] border-t-[#8AB4F8] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#9aa0a6] font-mono">Loading Analytics Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !hasInitiallyLoaded.current) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-[#d93025] text-lg mb-2 font-mono">Error Loading Analytics</p>
          <p className="text-[#9aa0a6] text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full px-0 py-0">
      <CustomDurationModal
        isOpen={isCustomModalOpen}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
        onClose={closeCustomModal}
        onApply={handleCustomApply}
      />

      <div className="w-full flex items-center justify-between h-13 mb-0 border-b border-[#3c4043] bg-[#131314] p-1 shadow-xl relative z-[100]">
        <div className="flex items-center min-w-170 flex-1">
          <div>
            <p className="text-[#ffffff] font-mono text-xl ml-4">Analytics Dashboard</p>
          </div>

          <div className="ml-5 min-w-0 flex-1 max-w-160">
            <div className="flex items-center gap-2 px-2.5 py-[5.5px] bg-[#292A2D] border border-[#3C4043] rounded-md transition-colors hover:bg-[#303134] focus-within:border-[#8AB4F8] focus-within:ring-0.7 focus-within:ring-[#8AB4F8]">
              
              <IoSearchSharp className="w-6 h-6 flex-shrink-0 text-[#669DF6]"></IoSearchSharp>

              <input
                type="text "
                placeholder="Search ( / ) for resources..."
                className="min-w-0 max-w-160 bg-transparent outline-none text-[#E8EAED] placeholder:text-[#9AA0A6] text-md"
              />
              
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
                signals={mapSignals} 
                pathSegments={pathSegments} 
                onPinClick={handleMapPinClick} 
              />
            </div>

          </div>
        </div>
      )}

      <div key={contentRefreshKey} className="relative min-h-[480px]">
        {sectionRefreshing && (
          <div className="absolute inset-0 z-[90] flex flex-col items-center justify-center bg-[#131314]/90 backdrop-blur-[1px]">
            <div className="w-10 h-10 border-4 border-[#3c4043] border-t-[#8AB4F8] rounded-full animate-spin mb-3" />
            <p className="text-[#9aa0a6] font-mono text-sm">Refreshing analytics...</p>
          </div>
        )}

        <div className={sectionRefreshing ? 'pointer-events-none select-none' : undefined}>
          <LocationBar />

        {error && hasInitiallyLoaded.current && !sectionRefreshing && (
          <div className="mx-4 mt-4 px-4 py-3 rounded-md border border-[#d93025]/40 bg-[#d93025]/10 text-[#f28b82] text-sm">
            {error}
          </div>
        )}

        {usingDemoData && !sectionRefreshing && (
          <p className="mx-4 mt-4 text-sm text-[#ea8600] dark:text-[#fdd663]">
            Some charts could not be loaded. Showing available data (demo mode may be active if the database is offline).
          </p>
        )}

      {
        // (!pathSegments) || (pathSegments && pathSegments.length==0) && (
        //   <div className="flex h-150 w-full items-center justify-center gap-1">
        //       {/* <div className="text-gray-500 text-xl font-medium self-center justify-self">Invalid location path.</div> */}
        //       <div className="text-gray-500 text-xl font-medium">Please select a location path in above location bar or using map.</div>
        //   </div>
        // )
        (!pathSegments) || (pathSegments && pathSegments.length==0) && (
          <NationalAnalytics/>
        )
      }
      {
        pathSegments && pathSegments.length==1 && (
          <StateAnalytics/>
        )
      }
      {
        pathSegments && pathSegments.length>=2 && pathSegments.length<=3 && (
          <CityAnalytics/>
        )
      }
      {
        pathSegments && pathSegments.length==4 && (
          <>
            {/* Headline Data*/}
            <div className="relative z-10 flex border-r border-[#3c4043] p-2 justify-between items-center bg-[#131314]">

              <p className="text-xl pl-2 font-[450] text-[#ffffff]">
                {currentLocationName}
              </p>
              <div className="flex items-center gap-1 bg-[#131314]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {['Today', 'Yesterday', '1 week', '1 month', '1 year', 'all time', 'custom duration'].map((duration) => {
                  
                  const currentDur = getDuration(('headlineData' as any)) || 'Today';
                  const isActive = currentDur === duration || (currentDur === 'custom' && duration === 'custom duration');
                  
                  return (
                    <button
                      key={duration}
                      onClick={() => handleDurationSelect(('headlineData' as any), duration)}
                      className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-[#8AB4F8]/10 text-[#8AB4F8] font-medium'
                          : 'text-[#9aa0a6] hover:bg-[#202124] hover:text-[#e8eaed]'
                      } capitalize`}
                    >
                      {duration}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Headline Data Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 border-t border-[#3c4043] mt-0 bg-[#131314]">
              
              {/* 1. Total Vehicles Count */}
              <div className="pt-3 pb-4 pl-4 pr-4 border-b border-r border-[#3c4043] flex flex-col justify-between transition-colors group">
                <div className="flex items-center gap-2 mb-3 text-[#9aa0a6] transition-colors">
                  <MdDirectionsCar className="w-5 h-5" />
                  <span className="text-sm uppercase font-medium tracking-wide">Total Vehicles</span>
                </div>
                <div className="flex px-0 justify-between items-center">
                  <span className="text-3xl font-mono text-[#e8eaed]">{headlineVehicleTotal}</span>
                  <div className="flex text-[15px] text-[#8AB4F8] gap-x-3 font-mono">
                    <div className="flex-cols">
                      {trafficWays.slice(0, Math.ceil(wayCount / 2)).map((way) => (
                        <p key={way.id}>
                          {way.label}: {way.vehicleCount}
                        </p>
                      ))}
                    </div>
                    <div className="flex-cols">
                      {trafficWays.slice(Math.ceil(wayCount / 2)).map((way) => (
                        <p key={way.id}>
                          {way.label}: {way.vehicleCount}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Avg. Waiting Time */}
              <div className="pt-3 pb-4 pl-4 pr-4 border-b border-r border-[#3c4043] flex flex-col justify-between transition-colors group">
                <div className="flex items-center gap-2 mb-3 text-[#9aa0a6] transition-colors">
                  <MdAccessTime className="w-4.5 h-4.5" />
                  <span className="text-sm uppercase font-medium tracking-wide">Avg Wait Time</span>
                </div>
                <div className="flex px-0 justify-between items-center">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-mono text-[#e8eaed]">{avgWaitTime}</span>
                    <span className="text-sm text-[#ffffff]">sec</span>
                  </div>
                  <div className="flex text-[15px] text-[#8AB4F8] gap-x-3 font-mono">
                    <div className="flex-cols">
                      {analyticsWays.slice(0, Math.ceil(wayCount / 2)).map((way, i) => (
                        <p key={way.id}>
                          {way.label}: {Math.floor(avgWaitTime * wayWaitMultiplier(i))}s
                        </p>
                      ))}
                    </div>
                    <div className="flex-cols">
                      {analyticsWays.slice(Math.ceil(wayCount / 2)).map((way, i) => {
                        const idx = Math.ceil(wayCount / 2) + i;
                        return (
                          <p key={way.id}>
                            {way.label}: {Math.floor(avgWaitTime * wayWaitMultiplier(idx))}s
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Avg. Queue Length */}
              <div className="pt-3 pb-4 pl-4 pr-4 border-b border-r border-[#3c4043] flex flex-col justify-between transition-colors group">
                <div className="flex items-center gap-2 mb-3 text-[#9aa0a6] transition-colors">
                  <MdOutlineQueue className="w-4.5 h-4.5" />
                  <span className="text-sm uppercase font-medium tracking-wide">Avg Queue Length</span>
                </div>
                <div className="flex px-0 justify-between items-center">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-mono text-[#e8eaed]">{avgQueueLength}</span>
                    <span className="text-sm text-[#ffffff]">m</span>
                  </div>
                  <div className="flex text-[15px] text-[#8AB4F8] gap-x-3 font-mono">
                    <div className="flex-cols">
                      {analyticsWays.slice(0, Math.ceil(wayCount / 2)).map((way, i) => (
                        <p key={way.id}>
                          {way.label}: {Math.floor(avgQueueLength * wayQueueMultiplier(i))}m
                        </p>
                      ))}
                    </div>
                    <div className="flex-cols">
                      {analyticsWays.slice(Math.ceil(wayCount / 2)).map((way, i) => {
                        const idx = Math.ceil(wayCount / 2) + i;
                        return (
                          <p key={way.id}>
                            {way.label}: {Math.floor(avgQueueLength * wayQueueMultiplier(idx))}m
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Peak Traffic (Inline Donut Chart) */}
              <div className="pt-3 pb-0 pl-2 pr-2 border-b border-r border-[#3c4043] flex flex-col justify-between transition-colors group">
                <div className="flex items-center px-2 gap-2 mb-0 text-[#9aa0a6] transition-colors">
                  <MdOutlineInsights className="w-4.5 h-4.5" />
                  <span className="text-sm uppercase font-medium tracking-wide">Peak Traffic</span>
                </div>
                <div className="flex items-center h-full">
                  <div className="w-20 h-20 relative  flex items-center justify-center cursor-crosshair">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={peakTrafficData} 
                          innerRadius={20} 
                          outerRadius={28} 
                          dataKey="value" 
                          stroke="none"
                          startAngle={90}
                          endAngle={-270}
                          
                          // @ts-expect-error Recharts type definitions mismatch
                          activeIndex={peakActiveIndex} 
                          
                          activeShape={renderActiveShape as any}
                          onMouseEnter={(data: any, index: number) => {
                            if (peakTrafficData[index] && !peakTrafficData[index].isFuture) {
                              setPeakActiveIndex(index);
                            }
                          }}
                          onMouseLeave={() => setPeakActiveIndex(-1)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <span className="absolute text-[12px] font-mono text-[#e8eaed] pointer-events-none">
                      {new Date().getHours()}h
                    </span>
                  </div>
                  <div className="flex-cols pl-6 pt-2 text-[16px] text-[#8AB4F8] gap-x-3 font-mono">
                    <p>In dir: {formatWayList(square, ['south', 'west'])}</p>
                    <p>Out dir: {formatWayList(square, ['east'])}</p>
                  </div>
                </div>
              </div>

              {/* 5. Traffic Growth Rate (Inline Sparkline) */}
              <div className="pt-3 pb-4 pl-4 pr-4 border-b border-r border-[#3c4043] flex flex-col justify-between transition-colors group">
                <div className="flex items-center gap-2 mb-2 text-[#9aa0a6] transition-colors">
                  {isGrowthPositive ? <MdTrendingUp className="w-5 h-5" /> : <MdTrendingDown className="w-4.5 h-4.5" />}
                  <span className="text-sm uppercase font-medium tracking-wide">Traffic Growth Rate</span>
                </div>
                <div className="flex justify-between items-center h-full gap-4 w-full">
                  <span className={`text-2xl font-mono flex items-center gap-0.5 ${isGrowthPositive ? 'text-[#f28b82]' : 'text-[#81c995]'}`}>
                    {isGrowthPositive ? '↑' : '↓'} {Math.abs(growthRate)}%
                  </span>
                  <div className="flex-1 h-10 w-full pr-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparklineData}>
                        <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                        <Tooltip 
                          content={<SparklineTooltip />} 
                          cursor={{ stroke: '#5f6368', strokeWidth: 1, strokeDasharray: '3 3' }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={isGrowthPositive ? '#f28b82' : '#81c995'} 
                          strokeWidth={2} 
                          dot={{ r: 0 }}
                          activeDot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* 6. Accidents & Fire Events */}
              <div className="pt-3 pb-4 pl-4 pr-4 border-b border-r border-[#3c4043] flex flex-col justify-between transition-colors group">
                <div className="flex items-center gap-2 mb-2 text-[#9aa0a6] transition-colors">
                  <MdWarningAmber className="w-4.5 h-4.5" />
                  <span className="text-sm uppercase font-medium tracking-wide">Incidents</span>
                </div>
                <div className="flex flex-col gap-1.5 mt-1 justify-end h-full">
                  <div className="flex justify-between items-center text-[11px] font-mono bg-[#1a1a1c] px-2 py-1 rounded border border-[#3c4043]">
                    <span className="text-[#9aa0a6]">Accidents</span>
                    <span className={accidentsCount > 0 ? "text-[#f28b82] font-bold" : "text-[#81c995]"}>{accidentsCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-mono bg-[#1a1a1c] px-2 py-1 rounded border border-[#3c4043]">
                    <span className="text-[#9aa0a6]">Fire Events</span>
                    <span className={fireCount > 0 ? "text-[#f28b82] font-bold" : "text-[#81c995]"}>{fireCount}</span>
                  </div>
                </div>
              </div>

              {/* 7. Emergency Vehicles Count */}
              <div className="pt-3 pb-4 pl-4 pr-4 border-b border-r border-[#3c4043] flex flex-col justify-between transition-colors group">
                <div className="flex items-center gap-2 mb-2 text-[#9aa0a6] transition-colors">
                  <MdOutlineEmergency className="w-4.5 h-4.5" />
                  <span className="text-sm uppercase font-medium tracking-wide">Emergency</span>
                </div>
                <div className="flex flex-col gap-1.5 mt-1 justify-end h-full">
                  <div className="flex justify-between items-center text-[11px] font-mono bg-[#1a1a1c] px-2 py-1 rounded border border-[#3c4043]">
                    <span className="text-[#9aa0a6]">Ambulance</span>
                    <span className="text-[#8AB4F8] font-bold">{ambCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-mono bg-[#1a1a1c] px-2 py-1 rounded border border-[#3c4043]">
                    <span className="text-[#9aa0a6]">Fire Brigade</span>
                    <span className="text-[#8AB4F8] font-bold">{fireBrigadeCount}</span>
                  </div>
                </div>
              </div>

            </div>



            {/* Chart div 1 — Traffic Volume + Square Map */}
            <div className="relative z-20 flex w-full mt-0 border-r border-[#3c4043] isolate">
              <div className="w-[66.6%] min-w-0">
                <TrafficVol
                  activeWays={trafficWays}
                  trafficTimeSeries={analyticsTrafficData.timeSeries}
                  durationPickerDisabled={sectionRefreshing}
                />
              </div>
              <div className="w-[33.4%] min-w-0">
                <SquareLocationMap
                  square={square}
                  isLocked={isLocked}
                  loading={squareLoading}
                  error={squareError}
                  wayVehicleCounts={analyticsTrafficData.byWay}
                  onSquareSaved={updateSquare}
                  onCoordinatesSaved={applySavedCoordinates}
                />
              </div>
            </div>
            
            {/* chart div 2*/}
            <div className="flex w-full">


              <div className="flex-cols bg-[#131314] w-[66.6%]">
                <Violations activeWays={analyticsWays} durationPickerDisabled={sectionRefreshing} />

                <div className="flex-cols h-100 w-full">
                  <div
                    ref={cardRef}
                    className={`w-full font-sans transition-all duration-150 flex flex-col ${
                      isFullscreen ? 'p-10 h-screen justify-center' : 'h-100 pt-3 border-r border-b border-[#3c4043] pb-2.5 pl-2 pr-6'
                    } bg-[#131314]`}
                  >
                    <div className="flex justify-between items-center mb-5">
                      <h2 className="text-gray-200 text-lg ml-5">Emergency Vehicles</h2>
                      <div className="chart-actions flex items-center gap-3.5 text-xs">
                        <ChartDurationPicker
                          selectedDuration={getDuration(ANALYTICS_CHART_IDS.emergency1)}
                          onSelect={(d) => handleDurationSelect(ANALYTICS_CHART_IDS.emergency1, d)}
                          disabled={sectionRefreshing}
                        />
                        <button
                          onClick={exportCSV}
                          className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
                          title="Download CSV Data"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={saveAsImage}
                          className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
                          title="Save as PNG"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={toggleFullscreen}
                          className="text-gray-400 hover:text-[#AECBFA] transition-colors"
                          title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
                        >
                          {isFullscreen ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M16 10h6m0 0v-6m0 6l3-3M4 10h6m0 0V4m0 6L3 3" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className={`flex-1 w-full ${isFullscreen ? 'min-h-[75vh]' : 'min-h-[280px]'}`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid vertical={false} stroke="#2d3748" strokeWidth={1} />
                          <XAxis
                            dataKey="time"
                            stroke="#718096"
                            tick={{ fill: '#718096', fontSize: 12 }}
                            tickFormatter={formatXAxis}
                            tickMargin={10}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={60}
                          />
                          <YAxis
                            stroke="#718096"
                            tickFormatter={formatYAxis}
                            tick={{ fill: '#718096', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          {EMERGENCY_METRICS.map((metric) => (
                            <Line
                              key={metric.key}
                              type="monotone"
                              name={metric.label}
                              dataKey={metric.key}
                              stroke={metric.color}
                              strokeWidth={1.5}
                              dot={false}
                              activeDot={{ r: 4, fill: metric.color, stroke: '#fff', strokeWidth: 2 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 flex flex-wrap justify-center gap-4">
                      {EMERGENCY_METRICS.map((metric) => (
                        <button
                          key={metric.key}
                          disabled
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-normal transition-all cursor-default"
                        >
                          <span className="w-4.5 h-1.5 rounded" style={{ backgroundColor: metric.color }} />
                          {metric.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div
                    ref={cardRef}
                    className={`w-full font-sans transition-all duration-150 flex flex-col ${
                      isFullscreen ? 'p-10 h-screen justify-center' : 'h-100 pt-3 border-r border-b border-[#3c4043] pb-2.5 pl-2 pr-6'
                    } bg-[#131314]`}
                  >
                    <div className="flex justify-between items-center mb-5">
                      <h2 className="text-gray-200 text-lg ml-5">Incidents</h2>
                      <div className="chart-actions flex items-center gap-3.5 text-xs">
                        <ChartDurationPicker
                          selectedDuration={getDuration(ANALYTICS_CHART_IDS.emergency2)}
                          onSelect={(d) =>
                            handleDurationSelect(ANALYTICS_CHART_IDS.emergency2, d)
                          }
                          disabled={sectionRefreshing}
                        />
                        {/* CSV Export Button */}
                        <button 
                          onClick={exportCSV}
                          className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
                          title="Download CSV Data"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>

                        {/* Snapshot Image Button */}
                        <button 
                          onClick={saveAsImage}
                          className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
                          title="Save as PNG"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>

                        {/* Fullscreen Toggle Button */}
                        <button 
                          onClick={toggleFullscreen}
                          className="text-gray-400 hover:text-[#AECBFA] transition-colors"
                          title={isFullscreen ? "Exit Fullscreen" : "View Fullscreen"}
                        >
                          {isFullscreen ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M16 10h6m0 0v-6m0 6l3-3M4 10h6m0 0V4m0 6L3 3" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Chart Canvas Area */}
                    <div className={`w-full ${isFullscreen ? "h-[75vh]" : "h-[270px]"}`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={data}
                          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid 
                            vertical={false} 
                            stroke="#2d3748" 
                            strokeWidth={1}
                          />
                          <XAxis 
                            dataKey="time" 
                            stroke="#718096" 
                            tick={{ fill: '#718096', fontSize: 12 }} 
                            tickFormatter={formatXAxis}
                            tickMargin={10}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={60}
                          />
                          <YAxis 
                            stroke="#718096" 
                            tickFormatter={formatYAxis}
                            tick={{ fill: '#718096', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          {INCIDENTS_METRICS.map((metric) => (
                            <Line
                              key={metric.key}
                              type="monotone"
                              name={metric.label}
                              dataKey={metric.key}
                              stroke={metric.color}
                              strokeWidth={1.5}
                              dot={false}
                              activeDot={{ r: 4, fill: metric.color, stroke: '#fff', strokeWidth: 2 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 flex flex-wrap justify-center gap-4">
                      {INCIDENTS_METRICS.map((metric) => (
                        <button
                          key={metric.key}
                          disabled
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-normal transition-all cursor-default"
                        >
                          <span className="w-4.5 h-1.5 rounded" style={{ backgroundColor: metric.color }} />
                          {metric.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-cols bg-[#131314] w-[33.4%]">

                <AnalyticsPieChartPanel
                  title="Violations data"
                  data={violationsData}
                  colors={VIOLATION_COLORS}
                  footer={<>Total vehicles: {totalVehicles}</>}
                  csvHeaders={['Violation', 'Count']}
                  exportBaseName="violations_data"
                  selectedDuration={getDuration(ANALYTICS_CHART_IDS.violations)}
                  onDurationSelect={(d) => handleDurationSelect(ANALYTICS_CHART_IDS.violations, d)}
                  durationPickerDisabled={sectionRefreshing}
                />

                <AnalyticsPieChartPanel
                  title="Vehicle Type Distribution"
                  data={vehicleTypeData}
                  colors={VEHICLE_COLORS}
                  className="w-full min-w-0 border-r border-t border-b border-[#3c4043] !bg-[#131314] py-5 relative overflow-visible"
                  footer={<>Total vehicles: {totalVehicles}</>}
                  csvHeaders={['Vehicle Type', 'Count']}
                  exportBaseName="vehicle_type_distribution"
                  selectedDuration={getDuration(ANALYTICS_CHART_IDS.vehicleTypes)}
                  onDurationSelect={(d) => handleDurationSelect(ANALYTICS_CHART_IDS.vehicleTypes, d)}
                  durationPickerDisabled={sectionRefreshing}
                />

                <AnalyticsPieChartPanel
                  title="Speed Distribution"
                  data={speedDistributionChartData}
                  nameKey="range"
                  colors={[]}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name} km/h: ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  tooltipFormatter={(value, _name, item) => [
                    String(value),
                    `${item?.payload?.range} km/h`,
                  ]}
                  getCellColor={(entry, index) => getSpeedRangeColor(String(entry.range), index)}
                  className="w-full min-w-0 border-b border-r border-[#3c4043] !bg-[#131314] py-5 relative overflow-visible"
                  footer={<span className="text-[#ffffff]">Total vehicles: {speedDistributionTotal}</span>}
                  csvHeaders={['Speed Range', 'Count']}
                  exportBaseName="speed_distribution"
                  selectedDuration={getDuration(ANALYTICS_CHART_IDS.speedDistributionPie)}
                  onDurationSelect={(d) => handleDurationSelect(ANALYTICS_CHART_IDS.speedDistributionPie, d)}
                  durationPickerDisabled={sectionRefreshing}
                />
              </div>
            </div>
          </>
        )
      }
      </div>
      </div>


    </div>
  )
}