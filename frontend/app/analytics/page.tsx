'use client'

import { useState, useEffect } from 'react';
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

export default function Analytics() {
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

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const [violations, vehicleTypes, hourly, speedDist, analyticsStats] = await Promise.all([
          getViolations(),
          getVehicleTypes(),
          getHourlyTraffic(),
          getSpeedDistribution(),
          getStats(),
        ]);

        setViolationsData(violations);
        setVehicleTypeData(vehicleTypes);
        setHourlyTraffic(hourly);
        setSpeedDistribution(speedDist);
        setStats(analyticsStats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
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
    <div className="max-w-full px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed] mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">
          Comprehensive traffic data analysis and insights
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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

