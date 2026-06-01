'use client'

import React, { useState, useEffect , useMemo, useRef} from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
import { MdArrowDropDown } from 'react-icons/md';
import { IoMdRefresh } from 'react-icons/io';
import { MAP_SIGNALS } from '@/map/MapData';
import LocationBar from '@/components/LocationBar';
import { useLocationFilter } from '@/context/LocationFilterContext';

import { toPng } from "html-to-image";
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
  // if (tickItem >= 1000) return `${(tickItem / 1000).toFixed(1)}s`;
  return `${Math.round(tickItem)}`;
};

const formatXAxis = (tickItem: string) => tickItem.replace(/:\d{2}\s/, ' ');

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e1e1e] border border-gray-700 p-3 rounded shadow-lg text-sm">
        <p className="text-gray-300 mb-2 font-medium">{label}</p>
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

const DynamicMap = dynamic(() => import('@/components/RealMap'), { 
  ssr: false, 
  loading: () => <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-[#8AB4F8] font-mono animate-pulse">Initializing Satellite Uplink...</div> 
});

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

  const data = useMemo(() => generateDenseData(), []);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      // Temporarily hide action buttons during image capture
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

  const { isMapOpen, setIsMapOpen, pathSegments, handleMapPinClick } = useLocationFilter();

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingDemoData, setUsingDemoData] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
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
        setError(reason instanceof Error ? reason.message : 'Failed to fetch analytics');
        setLoading(false);
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

      setLoading(false);
    };

    fetchAnalytics();
  }, []);

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

  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3c4043] border-t-[#8AB4F8] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#9aa0a6] font-mono">Loading Analytics Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
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

      <div className="w-full flex items-center justify-between h-13 mb-0 border-b border-[#3c4043] bg-[#131314] p-1 shadow-xl">
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

        <div className="group flex items-center gap-1 px-2 mr-3 justify-center hover:bg-[#202124] rounded-sm transition-all">
          <IoMdRefresh className="h-5 w-5 text-[#669DF6] group-hover:text-[#AECBFA]"></IoMdRefresh>
          <button 
            className="py-1 font-medium transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg"
            >
            Refresh
          </button>
        </div>
        {usingDemoData && (
          <p className="mt-2 text-sm text-[#ea8600] dark:text-[#fdd663]">
            Some charts could not be loaded. Showing available data (demo mode may be active if the database is offline).
          </p>
        )}
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
      
      {/* Chart div 1*/}
      <div className="flex w-full mt-6 px-4 gap-2">

        <div 
          ref={cardRef}
          className={`w-full font-sans transition-all duration-150 ${
            isFullscreen ? "p-10 h-screen flex flex-col justify-center" : "max-w-4xl h-88.5 pt-3 pb-0 pl-2 pr-6 rounded-lg"
          } bg-[#131314]`}
          
        >

          {/* Header Panel Containing Controls */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-gray-200 text-lg ml-5">
              Overall Traffic Volume
            </h2>
            
            {/* Action Button Strip */}
            <div className="chart-actions flex items-center gap-3.5 text-xs">
              <ChartDurationPicker
                selectedDuration={getDuration(ANALYTICS_CHART_IDS.overallTraffic)}
                onSelect={(d) =>
                  handleDurationSelect(ANALYTICS_CHART_IDS.overallTraffic, d)
                }
              />
              {/* CSV Export Button */}
              <button 
                onClick={exportCSV}
                className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
                title="Download CSV Data"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              {/* Snapshot Image Button */}
              <button 
                onClick={saveAsImage}
                className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
                title="Save as PNG"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M16 10h6m0 0v-6m0 6l3-3M4 10h6m0 0V4m0 6L3 3" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                
                {/* <Line type="monotone" dataKey="p99" stroke="#e2e8f0" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} /> */}
                {/* <Line type="monotone" dataKey="p95" stroke="#63b3ed" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} /> */}
                <Line type="monotone" dataKey="vehicles" stroke="#3182ce" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
                {/* <Line type="monotone" dataKey="p50" stroke="#2b6cb0" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} /> */}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div 
          ref={cardRef}
          className={`w-full font-sans transition-all duration-150 ${
            isFullscreen ? "p-10 h-screen flex flex-col justify-center" : "max-w-4xl h-88.5 pt-3 pb-0 pl-2 pr-6 rounded-lg"
          } bg-[#131314]`}
          
        >
          {/* Header Panel Containing Controls */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-gray-200 text-lg ml-5">
              Separate Traffic Volume
            </h2>
            
            {/* Action Button Strip */}
            <div className="chart-actions flex items-center gap-3.5 text-xs">
              <ChartDurationPicker
                selectedDuration={getDuration(ANALYTICS_CHART_IDS.separateTraffic1)}
                onSelect={(d) =>
                  handleDurationSelect(ANALYTICS_CHART_IDS.separateTraffic1, d)
                }
              />
              {/* CSV Export Button */}
              <button 
                onClick={exportCSV}
                className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
                title="Download CSV Data"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              {/* Snapshot Image Button */}
              <button 
                onClick={saveAsImage}
                className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
                title="Save as PNG"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M16 10h6m0 0v-6m0 6l3-3M4 10h6m0 0V4m0 6L3 3" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                
                <Line type="monotone" dataKey="p99" stroke="#e2e8f0" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="p95" stroke="#63b3ed" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="vehicles" stroke="#3182ce" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="p50" stroke="#2b6cb0" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div 
          ref={cardRef}
          className={`w-full font-sans transition-all duration-150 ${
            isFullscreen ? "p-10 h-screen flex flex-col justify-center" : "max-w-4xl h-88.5 pt-3 pb-0 pl-2 pr-6 rounded-lg"
          } bg-[#131314]`}
          
        >
          {/* Header Panel Containing Controls */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-gray-200 text-lg ml-5">
              Emergency Vehicles
            </h2>
            
            {/* Action Button Strip */}
            <div className="chart-actions flex items-center gap-3.5 text-xs">
              <ChartDurationPicker
                selectedDuration={getDuration(ANALYTICS_CHART_IDS.emergency1)}
                onSelect={(d) =>
                  handleDurationSelect(ANALYTICS_CHART_IDS.emergency1, d)
                }
              />
              {/* CSV Export Button */}
              <button 
                onClick={exportCSV}
                className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
                title="Download CSV Data"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              {/* Snapshot Image Button */}
              <button 
                onClick={saveAsImage}
                className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
                title="Save as PNG"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M16 10h6m0 0v-6m0 6l3-3M4 10h6m0 0V4m0 6L3 3" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
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
                
                {/* <Line type="monotone" dataKey="p99" stroke="#e2e8f0" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} /> */}
                <Line type="monotone" dataKey="p95" stroke="#ed6363" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
                {/* <Line type="monotone" dataKey="vehicles" stroke="#ce3131" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} /> */}
                <Line type="monotone" dataKey="p50" stroke="#2b6cb0" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* chart div 2*/}
      <div className="flex w-full mt-2 px-4 gap-2">

        <div className="w-full min-w-0 rounded-md !bg-[#131314] py-5 relative">
          <div className="flex justify-between items-center mb-4 pl-6 pr-6">
            <h2 className="text-gray-200 text-lg">Violations data</h2>
            <div className="chart-actions flex items-center gap-3.5 text-xs">
              <ChartDurationPicker
                selectedDuration={getDuration(ANALYTICS_CHART_IDS.violations)}
                onSelect={(d) =>
                  handleDurationSelect(ANALYTICS_CHART_IDS.violations, d)
                }
              />
            </div>
          </div>
          <div className="flex-cols gap-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={violationsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#1a73e8"
                  dataKey="count"
                >
                  {violationsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={VIOLATION_COLORS[index % VIOLATION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'black', 
                    color: 'white',
                    padding:'0px',
                    paddingLeft: '8px',
                    paddingRight: '8px',
                    borderRadius: '4px',
                    border: '0px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full pl-4 flex justify-center">
                  Total vehicles: {totalVehicles}

            </div>
          </div>
        </div>
        
        <div className="w-full min-w-0 rounded-md !bg-[#131314] py-5 relative">
          <div className="flex justify-between items-center mb-4 pl-6 pr-6">
            <h2 className="text-gray-200 text-lg">Vehicle Type Distribution</h2>
            <div className="chart-actions flex items-center gap-3.5 text-xs">
              <ChartDurationPicker
                selectedDuration={getDuration(ANALYTICS_CHART_IDS.vehicleTypes)}
                onSelect={(d) =>
                  handleDurationSelect(ANALYTICS_CHART_IDS.vehicleTypes, d)
                }
              />
            </div>
          </div>
          <div className="flex-cols gap-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={vehicleTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#1a73e8"
                  dataKey="count"
                >
                  {vehicleTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={VEHICLE_COLORS[index % VEHICLE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'black', 
                    color: 'white',
                    padding:'0px',
                    paddingLeft: '8px',
                    paddingRight: '8px',
                    borderRadius: '4px',
                    border: '0px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full pl-4 flex justify-center">
                  Total vehicles: {totalVehicles}

            </div>
          </div>
        </div>
        <div className="w-full min-w-0 rounded-md !bg-[#131314] py-5 relative">
          <div className="flex justify-between items-center mb-4 pl-6 pr-6">
            <h2 className="text-gray-200 text-lg">Speed Distribution</h2>
            <div className="chart-actions flex items-center gap-3.5 text-xs">
              <ChartDurationPicker
                selectedDuration={getDuration(ANALYTICS_CHART_IDS.speedDistributionPie)}
                onSelect={(d) =>
                  handleDurationSelect(ANALYTICS_CHART_IDS.speedDistributionPie, d)
                }
              />
            </div>
          </div>
          <div className="flex-cols gap-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={speedDistributionChartData}
                  nameKey="range"
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, percent }) =>
                    `${range} km/h: ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  dataKey="count"
                >
                  {speedDistributionChartData.map((entry, index) => (
                    <Cell
                      key={`speed-${entry.range}`}
                      fill={getSpeedRangeColor(entry.range, index)}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, _name, item) => [
                    value,
                    `${item.payload.range} km/h`,
                  ]}
                  contentStyle={{
                    backgroundColor: 'black',
                    color: 'white',
                    padding: '0px',
                    paddingLeft: '8px',
                    paddingRight: '8px',
                    borderRadius: '4px',
                    border: '0px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full pl-4 flex justify-center text-[#9aa0a6]">
              Total in range: {speedDistributionTotal}
            </div>
          </div>
        </div>
      </div>

      {/* Chart div 3*/}
      <div className="flex w-full mt-2 px-4 gap-2">

        <div 
          ref={cardRef}
          className={`w-full font-sans transition-all duration-150 ${
            isFullscreen ? "p-10 h-screen flex flex-col justify-center" : "max-w-4xl h-88.5 pt-3 pb-0 pl-2 pr-6 rounded-lg"
          } bg-[#131314]`}
          
        >
          {/* Header Panel Containing Controls */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-gray-200 text-lg ml-5">
              Speed
            </h2>
            
            {/* Action Button Strip */}
            <div className="chart-actions flex items-center gap-3.5 text-xs">
              <ChartDurationPicker
                selectedDuration={getDuration(ANALYTICS_CHART_IDS.speedLine)}
                onSelect={(d) =>
                  handleDurationSelect(ANALYTICS_CHART_IDS.speedLine, d)
                }
              />
              {/* CSV Export Button */}
              <button 
                onClick={exportCSV}
                className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
                title="Download CSV Data"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              {/* Snapshot Image Button */}
              <button 
                onClick={saveAsImage}
                className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
                title="Save as PNG"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M16 10h6m0 0v-6m0 6l3-3M4 10h6m0 0V4m0 6L3 3" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                
                <Line type="monotone" dataKey="p99" stroke="#e2e8f0" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="p95" stroke="#63b3ed" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="vehicles" stroke="#3182ce" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="p50" stroke="#2b6cb0" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div 
          ref={cardRef}
          className={`w-full font-sans transition-all duration-150 ${
            isFullscreen ? "p-10 h-screen flex flex-col justify-center" : "max-w-4xl h-88.5 pt-3 pb-0 pl-2 pr-6 rounded-lg"
          } bg-[#131314]`}
          
        >
          {/* Header Panel Containing Controls */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-gray-200 text-lg ml-5">
              Helmet
            </h2>
            
            {/* Action Button Strip */}
            <div className="chart-actions flex items-center gap-3.5 text-xs">
              <ChartDurationPicker
                selectedDuration={getDuration(ANALYTICS_CHART_IDS.separateTraffic2)}
                onSelect={(d) =>
                  handleDurationSelect(ANALYTICS_CHART_IDS.separateTraffic2, d)
                }
              />
              {/* CSV Export Button */}
              <button 
                onClick={exportCSV}
                className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
                title="Download CSV Data"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              {/* Snapshot Image Button */}
              <button 
                onClick={saveAsImage}
                className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
                title="Save as PNG"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M16 10h6m0 0v-6m0 6l3-3M4 10h6m0 0V4m0 6L3 3" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                
                <Line type="monotone" dataKey="p99" stroke="#e2e8f0" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="p95" stroke="#63b3ed" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="vehicles" stroke="#3182ce" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="p50" stroke="#2b6cb0" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div 
          ref={cardRef}
          className={`w-full font-sans transition-all duration-150 ${
            isFullscreen ? "p-10 h-screen flex flex-col justify-center" : "max-w-4xl h-88.5 pt-3 pb-0 pl-2 pr-6 rounded-lg"
          } bg-[#131314]`}
          
        >
          {/* Header Panel Containing Controls */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-gray-200 text-lg ml-5">
              Tripling
            </h2>
            
            {/* Action Button Strip */}
            <div className="chart-actions flex items-center gap-3.5 text-xs">
              <ChartDurationPicker
                selectedDuration={getDuration(ANALYTICS_CHART_IDS.emergency2)}
                onSelect={(d) =>
                  handleDurationSelect(ANALYTICS_CHART_IDS.emergency2, d)
                }
              />
              {/* CSV Export Button */}
              <button 
                onClick={exportCSV}
                className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
                title="Download CSV Data"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              {/* Snapshot Image Button */}
              <button 
                onClick={saveAsImage}
                className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
                title="Save as PNG"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M16 10h6m0 0v-6m0 6l3-3M4 10h6m0 0V4m0 6L3 3" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                
                {/* <Line type="monotone" dataKey="p99" stroke="#e2e8f0" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} /> */}
                <Line type="monotone" dataKey="p95" stroke="#ed6363" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
                {/* <Line type="monotone" dataKey="vehicles" stroke="#ce3131" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} /> */}
                <Line type="monotone" dataKey="p50" stroke="#2b6cb0" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Traffic Heat Map */}
      <div className="gcloud-card p-6 relative">
        <div className="flex justify-between items-start gap-4 mb-4">
          <h2 className="text-base font-medium text-[#202124] dark:text-[#e8eaed]">
            Traffic Violation Heat Map - City Overview
          </h2>
          <div className="chart-actions flex items-center gap-3.5 text-xs shrink-0">
            <ChartDurationPicker
              selectedDuration={getDuration(ANALYTICS_CHART_IDS.heatmap)}
              onSelect={(d) =>
                handleDurationSelect(ANALYTICS_CHART_IDS.heatmap, d)
              }
            />
          </div>
        </div>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mb-4">
          Click on the markers to see detailed violation information for each zone. Larger markers indicate higher violation counts.
        </p>
        <TrafficHeatMap />
      </div>
    </div>
  )
}

