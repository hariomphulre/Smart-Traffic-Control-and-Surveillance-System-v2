export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-6 text-gray-800">
          Traffic Management Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Welcome to your comprehensive traffic management and monitoring system
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
            <h2 className="text-2xl font-semibold mb-2 text-gray-800">Analytics</h2>
            <p className="text-gray-600">
              View comprehensive traffic analytics and insights
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
            <h2 className="text-2xl font-semibold mb-2 text-gray-800">Logs</h2>
            <p className="text-gray-600">
              Access detailed system logs and activity records
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
            <h2 className="text-2xl font-semibold mb-2 text-gray-800">Challan Records</h2>
            <p className="text-gray-600">
              Manage and track challan records efficiently
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
            <h2 className="text-2xl font-semibold mb-2 text-gray-800">Accident Reports</h2>
            <p className="text-gray-600">
              Monitor and manage accident and fire incident reports
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
            <h2 className="text-2xl font-semibold mb-2 text-gray-800">Images</h2>
            <p className="text-gray-600">
              View and manage traffic camera images and evidence
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

