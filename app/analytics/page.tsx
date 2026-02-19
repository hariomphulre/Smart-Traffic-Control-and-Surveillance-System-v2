'use client'

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dynamic from 'next/dynamic';

// Dynamically import map to avoid SSR issues
const TrafficHeatMap = dynamic(
  () => import('@/components/TrafficHeatMap'),
  { ssr: false }
);

// Mock data
const violationsData = [
  { name: 'Helmet-less', count: 145 },
  { name: 'Tripling', count: 89 },
  { name: 'Red Light', count: 67 },
  { name: 'Over Speed', count: 234 },
];

const vehicleTypeData = [
  { name: 'Car', count: 4523 },
  { name: 'Bike', count: 6789 },
  { name: 'Truck', count: 1234 },
  { name: 'Bus', count: 456 },
  { name: 'Auto', count: 2341 },
];

const hourlyTraffic = [
  { hour: '00:00', vehicles: 120, violations: 5 },
  { hour: '03:00', vehicles: 80, violations: 2 },
  { hour: '06:00', vehicles: 450, violations: 15 },
  { hour: '09:00', vehicles: 890, violations: 35 },
  { hour: '12:00', vehicles: 750, violations: 28 },
  { hour: '15:00', vehicles: 680, violations: 22 },
  { hour: '18:00', vehicles: 920, violations: 42 },
  { hour: '21:00', vehicles: 560, violations: 18 },
];

const speedDistribution = [
  { range: '0-20', count: 856 },
  { range: '21-40', count: 3245 },
  { range: '41-60', count: 5678 },
  { range: '61-80', count: 2134 },
  { range: '81-100', count: 678 },
  { range: '100+', count: 234 },
];

export default function Analytics() {
  const totalVehicles = vehicleTypeData.reduce((sum, item) => sum + item.count, 0);
  const totalViolations = violationsData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-black dark:text-white">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive traffic data analysis and insights
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800">
          <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-2 uppercase">
            Total Vehicles
          </h3>
          <p className="text-3xl font-bold text-black dark:text-white">{totalVehicles.toLocaleString()}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">↑ 12% from last week</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800">
          <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-2 uppercase">
            Total Violations
          </h3>
          <p className="text-3xl font-bold text-black dark:text-white">{totalViolations}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{violationsData[0].count} helmet-less</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800">
          <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-2 uppercase">
            Helmet-less
          </h3>
          <p className="text-3xl font-bold text-black dark:text-white">{violationsData[0].count}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Bike riders</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800">
          <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-2 uppercase">
            Tripling
          </h3>
          <p className="text-3xl font-bold text-black dark:text-white">{violationsData[1].count}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Triple riding</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800">
          <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-2 uppercase">
            Red Light Cross
          </h3>
          <p className="text-3xl font-bold text-black dark:text-white">{violationsData[2].count}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Signal violations</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Violations by Type */}
        <div className="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Violations by Type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={violationsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#000000"
                dataKey="count"
              >
                {violationsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#000000', '#333333', '#666666', '#999999'][index % 4]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Type Distribution */}
        <div className="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Vehicle Type Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vehicleTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
              <Legend />
              <Bar dataKey="count" fill="#000000" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Hourly Traffic */}
        <div className="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Traffic Flow (24h)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyTraffic}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
              <Legend />
              <Line type="monotone" dataKey="vehicles" stroke="#000000" strokeWidth={2} />
              <Line type="monotone" dataKey="violations" stroke="#666666" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Speed Distribution */}
        <div className="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Speed Distribution (km/h)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={speedDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="range" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
              <Legend />
              <Bar dataKey="count" fill="#000000" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Traffic Heat Map */}
      <div className="bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Traffic Violation Heat Map - City Overview</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Click on the markers to see detailed violation information for each zone. Larger markers indicate higher violation counts.
        </p>
        <TrafficHeatMap />
      </div>
    </div>
  )
}

