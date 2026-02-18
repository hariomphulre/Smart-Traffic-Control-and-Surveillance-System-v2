export default function Analytics() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-800">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          Comprehensive traffic data analysis and insights
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Total Vehicles Today
          </h3>
          <p className="text-3xl font-bold text-blue-600">12,458</p>
          <p className="text-sm text-green-600 mt-2">↑ 12% from yesterday</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Average Speed
          </h3>
          <p className="text-3xl font-bold text-blue-600">45 km/h</p>
          <p className="text-sm text-gray-600 mt-2">Normal range</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Violations Detected
          </h3>
          <p className="text-3xl font-bold text-red-600">87</p>
          <p className="text-sm text-red-600 mt-2">↑ 5% from yesterday</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Active Cameras
          </h3>
          <p className="text-3xl font-bold text-green-600">24/26</p>
          <p className="text-sm text-gray-600 mt-2">92% operational</p>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Traffic Flow (24h)</h2>
          <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
            <p className="text-gray-500">Chart will be displayed here</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Violations by Type</h2>
          <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
            <p className="text-gray-500">Chart will be displayed here</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Peak Hours Analysis</h2>
          <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
            <p className="text-gray-500">Chart will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  )
}

