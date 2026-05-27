'use client'

import { useState, useEffect, useRef } from 'react';
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
import { IoSearchSharp } from 'react-icons/io5';
import { MdArrowDropDown } from 'react-icons/md';
import { IoMdRefresh } from 'react-icons/io';
import { MAP_SIGNALS } from '@/map/MapData';
import { LOCATION_DB } from '@/map/MapData2';

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

const locationData = {
  "Andhra Pradesh": ["Anantapur", "Guntur", "Kakinada", "Nellore", "Rajahmundry", "Tirupati", "Vijayawada", "Visakhapatnam"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang"],
  "Assam": ["Dibrugarh", "Guwahati", "Jorhat", "Silchar", "Tezpur"],
  "Bihar": ["Bhagalpur", "Darbhanga", "Gaya", "Muzaffarpur", "Patna"],
  "Chhattisgarh": ["Bhilai", "Bilaspur", "Durg", "Korba", "Raipur"],
  "Goa": ["Mapusa", "Margao", "Panaji", "Vasco da Gama"],
  "Gujarat": ["Ahmedabad", "Bhavnagar", "Rajkot", "Surat", "Vadodara"],
  "Haryana": ["Faridabad", "Gurgaon", "Hisar", "Karnal", "Panipat"],
  "Himachal Pradesh": ["Dharamshala", "Kullu", "Mandi", "Shimla", "Solan"],
  "Jharkhand": ["Bokaro", "Dhanbad", "Jamshedpur", "Ranchi", "Hazaribagh"],
  "Karnataka": ["Belgaum", "Bangalore", "Hubli", "Mangalore", "Mysore"],
  "Kerala": ["Kannur", "Kochi", "Kollam", "Kozhikode", "Thiruvananthapuram"],
  "Madhya Pradesh": ["Bhopal", "Gwalior", "Indore", "Jabalpur", "Ujjain"],
  "Maharashtra": ["Mumbai", "Nagpur", "Nashik", "Pimpri-Chinchwad", "Pune", "Thane"],
  "Manipur": ["Bishnupur", "Churachandpur", "Imphal", "Thoubal"],
  "Meghalaya": ["Jowai", "Shillong", "Tura", "Williamnagar"],
  "Mizoram": ["Aizawl", "Champhai", "Kolasib", "Lunglei"],
  "Nagaland": ["Dimapur", "Kohima", "Mokokchung", "Tuensang"],
  "Odisha": ["Berhampur", "Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur"],
  "Punjab": ["Amritsar", "Bathinda", "Jalandhar", "Ludhiana", "Patiala"],
  "Rajasthan": ["Ajmer", "Bikaner", "Jaipur", "Jodhpur", "Udaipur"],
  "Sikkim": ["Gangtok", "Geyzing", "Mangan", "Namchi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli"],
  "Telangana": ["Hyderabad", "Karimnagar", "Nizamabad", "Warangal"],
  "Tripura": ["Agartala", "Dharmanagar", "Kailasahar", "Udaipur"],
  "Uttar Pradesh": ["Agra", "Kanpur", "Lucknow", "Noida", "Varanasi"],
  "Uttarakhand": ["Dehradun", "Haldwani", "Haridwar", "Roorkee"],
  "West Bengal": ["Asansol", "Durgapur", "Howrah", "Kolkata", "Siliguri"]
};

const DynamicMap = dynamic(() => import('@/components/RealMap'), { 
  ssr: false, 
  loading: () => <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-[#8AB4F8] font-mono animate-pulse">Initializing Satellite Uplink...</div> 
});

export default function Analytics() {
  const [pathSegments, setPathSegments] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  // All refs defined here
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const barContainerRef = useRef<HTMLDivElement>(null); // <-- The missing ref!

  const isLocked = pathSegments.length >= 4;

  const getAvailableOptions = (path: string[]) => {
    let currentLevel = LOCATION_DB;
    for (const segment of path) {
      if (!currentLevel[segment]) return [];
      currentLevel = currentLevel[segment];
    }
    return Array.isArray(currentLevel) ? currentLevel : Object.keys(currentLevel);
  };

  useEffect(() => {
    const options = getAvailableOptions(pathSegments);
    if (currentInput.trim() === "") {
      setSuggestions(options);
    } else {
      const filtered = options.filter(opt => 
        opt.toLowerCase().includes(currentInput.toLowerCase())
      );
      setSuggestions(filtered);
    }
  }, [currentInput, pathSegments]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pushSegment = (segment: string) => {
    setPathSegments([...pathSegments, segment]);
    setCurrentInput("");
    setShowSuggestions(true);
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  // Click handler for the outer bar
  const handleBarClick = () => {
    if (isLocked) {
      barContainerRef.current?.focus();
    } else {
      inputRef.current?.focus();
      setShowSuggestions(true);
    }
  };

  // Global keydown handler for backspace when input is unmounted
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement | HTMLInputElement>) => {
    if ((e.key === '/' || e.key === 'Enter') && !isLocked) {
      e.preventDefault();
      const options = getAvailableOptions(pathSegments);
      const exactMatch = options.find(opt => opt.toLowerCase() === currentInput.toLowerCase().trim());
      if (exactMatch) {
        pushSegment(exactMatch);
      }
    }
    
    if (e.key === 'Backspace' && currentInput === "" && pathSegments.length > 0) {
      e.preventDefault();
      const newSegments = [...pathSegments];
      const popped = newSegments.pop();
      setPathSegments(newSegments);
      setCurrentInput(popped || "");
      setShowSuggestions(true);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  const handleMapPinClick = (signalPath: string[]) => {
    setPathSegments(signalPath);
    setCurrentInput("");
  };

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

  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const states = Object.keys(locationData);
  const cities = selectedState ? locationData[selectedState] : [];

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

  if (loading) {
    return (
      <div className="max-w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed] mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">
            Comprehensive traffic data analysis and insights
          </p>
        </div>
        <div className="gcloud-card p-8 text-center">
          <p className="text-[#5f6368] dark:text-[#9aa0a6]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed] mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">
            Comprehensive traffic data analysis and insights
          </p>
        </div>
        <div className="gcloud-card p-8 text-center">
          <p className="text-[#d93025] dark:text-[#f28b82]">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full px-0 py-0">
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
                className="min-w-50 bg-transparent outline-none text-[#E8EAED] placeholder:text-[#9AA0A6] text-md"
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

      <div className="w-full relative font-sans" ref={wrapperRef}>
      
        {/* TOP LOCATION BAR */}
        <div className="flex w-full border-b border-[#3c4043] h-8 bg-black mb-5 items-center justify-between">
          
          {/* FIX 1: Removed the complex global key listener. We just force focus back to the input when clicked. */}
          <div 
            onClick={() => inputRef.current?.focus()}
            className="flex items-center flex-1 h-full outline-none select-none cursor-text" 
          >
            <p className="ml-5 text-[#9aa0a6] whitespace-nowrap">Location:</p>
            
            <div className="flex items-center ml-2 relative w-full h-full">
              
              {pathSegments.map((seg, idx) => (
                <div key={idx} className="flex items-center">
                  <span className="text-[#8AB4F8] whitespace-nowrap">{seg}</span>
                  <span className="text-[#5f6368] mx-1.5 font-light">/</span>
                </div>
              ))}

              <div className="relative flex-1 flex items-center h-full">
                {/* FIX 2: The input NEVER unmounts. 
                    readOnly={isLocked} stops typing but allows Backspace.
                    caret-transparent hides the blinking line perfectly. */}
                <input
                  ref={inputRef}
                  value={currentInput}
                  readOnly={isLocked} 
                  onChange={(e) => {
                    if (!isLocked) {
                      setCurrentInput(e.target.value);
                      setShowSuggestions(true);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => { if (!isLocked) setShowSuggestions(true); }}
                  placeholder={pathSegments.length === 0 ? "state / city / area / signal code, Ex: Maharashtra / Pune / Pimpri / T1" : ""}
                  className={`bg-transparent outline-none h-full w-full caret-white cursor-text
                    ${isLocked 
                      ? 'text-transparent placeholder:text-transparent' 
                      : 'text-[#9aa0a6] placeholder:text-[#5f6368]'}
                  `}
                />

                {showSuggestions && suggestions.length > 0 && !isLocked && (
                  <div className="absolute top-full text-sm mt-0 left-0 w-max min-w-[200px] bg-[#202124] border border-[#3c4043] rounded-sm shadow-2xl z-[999] py-0 overflow-hidden">
                    {suggestions.map((s, idx) => (
                      <div 
                        key={idx}
                        onMouseDown={(e) => {
                          e.preventDefault(); 
                          pushSegment(s);
                        }}
                        className="px-4 py-1 text-[#9aa0a6] hover:bg-[#3c4043] hover:text-[#8AB4F8] cursor-pointer transition-colors whitespace-nowrap"
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {isLocked && (
                <div className="pr-4 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}

            </div>
          </div>

          <button 
            onClick={() => setIsMapOpen(true)}
            className="px-4 h-full font-medium transition-all text-[#8AB4F8] hover:bg-[#202124] hover:text-[#AECBFA] border-l border-[#3c4043] flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            Map view
          </button>
        </div>

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

      {/* <div className="flex w-full border-b border-[#3c4043] h-7 bg-black mb-5 items-center justify-between">
        <div className="flex ">
          <p className="ml-5 text-[#9aa0a6]">Location:</p>
          <div className="mx-2  text-[#8AB4F8]">
            Maharashtra / Pune / Pimpri / T4
          </div>
        </div>
        <button 
          className="px-2 font-medium pb-1 transition-all text-[#8AB4F8] underline underline-offset-3 cursor-pointer hover:text-[#AECBFA] shadow-lg mr-4"
          >
          Map view
        </button>
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 px-4">
        <div className="gcloud-card p-5">
          <h3 className="text-[#5f6368] dark:text-[#9aa0a6] text-xs font-medium mb-2 uppercase">
            Total Vehicles
          </h3>
          <p className="text-3xl font-normal text-[#202124] dark:text-[#e8eaed]">{totalVehicles.toLocaleString()}</p>
          <p className="text-sm text-[#34a853] mt-2">↑ 12% from last week</p>
        </div>

        <div className="gcloud-card p-5">
          <h3 className="text-[#5f6368] dark:text-[#9aa0a6] text-xs font-medium mb-2 uppercase">
            Total Violations
          </h3>
          <p className="text-3xl font-normal text-[#202124] dark:text-[#e8eaed]">{totalViolations}</p>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-2">{stats.helmetless || violationsData[0]?.count || 0} helmet-less</p>
        </div>

        <div className="gcloud-card p-5">
          <h3 className="text-[#5f6368] dark:text-[#9aa0a6] text-xs font-medium mb-2 uppercase">
            Helmet-less
          </h3>
          <p className="text-3xl font-normal text-[#202124] dark:text-[#e8eaed]">{stats.helmetless || violationsData[0]?.count || 0}</p>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-2">Bike riders</p>
        </div>

        <div className="gcloud-card p-5">
          <h3 className="text-[#5f6368] dark:text-[#9aa0a6] text-xs font-medium mb-2 uppercase">
            Tripling
          </h3>
          <p className="text-3xl font-normal text-[#202124] dark:text-[#e8eaed]">{stats.tripling || violationsData[1]?.count || 0}</p>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-2">Triple riding</p>
        </div>

        <div className="gcloud-card p-5">
          <h3 className="text-[#5f6368] dark:text-[#9aa0a6] text-xs font-medium mb-2 uppercase">
            Red Light Cross
          </h3>
          <p className="text-3xl font-normal text-[#202124] dark:text-[#e8eaed]">{stats.redLightCross || violationsData[2]?.count || 0}</p>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-2">Signal violations</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Violations by Type */}
        <div className="gcloud-card p-6">
          <h2 className="text-base font-medium mb-4 text-[#202124] dark:text-[#e8eaed]">Violations by Type</h2>
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
                  backgroundColor: 'var(--card-bg)', 
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Type Distribution */}
        <div className="gcloud-card p-6">
          <h2 className="text-base font-medium mb-4 text-[#202124] dark:text-[#e8eaed]">Vehicle Type Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vehicleTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card-bg)', 
                  border: '1px solid var(--border-color)',
                }} 
              />
              <Legend />
              <Bar dataKey="count" fill={CHART_COLORS.primary}>
                {vehicleTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={VEHICLE_COLORS[index % VEHICLE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Hourly Traffic */}
        <div className="gcloud-card p-6">
          <h2 className="text-base font-medium mb-4 text-[#202124] dark:text-[#e8eaed]">Traffic Flow (24h)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyTraffic}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
              <XAxis dataKey="hour" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card-bg)', 
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }} 
              />
              <Legend />
              <Line type="monotone" dataKey="vehicles" stroke={CHART_COLORS.primary} strokeWidth={2} />
              <Line type="monotone" dataKey="violations" stroke={CHART_COLORS.danger} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Speed Distribution */}
        <div className="gcloud-card p-6">
          <h2 className="text-base font-medium mb-4 text-[#202124] dark:text-[#e8eaed]">Speed Distribution (km/h)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={speedDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
              <XAxis dataKey="range" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card-bg)', 
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }} 
              />
              <Legend />
              <Bar dataKey="count">
                {speedDistribution.map((entry, index) => {
                  let color = CHART_COLORS.success;
                  if (entry.range === '61-80') color = CHART_COLORS.warning;
                  if (entry.range === '81-100' || entry.range === '100+') color = CHART_COLORS.danger;
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Traffic Heat Map */}
      <div className="gcloud-card p-6">
        <h2 className="text-base font-medium mb-4 text-[#202124] dark:text-[#e8eaed]">Traffic Violation Heat Map - City Overview</h2>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mb-4">
          Click on the markers to see detailed violation information for each zone. Larger markers indicate higher violation counts.
        </p>
        <TrafficHeatMap />
      </div>
    </div>
  )
}

